import '@/styles/tokens.css'
import '@/styles/atoms.css'
import '@/styles/molecules.css'
import '@/styles/organisms.css'
import { renderHero } from '@/render/hero'
import { mountLeaderboard } from '@/render/leaderboard'
import { mountRadar } from '@/render/radar'
import { renderSources } from '@/render/sources'
import { mountVendorBattle } from '@/render/vendor-battle'
import { store } from '@/state/store'
import { qs } from '@/utils/dom'

function renderTabsNav(): string {
  const state = store.get()
  const tabs = [
    { key: 'leaderboard', label: '技能清單與總覽' },
    { key: 'radar', label: '四維能力比較' },
    { key: 'vendor', label: '廠商戰力對決' },
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

  if (activeTab === 'leaderboard') {
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
      <section class="hero" id="hero"></section>
      <div id="tabs-container"></div>
      <div id="tab-content"></div>
    </main>
  `

  renderHero(qs<HTMLElement>('#hero'))

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
