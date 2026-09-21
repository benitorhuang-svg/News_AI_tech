# 🤖 AI 技能含金量評分表

> **這個 AI 功能到底值不值得學？** 用四個維度量化 Gemini、ChatGPT、Claude 各項技能的「含金量」，幫你省下踩雷的時間。

[![Deploy to GitHub Pages](https://github.com/benitorhuang-svg/News_AI_tech/actions/workflows/deploy.yml/badge.svg)](https://github.com/benitorhuang-svg/News_AI_tech/actions/workflows/deploy.yml)
[![Collect Latest AI Releases](https://github.com/benitorhuang-svg/News_AI_tech/actions/workflows/update-sources.yml/badge.svg)](https://github.com/benitorhuang-svg/News_AI_tech/actions/workflows/update-sources.yml)

**🔗 Live Site:** [benitorhuang-svg.github.io/News_AI_tech](https://benitorhuang-svg.github.io/News_AI_tech/)

---

## 專案做什麼

三大 AI 廠商每週都在丟新功能，但多數公告只是行銷包裝。這個 Dashboard 用統一的評分標準把每個技能拆成四個維度打分，讓你一眼看出哪些值得投入時間。

**涵蓋廠商：** Gemini · ChatGPT · Claude

**主要功能：**

- 📊 **總覽** — 等級分佈、廠商統計、綜合摘要
- 🏆 **技能排行** — 依分數排序，支援廠商 / 等級 / 日期篩選
- ⚖️ **比較分析** — 選取多個技能，用雷達圖 (Radar Chart) 對比各維度強弱
- 📅 **日期區間過濾** — 快速鎖定最近 7/30/90 天的新發布
- 🔄 **自動化資料收集** — GitHub Actions 每週自動抓取 Google Blog 與 OpenAI Blog 的最新文章

---

## 評分模型

每個技能在四個維度上給 1–5 分，乘以各自的權重後加總：

```
score = 實用度 × 8 + 落地門檻 × 5 + 成熟度 × 4 + 獨特性 × 3
```

| 維度 | 權重 | 衡量什麼 |
|------|:----:|----------|
| 實用度 `practicality` | 8 | 能不能直接用在上班工作、省時間 / 提升產出 |
| 落地門檻 `accessibility` | 5 | 好不好上手，是否容易取得（分數越高越容易） |
| 成熟度 `maturity` | 4 | GA = 5、Beta = 4、Preview = 3、Research = 2、僅公告 = 1 |
| 獨特性 `uniqueness` | 3 | 真正的突破 vs. 行銷話術，差異化價值 |

**等級門檻：**

| 等級 | 門檻 | 意思 |
|------|:----:|------|
| 🟢 A 乾貨 | ≥ 80 | 立刻學，投資報酬率高 |
| 🔵 B 不錯 | ≥ 65 | 值得關注，適合特定場景 |
| 🟡 C 普通 | ≥ 50 | 有用但不急 |
| 🔴 退件 | < 50 | 目前不值得投入 |

完整評分標準參見 [`docs/scoring-rubric.md`](docs/scoring-rubric.md)。

---

## 技術架構

```
News_AI_tech/
├── src/
│   ├── data/              # 各廠商技能評分資料（一個技能一個 .ts 檔）
│   │   ├── gemini/        #   Gemini 系列（17 個技能）
│   │   ├── chatgpt/       #   ChatGPT 系列（15 個技能）
│   │   ├── claude/        #   Claude 系列（18 個技能）
│   │   ├── skills.ts      #   彙整所有技能、計算分數
│   │   └── types.ts       #   TypeScript 型別定義
│   ├── render/            # 三個 Tab 的渲染邏輯
│   ├── charts/            # Chart.js 圖表封裝
│   ├── state/             # 應用狀態管理（Store pattern）
│   ├── utils/             # 評分計算、日期處理、DOM 工具
│   ├── styles/            # CSS Design Tokens → Atoms → Molecules → Organisms
│   └── main.ts            # 應用程式進入點
├── scripts/
│   ├── collect-sources.ts # 自動抓取 RSS feed 的收集器
│   ├── agent-score-candidates.js  # Agent 候選評分產生
│   └── validate-scoring-candidates.js  # 候選評分驗證
├── .github/workflows/
│   ├── deploy.yml         # Push to main → Build → Deploy to GitHub Pages
│   └── update-sources.yml # 每週一 17:00 (UTC+8) 自動抓取最新 AI 文章
├── data-sources-latest.json  # 收集器產出的最新文章快照
└── docs/
    └── scoring-rubric.md  # 評分標準文件
```

**Tech Stack：**

| 層級 | 選用 |
|------|------|
| 語言 | TypeScript 6 |
| 打包 | Vite 8 |
| 圖表 | Chart.js 4 |
| 離線支援 | vite-plugin-pwa |
| Lint | ESLint 10 + typescript-eslint |
| 測試 | Vitest 4 |
| Git Hooks | Husky（pre-commit / pre-push） |
| CI/CD | GitHub Actions |
| 部署 | GitHub Pages |

---

## 快速開始

```bash
# 安裝依賴
npm ci

# 啟動開發伺服器
npm run dev

# 型別檢查 + 建構
npm run precheck

# 跑測試
npm test

# 手動執行資料收集器
npx tsx scripts/collect-sources.ts
```

---

## 自動化管線

### 資料收集 (`update-sources.yml`)

每週一 09:00 UTC（台北時間 17:00）自動執行：

1. 從 Google AI Blog 和 OpenAI Blog 的 RSS Feed 抓取最新文章
2. 與 `data-sources-latest.json` 比對去重
3. 如果有新文章，自動發 Pull Request 供人工審閱

### 部署 (`deploy.yml`)

Push 到 `main` 分支後自動：

1. TypeScript 型別檢查
2. Vite 建構
3. 部署到 GitHub Pages

---

## 新增技能評分

1. 在 `src/data/<vendor>/` 下新增一個 `.ts` 檔（編號遞增）
2. 按照 `RawSkill` 介面填寫四個維度分數與相關資訊
3. 附上官方來源 URL（沒有 URL 的候選不會通過驗證）
4. 提交 PR，CI 會自動跑型別檢查和 lint

```typescript
import type { RawSkill } from '../types'

export const skill: RawSkill = {
  id: 0,              // 會由 skills.ts 自動分配，這裡填 0 即可
  vendor: 'Gemini',   // 'Gemini' | 'ChatGPT' | 'Claude'
  name: '功能名稱',
  desc: '一句話描述這個功能做什麼',
  category: '分類',
  useCase: '適用場景',
  practicality: 4,    // 1-5
  accessibility: 3,   // 1-5
  maturity: 5,        // 1-5
  uniqueness: 3,      // 1-5
  comment: '評分理由',
  source: 'https://...',
}
```

---

## 授權

本專案目前尚未指定開源授權。
