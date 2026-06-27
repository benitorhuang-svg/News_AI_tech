/* ── 廠商 ── */
export type Vendor = 'Gemini' | 'ChatGPT' | 'Claude'

/* ── 等級 ── */
export type GradeKey = 'A' | 'B' | 'C' | 'D'

export interface GradeDef {
  key: GradeKey
  label: string
  min: number
  color: string
}

/* ── 四維評分 ── */
export interface DimensionDef {
  key: DimensionKey
  label: string
  weight: number
  max: number
  desc: string
}

export type DimensionKey =
  | 'practicality'
  | 'accessibility'
  | 'maturity'
  | 'uniqueness'

/* ── 技能資料 ── */
export interface Skill {
  id: number
  vendor: Vendor
  name: string
  desc: string
  category: string
  useCase: string
  practicality: number
  accessibility: number
  maturity: number
  uniqueness: number
  score: number
  grade: string
  comment: string
  source: string
  publishedAt: string
}

export interface RawSkill {
  id: number
  vendor: Vendor
  name: string
  desc: string
  category: string
  useCase: string
  practicality: number
  accessibility: number
  maturity: number
  uniqueness: number
  comment: string
  source: string
  publishedAt?: string
}

/* ── 廠商色彩 ── */
export interface VendorStyle {
  primary: string
}

/* ── 應用狀態 ── */
export interface AppState {
  vendorFilter: Vendor | 'all'
  gradeFilter: GradeKey | 'all'
  searchQuery: string
  sortBy: 'score' | 'name' | 'vendor' | 'date'
  dateFrom: string
  dateTo: string
  recentDays: number | null
  compareIds: number[]
  activeTab: 'overview' | 'leaderboard' | 'analysis'
  currentPage: number
  pageSize: number
}
