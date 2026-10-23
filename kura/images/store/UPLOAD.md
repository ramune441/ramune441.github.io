# Kura ストア画像 — Play Console 掲載手順

各言語 11 枚（18 言語）。アイコンは全言語共通で `kura/icons/icon512.png`（512×512）。

```
images/store/
  en/  ja/  zh/  zh-TW/  ko/  es/  fr/  de/  pt/  it/  ru/  id/  hi/  tr/  vi/  th/  pl/  ar/
    store-image-feature.png          ← フィーチャー グラフィック（1024×500）
    store-image-1.png … 5.png        ← 携帯電話版のスクリーンショット（1080×1920）
    store-image-tablet-1.png … 5.png ← 7 インチと 10 インチのタブレット版スクリーンショット（1080×1920）
```

すべてアルファ無しの RGB PNG（Play の指定どおり）。

5枚の中身: 1 写真（ライブラリ）/ 2 スワイプで仕分け＋連写のベスト / 3 容量を食うもの / 4 プライベート（金庫）に写真を隠す / 5 容量の画面（料金）とバックアップ。
Play へは片付けを先に見せる順 **2 → 3 → 1 → 4 → 5** で上げる（携帯電話・タブレットとも）。

## 手順（言語ごとに繰り返す）

1. Play Console → Kura → **ユーザーを増やす > ストアでの表示 > ストアの掲載情報**
2. 上部の言語ドロップダウンで対象言語を選ぶ（下の表）
3. **アプリのアイコン**（既定の言語だけ）→ `kura/icons/icon512.png`
4. **フィーチャー グラフィック** → `<lang>/store-image-feature.png`
5. **携帯電話版のスクリーンショット** → `store-image-2, 3, 1, 4, 5.png` の順で追加（並び順が表示順）
6. **7 インチ タブレット**と **10 インチ タブレット**のスクリーンショット → どちらにも `store-image-tablet-2, 3, 1, 4, 5.png` の順で
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

## 再生成

アプリの文言や訳を直したら:
```
cd kura
node store-images-strings.mjs      # Kura リポジトリの strings.xml → store-images-app-strings.js
npm init -y && npm install puppeteer
node record-store-i18n.mjs         # 12 言語 × 11 枚と icons/icon512.png を書き出し（ja en のように言語を絞れる）
rm -rf node_modules package.json package-lock.json
```
テンプレ: `store-images.html`（画面とレイアウト） / `store-images-i18n.js`（キャプション 12 言語）。
`store-images.html?lang=xx` をブラウザで開くと各言語をプレビューできる。
`record-store-i18n.mjs` は `.gitignore` の `record-*.mjs` に当たるので、無ければ作り直す。
