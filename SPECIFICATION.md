# SPECIFICATION — ramune441.github.io

Chrome拡張機能・Androidアプリ・WebサービスのLP/プライバシーポリシーを提供する静的サイト。GitHub Pagesホスティング。

## サイト構成

| パス | 種別 | インデックス | sitemap | 説明 |
|---|---|---|---|---|
| `/` | ルートポータル | index | yes | 全プロダクト一覧 |
| `/formpilot/` | LP | index | yes | Chrome拡張 |
| `/formpilot/guide.html` | 使い方ガイド | index | yes | 操作手順 |
| `/formpilot/privacy-policy.html` | 規約 | index | yes | プライバシーポリシー |
| `/formpilot/promo.html` | 動画用 | noindex | no | 録画専用 |
| `/ashiato-maker/` | LP | index | yes | Chrome拡張 |
| `/ashiato-maker/privacy-policy.html` | 規約 | index | yes | プライバシーポリシー |
| `/ashiato-maker/promo.html` | 動画用 | noindex | no | 録画専用 |
| `/lovent/` | LP | index | yes | Android |
| `/lovent/privacy-policy.html` | 規約 | index | yes | プライバシーポリシー |
| `/lovent/promo.html` | 動画用 | noindex | no | 録画専用 |
| `/lovent/store-images.html` | ストア画像生成 | noindex | no | スクショ撮影用 |
| `/sendready/` | LP | index | yes | Android |
| `/sendready/tutorial.html` | 使い方ガイド | index | yes | 操作手順 |
| `/sendready/privacy-policy.html` | 規約 | index | yes | プライバシーポリシー |
| `/sendready/promo.html` | 動画用 | noindex | no | 録画専用 |

外部ドメイン運用のプロダクト（リポジトリにディレクトリを持たない）:

| プロダクト | URL | 種別 |
|---|---|---|
| Charmly | https://charm-ly.com/ | Web |

## SEO 設計

### 必須メタタグ（全インデックス対象ページ）

| タグ | 内容 |
|---|---|
| `<title>` | 日本語、ページ固有、60文字以内 |
| `meta description` | 日本語、120-160文字 |
| `meta robots` | `index, follow` (`noindex` は promo/store-images のみ) |
| `link canonical` | 自身の絶対URL |
| `og:title` `og:description` `og:type` `og:url` `og:image` `og:locale=ja_JP` `og:site_name` | 必須 |
| `twitter:card=summary_large_image` | 必須 |
| `og:image:width` `og:image:height` `og:image:alt` | LPおよびルートで設定 |

### JSON-LD 構造化データ

| ページ | 構造化データ |
|---|---|
| `/` (ルート) | `WebSite` + `Person`(`@id`参照) + `ItemList`(各SoftwareApplication入れ子) |
| 各LP | `SoftwareApplication` + `FAQPage` + `BreadcrumbList` |
| guide/tutorial | 現状なし（将来 `HowTo` 追加余地あり） |

### sitemap.xml / robots.txt

- `sitemap.xml`: 全インデックス対象ページを列挙。`lastmod` はリリース毎に更新。
- `robots.txt`: 全許可。`promo.html` `store-images.html` `node_modules/` を `Disallow`。

### Google Analytics 計測ID

| プロダクト | gtag ID |
|---|---|
| ルート (`/`) | G-4YHTG3FQSX |
| formpilot | G-4QPZE2JTLP |
| ashiato-maker | G-NLL1M8ZFGH (+ Google広告 AW-17017238782) |
| lovent | G-4YHTG3FQSX |
| sendready | G-4YHTG3FQSX |

### Google Search Console 認証

- ルートに `<meta name="google-site-verification" content="prSam5v9XLSOs51WRCTyq592bxz1Xmf6HiBGRA-_ke0">` を設置済み。

## 新規プロダクト追加時の必須作業

1. ディレクトリ作成 (`<product>/`)
2. `index.html` を作成（CLAUDE.md のLP構成に従う）
3. ルート `index.html` のカードとItemList JSON-LDに追加
4. `sitemap.xml` にURL追加（最低 `/`・`privacy-policy.html`）
5. 必要に応じて `robots.txt` の Disallow に `promo.html` 追加
6. このSPECIFICATIONのサイト構成表を更新

## デプロイ

GitHub Pages（masterブランチ直push）。手動ビルドなし。

## 使用外部サービス

| サービス | 用途 | 認証 | 制約 |
|---|---|---|---|
| GitHub Pages | ホスティング | - | 1リポジトリ1サイト |
| Google Analytics 4 | アクセス計測 | gtag.js | - |
| Google Ads | 広告計測 (ashiato-maker のみ) | gtag.js | - |
| Google Fonts | Webフォント | - | Noto Sans JP / Inter |
| Google Search Console | サーチ計測 | metaタグ認証 | - |
