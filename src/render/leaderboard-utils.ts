import { GRADES, SKILLS } from '@/data/skills'
import type { AppState, Skill } from '@/data/types'
import { gradeKey } from '@/utils/scoring'

export const dimensions = [
  ['實', '實用度', 'practicality', '#257a52'],
  ['門', '落地門檻', 'accessibility', '#315b8c'],
  ['熟', '成熟度', 'maturity', '#946200'],
  ['獨', '獨特性', 'uniqueness', '#8a4f7d'],
] as const

export function gradeColor(skill: Skill): string {
  return GRADES.find((grade) => grade.key === gradeKey(skill.score))?.color ?? '#667085'
}

export function sourceUrl(skill: Skill): string {
  return skill.source.startsWith('http') ? skill.source : `https://${skill.source}`
}

export function sourceLabel(skill: Skill): string {
  try {
    return new URL(sourceUrl(skill)).hostname.replace(/^www\./, '')
  } catch {
    return skill.source.replace(/^https?:\/\//, '')
  }
}

export function formatDateTag(value: string): string {
  return value.replaceAll('-', '.')
}

function matchesQuery(skill: Skill, query: string): boolean {
  const target = [
    skill.name,
    skill.desc,
    skill.category,
    skill.useCase,
    skill.comment,
    skill.source,
    skill.publishedAt,
  ].join(' ')

  return target.toLowerCase().includes(query.trim().toLowerCase())
}

export function matchesDateRange(skill: Skill, state: Pick<AppState, 'dateFrom' | 'dateTo'>): boolean {
  if (state.dateFrom && skill.publishedAt < state.dateFrom) return false
  if (state.dateTo && skill.publishedAt > state.dateTo) return false
  return true
}

export function skillsInDateRange(state: Pick<AppState, 'dateFrom' | 'dateTo'>): Skill[] {
  return SKILLS.filter((skill) => matchesDateRange(skill, state))
}

function compareSkills(sortBy: AppState['sortBy']) {
  return (a: Skill, b: Skill) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name, 'zh-Hant')
    if (sortBy === 'vendor') return a.vendor.localeCompare(b.vendor, 'en')
    if (sortBy === 'date') return b.publishedAt.localeCompare(a.publishedAt)
    return b.score - a.score
  }
}

export function visibleSkills(state: Readonly<AppState>): Skill[] {
  return SKILLS.filter((skill) => {
    const vendorMatch = state.vendorFilter === 'all' || skill.vendor === state.vendorFilter
    const gradeMatch = state.gradeFilter === 'all' || gradeKey(skill.score) === state.gradeFilter
    const queryMatch = !state.searchQuery || matchesQuery(skill, state.searchQuery)

    return vendorMatch && gradeMatch && queryMatch && matchesDateRange(skill, state)
  }).sort(compareSkills(state.sortBy))
}
