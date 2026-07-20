# Ripen ストア画像 — Play Console 掲載手順

各言語 6 枚（フィーチャーグラフィック 1 + 携帯電話スクリーンショット 5）。
すべて 1024×500 PNG。ファイルは各言語フォルダにあります。

```
images/store/
  en/  ja/  ko/  zh/  de/  es/  fr/  it/  pt/  ru/  hi/  ar/
    store-image-feature.png   ← フィーチャー グラフィック
    store-image-1.png … 5.png ← 携帯電話版スクリーンショット（この順で）
```

## 手順（言語ごとに繰り返す）

1. Play Console → Ripen → **ユーザーを増やす > ストアでの表示 > ストアの掲載情報**
2. 上部の言語ドロップダウンで対象言語を選ぶ（例: 日本語 – ja-JP）
3. **フィーチャー グラフィック**の「アセットを追加」→ `<lang>/store-image-feature.png` を選択
4. **携帯電話版のスクリーンショット**の「アセットを追加」→ `store-image-1.png`〜`5.png` を
   **1→5 の順**で追加（並び順が表示順になる）。旧 en 流用画像が残る場合は削除
5. ページ下部の**保存**

## Console の言語コード対応

| フォルダ | Console 表示 |
|---|---|
| en | デフォルト – 英語 (アメリカ合衆国) – en-US |
| ja | 日本語 – ja-JP |
| ko | 韓国語 – ko-KR |
| zh | 中国語 (簡体字) – zh-CN |
| de | ドイツ語 – de-DE |
| es | スペイン語 (スペイン) – es-ES |
| fr | フランス語 (フランス) – fr-FR |
| it | イタリア語 – it-IT |
| pt | ポルトガル語 (ブラジル) – pt-BR |
| ru | ロシア語 – ru-RU |
| hi | ヒンディー語 – hi-IN |
| ar | アラビア語 – ar |

## 再生成

内容や訳を直したら:
```
cd ripen
node record-store-i18n.mjs   # 12 言語 × 6 枚を images/store/<lang>/ に書き出し
```
テンプレ: `store-images.html`（レイアウト） / `store-images-i18n.js`（12 言語辞書）。
`store-images.html?lang=xx` をブラウザで開くと各言語をプレビュー可能。
