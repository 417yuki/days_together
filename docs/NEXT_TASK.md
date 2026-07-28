# 次の実装タスク

この文書は、Codexへ長い依頼文を毎回貼らずに済むよう、次の一件だけを記載する。

作業開始前に `AGENTS.md`、`docs/INDEX.md`、`docs/PRODUCT_SPEC.md`、`docs/ITEM_VISUALS.md`、`docs/ROADMAP.md` を読むこと。

## 対象

Milestone 8A：画像なしで成立するアイテム基盤

## 目的

専用画像を一枚も用意しなくても、初期アイテムを一覧と詳細で確認でき、ユーザーが名前とカテゴリだけで新しいアイテムを登録できるようにする。

このMilestoneでは、アイテムの意味をテキストで保持し、見た目はアプリへ同梱したローカルSVGアイコンで成立させる。

- 外部アイコンフォントを読み込まない
- 外部画像URLへ接続しない
- 個別画像を要求しない
- 画像がないことをエラー扱いしない
- アイテム登録のためにパートナーチャットへ相談しない
- 既存のマップ、イベント、パートナー設定、自律生活を止めない

個別画像アップロード、画像Blob、マップ配置、キャラクターピン、背景、カスタムマップはこのMilestoneへ含めない。

## 前提

- 下部ナビゲーションの `items` を準備中画面から実画面へ変更する。
- メインセーブIDは既存どおり `main`。
- アイテムデータには安定した `itemId` を持たせる。
- 一覧は汎用アイコンを標準とする。
- 詳細は個別画像がないため、カテゴリ共通画像が未実装なら拡大した汎用アイコンへ必ずフォールバックする。
- `ItemVisual` は将来の個別画像に対応できる形で保存するが、このMilestoneでは `imageAssetId` は常に `null`、`mapDisplayMode` は常に `"icon"` とする。
- 初期アイテムとユーザー登録アイテムを同じ型で扱う。
- 動的なアイテム名、説明、カテゴリ名を `innerHTML` へ渡さない。

## 1. 固定カテゴリ

次のカテゴリIDを固定する。

```ts
type ItemCategory =
  | "food"
  | "drink"
  | "plant"
  | "book"
  | "tool"
  | "craft"
  | "photo"
  | "gift"
  | "furniture"
  | "clothing"
  | "toy"
  | "storage"
  | "memory"
  | "misc";
```

日本語表示：

| category | label |
|---|---|
| food | 食べ物 |
| drink | 飲み物 |
| plant | 植物 |
| book | 本・紙もの |
| tool | 道具 |
| craft | 工作材料 |
| photo | 写真 |
| gift | 贈り物 |
| furniture | 家具・装飾 |
| clothing | 衣類・布もの |
| toy | 玩具 |
| storage | 収納 |
| memory | 思い出品 |
| misc | その他 |

自由なカテゴリ追加は行わない。

## 2. アイテムデータ

少なくとも次の意味を持つ型を用意する。

```ts
type ItemSource = "preset" | "user" | "event";

type ItemVisual = {
  iconKey: string;
  genericVisualKey: string | null;
  imageAssetId: string | null;
  mapDisplayMode: "icon" | "image" | "auto";
};

type GameItem = {
  itemId: string;
  name: string;
  category: ItemCategory;
  description: string;
  tags: string[];
  source: ItemSource;
  visual: ItemVisual;
  createdAt: string;
  updatedAt: string;
};
```

型名やファイル分割は既存構造へ合わせてよい。

### 2.1 文字列と件数

- `itemId`：1から100文字。ゲーム側が発行する。
- `name`：前後空白を除いて1から40文字。
- `description`：任意。前後空白を除いて0から280文字。
- `tags`：最大12件。
- 一つのタグ：前後空白を除いて1から24文字。
- 同じタグの重複は不可。
- C0制御文字とDELを受け付けない。説明の改行は許可してよい。
- `source` は固定三値だけ。
- `createdAt`、`updatedAt` はISO日時文字列。

かんたん登録画面では、`tags` の入力UIをまだ追加しない。ユーザー登録時は空配列とする。

### 2.2 ユーザー登録アイテムの既定値

名前とカテゴリを受け取り、ゲーム側で次を設定する。

```ts
{
  itemId: createSecureId(),
  name: normalizedName,
  category,
  description: normalizedDescription,
  tags: [],
  source: "user",
  visual: {
    iconKey: categoryDefault.iconKey,
    genericVisualKey: categoryDefault.genericVisualKey,
    imageAssetId: null,
    mapDisplayMode: "icon"
  },
  createdAt: now,
  updatedAt: now
}
```

`itemId` は `crypto.randomUUID()` を優先する。

フォールバックが必要な場合は `crypto.getRandomValues()` を使用し、`Math.random()`だけでIDを作らない。

## 3. カテゴリ既定ビジュアル

カテゴリから既定値を得る純粋関数を用意する。

| category | iconKey | genericVisualKey |
|---|---|---|
| food | restaurant | food |
| drink | local_cafe | drink |
| plant | potted_plant | plant |
| book | menu_book | book |
| tool | handyman | tool |
| craft | construction | craft |
| photo | photo | photo |
| gift | redeem | gift |
| furniture | chair | furniture |
| clothing | apparel | clothing |
| toy | toys | toy |
| storage | inventory_2 | storage |
| memory | favorite | memory |
| misc | category | misc |

関数例：

```ts
getDefaultItemVisual(category: ItemCategory): ItemVisual
```

返す `imageAssetId` は `null`、`mapDisplayMode` は `"icon"`。

## 4. ローカルSVGアイコンレジストリ

最低限、次の `iconKey` をアプリへ同梱する。

- `category`
- `restaurant`
- `local_cafe`
- `potted_plant`
- `menu_book`
- `handyman`
- `construction`
- `photo`
- `redeem`
- `chair`
- `apparel`
- `toys`
- `inventory_2`
- `favorite`
- `umbrella`

実装ルール：

- Google Fonts、Material Symbolsフォント、CDNを実行時に読み込まない。
- SVGはローカルTypeScript、ローカルSVGファイル、または静的なインラインSVGとして同梱する。
- レジストリは `iconKey` から安全なSVG要素または静的定義を取得する。
- 未知の `iconKey` は `category` へフォールバックする。
- ユーザー入力をSVGの `innerHTML` へ連結しない。
- SVGパス等の静的な定義と、ユーザー由来のラベルを分離する。
- 一覧でアイテム名を併記する場合、装飾SVGは `aria-hidden="true"`。
- 詳細でSVG自体に意味を持たせる場合は、アイテム名を読み上げ名にする。
- 色だけでカテゴリを区別しない。
- 外部通信なしで表示できる。

アイコンの造形は単純でよい。既存製品のロゴやブランド形状を使用しない。

## 5. 初期アイテム

次の六件を固定のプリセットとして用意する。

```ts
const starterItems: GameItem[] = [
  {
    itemId: "starter_umbrella",
    name: "傘",
    category: "tool",
    description: "雨の日のために置いてある傘。",
    source: "preset",
    visual: {
      iconKey: "umbrella",
      genericVisualKey: "tool",
      imageAssetId: null,
      mapDisplayMode: "icon"
    }
  },
  {
    itemId: "starter_mug",
    name: "マグカップ",
    category: "drink",
    description: "日々の飲み物に使うマグカップ。",
    source: "preset"
  },
  {
    itemId: "starter_book",
    name: "本",
    category: "book",
    description: "静かな時間に開ける一冊の本。",
    source: "preset"
  },
  {
    itemId: "starter_snack",
    name: "おやつ",
    category: "food",
    description: "二人で食べられる小さなおやつ。",
    source: "preset"
  },
  {
    itemId: "starter_watering_can",
    name: "ジョウロ",
    category: "tool",
    description: "庭の植物へ水をあげるためのジョウロ。",
    source: "preset"
  },
  {
    itemId: "starter_toolbox",
    name: "工具箱",
    category: "tool",
    description: "工作や手入れに使う道具をまとめた箱。",
    source: "preset"
  }
];
```

省略されている `visual` はカテゴリ既定値から作る。

初期アイテムの `createdAt`、`updatedAt` は固定のプリセット日時でよい。

復元時：

- 有効な保存アイテムを `itemId` ごとに読む。
- 保存に存在しない初期アイテムIDは、プリセットから補う。
- 同じ `itemId` を二件作らない。
- 壊れたユーザーアイテムはその一件だけ無視する。
- 一件の破損で全アイテムやゲーム本体を初期化しない。

このMilestoneにはアイテム削除UIがないため、初期アイテムを補う動作でよい。

## 6. アイテム画面

### 6.1 状態

安定したアイテム配列と、一時的な画面状態を分ける。

意味として次を扱う。

```ts
type ItemView = "list" | "detail" | "create";
```

- `items`：保存対象。
- `itemView`：保存しない。
- `selectedItemId`：保存しない。
- 作成フォームの入力途中：保存しない。
- 一時的な成功、エラーメッセージ：保存しない。

### 6.2 一覧

下部ナビゲーションの「アイテム」で表示する。

表示：

- 見出し「アイテム」
- 登録件数
- 「アイテムを登録」ボタン
- アイテム行
  - 汎用アイコン
  - アイテム名
  - カテゴリの日本語名
- 保存失敗等を伝える `aria-live` 領域

一覧ルール：

- 行全体を `button` とし、44px以上のタップ領域にする。
- アイコンだけを操作対象にしない。
- アイコンと名前を必ず併記する。
- 初期アイテムを先、ユーザー登録を後に表示する。
- 同じsource内では名前または作成日時による決定的な順序にする。
- 一覧では個別画像Blobを読まない。
- このMilestoneでは画像がないため、常にアイコン表示でよい。

### 6.3 詳細

一覧行を押すと詳細へ進む。

表示：

- 「一覧へ戻る」
- 拡大した汎用アイコン
- アイテム名
- カテゴリ
- 説明
- プリセットまたはユーザー登録の表示
- 「画像は任意。現在は汎用アイコンで表示しています」等の短い案内

詳細の表示優先関数は、将来の三段フォールバックへ拡張できる形にする。

意味として次を判定できるようにする。

```ts
type ResolvedItemVisual =
  | { kind: "image"; assetId: string }
  | { kind: "generic"; key: string }
  | { kind: "icon"; iconKey: string };
```

ただしこのMilestoneでは画像アセットとカテゴリ共通画像の実画像を読み込まないため、最終的に `kind: "icon"` を表示してよい。

未知の `iconKey` でも空白にせず、`category` を表示する。

### 6.4 かんたん登録

「アイテムを登録」から開く。

入力：

- アイテム名
- カテゴリ
- 説明、任意

要件：

- アイテム名は `input type="text"`。
- カテゴリは固定カテゴリのネイティブ `select`。
- 説明は `textarea`。
- 入力文字は16px以上。
- 保存ボタンは「登録する」。
- キャンセルで一覧へ戻る。
- 登録前にカテゴリ既定のアイコン名を短く表示してよい。
- 個別画像の入力欄を出さない。
- タグ、操作、マップ配置の入力欄を出さない。
- バリデーションエラーをフォーム近くの `aria-live` で案内する。
- 動的文字列は `textContent` またはフォーム値で扱う。

### 6.5 登録処理

- 「登録する」を押した時だけ検証する。
- 検証失敗時は保存せず、入力を残す。
- 保存中の二重押しを防ぐ。
- IndexedDB保存に成功してから、メモリ上の現在アイテムへ追加する。
- 保存失敗時は現在アイテムへ追加しない。
- 保存失敗時もフォーム入力を残して再試行できる。
- 成功後は作成したアイテムの詳細を表示する。
- 作成したアイテム行へ戻った時にフォーカス復帰できるようにする。
- 登録でマップ、イベント、パートナー設定、人物位置を変更しない。

## 7. 保存

### 7.1 IndexedDB

`DB_VERSION` を4から5へ上げる。

追加ストア：

```ts
items
```

keyPath：

```ts
["saveSlotId", "itemId"]
```

DBバージョン4からの更新では、既存ストアを変更せず `items` だけを追加する。

### 7.2 保存レコード

```ts
type ItemRecord = {
  saveSlotId: "main";
  itemId: string;
  name: string;
  category: ItemCategory;
  description: string;
  tags: string[];
  source: ItemSource;
  visual: ItemVisual;
  createdAt: string;
  updatedAt: string;
};
```

### 7.3 SaveSnapshot

メインセーブの安定状態へ `items` を追加する。

保存する：

- 全アイテムの安定フィールド

保存しない：

- 一覧、詳細、作成の画面状態
- 選択中アイテムID
- フォーム入力途中
- 一時メッセージ
- SVG DOM要素
- Blob、Object URL
- 画像データ

### 7.4 読込と部分復旧

- `loadMainSave()` で `items` ストアの `main` 範囲を読む。
- レコードを一件ずつ検証する。
- 不正なカテゴリ、型、文字数、visualを持つ一件だけを無視する。
- 有効なユーザーアイテムは残す。
- 欠けた初期アイテムを補う。
- 保存アイテムがゼロでもゲーム本体を起動する。
- 不正な `iconKey` はアイテムレコード自体を捨てず、描画時に `category` へフォールバックしてよい。
- 既存のキャラクター、イベント、相談、パートナー履歴を従来どおり復元する。

### 7.5 書込

通常のメインセーブでアイテム配列を保存できるようにする。

加えて、かんたん登録は保存成功前に画面へ反映しないため、次のどちらかで実装する。

1. 新しいアイテム一件を保存する専用repositoryメソッドを直列化してからStoreへ反映する。
2. 次の完全なアイテム配列を一トランザクションで保存してからStoreへ反映する。

保存中に自動保存と競合しないよう、既存 `SaveCoordinator` の書込キューを使用する。

アイテム全置換を行う場合、対象は `main` のitems範囲だけとし、他セーブや他ストアを消さない。

## 8. StoreとApp

`AppState`へ少なくとも次の意味を追加する。

```ts
items: GameItem[];
itemView: "list" | "detail" | "create";
selectedItemId: string | null;
itemMessage: string;
```

初期状態：

- `items` は初期アイテム。
- `itemView` は `"list"`。
- `selectedItemId` は `null`。
- `itemMessage` は空。

操作：

- アイテム一覧を開く
- アイテム詳細を開く
- 詳細から一覧へ戻る
- 登録画面を開く
- 登録をキャンセルする
- アイテムを検証、保存、反映する

ナビゲーションを別画面へ切り替えた場合：

- アイテムの安定データは維持する。
- アイテムの一時画面は一覧へ戻してよい。
- フォーム入力途中を保存しない。
- パートナー相談や花の相談の保留状態を変更しない。

全体初期化では、アイテムを六つの初期アイテムへ戻してよい。

## 9. テスト

少なくとも次を自動テストする。

### 9.1 カテゴリとビジュアル

- 14カテゴリを受け付ける
- 各カテゴリから固定の `iconKey`、`genericVisualKey` を得る
- `imageAssetId` は `null`
- `mapDisplayMode` は `"icon"`
- 未知の `iconKey` が `category` へフォールバックする
- SVGレジストリが全必須キーを持つ

### 9.2 アイテム検証

- 正しいプリセット、ユーザーアイテムを受け付ける
- 空の名前を拒否する
- 40文字超の名前を拒否する
- 未知のカテゴリを拒否する
- 280文字超の説明を拒否する
- 重複タグを拒否する
- 不正なvisual型を拒否する
- 不正な一件が他の有効アイテムを壊さない

### 9.3 初期アイテム

- 六件ある
- itemIdが重複しない
- 各アイテムが有効
- 傘は `umbrella`
- 他の省略visualはカテゴリ既定値になる
- 保存に欠けた初期IDだけ補われる

### 9.4 作成

- 名前とカテゴリだけでユーザーアイテムを作れる
- 説明は任意
- ID生成関数と現在時刻を注入してテストできる
- 作成結果が入力を変更しない
- カテゴリ既定ビジュアルが設定される
- 保存成功時だけStoreへ追加される
- 保存失敗時はStoreへ追加しない

### 9.5 保存復元

- SaveSnapshotへitemsが入る
- 一時画面状態は入らない
- DBバージョン5とitemsストア
- DBバージョン4の既存セーブを復元できる
- 登録したアイテムが再読込後も残る
- 壊れた一件を無視し、他のアイテム、人物、イベント、パートナー設定を維持する

### 9.6 UI

DOMテストを既に採用していない場合、無理に新しいブラウザテスト基盤を追加しない。

純粋関数、Store、fake repositoryで主要動作を確認する。

## 10. アクセシビリティとモバイル

- 320px幅で横スクロールを発生させない。
- タップ対象は44px以上。
- 入力文字は16px以上。
- 一覧行はアイコンと名前を併記する。
- SVGだけへ意味を依存しない。
- フォームの `label` と入力を関連付ける。
- 成功、検証失敗、保存失敗は `aria-live` で案内する。
- 一覧、詳細、登録画面の見出しへ適切にフォーカスを移す。
- 詳細や登録から戻る時、可能なら元のボタンへフォーカスを戻す。
- `prefers-reduced-motion` を損なう新しいアニメーションを追加しない。
- iPhone Safariでフォーム拡大を起こしにくい16px以上を守る。

## 11. 今回変更しないもの

- `PRODUCT_SPEC.md` と `ITEM_VISUALS.md` の基本方針
- キャラクター移動経路と速度
- パートナーの行動点数式
- パートナーのプロフィール、台詞、履歴
- 「知らない芽」の段階、結果、相談内容
- 花の相談タイミング
- 思い出画面
- 設定画面
- 外部APIなしの方針
- バックアップ形式
- PWA
- 広告

## 12. 今回追加しないもの

- `<input type="file">`
- `FileReader`
- `URL.createObjectURL`
- 画像Blob
- `assets`、`assetBlobs` ストア
- カテゴリ共通画像の実ファイル
- 個別画像の追加、削除
- 画像編集、切抜き、圧縮
- マップへのアイテム描画
- マップ上の接地点、倍率
- `mapDisplayMode` の変更UI
- キャラクターピン画像
- 代理アイコン画像
- 室内、庭背景
- 地点マッピング
- 出入口編集
- アイテムスロット配置
- カスタムマップ
- アイテム削除
- アイテム名、説明の再編集
- 自由カテゴリ
- 数量、所持上限、消費処理
- パートナーへアイテムを渡す機能
- `inspect_item` の対象選択
- アイテム用手動相談
- アイテム用画像生成プロンプト
- クラウド同期

## 13. 完了条件

- 「アイテム」タブが準備中ではなく実画面になる。
- 六つの初期アイテムが表示される。
- 一覧はローカルSVGアイコン、名前、カテゴリを表示する。
- アイテム行全体をタップして詳細を開ける。
- 詳細は個別画像なしでも拡大アイコンを表示し、空白にならない。
- 未知のアイコンキーでも `category` へ安全に戻る。
- 名前とカテゴリだけでアイテムを登録できる。
- 説明を任意で追加できる。
- 登録したアイテムが一覧と詳細へ表示される。
- 保存成功前にメモリ上へ反映しない。
- 保存失敗時はフォーム入力を残し、既存アイテムを維持する。
- 登録アイテムがページ再読込後も残る。
- DBバージョン4から5へ安全に更新できる。
- 壊れたアイテム一件があっても他のアイテムとゲーム本体を復元できる。
- 外部アイコンフォントと外部画像通信を追加しない。
- 個別画像を必須にしない。
- パートナー、自律行動、移動、イベント、相談、履歴を維持する。
- 320px幅、44pxタップ領域、16px入力、読み上げ対応を満たす。
- typecheck、test、build、CIが成功する。

## 14. PR本文に記載すること

- 追加したカテゴリとアイコンキー
- SVGレジストリの構造と未知キーのフォールバック
- 初期アイテム六件
- かんたん登録の入力項目
- アイテム作成時の検証
- DBバージョン5とitemsストア
- DBバージョン4からの移行方法
- 保存失敗時に未反映となる仕組み
- 壊れたアイテムの部分復旧
- 画像Blob、マップ配置、カスタム素材を今回含めていないこと
- typecheck、test、buildの結果
- 変更ファイル一覧
- 手動確認手順

## 15. 手動確認

最低限、次をPR本文へ記載する。

1. 既存セーブで起動する。
2. 「アイテム」タブを開く。
3. 六つの初期アイテムがアイコンと名前つきで表示される。
4. 傘を開き、拡大した傘アイコン、カテゴリ、説明を確認する。
5. 一覧へ戻る。
6. 「アイテムを登録」を開く。
7. 名前だけ入力し、カテゴリを選ぶ。説明は空でもよい。
8. 登録する。
9. 作成したアイテムの詳細が表示される。
10. 一覧へ戻り、作成したアイテムがあることを確認する。
11. ページを再読込する。
12. 作成したアイテムが残ることを確認する。
13. パートナーの表示名、設定revision、現在地、イベント、花の相談結果が残ることを確認する。
14. 開発者パネルから自律行動が続くことを確認する。
15. 320px相当幅で横スクロールがないことを確認する。
