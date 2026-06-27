import type { AppState, Vendor, GradeKey } from '@/data/types'

type Listener = () => void

const state: AppState = {
  vendorFilter: 'all',
  gradeFilter: 'all',
  searchQuery: '',
  sortBy: 'score',
  compareIds: [],
  activeTab: 'overview',
}

const listeners: Set<Listener> = new Set()

function notify(): void {
  listeners.forEach((fn) => fn())
}

export const store = {
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
    notify()
  },

  setGrade(g: GradeKey | 'all'): void {
    state.gradeFilter = g
    notify()
  },

  setSearch(q: string): void {
    state.searchQuery = q
    notify()
  },

  setSort(s: AppState['sortBy']): void {
    state.sortBy = s
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
