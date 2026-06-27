import { describe, expect, it } from 'vitest'
import { SKILLS } from '@/data/skills'
import type { AppState } from '@/data/types'
import { visibleSkills } from '@/render/leaderboard-utils'
import { recentDateRange } from '@/utils/date-range'

const baseState: AppState = {
  vendorFilter: 'all',
  gradeFilter: 'all',
  searchQuery: '',
  sortBy: 'score',
  dateFrom: '',
  dateTo: '',
  recentDays: null,
  compareIds: [],
  activeTab: 'leaderboard',
  currentPage: 1,
  pageSize: 5,
}

describe('leaderboard filters', () => {
  it('filters skills by an inclusive published date range', () => {
    const results = visibleSkills({
      ...baseState,
      dateFrom: '2026-06-24',
      dateTo: '2026-06-25',
    })

    expect(results.length).toBeGreaterThan(0)
    expect(results.length).toBeLessThan(SKILLS.length)
    expect(
      results.every((skill) => (
        skill.publishedAt >= '2026-06-24' &&
        skill.publishedAt <= '2026-06-25'
      )),
    ).toBe(true)
  })

  it('sorts by newest source date first', () => {
    const results = visibleSkills({
      ...baseState,
      sortBy: 'date',
    })

    const sortedDates = [...results]
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .map((skill) => skill.publishedAt)

    expect(results.map((skill) => skill.publishedAt)).toEqual(sortedDates)
  })

  it('builds an inclusive recent-days range from the latest date', () => {
    expect(recentDateRange('2026-06-25', 7)).toEqual({
      from: '2026-06-19',
      to: '2026-06-25',
    })
  })
})
