# Kura ストア画像 — Play Console 掲載手順

各言語 11 枚（20 言語）。アイコンは全言語共通で `kura/icons/icon512.png`（512×512）。

```
images/store/
  en/  ja/  zh/  zh-TW/  ko/  es/  fr/  de/  pt/  it/  ru/  id/  hi/  tr/  vi/  th/  pl/  ar/  nl/  bn/
    store-image-feature.png          ← フィーチャー グラフィック（1024×500）
    store-image-1.png … 5.png        ← 携帯電話版のスクリーンショット（1080×1920）
    store-image-tablet-1.png … 5.png ← 7 インチと 10 インチのタブレット版スクリーンショット（1080×1920）
```

すべてアルファ無しの RGB PNG（Play の指定どおり）。

5枚の中身: 1 写真（ライブラリ）/ 2 スワイプで仕分け＋連写のベスト / 3 容量を食うもの / 4 プライベート（金庫）に写真を隠す / 5 容量の画面（料金）とバックアップ。
Play へは **2 → 4 → 3 → 1 → 5** の順で上げ、片付けに続いて写真を隠せることを伝える（携帯電話・タブレットとも）。順序と掲載文・22 掲載先の対応は `kura/store-listing.json` を正とする。

## API での反映

1. `node kura/store-images-strings.mjs` でアプリの翻訳を取り込み、`node kura/render-store-images.mjs` で全言語を生成する（`npm install --no-save puppeteer-core` と Chrome が必要）。
2. `node --test kura/store-assets.test.mjs` と `python kura/publish-store.py` を実行し、文言の一致・文字数・RGB・解像度を検証する。
3. `python kura/publish-store.py --publish` で掲載文と画像を同じ edit 内で検証して反映し、`--verify` で掲載文・画像の SHA-256 と並び順を読み戻して照合する。

認証鍵は `GOOGLE_APPLICATION_CREDENTIALS` または `~/.kura/play-service-account.json`。鍵はリポジトリへ置かない。画像・文言を確認してから送信し、審査中の場合はその審査を自動取消しせず停止する。

## 手順（言語ごとに繰り返す）

1. Play Console → Kura → **ユーザーを増やす > ストアでの表示 > ストアの掲載情報**
2. 上部の言語ドロップダウンで対象言語を選ぶ（下の表）
3. **アプリのアイコン**（既定の言語だけ）→ `kura/icons/icon512.png`
4. **フィーチャー グラフィック** → `<lang>/store-image-feature.png`
5. **携帯電話版のスクリーンショット** → 上記の順で追加（並び順が表示順）
6. **7 インチ タブレット**と **10 インチ タブレット**のスクリーンショット → どちらにも上記と同じ順で
7. ページ下部の**保存**

## Console の言語コード対応

| フォルダ | Console 表示 |
|---|---|
| en | 英語 (アメリカ合衆国) – en-US |
| ja | 日本語 – ja-JP |
| zh | 中国語 (簡体字) – zh-CN |
| zh-TW | 中国語 (繁体字) – zh-TW |
| ko | 韓国語 – ko-KR |
| es | スペイン語 (スペイン) – es-ES（中南米 es-419 にも同じ画像を使える） |
| fr | フランス語 (フランス) – fr-FR |
| de | ドイツ語 – de-DE |
| pt | ポルトガル語 (ブラジル) – pt-BR |
| it | イタリア語 – it-IT |
| ru | ロシア語 – ru-RU |
| id | インドネシア語 – id |
| hi | ヒンディー語 – hi-IN |
| tr | トルコ語 – tr-TR |
| vi | ベトナム語 – vi |
| th | タイ語 – th |
| pl | ポーランド語 – pl-PL |
| ar | アラビア語 – ar（画面の中は右から左。振り分けのボタンはアプリと同じく左右を固定） |
| nl | オランダ語 – nl-NL |
| bn | ベンガル語 – bn-BD |

## 再生成

アプリの文言や訳を直したら:
```
cd kura
node store-images-strings.mjs      # Kura リポジトリの strings.xml → store-images-app-strings.js
npm install --no-save puppeteer-core
node render-store-images.mjs       # 20 言語 × 11 枚を書き出し（nl bn のように言語を絞れる）
```
テンプレ: `store-images.html`（画面とレイアウト） / `store-images-i18n.js`（キャプション 20 言語）。
`store-images.html?lang=xx` をブラウザで開くと各言語をプレビューできる。
書き出し時にフォント・画像の読み込みと見切れを検証する。アプリのアイコンは `kura/icons/icon512.png` を使う。
