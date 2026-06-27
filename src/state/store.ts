import { SKILLS } from '@/data/skills'
import type { AppState, Vendor, GradeKey } from '@/data/types'
import { isRecentDays, latestIsoDate, recentDateRange } from '@/utils/date-range'

type Listener = () => void
const tabs: AppState['activeTab'][] = ['overview', 'leaderboard', 'analysis']

const state: AppState = {
  vendorFilter: 'all',
  gradeFilter: 'all',
  searchQuery: '',
  sortBy: 'score',
  dateFrom: '',
  dateTo: '',
  recentDays: null,
  compareIds: [],
  activeTab: 'overview',
  currentPage: 1,
  pageSize: 5,
}

const listeners: Set<Listener> = new Set()
const latestPublishedAt = latestIsoDate(SKILLS.map((skill) => skill.publishedAt))

function normalizeTab(tab: string | null): AppState['activeTab'] {
  if (tab === 'radar' || tab === 'vendor') return 'analysis'
  if (tab === 'sources') return 'leaderboard'
  if (tabs.includes(tab as AppState['activeTab'])) return tab as AppState['activeTab']
  return 'overview'
}

function applyRecentDays(days: number): void {
  const range = recentDateRange(latestPublishedAt, days)
  state.recentDays = days
  state.dateFrom = range.from
  state.dateTo = range.to
}

function syncToURL(): void {
  const url = new URL(window.location.href)
  url.searchParams.set('tab', state.activeTab)
  url.searchParams.set('vendor', state.vendorFilter)
  url.searchParams.set('grade', state.gradeFilter)
  url.searchParams.set('sort', state.sortBy)

  if (state.searchQuery) {
    url.searchParams.set('q', state.searchQuery)
  } else {
    url.searchParams.delete('q')
  }

  url.searchParams.set('page', state.currentPage.toString())
  url.searchParams.set('size', state.pageSize.toString())
  if (state.recentDays) {
    url.searchParams.set('days', state.recentDays.toString())
    url.searchParams.delete('from')
    url.searchParams.delete('to')
  } else {
    url.searchParams.delete('days')
    if (state.dateFrom) url.searchParams.set('from', state.dateFrom)
    else url.searchParams.delete('from')
    if (state.dateTo) url.searchParams.set('to', state.dateTo)
    else url.searchParams.delete('to')
  }
  
  if (state.compareIds.length > 0) {
    url.searchParams.set('compare', state.compareIds.join(','))
  } else {
    url.searchParams.delete('compare')
  }

  window.history.replaceState(null, '', url.toString())
}

function notify(): void {
  syncToURL()
  listeners.forEach((fn) => fn())
}

export const store = {
  initFromURL(): void {
    const params = new URLSearchParams(window.location.search)

    if (params.has('tab')) state.activeTab = normalizeTab(params.get('tab'))
    if (params.has('vendor')) state.vendorFilter = params.get('vendor') as Vendor | 'all'
    if (params.has('grade')) state.gradeFilter = params.get('grade') as GradeKey | 'all'
    if (params.has('sort')) state.sortBy = params.get('sort') as AppState['sortBy']
    if (params.has('q')) state.searchQuery = params.get('q') || ''
    if (params.has('days')) {
      const days = Number(params.get('days'))
      if (isRecentDays(days)) applyRecentDays(days)
    } else {
      if (params.has('from')) state.dateFrom = params.get('from') || ''
      if (params.has('to')) state.dateTo = params.get('to') || ''
    }
    if (params.has('page')) state.currentPage = Number(params.get('page')) || 1
    if (params.has('size')) state.pageSize = Number(params.get('size')) || 5
    if (params.has('compare')) {
      state.compareIds = params.get('compare')!.split(',').map(Number).filter(Boolean)
    }
  },

  get(): Readonly<AppState> {
    return state
  },

  subscribe(fn: Listener): () => void {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },

  setActiveTab(tab: AppState['activeTab']): void {
    state.activeTab = tab
    notify()
  },

  setVendor(v: Vendor | 'all'): void {
    state.vendorFilter = v
    state.currentPage = 1
    notify()
  },

  setGrade(g: GradeKey | 'all'): void {
    state.gradeFilter = g
    state.currentPage = 1
    notify()
  },

  setSearch(q: string): void {
    state.searchQuery = q
    state.currentPage = 1
    notify()
  },

  setSort(s: AppState['sortBy']): void {
    state.sortBy = s
    state.currentPage = 1
    notify()
  },

  setDateRange(from: string, to: string): void {
    state.dateFrom = from
    state.dateTo = to
    state.recentDays = null
    state.currentPage = 1
    notify()
  },

  setRecentDays(days: number | null): void {
    if (days === null) {
      state.dateFrom = ''
      state.dateTo = ''
      state.recentDays = null
    } else if (isRecentDays(days)) {
      applyRecentDays(days)
    }

    state.currentPage = 1
    notify()
  },

  setPage(page: number): void {
    state.currentPage = page
    notify()
  },

  setPageSize(size: number): void {
    state.pageSize = size
    state.currentPage = 1
    notify()
  },

  toggleCompare(id: number): void {
    const idx = state.compareIds.indexOf(id)
    if (idx >= 0) {
      state.compareIds.splice(idx, 1)
    } else if (state.compareIds.length < 3) {
      state.compareIds.push(id)
    }
    notify()
  },

  clearCompare(): void {
    state.compareIds = []
    notify()
  },
}
