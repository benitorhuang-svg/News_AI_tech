import '@/styles/tokens.css'
import '@/styles/atoms.css'
import '@/styles/molecules.css'
import '@/styles/organisms.css'
import '@/styles/report.css'
import '@/styles/header.css'
import type { AppState } from '@/data/types'
import { store } from '@/state/store'
import { RECENT_DAY_OPTIONS } from '@/utils/date-range'
import { qs } from '@/utils/dom'
import { Chart } from 'chart.js'

type TabKey = AppState['activeTab']
type RenderModule =
  | { renderOverview(root: HTMLElement): void }
  | { mountLeaderboard(root: HTMLElement): void }
  | { mountComparison(root: HTMLElement): void }

function renderTabsNav(): string {
  const state = store.get()
  const tabs = [
    { key: 'overview', label: '總覽' },
    { key: 'leaderboard', label: '技能排行' },
    { key: 'analysis', label: '比較分析' },
  ] as const

  return `
    <nav class="tabs-nav" role="tablist" aria-label="分頁選單">
      ${tabs.map((tab) => `
        <button
          type="button"
          role="tab"
          aria-selected="${state.activeTab === tab.key}"
          class="tabs-nav__btn ${state.activeTab === tab.key ? 'is-active' : ''}"
          data-tab="${tab.key}"
        >
          ${tab.label}
        </button>
      `).join('')}
    </nav>
  `
}

function updateHeaderControls(header: HTMLElement): void {
  const state = store.get()
  const dateFrom = header.querySelector<HTMLInputElement>('[data-header-date-from]')
  const dateTo = header.querySelector<HTMLInputElement>('[data-header-date-to]')
  const clearButton = header.querySelector<HTMLButtonElement>('[data-header-date-clear]')
  const recentButtons = header.querySelectorAll<HTMLButtonElement>('[data-header-recent-days]')

  if (dateFrom && dateFrom.value !== state.dateFrom) dateFrom.value = state.dateFrom
  if (dateTo && dateTo.value !== state.dateTo) dateTo.value = state.dateTo
  if (clearButton) clearButton.disabled = !state.dateFrom && !state.dateTo && !state.recentDays
  recentButtons.forEach((button) => {
    button.classList.toggle('is-active', Number(button.dataset.headerRecentDays) === state.recentDays)
  })
}

function bindHeaderControls(header: HTMLElement): void {
  header.querySelectorAll<HTMLInputElement>('[data-header-date-from], [data-header-date-to]')
    .forEach((input) => {
      input.addEventListener('change', () => {
        const from = header.querySelector<HTMLInputElement>('[data-header-date-from]')?.value ?? ''
        const to = header.querySelector<HTMLInputElement>('[data-header-date-to]')?.value ?? ''
        store.setDateRange(from, to)
      })
    })

  header.querySelector<HTMLButtonElement>('[data-header-date-clear]')?.addEventListener('click', () => {
    store.setRecentDays(null)
  })

  header.querySelectorAll<HTMLButtonElement>('[data-header-recent-days]').forEach((button) => {
    button.addEventListener('click', () => {
      store.setRecentDays(Number(button.dataset.headerRecentDays))
    })
  })
}

async function loadTabModule(tab: TabKey): Promise<RenderModule> {
  if (tab === 'overview') return import('@/render/overview')
  if (tab === 'leaderboard') return import('@/render/leaderboard')
  return import('@/render/comparison')
}

async function mountTabContent(tabContent: HTMLDivElement): Promise<void> {
  const { activeTab } = store.get()
  const module = await loadTabModule(activeTab)

  Object.values(Chart.instances).forEach((chart) => chart.destroy())
  tabContent.innerHTML = `<div id="active-pane"></div>`
  const pane = qs<HTMLElement>('#active-pane')

  if ('renderOverview' in module) module.renderOverview(pane)
  else if ('mountLeaderboard' in module) module.mountLeaderboard(pane)
  else module.mountComparison(pane)
}

function mountApp(): void {
  const app = qs<HTMLDivElement>('#app')

  app.innerHTML = `
    <main>
      <header class="app-header">
        <div class="app-header__title">
          <span class="app-title">技能含金量評分表</span>
          <span class="app-subtitle">依工作價值、上手成本與成熟度排序</span>
        </div>
        <div id="tabs-container"></div>
        <div class="header-date-filter" aria-label="資料日期區間">
          <span class="header-date-filter__label">資料區間</span>
          <div class="header-date-filter__presets" aria-label="最近天數">
            ${RECENT_DAY_OPTIONS.map((days) => `
              <button type="button" data-header-recent-days="${days}">${days} 天</button>
            `).join('')}
          </div>
          <label class="header-date-filter__field">
            <span>起</span>
            <input type="date" data-header-date-from />
          </label>
          <label class="header-date-filter__field">
            <span>迄</span>
            <input type="date" data-header-date-to />
          </label>
          <button class="ghost-button" type="button" data-header-date-clear>清除</button>
        </div>
      </header>
      <div id="tab-content"></div>
    </main>
  `

  const tabsContainer = qs<HTMLDivElement>('#tabs-container')
  const tabContent = qs<HTMLDivElement>('#tab-content')
  const header = qs<HTMLElement>('.app-header')

  store.subscribe(() => {
    tabsContainer.innerHTML = renderTabsNav()
    updateHeaderControls(header)
    mountTabContent(tabContent)
  })

  store.initFromURL()
  tabsContainer.innerHTML = renderTabsNav()
  bindHeaderControls(header)
  updateHeaderControls(header)
  mountTabContent(tabContent)

  tabsContainer.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    const tabButton = target.closest<HTMLButtonElement>('[data-tab]')
    if (tabButton) {
      const tab = tabButton.dataset.tab as AppState['activeTab']
      store.setActiveTab(tab)
    }
  })
}

mountApp()
