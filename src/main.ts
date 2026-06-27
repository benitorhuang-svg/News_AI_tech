import '@/styles/tokens.css'
import '@/styles/atoms.css'
import '@/styles/molecules.css'
import '@/styles/organisms.css'
import { renderOverview } from '@/render/overview'
import { mountLeaderboard } from '@/render/leaderboard'
import { mountRadar } from '@/render/radar'
import { renderSources } from '@/render/sources'
import { mountVendorBattle } from '@/render/vendor-battle'
import { store } from '@/state/store'
import { qs } from '@/utils/dom'

function renderTabsNav(): string {
  const state = store.get()
  const tabs = [
    { key: 'overview', label: '戰略綜觀與 KPI' },
    { key: 'leaderboard', label: '技能排行明細' },
    { key: 'radar', label: '四維能力比較' },
    { key: 'vendor', label: '廠商競爭格局' },
    { key: 'sources', label: '資料來源追蹤' },
  ] as const

  return `
    <nav class="tabs-nav" aria-label="分頁選單">
      ${tabs.map((tab) => `
        <button
          type="button"
          class="tabs-nav__btn ${state.activeTab === tab.key ? 'is-active' : ''}"
          data-tab="${tab.key}"
        >
          ${tab.label}
        </button>
      `).join('')}
    </nav>
  `
}

function mountTabContent(tabContent: HTMLDivElement): void {
  const { activeTab } = store.get()

  tabContent.innerHTML = `<div id="active-pane"></div>`
  const pane = qs<HTMLElement>('#active-pane')

  if (activeTab === 'overview') {
    renderOverview(pane)
  } else if (activeTab === 'leaderboard') {
    mountLeaderboard(pane)
  } else if (activeTab === 'radar') {
    mountRadar(pane)
  } else if (activeTab === 'vendor') {
    mountVendorBattle(pane)
  } else if (activeTab === 'sources') {
    renderSources(pane)
  }
}

function mountApp(): void {
  const app = qs<HTMLDivElement>('#app')

  app.innerHTML = `
    <main>
      <header style="padding: 0 0 1.25rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--color-line); margin-bottom: 1.5rem;">
        <span style="font-weight: 800; font-size: 1.15rem; letter-spacing: -0.02em; color: var(--color-text);">
          AI Skill Value Index
        </span>
        <span style="font-size: 0.8rem; color: var(--color-muted); font-weight: 500;">
          更新期間: 2026年3-5月 (近90天)
        </span>
      </header>
      <div id="tabs-container"></div>
      <div id="tab-content" style="margin-top: 1.5rem;"></div>
    </main>
  `

  const tabsContainer = qs<HTMLDivElement>('#tabs-container')
  const tabContent = qs<HTMLDivElement>('#tab-content')

  // 訂閱狀態更新
  store.subscribe(() => {
    tabsContainer.innerHTML = renderTabsNav()
    mountTabContent(tabContent)
  })

  // 初次渲染
  tabsContainer.innerHTML = renderTabsNav()
  mountTabContent(tabContent)

  // 監聽分頁切換
  tabsContainer.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    const tabButton = target.closest<HTMLButtonElement>('[data-tab]')
    if (tabButton) {
      const tab = tabButton.dataset.tab as any
      store.setActiveTab(tab)
    }
  })
}

mountApp()
