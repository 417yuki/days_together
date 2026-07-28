# 次の実装タスク

この文書は、Codexへ長い依頼文を毎回貼らずに済むよう、次の一件だけを記載する。

作業開始前に `AGENTS.md`、`docs/INDEX.md`、`docs/PRODUCT_SPEC.md`、`docs/ROADMAP.md` を読むこと。

## 対象

Milestone 5：最初のイベント「知らない芽」

## 目的

庭に一度だけ現れる小さな発見イベントを、パートナーチャットへ相談しなくても、発見から普通の花としての完了まで遊べるようにする。

このMilestoneでは、これまで実装したマップ、保存、自律生活へ、最初の小さな物語を接続する。

- 通常はセーブ開始日の翌日以降に発生する
- 開発者パネルからは待たずに発生を試せる
- 庭の芽をタップすると、最初に概要ボトムシートが開く
- 必要な場合だけ詳細画面へ進む
- 観察、手入れ、見守るというプリセット選択だけで完了できる
- どの経路でも失敗や枯死を起こさず、普通の花として庭へ残る
- イベント状態と選択結果はIndexedDBへ保存する
- コーディの自律生活はイベント中も停止しない
- LLM APIやパートナーチャットへ問い合わせない

## 基本ルール

- 今回実装するイベントは `unknown_sprout` 一件だけとする。
- イベントは庭に一度だけ発生する。
- 完了後に同じイベントを再発させない。
- イベントを開く、閉じる、選択する操作で、主人公やコーディの現在地を変更しない。
- イベント進行のためにキャラクターを瞬間移動させない。
- コーディの自律移動、行動、台詞、保存を維持する。
- イベント中も日常生活を停止しない。
- 実時間の待機を要求せず、一回のプレイ中にプリセット結果まで進められる。
- 画像は必須にしない。文字とローカルな記号またはインラインSVGだけで成立させる。
- 外部アイコンフォント、CDN、ネットワーク通信を追加しない。

## 実装する

### 1. イベントIDと状態型

今回のイベントIDは一つだけとする。

```ts
type EventId = "unknown_sprout";
```

進行状態は、矛盾した組合せを作れない判別可能なunionまたは同等の安全な型で表す。

```ts
type UnknownSproutPath = "tended" | "watched";

type UnknownSproutState =
  | {
      eventId: "unknown_sprout";
      status: "locked";
      stage: "hidden";
      path: null;
      choiceHistory: [];
    }
  | {
      eventId: "unknown_sprout";
      status: "available";
      stage: "sprout";
      path: null;
      choiceHistory: [];
    }
  | {
      eventId: "unknown_sprout";
      status: "active";
      stage: "observed";
      path: null;
      choiceHistory: ["observe"];
    }
  | {
      eventId: "unknown_sprout";
      status: "active";
      stage: "growing";
      path: UnknownSproutPath;
      choiceHistory: ["observe", "tend" | "watch"];
    }
  | {
      eventId: "unknown_sprout";
      status: "completed";
      stage: "flower";
      path: UnknownSproutPath;
      choiceHistory: ["observe", "tend" | "watch", "finish"];
    };
```

型名やファイル分割は既存構成に合わせて調整してよいが、意味と有効な遷移を変えないこと。

初期状態は次とする。

```ts
{
  eventId: "unknown_sprout",
  status: "locked",
  stage: "hidden",
  path: null,
  choiceHistory: []
}
```

### 2. イベント定義

表示文、庭上の位置、各段階の説明、選択肢はデータとしてまとめる。

最低限、次を持つ。

```ts
type EventDefinition = {
  eventId: EventId;
  title: string;
  mapId: "starter_garden";
  position: { x: number; y: number };
};
```

`unknown_sprout` の表示名は `知らない芽` とする。

庭上の初期位置は、既存の庭地点やキャラクターピンと大きく重ならない次の値を基準とする。

```ts
position: { x: 0.78, y: 0.64 }
```

この座標はイベント表示用であり、キャラクターの現在地や移動経路の地点として扱わない。

### 3. セーブ開始日と発生条件

製品仕様の「2日目以降」を、端末のローカル暦日で判定する。

`AppState`または同等の安定状態へ、セーブの開始日を表す値を追加する。

```ts
worldStartedOn: string;
```

形式は端末ローカル日付の `YYYY-MM-DD` とする。

- 新規セーブ作成時は、その日のローカル日付を入れる。
- DBバージョン1の既存セーブで値が欠落している場合は、読込日のローカル日付を補完する。
- 不正な日付文字列は読込日のローカル日付へ戻す。
- 日付を作る関数は現在時刻を注入できる純粋関数または同等の境界を持ち、テストで実時計へ依存しない。

通常の発生条件：

```text
unknown_sprout.status が locked
かつ
今日のローカル日付が worldStartedOn より後
```

条件を満たしたら、次へ一度だけ遷移する。

```text
locked / hidden
→ available / sprout
```

発生確認は最低限、次の時点で行う。

- 起動時のセーブ復元後
- `visibilitychange`で画面が再び表示状態になった時

バックグラウンドタイマーを常時動かさない。日付が過去へ戻っても、すでに `available`、`active`、`completed` のイベントを巻き戻さない。

### 4. 開発者パネルのイベント操作

待たずに検証できるよう、開発者パネルへイベント状態を表示する。

表示する：

- `eventId`
- `status`
- `stage`
- `path`
- `choiceHistory`
- `worldStartedOn`
- 今日のローカル日付

操作：

- `locked` の時だけ `知らない芽を発生させる`
- `available`、`active`、`completed` の時は `知らない芽を初期状態へ戻す`

即時発生は通常条件を無視し、`available / sprout`へ進めて保存する。

イベントだけの初期化は、次を同時に行う。

- `unknown_sprout`を`locked / hidden`へ戻す
- `worldStartedOn`を今日のローカル日付へ戻す
- 画面上のイベント詳細を閉じる
- 変更を保存する

既存の全体リセットでも、同じイベント初期状態と今日の`worldStartedOn`へ戻す。

### 5. 庭マップ上のイベント表示

`MapView`またはイベント表示専用コンポーネントへ、イベントマーカーを追加する。

表示条件：

- 表示中マップが `starter_garden`
- イベント状態が `available`、`active`、`completed` のいずれか

段階ごとの表示：

- `available / sprout`：芽を表す文字またはローカルアイコン
- `active / observed`：観察中の芽
- `active / growing`：育っている芽
- `completed / flower`：花を表す文字またはローカルアイコン

要件：

- `button`として実装する
- タップ領域44px以上
- `data-focus-key`を持つ
- 段階に応じた`aria-label`を持つ
- 色だけで状態を区別しない
- キャラクターピン、地点ボタン、家の外観を操作できる状態を維持する
- タップしても主人公やコーディを移動させない

### 6. 概要ボトムシート

イベントマーカーをタップしたら、最初に概要ボトムシートを開く。

最低限、次を表示する。

- タイトル `知らない芽`
- 現在段階に対応する短い説明
- `詳しく見る`ボタン
- `閉じる`ボタン

段階別の概要文は次を基準とする。

- `sprout`：`庭の土から、見覚えのない小さな芽が顔を出しています。`
- `observed`：`葉は二枚。植えた覚えはないけれど、元気そうです。`
- `growing / tended`：`土を整えて水をあげた芽が、ゆっくり茎を伸ばしています。`
- `growing / watched`：`そっと見守っている芽が、日差しの方へ少し傾いています。`
- `flower / tended`：`手入れを続けた芽は、淡い黄色の小さな花になりました。`
- `flower / watched`：`そっと見守った芽は、白い小さな花を静かに開きました。`

ボトムシートを閉じた後は、再描画後の同じイベントマーカーへフォーカスを戻す。

### 7. イベント詳細画面

`詳しく見る`を選んだ時だけ、イベント詳細画面をメイン領域へ表示する。

`AppState`へ、詳細画面の開閉を表す一時状態を追加してよい。

```ts
openEventId: EventId | null;
```

この値は保存しない。起動、復元、全体リセット後は`null`とする。

詳細画面には次を表示する。

- 戻るボタン
- イベント名
- 現在の段階
- 段階に対応する説明
- 現在有効な選択肢
- 完了済みの場合は結果

戻る操作でマップへ戻り、可能ならイベントマーカーへフォーカスを復帰する。

下部ナビゲーションで別画面を選んだ場合は、イベント詳細を閉じて通常のナビゲーションを行う。

### 8. プリセット進行

状態遷移は純粋関数へ分離する。

```ts
advanceUnknownSprout(
  current: UnknownSproutState,
  choiceId: UnknownSproutChoiceId
): UnknownSproutState | null
```

`null`または明示的な失敗値は、現在状態で無効な選択を表す。無効な選択で状態を変更しない。

有効な遷移：

#### 発見後

```text
available / sprout
選択：observe「観察する」
→ active / observed
```

表示文：

`葉は二枚。植えた覚えはないけれど、茎はまっすぐで元気そうです。`

#### 観察後の分岐

```text
active / observed
選択：tend「土を整えて水をあげる」
→ active / growing / tended
```

または：

```text
active / observed
選択：watch「触れずに見守る」
→ active / growing / watched
```

どちらかを選んだ後に、別経路へ変更しない。

#### 成長中から完了

```text
active / growing
選択：finish「次の様子を見る」
→ completed / flower
```

`tended`のプリセット結果：

`淡い黄色の小さな花が咲きました。特別な正体は決めず、庭の新しい花として残ります。`

`watched`のプリセット結果：

`白い小さな花が静かに開きました。特別な正体は決めず、庭の新しい花として残ります。`

完了後は選択肢を表示せず、結果と戻る操作だけを表示する。

植物を枯らさない。失敗、取り返しのつかない損失、危険な結果を追加しない。

### 9. 最近の出来事

既存の「最近の出来事」は、新しい履歴ストアを追加せず、`unknown_sprout`の現在状態から一件の要約を表示してよい。

例：

- `locked`：`まだ大きな出来事はありません。`
- `available`：`庭で見覚えのない芽が見つかりました。`
- `active / observed`：`知らない芽を観察しました。`
- `active / growing`：`知らない芽を見守っています。`
- `completed`：`庭に小さな花が咲きました。`

このMilestoneでは汎用のactivity logは実装しない。

### 10. コーディの自律生活との関係

イベントはコーディの現在行動を強制中断しない。

- イベントを開いている間も、コーディの自律行動タイマーは通常どおり進んでよい。
- イベント選択でコーディを庭へ移動させない。
- `observe_event`を行動候補へ追加しない。
- イベント関心補正や強い状況ルールを追加しない。
- コーディが偶然庭にいても、イベント結果を自動決定しない。

イベント画面の再描画で、コーディの移動タイマーや行動タイマーを重複作成しない。

### 11. IndexedDBバージョン2

既存のDB名とメインセーブIDを維持する。

```ts
const DB_NAME = "futari-biyori";
const DB_VERSION = 2;
const MAIN_SAVE_SLOT_ID = "main";
```

`onupgradeneeded`で、新しい`events`ストアを追加する。

```ts
STORE_NAMES.events = "events";
```

`events`ストア：

- keyPath：`["saveSlotId", "eventId"]`
- 今回は`unknown_sprout`一件だけ

レコード例：

```ts
{
  saveSlotId: "main";
  eventId: "unknown_sprout";
  status: "active";
  stage: "growing";
  path: "tended";
  choiceHistory: ["observe", "tend"];
}
```

アップグレード要件：

- DBバージョン1の`appMeta`、`saveSlots`、`worldStates`、`characters`を削除、再作成しない
- 既存の表示マップ、二人の現在地、直近行動を維持する
- `events`が存在しない時だけ作成する
- `versionchange`時の接続終了を維持する
- アップグレード失敗時も既存どおりメモリ上でゲームを続行できる

### 12. 保存スナップショットとtransaction

保存対象へ次を追加する。

- `worldStartedOn`
- `unknown_sprout`の安定状態

保存しない：

- `openEventId`
- ボトムシートの開閉状態
- フォーカス先
- 一時的な説明メッセージ
- DOM参照
- イベント画面のスクロール位置

イベント選択、通常発生、開発者の即時発生、イベント初期化、全体リセットの直後に自動保存する。

保存は、少なくとも次を同じreadwrite transactionで更新する。

- `saveSlots.updatedAt`
- `worldStates`
- `characters`
- `events`

既存のPromise直列化を維持し、古いイベント状態が新しい状態を上書きしないようにする。

### 13. 読込検証と部分復旧

IndexedDBから読んだイベントレコードを無条件に型変換しない。

最低限、次を検証する。

- `saveSlotId`が`main`
- `eventId`が`unknown_sprout`
- `status`と`stage`の組合せが有効
- `path`が段階と整合する
- `choiceHistory`が段階と整合する
- 同じ`eventId`が重複していない

復旧ルール：

- 欠落したイベントは初期状態へ戻す
- 不正なイベントは初期状態へ戻す
- 未知の余分なイベントは無視する
- 重複した`unknown_sprout`レコードは安全のため初期状態へ戻す
- 不正または欠落した`worldStartedOn`は読込日のローカル日付へ戻す
- イベントデータだけが壊れていても、表示マップ、キャラクター位置、直近行動は利用する
- 読込後の`openEventId`は必ず`null`
- `completed`の有効なイベントは完了状態のまま復元する

検証と初期値への統合は純粋関数へ分離し、現在日を注入してテストする。

### 14. 読み上げとモバイル要件

- イベント発生時は`aria-live`領域で `庭に知らない芽が現れました。` と案内する
- 選択後は新しい段階を短く案内する
- 完了時は `庭に小さな花が咲きました。` と案内する
- ボトムシートと詳細画面に見出しを付ける
- ボタン文言だけで操作内容が分かるようにする
- タップ領域44px以上
- 320px幅で横スクロールを起こさない
- iPhoneのセーフエリアを維持する
- ホバー必須操作を追加しない
- `prefers-reduced-motion`でイベント表示を損なわない
- 新しい点滅、連続アニメーションを追加しない

### 15. テスト

最低限、次を自動テストする。

#### 発生条件

- 開始日と同じ日は発生しない
- 開始日の翌ローカル日以降に発生する
- すでに`available`、`active`、`completed`なら再発処理で変化しない
- 不正な開始日は今日へ補完される
- 注入した現在日で決定的に判定できる

#### 状態遷移

- 初期状態が`locked / hidden`
- 即時発生で`available / sprout`になる
- `observe`で`active / observed`になる
- `tend`で`growing / tended`になる
- `watch`で`growing / watched`になる
- `finish`で各経路の`completed / flower`になる
- 無効な順序の選択は状態を変更しない
- 成長中に経路を変更できない
- 完了後に再進行しない
- 入力状態を破壊的変更しない

#### 保存と復元

- 保存スナップショットへ`worldStartedOn`とイベント状態が入る
- `openEventId`とダイアログ状態は保存されない
- 有効なイベントを復元できる
- 完了状態を復元できる
- 不正なstatus、stage、path、choiceHistoryを初期状態へ戻す
- 未知イベントを無視する
- 重複イベントを初期状態へ戻す
- イベントが欠落したDBバージョン1相当データから安全に起動できる
- イベント選択後の状態が保存キューへ渡る
- 全体リセット後にイベント初期状態と今日の開始日が保存される
- 保存失敗でもメモリ上のイベント進行を続けられる

#### UIと既存機能

- イベントマーカーは庭だけに表示される
- `locked`では表示されない
- `completed`では花表示になる
- イベント操作で二人の位置が変わらない
- ボトムシートを閉じるとイベントマーカーへフォーカスが戻る
- 詳細画面からマップへ戻れる
- コーディの自律行動がイベント操作で停止、重複開始しない
- 既存の移動、代理表示、マップ切り替え、開発者パネルが維持される

VitestのNode環境でブラウザIndexedDBが存在しないことを前提に、状態遷移、日付判定、復旧、保存repositoryのfakeを中心にテストする。テストのためだけに大きなランタイム依存を追加しない。

## 実装しない

- パートナーチャットへの手動相談
- 送信用プロンプト作成
- 返答貼り付け
- JSON抽出、検証、確認、反映
- チェックポイント
- 花の自由命名
- 正体、由来、次の出来事の自由生成
- 新規アイテム作成
- 思い出登録
- イベント画像登録
- 画像生成用プロンプト
- 本格的なゲーム内時間
- 現実1分をゲーム内10分として扱う時計
- オフライン進行
- 閉じていた時間の追いつき
- 植物の枯死
- 失敗分岐
- 重大な損失
- 複数イベント同時進行
- `observe_event`自律行動
- イベントによるコーディの強制移動、強制中断
- イベント関心スコア
- 天気、体力、気分、空腹
- PWA
- 通知
- クラウド同期
- 外部API接続
- 本番画像

## 完成条件

- DBバージョン1の既存セーブを壊さず、DBバージョン2と`events`ストアを追加できる
- 新規または補完された`worldStartedOn`が保存される
- 通常はセーブ開始日の翌ローカル日以降に芽が一度だけ発生する
- 開発者パネルから即時発生と初期化を試せる
- 庭マップにタップ可能な芽が表示される
- イベントマーカーをタップすると概要ボトムシートが開く
- 必要な場合だけ詳細画面へ進める
- 観察、手入れまたは見守る、開花の順に進められる
- どちらの経路でも安全な普通の花として完了できる
- 完了後は花として表示され、同じイベントが再発しない
- 再読込後もイベント段階、経路、選択履歴、開始日が残る
- 壊れたイベントデータがあっても他の正常なセーブを利用して起動できる
- イベントの開閉と進行で主人公とコーディの位置が変わらない
- コーディの自律生活、既存移動、代理表示、保存が維持される
- ボトムシートと詳細画面が読み上げ可能
- 320px幅で横スクロールがない
- typecheck、test、buildが成功する
- GitHub ActionsのCIが成功する
- 範囲外の手動相談、アイテム、思い出、画像、本格時間を追加していない

## Codexへ送る最短依頼

```text
AGENTS.md と docs/INDEX.md を読み、現在の docs/NEXT_TASK.md の対象名を確認してから、その内容だけを実装してください。
最新mainから新しい作業ブランチを作り、範囲外を変更せず、typecheck・test・build・CIの結果を添えてPRを作成してください。
```
