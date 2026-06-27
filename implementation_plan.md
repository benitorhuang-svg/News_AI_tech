# AI 技能含金量評分 Dashboard — v3 方案

## 技術棧

| 項目     | 選擇                              | 原因                                        |
| -------- | --------------------------------- | ------------------------------------------- |
| 建置工具 | **Vite**                          | TS + 路徑別名原生支援、HMR 快               |
| 語言     | **TypeScript**                    | 型別安全                                    |
| 路徑別名 | **`@/`** → `src/`                 | 消除`../../`                                |
| 樣式     | **Vanilla CSS**                   | 原子化設計 tokens/atoms/molecules/organisms |
| 圖表     | **Chart.js**                      | 輕量、雷達圖支援好                          |
| 部署     | **GitHub Pages**（Actions build） | 靜態站                                      |
| 資料更新 | **GitHub Actions** 排程           | 自動抓取官方來源                            |

---

## 檔案結構（原子化設計 + `@` 別名）

```
AI技能含金量評分/
├── index.html                              # Vite 進入點
├── vite.config.ts                          # Vite 設定 + @ 別名
├── tsconfig.json                           # TS 設定 + paths
├── package.json
│
├── src/
│   ├── main.ts                             # 進入點：初始化 + 事件綁定（< 120 行）
│   │
│   ├── data/
│   │   ├── skills.ts                       # 50 筆技能原始資料（< 300 行）
│   │   └── types.ts                        # 型別定義：Skill, Grade, Vendor（< 60 行）
│   │
│   ├── state/
│   │   └── store.ts                        # 響應式狀態：篩選/排序/選取（< 100 行）
│   │
│   ├── render/
│   │   ├── hero.ts                         # 總覽區塊渲染（< 150 行）
│   │   ├── leaderboard.ts                  # 排行榜渲染 + 篩選邏輯（< 250 行）
│   │   ├── radar.ts                        # 雷達圖比較器（< 200 行）
│   │   ├── vendor-battle.ts                # 廠商對決（< 200 行）
│   │   └── sources.ts                      # 來源面板（< 100 行）
│   │
│   ├── charts/
│   │   ├── radar-chart.ts                  # Chart.js 雷達圖封裝（< 150 行）
│   │   └── bar-chart.ts                    # Chart.js 條形圖封裝（< 100 行）
│   │
│   ├── utils/
│   │   ├── scoring.ts                      # 計分公式 + 等級判定（< 40 行）
│   │   └── dom.ts                          # DOM 工具函式（< 50 行）
│   │
│   └── styles/
│       ├── tokens.css                      # 設計變數（< 80 行）
│       ├── atoms.css                       # 原子元件（< 200 行）
│       ├── molecules.css                   # 分子元件（< 250 行）
│       └── organisms.css                   # 有機體（< 250 行）
│
├── .github/
│   └── workflows/
│       ├── deploy.yml                      # Build + Deploy to Pages
│       └── update-sources.yml              # 排程資料蒐集
│
├── scripts/
│   └── collect-sources.js                  # 資料蒐集腳本（原生 Node ESM）
│
└── assets/
    └── favicon.svg
```

---

## `@` 路徑別名設定

### tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### vite.config.ts

```ts
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  base: "./", // GitHub Pages 相對路徑
});
```

### 使用範例

```ts
// ❌ 之前
import { Skill } from "../../data/types";
import { computeScore } from "../../utils/scoring";

// ✅ 之後
import { Skill } from "@/data/types";
import { computeScore } from "@/utils/scoring";
```

---

## GitHub Actions

### 1. 部署 (deploy.yml)

```yaml
on:
  push:
    branches: [main]

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci && npm run build
      - uses: actions/deploy-pages@v4 # 部署 dist/
```

### 2. 資料蒐集 (update-sources.yml)

```yaml
on:
  schedule:
    - cron: "0 9 * * 1" # 每週一
  workflow_dispatch: # 手動觸發

jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run sources:collect
      - run: npm run score:review
      - run: | # 有變更時開 PR
          git diff --quiet || gh pr create ...
```

蒐集 6 個官方來源（Google Blog、OpenAI Blog、Anthropic News 等），抓首頁候選連結、標題、日期/檢查時間與連結，標記新內容供 agent 初評與人工審閱。

---

## 規範

| 規則          | 執行方式                       |
| ------------- | ------------------------------ |
| 每檔 ≤ 300 行 | 寫完後`wc -l` 驗證             |
| 零幽靈代碼    | 無未使用的 export / 變數 / CSS |
| 單一職責      | 每個模組只做一件事             |
| 型別安全      | `strict: true`，無 `any`       |

---

## 驗證計畫

1. `npm run build` 零錯誤
2. `wc -l src/**/*.ts src/**/*.css` 每檔 ≤ 300
3. 瀏覽器開 `npm run dev` 測試所有互動
4. 50 筆分數與 Excel 逐筆比對
