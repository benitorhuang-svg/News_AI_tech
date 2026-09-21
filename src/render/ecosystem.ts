import { GITHUB_REPOS, REPO_CATEGORIES, CATEGORY_COLOR_MAP } from '@/data/github-trending'
import type { GitHubRepo, RepoCategory } from '@/data/types'
import { store } from '@/state/store'
import { drawStarChart } from '@/charts/star-chart'
import { escapeHTML } from '@/utils/dom'

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

function categoryBadge(category: RepoCategory): string {
  const def = REPO_CATEGORIES.find((c) => c.key === category)
  const color = CATEGORY_COLOR_MAP[category] ?? '#667085'
  return `<span class="cat-badge" style="--cat-color: ${color}">${def?.label ?? category}</span>`
}

function filterAndSort(repos: GitHubRepo[]): GitHubRepo[] {
  const { ecosystemCategory, ecosystemSort } = store.get()

  let filtered = repos
  if (ecosystemCategory !== 'all') {
    filtered = repos.filter((r) => r.category === ecosystemCategory)
  }

  return [...filtered].sort((a, b) => {
    if (ecosystemSort === 'stars') return b.stars - a.stars
    if (ecosystemSort === 'starsWeekly') return b.starsWeekly - a.starsWeekly
    return a.label.localeCompare(b.label)
  })
}

function renderTopMovers(repos: GitHubRepo[]): string {
  const movers = [...repos]
    .sort((a, b) => b.starsWeekly - a.starsWeekly)
    .slice(0, 5)

  return movers.map((r) => {
    const deltaClass = r.starsWeekly > 0 ? '' : 'eco-mover-card__delta--zero'
    const deltaText = r.starsWeekly > 0 ? `+${r.starsWeekly.toLocaleString()}` : '±0'

    return `
      <article class="eco-mover-card">
        <div class="eco-mover-card__header">
          <span class="eco-mover-card__label">${escapeHTML(r.label)}</span>
          <span class="eco-mover-card__delta ${deltaClass}">${deltaText} ⭐</span>
        </div>
        <span class="eco-mover-card__stars">${formatStars(r.stars)} stars · ${escapeHTML(r.language)}</span>
        <span class="eco-mover-card__desc">${escapeHTML(r.description)}</span>
        ${categoryBadge(r.category)}
      </article>
    `
  }).join('')
}

function renderCategoryFilters(): string {
  const { ecosystemCategory } = store.get()

  const allBtn = `<button type="button" class="eco-filters__btn ${ecosystemCategory === 'all' ? 'is-active' : ''}" data-eco-cat="all">全部</button>`
  const catBtns = REPO_CATEGORIES.map((c) =>
    `<button type="button" class="eco-filters__btn ${ecosystemCategory === c.key ? 'is-active' : ''}" data-eco-cat="${c.key}">${c.label}</button>`,
  ).join('')

  return `<div class="eco-filters">${allBtn}${catBtns}</div>`
}

function renderSortHeaders(): string {
  const { ecosystemSort } = store.get()
  const sortIcon = (key: string) => ecosystemSort === key ? ' ▼' : ''
  const cls = (key: string) => ecosystemSort === key ? 'is-sorted' : ''

  return `
    <tr>
      <th>Repo</th>
      <th>分類</th>
      <th class="eco-table__stars ${cls('stars')}" data-eco-sort="stars">Stars${sortIcon('stars')}</th>
      <th class="eco-table__delta ${cls('starsWeekly')}" data-eco-sort="starsWeekly">週增${sortIcon('starsWeekly')}</th>
      <th>語言</th>
      <th>最近更新</th>
    </tr>
  `
}

function renderRepoRows(repos: GitHubRepo[]): string {
  return repos.map((r) => {
    const deltaClass = r.starsWeekly > 0 ? 'eco-table__delta--positive' : 'eco-table__delta--zero'
    const deltaText = r.starsWeekly > 0 ? `+${r.starsWeekly.toLocaleString()}` : '—'
    const pushedDate = r.pushedAt ? r.pushedAt.slice(0, 10) : '—'

    return `
      <tr>
        <td class="eco-table__name">
          <a href="https://github.com/${r.repo}" target="_blank" rel="noopener">${escapeHTML(r.label)}</a>
        </td>
        <td>${categoryBadge(r.category)}</td>
        <td class="eco-table__stars">${r.stars.toLocaleString()}</td>
        <td class="eco-table__delta ${deltaClass}">${deltaText}</td>
        <td class="eco-table__lang">${escapeHTML(r.language)}</td>
        <td class="eco-table__lang">${pushedDate}</td>
      </tr>
    `
  }).join('')
}

function renderEmptyState(): string {
  return `
    <div class="eco-empty">
      <div class="eco-empty__icon">📡</div>
      <p>尚未收集 GitHub 生態系資料</p>
      <p>執行 <code>npx tsx scripts/collect-github-trending.ts</code> 來收集第一份快照</p>
    </div>
  `
}

export function mountEcosystem(root: HTMLElement): void {
  const repos = GITHUB_REPOS

  if (repos.length === 0) {
    root.innerHTML = renderEmptyState()
    return
  }

  const sorted = filterAndSort(repos)
  const collectedAt = repos[0]?.collectedAt
    ? new Date(repos[0].collectedAt).toLocaleDateString('zh-TW')
    : '—'

  root.innerHTML = `
    <div class="eco-hero">
      <div>
        <p class="eyebrow">生態趨勢</p>
        <h1>AI 開源生態系追蹤</h1>
        <p class="eco-hero__lead">
          追蹤 ${repos.length} 個熱門 AI 開源專案的 GitHub Stars 趨勢，涵蓋 Agent 框架、推理引擎、開發工具、基礎模型與應用層。
          <small style="color: var(--color-muted)">最後更新：${collectedAt}</small>
        </p>
      </div>

      <div>
        <div class="section-heading">
          <div>
            <p class="eyebrow">本週竄升</p>
            <h2>Top Movers</h2>
          </div>
        </div>
        <div class="eco-movers">${renderTopMovers(repos)}</div>
      </div>

      <div class="eco-split">
        <section>
          <div class="section-heading">
            <div>
              <p class="eyebrow">完整列表</p>
              <h2>追蹤 Repo</h2>
            </div>
          </div>
          ${renderCategoryFilters()}
          <div class="eco-table-wrap">
            <table class="eco-table">
              <thead>${renderSortHeaders()}</thead>
              <tbody>${renderRepoRows(sorted)}</tbody>
            </table>
          </div>
        </section>

        <section>
          <div class="section-heading">
            <div>
              <p class="eyebrow">視覺化</p>
              <h2>週增 Stars 排行</h2>
            </div>
          </div>
          <div class="chart-frame chart-frame--star" style="height: 400px">
            <canvas data-star-canvas aria-label="週增 Stars 柱狀圖" role="img"></canvas>
          </div>
        </section>
      </div>
    </div>
  `

  // Bind category filter clicks
  root.querySelectorAll<HTMLButtonElement>('[data-eco-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.ecoCat as RepoCategory | 'all'
      store.setEcosystemCategory(cat)
    })
  })

  // Bind sort header clicks
  root.querySelectorAll<HTMLElement>('[data-eco-sort]').forEach((th) => {
    th.addEventListener('click', () => {
      const sort = th.dataset.ecoSort as 'stars' | 'starsWeekly'
      store.setEcosystemSort(sort)
    })
  })

  // Draw chart
  const canvas = root.querySelector<HTMLCanvasElement>('[data-star-canvas]')
  if (canvas) {
    drawStarChart(canvas, sorted)
  }
}
