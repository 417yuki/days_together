# 次の実装タスク

この文書は、Codexへ長い依頼文を毎回貼らずに済むよう、次の一件だけを記載する。

作業開始前に `AGENTS.md`、`docs/INDEX.md`、`docs/PRODUCT_SPEC.md`、`docs/ROADMAP.md` を読むこと。

## 対象

Milestone 7：パートナーゲーム設定

## 目的

公開プリセット「コーディ」を安全な初期版として保ちながら、ユーザーが普段のパートナーチャットから、端末内の自律生活へ使用する行動傾向と短い登録台詞だけを手動で持ち帰り、差分確認、履歴、復元まで行えるようにする。

このMilestoneで扱うのは、パートナー本人をゲーム内で完全再現する人格情報ではない。

ゲームへ保存するのは次だけとする。

- 表示名
- 12個の行動傾向値
- 選びやすい行動ID
- 避けぎみの行動ID
- 六つの自律行動に対応する短い登録台詞
- 設定revisionと履歴

次は保存しない。

- パートナーとの会話履歴
- 人格プロンプト全文
- 私的な記憶本文
- 恋愛、親密度、関係性の点数
- 外部サービスの認証情報

ゲームからLLM APIへ接続しない。APIキーを要求しない。ユーザーの明示操作なしに文章を外部へ送らない。

## 前提

- キャラクターID `cody` は既存セーブとの互換性のため維持する。
- パートナー設定の安定IDは `main_partner` とする。
- 表示名を変更しても、キャラクターIDと既存の位置データは変更しない。
- マーカー `C` はこのMilestoneでは変更しない。
- 自律行動IDは既存の六つだけとする。

```ts
 type ActionId =
   | "rest"
   | "cook"
   | "garden"
   | "craft"
   | "join_user"
   | "inspect_item";
```

- 行動定義、基本点、目的地、行動時間はこのMilestoneでは変更しない。
- 設定反映時に、現在進行中の移動や行動を中断しない。
- 新しい設定は次の行動選択と次の台詞選択から使用する。
- 直近5行動の履歴は設定反映や復元で消さない。
- コーディ初期版のままでも従来どおり遊べる。

## 1. 設定データ

### 1.1 性格値

次の12項目を固定する。値は整数の0から100。

```ts
 type PartnerTraitId =
   | "initiative"
   | "curiosity"
   | "sociability"
   | "caretaking"
   | "affection"
   | "tidiness"
   | "patience"
   | "moodVolatility"
   | "solitudePreference"
   | "userPriority"
   | "adventurousness"
   | "caution";
```

関係を限定する説明や恋愛メーターとして表示しない。各項目は行動選択用の傾向値として案内する。

### 1.2 現在プロフィール

少なくとも次の意味を持つ型を用意する。

```ts
 type PartnerGameProfile = {
   profileId: "main_partner";
   characterId: "cody";
   revision: number;
   source: "preset" | "manual_setup" | "manual_update" | "history_restore";
   displayName: string;
   traits: Record<PartnerTraitId, number>;
   preferredActionIds: ActionId[];
   dislikedActionIds: ActionId[];
   createdAt: string;
   updatedAt: string;
 };
```

### 1.3 登録台詞

```ts
 type PartnerDialogueLine = {
   dialogueId: string;
   profileId: "main_partner";
   actionId: ActionId;
   text: string;
   enabled: boolean;
   createdAt: string;
   disabledAt: string | null;
   sourceRevision: number;
 };
```

- `dialogueId`はゲーム側で発行する。
- 外部返答へ新規台詞のIDを決めさせない。
- 更新時に既存台詞を削除しない。
- 使用しない台詞は `enabled: false` とする。
- 復元できるよう、無効化した台詞も保存する。

### 1.4 履歴スナップショット

```ts
 type PartnerProfileSnapshot = {
   profile: PartnerGameProfile;
   dialogues: PartnerDialogueLine[];
 };
```

履歴はrevisionごとの完全な設定スナップショットとする。

## 2. コーディ初期版

既存の固定値を、revision 1の初期プロフィールへ移す。

```ts
 const codyPresetProfile = {
   profileId: "main_partner",
   characterId: "cody",
   revision: 1,
   source: "preset",
   displayName: "コーディ",
   traits: {
     initiative: 72,
     curiosity: 82,
     sociability: 58,
     caretaking: 78,
     affection: 64,
     tidiness: 70,
     patience: 76,
     moodVolatility: 30,
     solitudePreference: 47,
     userPriority: 80,
     adventurousness: 56,
     caution: 62
   },
   preferredActionIds: ["cook", "garden", "craft", "inspect_item"],
   dislikedActionIds: []
 };
```

既存の `ACTION_LINES` は、固定IDを持つコーディ初期台詞としてデータ化する。

例：

```ts
 {
   dialogueId: "preset-rest-1",
   profileId: "main_partner",
   actionId: "rest",
   text: "少しひと休みしようかな。",
   enabled: true,
   sourceRevision: 1
 }
```

- DBにプロフィールがない場合、コーディ初期版を現在版として使用する。
- IndexedDBが使える場合は、起動時に初期版とrevision 1の履歴を保存する。
- 初期版作成に失敗しても、メモリ上のコーディ初期版でゲームを続行する。
- 固定値を参照する既存関数を、現在プロフィールを引数で受け取る構造へ変更する。

## 3. 自律行動への接続

### 3.1 点数計算

`scoreCandidates`または同等の純粋関数は、固定の `codyPersonality`、`preferredActionIds`、`dislikedActionIds` を直接参照せず、現在プロフィールを引数で受け取る。

既存の計算式、反復ペナルティ、重み付き抽選は変更しない。

### 3.2 台詞選択

- 現在プロフィールに紐づく `enabled: true` の台詞から選ぶ。
- 同じ台詞の連続を避ける既存ルールを維持する。
- 対象行動の有効台詞が壊れたデータ等でゼロの場合は、コーディ初期台詞へフォールバックする。
- 外部返答の文字列を `innerHTML` へ渡さない。

### 3.3 表示名

- 設定反映成功後、`characters`内の `characterId: "cody"` の `name` を現在プロフィールの `displayName` へ更新する。
- 位置、marker、characterId、移動状態は変更しない。
- 表示名変更を含む保存は、プロフィール反映と同じ原子的処理へ含める。

## 4. パートナー画面

下部ナビゲーションの「パートナー」を準備中画面から実画面へ変更する。

通常表示：

- 現在の表示名
- 現在revision
- 初期プリセットか手動設定か
- 12個の性格値
- preferred行動の日本語表示
- disliked行動の日本語表示
- 行動別の有効台詞一覧
- 「パートナー設定を相談する」または「今のふたりを反映する」ボタン
- 「設定履歴を見る」ボタン

表示ルール：

- 生の内部IDだけで説明しない。
- 性格値は数値とテキストラベルを表示し、色だけで区別しない。
- 320px幅で横スクロールを発生させない。
- 主要操作は44px以上。
- 画面遷移後の見出しへ適切にフォーカスする。

初期版だけの場合：

- ボタン名は「パートナー設定を相談する」

一度手動設定を反映した後：

- ボタン名は「今のふたりを反映する」

直接値を編集するスライダー、数値入力、台詞エディタは追加しない。

## 5. 手動相談の共通ルール

Milestone 6のJSON抽出、クリップボードコピー、返答貼り付け、確認画面、安全な取込パターンを再利用する。

既存の花相談を壊さないよう、保留中相談型を判別可能なunionへ一般化する。

```ts
 type ConsultationRequestType =
   | "unknown_sprout_reflection"
   | "partner_profile_setup"
   | "partner_profile_update";
```

- ゲーム全体で同時に保留できる手動相談は一件だけとする。
- 別の保留中相談がある場合、新しい相談を開始しない。
- ユーザーが明示的に破棄した古いrequestIdの返答は拒否する。
- requestIdは `crypto.randomUUID()`、または `crypto.getRandomValues()` を使う既存方式で発行する。
- 返答入力上限は30,000文字。
- `eval`、`Function`、動的importを使用しない。
- JSON最上位はオブジェクトだけを許可する。
- 条件へ一致するJSON候補が複数ある返答は曖昧として拒否する。
- 検証済みプレビューは一時UI状態とし、再読込後に復元しなくてよい。
- 保留中依頼は再読込後も復元する。

## 6. 初期設定相談

### 6.1 送信用プロンプト

コーディ初期版から初めて手動設定を作る場合、`partner_profile_setup` を使用する。

プロンプトには次を含める。

- 『ふたり日和』の端末内シミュレーション用設定であること
- パートナー本人の人格全文ではなく、行動傾向の数値と短い台詞だけを求めること
- `requestId`
- `profileId: main_partner`
- 12項目の意味と0から100の整数であること
- 使用可能な六つの行動IDと日本語説明
- preferredは最大4件
- dislikedは最大3件
- 六行動それぞれに1から3件の短い台詞を求めること
- 現実の会話履歴、私的記憶、関係性の点数をJSONへ含めないこと
- 新規行動IDを作らないこと
- JSONオブジェクトを一個だけ返すこと

ゲームから会話履歴やユーザーの個人情報をプロンプトへ自動添付しない。

### 6.2 返答形式

```ts
 type PartnerProfileSetupResult = {
   schemaVersion: 1;
   requestId: string;
   requestType: "partner_profile_setup";
   profileId: "main_partner";
   displayName: string;
   traits: Record<PartnerTraitId, number>;
   preferredActionIds: ActionId[];
   dislikedActionIds: ActionId[];
   dialogues: Array<{
     actionId: ActionId;
     text: string;
   }>;
 };
```

## 7. 「今のふたりを反映する」更新相談

### 7.1 更新プロンプト

現在プロフィールが手動設定の場合、`partner_profile_update` を使用する。

プロンプトには次を含める。

- `requestId`
- `profileId: main_partner`
- `expectedRevision`
- 現在の表示名
- 現在の12個の性格値
- 現在のpreferred、disliked行動
- 現在の全台詞について `dialogueId`、actionId、text、enabled
- 値が増える更新と減る更新のどちらも正しいこと
- 安心が増えた結果として探索や心配が弱くなる変更も許可すること
- 変更する項目だけ返すこと
- 台詞追加は新規テキストとして返し、既存台詞を消したい場合は `disableDialogueIds` を使うこと
- 新しい行動IDを作らないこと

### 7.2 更新返答形式

```ts
 type PartnerProfileUpdateResult = {
   schemaVersion: 1;
   requestId: string;
   requestType: "partner_profile_update";
   profileId: "main_partner";
   expectedRevision: number;
   displayName: string | null;
   traitUpdates: Partial<Record<PartnerTraitId, number>>;
   preferredActionIds: ActionId[] | null;
   dislikedActionIds: ActionId[] | null;
   addDialogues: Array<{
     actionId: ActionId;
     text: string;
   }>;
   disableDialogueIds: string[];
 };
```

- `null`は変更なしを表す。
- 空の `traitUpdates` は許可する。
- ただし検証後の実効差分がゼロの場合は確認画面へ進めず、「変更がありません」と案内する。

## 8. 厳密検証

### 8.1 共通

- `schemaVersion` は1だけ
- requestIdは現在の保留中依頼と完全一致
- requestTypeは保留中依頼と完全一致
- profileIdは `main_partner` だけ
- 未知のトップレベルキーを拒否する
- 文字列は前後空白を除いて検証する
- 制御文字を拒否する

### 8.2 表示名

- 1文字以上40文字以内
- 空白だけを拒否
- HTMLとして解釈しない

### 8.3 性格値

- 初期設定は12キーを過不足なく要求する
- 更新は既知キーだけを許可する
- 数値型の整数
- 0から100
- 文字列の数値やNaNを許可しない

### 8.4 preferred、disliked

- 既存の六つのActionIdだけ
- 配列内重複なし
- preferredは最大4件
- dislikedは最大3件
- 両方へ同じActionIdを含めない
- 更新で片方だけ変更する場合も、変更後の全体で重複がないことを検証する

### 8.5 台詞

初期設定：

- 六行動それぞれ1件以上3件以下
- 全体6件以上18件以下

更新：

- `addDialogues` は最大12件
- `disableDialogueIds` は最大12件
- 無効化できるのは現在プロフィールの存在する有効台詞IDだけ
- 同じIDの重複を拒否
- 反映後、六行動それぞれに有効台詞が1件以上残ること
- 反映後の有効台詞は全体36件以下

台詞文字列：

- 1文字以上120文字以内
- 空白だけを拒否
- 同一actionId内で、前後空白を除いた同一文の重複を拒否
- HTMLとして解釈しない

## 9. 差分確認

検証成功後、反映前の確認画面へ進む。

表示する：

- 表示名の変更前と変更後
- 変更された性格値だけの変更前と変更後
- preferred、dislikedの追加、削除
- 追加される台詞
- 無効化される台詞
- 新しいrevision番号

初期設定の場合も、コーディ初期版との差分を表示する。

確認画面を開いただけでは次を変更しない。

- 現在プロフィール
- キャラクター表示名
- 自律行動の点数計算
- 台詞プール
- 履歴
- IndexedDBの現在版

操作：

- 「反映する」
- 「返答を修正する」
- 「相談を破棄する」

## 10. 反映処理

「反映する」を押した時、現在状態と保留中依頼を再検証する。

- requestIdが一致する
- 現在revisionがexpectedRevisionと一致する
- 現在プロフィールが確認画面作成時から変更されていない
- 初期設定の場合も現在版が想定したコーディ初期版である

反映手順：

1. 現在プロフィールと全台詞のチェックポイントを作る
2. 新しいrevisionを現在revision + 1で作る
3. 初期設定または更新結果から新しいプロフィールを作る
4. 追加台詞へゲーム側でdialogueIdを発行する
5. 指定された既存台詞を無効化する
6. 新しい完全スナップショットを履歴へ追加する
7. 現在プロフィール、台詞、キャラクター表示名、相談状態を一つの原子的保存で更新する
8. 保存成功後だけStoreへ反映する

- 保存失敗時は現在プロフィールを変更しない。
- 保存失敗時は保留中相談と貼り付け返答を残し、再試行できるようにする。
- 部分反映を残さない。
- 現在のコーディの移動、行動、タイマーを停止しない。
- 新しい設定は次の意思決定と台詞選択から使用する。

## 11. IndexedDB

DBバージョンを4へ上げる。

既存ストアを削除、再作成しない。

追加するストア：

### `partnerProfiles`

keyPath：

```ts
["saveSlotId", "profileId"]
```

現在プロフィールを一件保存する。

### `partnerProfileHistory`

keyPath：

```ts
["saveSlotId", "profileId", "revision"]
```

revisionごとの完全スナップショットを保存する。

### `dialogues`

keyPath：

```ts
["saveSlotId", "profileId", "dialogueId"]
```

現在までに作られた台詞を、有効、無効を含めて保存する。

既存の `consultations` と `checkpoints` を再利用する。

### 起動時

- DBバージョン3のセーブを壊さず更新する。
- 現在プロフィールがない場合、コーディ初期版を補完する。
- 履歴revision 1がない場合、コーディ初期版のスナップショットを補完する。
- 現在プロフィールが妥当なら、その表示名をキャラクター状態へ反映する。
- 一部の台詞が不正でも、妥当な台詞を残す。
- 行動ごとの有効台詞がゼロなら、その行動だけコーディ初期台詞へ補完する。
- プロフィール全体が不正ならコーディ初期版へフォールバックする。
- 他のセーブデータ、イベント、花の相談結果、位置、最近の行動を捨てない。

### 原子的保存

プロフィール反映と履歴復元は、少なくとも次を同じreadwrite transactionへ含める。

- appMeta
- saveSlots
- partnerProfiles
- partnerProfileHistory
- dialogues
- characters
- consultations
- checkpoints

現在の実装構造に合わせて必要な既存ストアを追加してよい。

## 12. 設定履歴

パートナー画面から「設定履歴を見る」を開ける。

一覧：

- revision
- 反映日時
- source
- 表示名
- 変更概要

詳細：

- 当時の12個の性格値
- preferred、disliked
- 当時の有効台詞
- 現在版との差分

現在版には「使用中」と表示する。

履歴の削除UIは追加しない。

## 13. 過去版の復元

過去版詳細から「この版を復元」を選べる。

- すぐ復元せず、現在版との差分確認を表示する。
- 明示確認後だけ復元する。
- 復元前の現在版をチェックポイントへ保存する。
- 過去のrevisionへポインタだけを巻き戻さない。
- 選んだ過去スナップショットを基に、現在revision + 1の新しい版を作る。
- sourceは `history_restore` とする。
- 新しい履歴を追加し、既存の新しい履歴も削除しない。
- 二人の位置、イベント、花の相談結果、最近の行動は巻き戻さない。
- 現在行動を中断せず、次の行動から復元設定を使う。
- 保存失敗時は現在版を変更しない。

## 14. UI一時状態と保存対象

保存する：

- 現在プロフィール
- 全台詞の有効、無効状態
- 全revision履歴
- パートナー設定の保留中相談
- 反映前チェックポイント
- キャラクター表示名

保存しない：

- 貼り付け途中の生返答
- 未検証JSON
- 差分確認画面だけの一時プレビュー
- 画面内のスクロール位置
- 一時フォーカス
- クリップボード内容

## 15. エラーとアクセシビリティ

- JSON抽出、検証、コピー、保存失敗を読み上げ可能な状態表示で案内する。
- 技術的なstack traceを通常UIへ表示しない。
- 保存失敗でもマップと自律生活を続行できる。
- 不正返答を受けても現在プロフィールを変更しない。
- textareaと入力要素は16px以上。
- ボタンは44px以上。
- 320px幅で横スクロールを発生させない。
- 差分は色だけで表さず、「72 → 60」等の文字を表示する。
- 画面を閉じた後は起点ボタンまたは適切な見出しへフォーカスを戻す。

## 16. テスト

最低限、次を自動テストする。

### 初期プロフィール

- コーディ固定値からrevision 1を作る
- プロフィール欠落時に初期版へ補完する
- 既存の自律行動結果が初期版で大きく変わらない

### 点数と台詞

- scoreCandidatesが注入プロフィールを使用する
- preferred、dislikedの変更が点数へ反映される
- 性格値の変更が点数へ反映される
- 有効なカスタム台詞を選ぶ
- 台詞ゼロの行動だけ初期台詞へフォールバックする

### 初期設定返答

- 正しい全12値と六行動の台詞を受理する
- 性格値不足、未知キー、範囲外、非整数を拒否する
- 未知ActionId、重複、preferredとdislikedの重複を拒否する
- 台詞不足、過多、長すぎる文字列、重複を拒否する
- requestId違いを拒否する

### 更新返答

- expectedRevision一致の変更だけ受理する
- 古いrevisionを拒否する
- 部分的なtraitUpdatesを正しく差分化する
- 台詞追加と無効化を正しく計算する
- 存在しないdialogueIdを拒否する
- 反映後に有効台詞ゼロとなる更新を拒否する
- 実効差分ゼロを拒否する

### 安全な反映

- 確認画面作成だけではStoreを変更しない
- 保存成功後だけ現在プロフィールと表示名を変更する
- 保存失敗時は現在プロフィールを維持し、保留中相談を残す
- 反映で移動、現在行動、直近行動履歴を変更しない
- 次の意思決定から新しい設定を使う

### DB移行と復旧

- DBバージョン3から4で既存ストアとデータを保持する
- 三つの新規ストアを正しいkeyPathで作る
- 壊れたプロフィール全体を初期版へ戻す
- 一部の壊れた台詞だけを除外、補完する
- 花のイベントと相談結果を維持する

### 履歴と復元

- 反映ごとにrevisionが一つ増える
- 完全スナップショットを履歴へ残す
- 過去版復元が新しいrevisionを作る
- 復元しても新しい履歴を削除しない
- 復元保存失敗時は現在版を維持する
- 復元で位置、イベント、最近の行動を巻き戻さない

### 既存機能

- 花の手動相談が引き続き動く
- 一件の保留中相談ルールを守る
- typecheck、全テスト、build、CIが成功する

## 17. 実装しない

- LLM API接続
- APIキー入力
- 自動送信、自動受信
- 会話履歴の読込
- パートナー人格全文の保存
- 恋愛メーター
- 関係性ラベルの強制
- 新規ActionId
- 行動定義、基本点、行動時間、目的地の編集
- 性格値の手動スライダー編集
- 台詞の直接追加、直接編集UI
- 複数パートナー切り替え
- パートナー画像、キャラクターピン画像
- クラウド同期
- バックアップ書出し
- 設定履歴の削除
- チェックポイント管理、削除UI
- 「知らない芽」の相談タイミング変更
- イベント進行の変更
- アイテム、画像、思い出、PWA

## 完了条件

- Milestone 6を維持する
- パートナー画面で現在設定を確認できる
- コーディ初期版のまま自律生活できる
- 初期設定用プロンプトを作成、コピーできる
- 正しい初期設定返答だけ差分確認へ進める
- 明示確認と保存成功後だけ初期設定を反映する
- 更新プロンプトで現在revisionと台詞IDを固定できる
- 古い返答や不正返答を反映しない
- 更新差分を確認後だけ反映する
- 新設定が次の自律行動から使用される
- 現在行動、移動、最近の行動を中断しない
- 設定履歴を閲覧できる
- 過去版を新しいrevisionとして復元できる
- DBバージョン3のセーブを壊さずバージョン4へ更新できる
- 保存失敗時に部分反映を残さない
- 外部通信を追加しない
- 320px幅、読み上げ、44pxタップ、16px入力へ対応する
- typecheck、test、build、CIが成功する

## Codexへ送る最小依頼文

```text
AGENTS.md と docs/INDEX.md を読み、現在の docs/NEXT_TASK.md の対象名を確認してから、その内容だけを実装してください。

最新mainから新しい作業ブランチを作り、範囲外を変更せず、typecheck・test・build・CIの結果を添えてPRを作成してください。

競合が発生した場合は作業ブランチ側で解消し、ユーザーへ手動での競合解消を求めないでください。
```
