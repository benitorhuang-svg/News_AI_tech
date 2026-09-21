# Copilot Code Review Instructions

## 專案背景
這是一個 AI 技能應用含金量評分 Dashboard，追蹤 Gemini、ChatGPT、Claude 三大廠商的 AI 技術動態，並透過 GitHub Stars 追蹤熱門 AI 開源專案趨勢。

## JSON 資料檔案審查規則

### `data-sources-latest.json`
- 每筆資料必須包含 `vendor`、`title`、`url`、`date` 四個欄位，缺一不可
- `vendor` 欄位只允許以下值：`"Gemini"` / `"ChatGPT"` / `"Claude"`
- `url` 欄位不得出現重複值（整份 JSON 陣列內唯一）
- `date` 欄位必須是合法的日期字串（RFC 2822 或 ISO 8601 格式）
- 陣列總長度不得超過 100 筆

### `github-trending-snapshot.json`（GitHub 生態系追蹤資料）
- 每筆資料必須包含 `repo`、`stars`、`starsWeekly`、`language`、`description`、`collectedAt` 欄位
- `repo` 格式必須是 `owner/name`
- `stars` 和 `starsWeekly` 必須是非負整數
- `collectedAt` 必須是 ISO 8601 格式

## TypeScript / JavaScript 審查規則
- 所有 TypeScript 檔案必須通過 `npm run typecheck` 無錯誤
- ESLint 規則必須通過（專案使用 flat config `eslint.config.js`）
- 新增的型別定義應放在 `src/data/types.ts`
- 新增的常數或設定應與既有的命名慣例一致（camelCase 變數、PascalCase 型別）

## CSS 審查規則
- 使用 CSS custom properties（`--variable-name`）定義色彩，不使用硬編碼色碼
- 確保深色主題下的可讀性與對比度

## 自動化腳本審查規則
- `scripts/` 目錄下的腳本必須處理 HTTP 錯誤（非 2xx 回應）
- 外部 API 呼叫必須有 timeout 和 retry 機制
- 不得在腳本中硬編碼 API token 或密碼，應使用環境變數（`process.env`）

## PR 描述審查
- PR 標題應包含變更類型前綴：`data:` / `feat:` / `fix:` / `chore:` / `docs:`
- 自動產生的 PR（由 GitHub Actions 建立）標題應以 emoji 開頭
