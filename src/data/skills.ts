import type { Skill, Vendor, DimensionDef, GradeDef, VendorStyle } from '@/data/types'
import { computeScore, computeGrade } from '@/utils/scoring'

/* ── 評分維度定義 ── */
export const DIMENSIONS: DimensionDef[] = [
  { key: 'practicality',  label: '實用度',   weight: 8, max: 5, desc: '能不能真的用在日常上班工作、省時間/提升產出' },
  { key: 'accessibility', label: '落地門檻', weight: 5, max: 5, desc: '好不好上手，分數越高越容易用' },
  { key: 'maturity',      label: '成熟度',   weight: 4, max: 5, desc: 'GA=5、Beta=4、公開預覽=3、研究預覽=2、僅公告/已關閉=1' },
  { key: 'uniqueness',    label: '獨特性',   weight: 3, max: 5, desc: '是真突破還是行銷話術，差異化價值' },
]

/* ── 等級定義 ── */
export const GRADES: GradeDef[] = [
  { key: 'A', label: 'A 乾貨', min: 80, color: '#00e68a' },
  { key: 'B', label: 'B 不錯', min: 65, color: '#4da6ff' },
  { key: 'C', label: 'C 普通', min: 50, color: '#ffaa33' },
  { key: 'D', label: '退件',   min: 0,  color: '#ff4d6a' },
]

/* ── 廠商色彩 ── */
export const VENDOR_STYLES: Record<Vendor, VendorStyle> = {
  Gemini:  { primary: '#4285f4', gradient: 'linear-gradient(135deg,#4285f4,#34a0f4)', glow: 'rgba(66,133,244,0.4)' },
  ChatGPT: { primary: '#10a37f', gradient: 'linear-gradient(135deg,#10a37f,#1ed9a4)', glow: 'rgba(16,163,127,0.4)' },
  Claude:  { primary: '#d97706', gradient: 'linear-gradient(135deg,#d97706,#f59e0b)', glow: 'rgba(217,119,6,0.4)' },
}

export const VENDORS: Vendor[] = ['Gemini', 'ChatGPT', 'Claude']

/* ── 原始資料 ── */
interface RawSkill {
  id: number; vendor: Vendor; name: string; desc: string
  category: string; useCase: string
  practicality: number; accessibility: number; maturity: number; uniqueness: number
  comment: string; source: string
}

const RAW: RawSkill[] = [
  { id:1,  vendor:'Gemini',  name:'Gemini 3 Pro / Deep Research Max', desc:'給一個研究題目，自動瀏覽上百網站、產出多頁深度報告', category:'研究分析', useCase:'市場調查、競品分析、文獻/政策回顧', practicality:5, accessibility:4, maturity:4, uniqueness:4, comment:'頂級乾貨：自動化研究最成熟代表', source:'blog.google' },
  { id:2,  vendor:'Gemini',  name:'Deep Research 連私有資料', desc:'研究時同時讀你的信件雲端文件，把公開+私有資料串起來', category:'研究分析', useCase:'結合內部資料的調研、提案前情蒐', practicality:5, accessibility:4, maturity:4, uniqueness:4, comment:'乾貨：私有資料整合', source:'blog.google' },
  { id:3,  vendor:'Gemini',  name:'Gemini in Docs/Sheets/Slides/Drive', desc:'在 Google 文件/試算表/簡報內直接用 AI 生成與改善', category:'文件生產力', useCase:'寫文件、做表、做簡報的日常加速', practicality:5, accessibility:4, maturity:4, uniqueness:3, comment:'乾貨：天天用的文件套', source:'blog.google' },
  { id:4,  vendor:'Gemini',  name:'Gems（自訂助理）', desc:'設定專用指令的客製助理，類似自訂 GPT', category:'個人化助理', useCase:'固定作務模板：翻譯、文案、客服回覆', practicality:4, accessibility:5, maturity:5, uniqueness:2, comment:'好用且零門檻', source:'blog.google' },
  { id:5,  vendor:'Gemini',  name:'Canvas（即時協作編輯）', desc:'側邊即時協作空間，邊寫文件邊改、可寫程式', category:'文件生產力', useCase:'長文/程式的反覆修改討論', practicality:4, accessibility:5, maturity:5, uniqueness:2, comment:'上手快、體驗好', source:'blog.google' },
  { id:6,  vendor:'Gemini',  name:'Gemini Spark（24/7 背景代理）', desc:'可在背景跨 Workspace 與網路執行多步驟、設定週期任務', category:'Agent/自動化', useCase:'委派長流程、週期性雜務自動跑', practicality:5, accessibility:2, maturity:2, uniqueness:4, comment:'潛力高但限制多', source:'blog.google' },
  { id:7,  vendor:'Gemini',  name:'Antigravity 2.0（桌面 IDE）', desc:'Agent 優先的開發平台，可編排多代理、排程背景任務', category:'開發/Agent', useCase:'開發者建 app、自動化開發流程', practicality:3, accessibility:3, maturity:4, uniqueness:4, comment:'開發者乾貨', source:'blog.google' },
  { id:8,  vendor:'Gemini',  name:'Antigravity CLI / SDK', desc:'用終端機或程式碼建立自訂化理', category:'開發/Agent', useCase:'工程團隊自建代理', practicality:2, accessibility:2, maturity:4, uniqueness:2, comment:'純開發工具', source:'developers.google' },
  { id:9,  vendor:'Gemini',  name:'Gemini API Managed Agents', desc:'用 API 管理代理生命週期：建立、追蹤、回收', category:'開發/Agent', useCase:'企業代理管理', practicality:3, accessibility:2, maturity:3, uniqueness:4, comment:'偏開發者/企業', source:'cloud.google' },
  { id:10, vendor:'Gemini',  name:'Agent Designer（低/無代碼建代理）', desc:'拖拉+自然語言就能建代理、不用寫程式', category:'Agent/自動化', useCase:'非工程師也能建自動化流程', practicality:4, accessibility:3, maturity:3, uniqueness:3, comment:'概念佳，待成熟', source:'cloud.google' },
  { id:11, vendor:'Gemini',  name:'Gemini Enterprise Projects & Canvas', desc:'企業版專案空間+協作 Canvas，多人多輪', category:'協作', useCase:'團隊專案知識庫+討論', practicality:4, accessibility:3, maturity:3, uniqueness:2, comment:'企業適用', source:'blog.google' },
  { id:12, vendor:'Gemini',  name:'Gemini 3.5 Flash', desc:'最快模型，延遲低、成本低、適合高頻簡單任務', category:'模型', useCase:'需要快速回應的場景', practicality:4, accessibility:4, maturity:4, uniqueness:2, comment:'速度為王', source:'blog.google' },
  { id:13, vendor:'Gemini',  name:'Notebooks in Gemini（同步 NotebookLM）', desc:'Gemini 內直接用 NotebookLM 功能，知識庫+摘要', category:'知識管理', useCase:'研究筆記、文件消化、團隊知識庫', practicality:4, accessibility:4, maturity:4, uniqueness:3, comment:'整合到位', source:'blog.google' },
  { id:14, vendor:'Gemini',  name:'Data Science Agent in Colab', desc:'Colab 內自動寫分析程式碼、跑模型、出圖表', category:'資料分析', useCase:'資料探索、自動化分析、視覺化', practicality:4, accessibility:3, maturity:4, uniqueness:4, comment:'資料人利器', source:'developers.google' },
  { id:15, vendor:'Gemini',  name:'Auto Browse（Chrome）', desc:'Chrome 內自動幫你瀏覽、填表、操作網頁', category:'Agent/自動化', useCase:'自動填表、查價、資料蒐集', practicality:4, accessibility:3, maturity:3, uniqueness:4, comment:'瀏覽器自動化新星', source:'blog.google' },
  { id:16, vendor:'Gemini',  name:'Gemini Enterprise Agent Platform', desc:'企業級代理開發與管理平台', category:'企業平台', useCase:'企業自建代理軍團', practicality:3, accessibility:2, maturity:3, uniqueness:3, comment:'企業限定', source:'cloud.google' },
  { id:17, vendor:'Gemini',  name:'Project Mariner（瀏覽器代理）', desc:'讓 AI 完全控制瀏覽器完成複雜網頁任務', category:'Agent/自動化', useCase:'全自動網頁操作', practicality:1, accessibility:1, maturity:1, uniqueness:1, comment:'已關閉/僅公告', source:'blog.google' },
  { id:18, vendor:'ChatGPT', name:'ChatGPT agent（研究+執行）', desc:'給目標自動拆步驟、上網查資料、寫檔、呼叫工具完成', category:'Agent/自動化', useCase:'一鍵式自動完成複雜任務', practicality:5, accessibility:4, maturity:4, uniqueness:4, comment:'頂級乾貨：自動化里程碑', source:'openai.com' },
  { id:19, vendor:'ChatGPT', name:'Tasks（排程任務）', desc:'設定時間自動跑任務，如每早彙整新聞', category:'Agent/自動化', useCase:'定時推送、自動摘要、提醒', practicality:5, accessibility:5, maturity:4, uniqueness:3, comment:'人人能用的自動排程', source:'openai.com' },
  { id:20, vendor:'ChatGPT', name:'Projects + Project Memory', desc:'專案空間+跨對話記憶，同一專案累積知識', category:'知識管理', useCase:'長期專案的上下文管理', practicality:5, accessibility:5, maturity:5, uniqueness:3, comment:'最完善的專案記憶', source:'openai.com' },
  { id:21, vendor:'ChatGPT', name:'Workspace Agents', desc:'在工作區建自訂代理，連你的工具與資料', category:'Agent/自動化', useCase:'團隊共用自動化代理', practicality:5, accessibility:3, maturity:3, uniqueness:4, comment:'企業代理入口', source:'openai.com' },
  { id:22, vendor:'ChatGPT', name:'Connectors（60+ 應用）', desc:'一鍵連 Slack/Notion/Jira/Salesforce 等 60+ 應用', category:'整合連接', useCase:'跨工具整合、免切換視窗', practicality:5, accessibility:4, maturity:4, uniqueness:3, comment:'最廣生態系連接', source:'openai.com' },
  { id:23, vendor:'ChatGPT', name:'Canvas（側邊協作編輯）', desc:'側邊面板即時共編文件和程式碼', category:'文件生產力', useCase:'即時修改文件/程式碼', practicality:4, accessibility:5, maturity:5, uniqueness:2, comment:'成熟好用', source:'openai.com' },
  { id:24, vendor:'ChatGPT', name:'Record Mode（會議轉錄摘要）', desc:'錄音→轉錄→摘要→行動項目，一條龍', category:'會議生產力', useCase:'會議記錄、重點摘要、待辦追蹤', practicality:4, accessibility:4, maturity:4, uniqueness:3, comment:'會議工作流利器', source:'openai.com' },
  { id:25, vendor:'ChatGPT', name:'Memory（跨對話記憶）', desc:'跨對話記住你的偏好、背景和常用設定', category:'個人化', useCase:'個人化體驗、免重複說明', practicality:4, accessibility:5, maturity:5, uniqueness:2, comment:'最成熟的個人記憶', source:'openai.com' },
  { id:26, vendor:'ChatGPT', name:'AgentKit – Agent Builder', desc:'視覺化/程式碼建代理的工具包', category:'Agent/自動化', useCase:'快速建代理原型', practicality:4, accessibility:3, maturity:4, uniqueness:4, comment:'代理建置利器', source:'openai.com' },
  { id:27, vendor:'ChatGPT', name:'GPT-5.5（agentic 基礎模型）', desc:'專為代理任務優化的基礎模型', category:'模型', useCase:'所有代理任務更強更穩', practicality:4, accessibility:4, maturity:4, uniqueness:3, comment:'底層升級紮實', source:'openai.com' },
  { id:28, vendor:'ChatGPT', name:'Codex app（GPT-5.5 自主編碼）', desc:'描述任務即自動跨檔寫程式、跑測試、開 PR', category:'開發/Agent', useCase:'工程團隊自動化開發', practicality:3, accessibility:3, maturity:4, uniqueness:4, comment:'開發者乾貨', source:'openai.com' },
  { id:29, vendor:'ChatGPT', name:'Connector Registry', desc:'集中管理各產品資料與工具連接的後台', category:'整合連接', useCase:'企業統一管理連接器權限', practicality:3, accessibility:3, maturity:3, uniqueness:3, comment:'偏管理員功能', source:'openai.com' },
  { id:30, vendor:'ChatGPT', name:'ChatKit', desc:'把客製聊天代理嵌入自家產品的工具', category:'開發', useCase:'產品團隊嵌入 AI 客服/助理', practicality:2, accessibility:3, maturity:5, uniqueness:2, comment:'開發者導向', source:'openai.com' },
  { id:31, vendor:'ChatGPT', name:'Agents SDK', desc:'用程式建代理應用的輕量套件', category:'開發/Agent', useCase:'工程自建代理', practicality:2, accessibility:3, maturity:5, uniqueness:2, comment:'純開發用途', source:'developers.openai' },
  { id:32, vendor:'ChatGPT', name:'Desktop superapp（含 Atlas 瀏覽器）', desc:'ChatGPT+Codex+瀏覽器整合成單一桌面應用', category:'平台整合', useCase:'統一入口操作', practicality:3, accessibility:2, maturity:2, uniqueness:3, comment:'早期，待觀察', source:'tosea.ai' },
  { id:33, vendor:'Claude',  name:'Pre-built Skills（pptx/xlsx/docx/pdf）', desc:'內建技能直接做簡報/試算表/Word/PDF', category:'文件生產力', useCase:'產出與編輯各式辦公文件', practicality:5, accessibility:5, maturity:5, uniqueness:3, comment:'頂級乾貨：辦公文件即開即用', source:'platform.claude' },
  { id:34, vendor:'Claude',  name:'Agent Skills（模組化技能）', desc:'把流程打包成可重用技能，相關時自動載入', category:'Agent/自動化', useCase:'把重複流程一句話觸發、團隊共用', practicality:5, accessibility:4, maturity:4, uniqueness:5, comment:'頂級乾貨：可重用+自動載入', source:'platform.claude' },
  { id:35, vendor:'Claude',  name:'Claude for Excel', desc:'原生 Excel 操作：樞紐分析、條件式格式', category:'資料/文件', useCase:'試算表分析與自動整理', practicality:5, accessibility:4, maturity:4, uniqueness:4, comment:'乾貨：對帳/分析超實用', source:'9to5google' },
  { id:36, vendor:'Claude',  name:'Office add-ins（M365）', desc:'在 Word/PPT/Excel/Outlook 內原生工作', category:'文件生產力', useCase:'文件→簡報無縫接續、信件處理', practicality:5, accessibility:4, maturity:4, uniqueness:4, comment:'乾貨：嵌進既有辦公軟體', source:'releasebot' },
  { id:37, vendor:'Claude',  name:'Cowork（桌面 agentic 知識工作）', desc:'把 Claude Code 的代理能力帶到桌面做非程式工作', category:'Agent/自動化', useCase:'檔案整理、對帳、文件自動化', practicality:5, accessibility:4, maturity:3, uniqueness:4, comment:'乾貨：非工程師也能跑代理', source:'anthropic.com' },
  { id:38, vendor:'Claude',  name:'Claude Opus 4.8', desc:'更強代理/推理，新增努力程度控制、快速模式更便宜', category:'模型', useCase:'所有任務底層升級+成本下降', practicality:4, accessibility:4, maturity:5, uniqueness:3, comment:'底層升級紮實，正式可用', source:'anthropic.com' },
  { id:39, vendor:'Claude',  name:'Plugins（打包 skills/hooks/代理/MCP）', desc:'把技能、子代理、MCP 打包成可安裝單元', category:'Agent/自動化', useCase:'團隊一鍵部署整套能力', practicality:4, accessibility:4, maturity:4, uniqueness:3, comment:'利於規模化複用', source:'firecrawl' },
  { id:40, vendor:'Claude',  name:'MCP（模型上下文協定）', desc:'連接外部工具/資料的開放標準', category:'整合連接', useCase:'讓 AI 接你的工具與資料源', practicality:4, accessibility:3, maturity:4, uniqueness:4, comment:'生態基礎，需一點設定', source:'code.claude' },
  { id:41, vendor:'Claude',  name:'Outcomes（評分代理自動重跑）', desc:'獨立評分代理依評分表打分，不合格自動退回重做', category:'品質控管', useCase:'確保自動產出的品質、降低錯誤', practicality:4, accessibility:3, maturity:3, uniqueness:4, comment:'自動把關品質', source:'mindstudio' },
  { id:42, vendor:'Claude',  name:'Claude in Chrome', desc:'在 Chrome 內操作網頁（Max 方案 beta）', category:'Agent/自動化', useCase:'網頁操作、查資料自動化', practicality:4, accessibility:3, maturity:3, uniqueness:3, comment:'實用但 beta、限 Max', source:'9to5mac' },
  { id:43, vendor:'Claude',  name:'Claude Finance（10 個金融代理模板）', desc:'金融服務現成代理模板', category:'產業模板', useCase:'金融/財務情境快速起步', practicality:3, accessibility:3, maturity:3, uniqueness:3, comment:'利基產業，泛用性中等', source:'anthropic.com' },
  { id:44, vendor:'Claude',  name:'Subagents（專門子代理）', desc:'針對特定任務的專門代理（如安全稽核）', category:'Agent/自動化', useCase:'拆分任務給多個專家代理', practicality:3, accessibility:3, maturity:4, uniqueness:3, comment:'概念好，偏開發場景', source:'firecrawl' },
  { id:45, vendor:'Claude',  name:'Connector custom roles（企業權限）', desc:'管理員可細控哪些連接器/工具開放給哪種角色', category:'整合/治理', useCase:'企業資料權限管控', practicality:3, accessibility:3, maturity:4, uniqueness:2, comment:'管理員導向', source:'9to5google' },
  { id:46, vendor:'Claude',  name:'Dynamic workflows（數十~數百子代理）', desc:'Claude 自己寫編排腳本跑大量平行子代理', category:'Agent/自動化', useCase:'超大規模平行任務', practicality:3, accessibility:3, maturity:2, uniqueness:4, comment:'強但研究預覽、偏進階', source:'releasebot' },
  { id:47, vendor:'Claude',  name:'Multi-agent orchestration', desc:'多代理協同編排完成複雜工作', category:'Agent/自動化', useCase:'複雜多步驟流程協同', practicality:3, accessibility:2, maturity:3, uniqueness:3, comment:'進階能力，落地需設計', source:'mindstudio' },
  { id:48, vendor:'Claude',  name:'Dreaming（自我改進記憶）', desc:'排程回顧過往對話，萃取模式改進記憶', category:'Agent/自動化', useCase:'代理隨用越用越聰明', practicality:3, accessibility:2, maturity:2, uniqueness:4, comment:'概念新穎但研究預覽', source:'mindstudio' },
  { id:49, vendor:'Claude',  name:'MCP tunnels（私網連內部工具）', desc:'代理經私網連到內部 DB/API，不對外曝露', category:'整合/安全', useCase:'安全連接內部系統', practicality:3, accessibility:2, maturity:2, uniqueness:4, comment:'安全亮點，研究預覽', source:'9to5mac' },
  { id:50, vendor:'Claude',  name:'Self-hosted sandboxes（自架執行環境）', desc:'工具執行移到你自架/託管環境', category:'基礎設施', useCase:'資安要求高的執行隔離', practicality:2, accessibility:2, maturity:3, uniqueness:3, comment:'偏 IT 基礎設施', source:'9to5mac' },
]

/* ── 計算分數並匯出 ── */
export const SKILLS: Skill[] = RAW.map((r) => ({
  ...r,
  score: computeScore(r.practicality, r.accessibility, r.maturity, r.uniqueness),
  grade: computeGrade(computeScore(r.practicality, r.accessibility, r.maturity, r.uniqueness)),
}))
