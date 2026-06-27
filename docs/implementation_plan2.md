# 實作計畫：設定 ESLint 與建立 Agent 記憶 (Customization Rule)

根據您的需求，我們需要為專案導入 TypeScript ESLint 檢查，並透過 Agent 自訂規則（Memory）來讓我在未來「每次修改程式碼後，都會自動執行 ESLint」。

## Proposed Changes

---

### 1. 安裝與設定 ESLint (TypeScript 支援)

#### [MODIFY] [package.json](file:///C:/Users/benit/Desktop/project_home/AI%E6%8A%80%E8%83%BD%E5%90%AB%E9%87%91%E9%87%8F%E8%A9%95%E5%88%86/package.json)
- 安裝必備套件：`eslint`, `typescript-eslint`, `@eslint/js`, `globals`。
- 新增 npm scripts：
  - `"lint": "eslint ."`
  - `"lint:fix": "eslint . --fix"`

#### [NEW] [eslint.config.js](file:///C:/Users/benit/Desktop/project_home/AI%E6%8A%80%E8%83%BD%E5%90%AB%E9%87%91%E9%87%8F%E8%A9%95%E5%88%86/eslint.config.js)
- 建立最新的 ESLint Flat Config，配置支援 TypeScript 解析與 Browser 全域變數。

---

### 2. 建立專案層級的 Agent 記憶 (Customizations Root)

為了讓我（以及未來的 AI Agents）記住「每次修改後都要執行 ESLint」，我們需要建立 Workspace Customizations Root。

#### [NEW] [.agents/AGENTS.md](file:///C:/Users/benit/Desktop/project_home/AI%E6%8A%80%E8%83%BD%E5%90%AB%E9%87%91%E9%87%8F%E8%A9%95%E5%88%86/.agents/AGENTS.md)
- 這是專門給 AI 閱讀的系統設定檔（Customization Rules）。
- 我會在裡面寫下明確的規則：`"Whenever you modify any TypeScript or JavaScript files, you MUST run 'npm run lint' or 'npm run lint:fix' to ensure code quality."`
- 當這個檔案被建立後，系統會在未來的每一次對話中自動將這個規則載入到我的記憶裡。

---

## Verification Plan

### Automated Tests
- 執行 `npm run lint` 掃描整個專案，確認設定檔正確運作且無重大錯誤。如果有發現程式碼風格問題，我會使用 `npm run lint:fix` 幫您自動修復。

### Manual Verification
- 幫您驗證 `.agents/AGENTS.md` 是否已正確產生。完成後，您可以在未來的任務中測試這個「記憶」是否生效（隨意請我改一段程式碼，看看我會不會自動觸發 `npm run lint`）。
