import latestSources from '@/../data-sources-latest.json'
import type { Skill, Vendor, DimensionDef, GradeDef, VendorStyle, RawSkill } from '@/data/types'
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
  { key: 'A', label: 'A 乾貨', min: 80, color: '#257a52' },
  { key: 'B', label: 'B 不錯', min: 65, color: '#315b8c' },
  { key: 'C', label: 'C 普通', min: 50, color: '#946200' },
  { key: 'D', label: '退件',   min: 0,  color: '#b42318' },
]

/* ── 廠商色彩 ── */
export const VENDOR_STYLES: Record<Vendor, VendorStyle> = {
  Gemini:  { primary: '#315b8c' },
  ChatGPT: { primary: '#28705f' },
  Claude:  { primary: '#9a5b22' },
}

export const VENDORS: Vendor[] = ['Gemini', 'ChatGPT', 'Claude']

interface SourceSnapshot {
  date: string
  url: string
}

const fallbackDates: Record<Vendor, string> = {
  Gemini: '2026-05-20',
  ChatGPT: '2026-06-25',
  Claude: '2026-06-23',
}

const sourceDateMap = new Map(
  (latestSources as SourceSnapshot[]).map((source) => [
    source.url,
    toISODate(source.date),
  ]),
)

function toISODate(value: string): string {
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp)
    ? value.slice(0, 10)
    : new Date(timestamp).toISOString().slice(0, 10)
}

function resolvePublishedAt(skill: RawSkill): string {
  return skill.publishedAt ?? sourceDateMap.get(skill.source) ?? fallbackDates[skill.vendor]
}

// 透過 Vite 載入各廠商獨立的技能 TS 檔
interface SkillModule {
  skill: RawSkill
}

const modules = import.meta.glob<SkillModule>('./(gemini|chatgpt|claude)/*.ts', { eager: true })

// 排序路徑：Gemini, ChatGPT, Claude；且內部檔名由小到大排序
const vendorsOrder = ['gemini', 'chatgpt', 'claude']
const sortedPaths = Object.keys(modules).sort((a, b) => {
  const partsA = a.split('/')
  const partsB = b.split('/')
  const vendorA = partsA[1]
  const vendorB = partsB[1]
  
  if (vendorA !== vendorB) {
    return vendorsOrder.indexOf(vendorA) - vendorsOrder.indexOf(vendorB)
  }
  
  const idA = parseInt(partsA[2].replace('.ts', ''))
  const idB = parseInt(partsB[2].replace('.ts', ''))
  return idA - idB
})

let nextGlobalId = 1
const RAW: RawSkill[] = sortedPaths.map((path) => {
  const mod = modules[path]
  return {
    ...mod.skill,
    id: nextGlobalId++, // 動態產生全域唯一且穩定遞增的 ID，維護比較系統功能
  }
})

/* ── 計算分數並匯出 ── */
export const SKILLS: Skill[] = RAW.map((r) => ({
  ...r,
  publishedAt: resolvePublishedAt(r),
  score: computeScore(r.practicality, r.accessibility, r.maturity, r.uniqueness),
  grade: computeGrade(computeScore(r.practicality, r.accessibility, r.maturity, r.uniqueness)),
}))
