# ふたり日和

ユーザーと、その人が普段から会話しているAIパートナーが、小さな家と庭で暮らすスマートフォン向け生活シミュレーションゲームです。

ゲームの日常行動は端末内の JavaScript で進みます。特別な出来事についてパートナー本人へ相談したい場合だけ、ゲームが送信用プロンプトを作ります。ユーザーが普段のパートナーチャットへ手動で送り、返答を手動でゲームへ戻して、確認後に反映します。

ゲームから LLM API や画像生成 API へ直接接続する設計ではありません。

公開プリセットパートナーは「コーディ」です。

アイテム画像は必須ではありません。一覧や小さな表示には汎用アイコンを使い、詳細では個別画像、カテゴリ共通画像、拡大アイコンの順に表示します。

## 仕様の入口

開発・レビュー前に、次を順に確認してください。

1. [`AGENTS.md`](./AGENTS.md)
2. [`docs/INDEX.md`](./docs/INDEX.md)
3. [`docs/PRODUCT_SPEC.md`](./docs/PRODUCT_SPEC.md)
4. [`docs/ITEM_VISUALS.md`](./docs/ITEM_VISUALS.md)
5. [`docs/ROADMAP.md`](./docs/ROADMAP.md)
6. [`docs/NEXT_TASK.md`](./docs/NEXT_TASK.md)
7. [`docs/CHANGE_CONTROL.md`](./docs/CHANGE_CONTROL.md)

この文書群を、現在の製品仕様の一次情報とします。

## 現在の実装段階

Milestone 0、1、1.1まで完了しています。

- Vite + TypeScript の土台
- iPhone縦画面向けUI
- 家の中と庭の仮マップ
- 縦長3:4マップ
- キャラクター位置の地点データ連動
- 別マップ人物の代理表示
- 安全な動的文字描画
- 下部ナビゲーション
- 開発者パネル
- GitHub Actionsによるtypecheck、test、build

次はMilestone 2として、主人公とコーディが接続地点とゲートを通って家と庭を移動する機能を実装します。詳細は `docs/NEXT_TASK.md` を参照してください。
