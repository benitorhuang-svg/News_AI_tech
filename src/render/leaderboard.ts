import { GRADES, SKILLS, VENDORS, VENDOR_STYLES } from '@/data/skills'
import type { AppState, GradeKey, Skill, Vendor } from '@/data/types'
import {
  dimensions,
  formatDateTag,
  gradeColor,
  sourceLabel,
  sourceUrl,
  visibleSkills,
} from '@/render/leaderboard-utils'
import { store } from '@/state/store'
import { debounce, escapeHTML } from '@/utils/dom'

function dimensionBars(skill: Skill): string {
  return `
    <div class="dimension-bars">
      ${dimensions.map(([label, title, key, color]) => `
        <div class="dimension-bar" title="${title}: ${skill[key]} / 5">
          <span class="dimension-bar__label">${label}</span>
          <div class="dimension-bar__track">
            <div class="dimension-bar__fill" style="height: ${skill[key] * 20}%; --dim-color: ${color};"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `
}

function skillRow(skill: Skill, sequence: number): string {
  const selected = store.get().compareIds.includes(skill.id)
  const vendorStyle = VENDOR_STYLES[skill.vendor]

  return `
    <tr class="${selected ? 'is-selected' : ''}">
      <td class="rank-cell">${sequence}</td>
      <td>
        <div class="skill-title">
          ${escapeHTML(skill.name)}
        </div>
        <div class="skill-desc">${escapeHTML(skill.desc)}</div>
        <div class="skill-meta">${escapeHTML(skill.category)} · ${escapeHTML(skill.useCase)}</div>
      </td>
      <td>
        <span class="vendor-badge" style="--vendor-color: ${vendorStyle.primary}">
          ${skill.vendor}
        </span>
      </td>
      <td>
        <span class="grade-pill" style="--grade-color: ${gradeColor(skill)}">
          ${skill.grade}
        </span>
      </td>
      <td class="score-cell">${skill.score}</td>
      <td>${dimensionBars(skill)}</td>
      <td>
        <span class="date-tag">${formatDateTag(skill.publishedAt)}</span>
      </td>
      <td>
        <a class="source-link" href="${escapeHTML(sourceUrl(skill))}" target="_blank" rel="noopener">
          ${escapeHTML(sourceLabel(skill))}
        </a>
      </td>
      <td>
        <button
          class="icon-button ${selected ? 'is-active' : ''}"
          type="button"
          data-compare="${skill.id}"
          title="${selected ? '移除比較' : '加入比較'}"
          aria-label="${selected ? '移除比較' : '加入比較'}"
        >
          ${selected ? '✓' : '+'}
        </button>
      </td>
    </tr>
  `
}

function updateControls(root: HTMLElement): void {
  const state = store.get()

  root.querySelectorAll<HTMLButtonElement>('[data-vendor-filter]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.vendorFilter === state.vendorFilter)
  })
  root.querySelectorAll<HTMLButtonElement>('[data-grade-filter]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.gradeFilter === state.gradeFilter)
  })
  root.querySelectorAll<HTMLButtonElement>('[data-page-size]').forEach((button) => {
    const size = button.dataset.pageSize === 'all' ? -1 : Number(button.dataset.pageSize)
    button.classList.toggle('is-active', size === state.pageSize)
  })

  const search = root.querySelector<HTMLInputElement>('[data-search]')
  const sort = root.querySelector<HTMLSelectElement>('[data-sort]')
  if (search && search.value !== state.searchQuery) search.value = state.searchQuery
  if (sort) sort.value = state.sortBy
}

function renderToast(root: HTMLElement): void {
  const toast = root.querySelector<HTMLElement>('[data-compare-toast]')
  if (!toast) return

  const count = store.get().compareIds.length
  toast.innerHTML = count
    ? `
      <div class="compare-chip compare-chip--wide">
        <span>已選擇 <b>${count}</b> 個技能，上限 3 個</span>
        <span>
          <button class="ghost-button" type="button" data-toast-clear>清除</button>
          <button class="ghost-button" type="button" data-toast-go>比較</button>
        </span>
      </div>
    `
    : ''

  toast.querySelector('[data-toast-clear]')?.addEventListener('click', () => store.clearCompare())
  toast.querySelector('[data-toast-go]')?.addEventListener('click', () => store.setActiveTab('analysis'))
}

function renderPagination(totalItems: number): string {
  const { currentPage, pageSize } = store.get()
  const limit = pageSize === -1 ? totalItems || 1 : pageSize
  const totalPages = Math.max(1, Math.ceil(totalItems / limit))
  const start = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1
  const end = Math.min(currentPage * limit, totalItems)

  return `
    <div class="pagination">
      <span>顯示 ${start}-${end} 筆，共 ${totalItems} 筆</span>
      <span>
        <button class="ghost-button" type="button" data-page="prev" ${currentPage === 1 ? 'disabled' : ''}>上一頁</button>
        <strong>${currentPage} / ${totalPages}</strong>
        <button class="ghost-button" type="button" data-page="next" ${currentPage === totalPages ? 'disabled' : ''}>下一頁</button>
      </span>
    </div>
  `
}

function renderRows(root: HTMLElement): void {
  updateControls(root)
  renderToast(root)

  const rows = visibleSkills(store.get())
  const count = root.querySelector<HTMLElement>('[data-result-count]')
  const tbody = root.querySelector<HTMLTableSectionElement>('[data-skill-rows]')
  if (count) count.textContent = `${rows.length} / ${SKILLS.length}`
  if (!tbody) return

  const { currentPage, pageSize } = store.get()
  const limit = pageSize === -1 ? rows.length || 1 : pageSize
  const startIndex = (currentPage - 1) * limit
  const paginatedRows = rows.slice(startIndex, currentPage * limit)

  tbody.innerHTML = paginatedRows.length
    ? paginatedRows.map((skill, index) => skillRow(skill, startIndex + index + 1)).join('')
    : `<tr><td colspan="9" class="empty-row">沒有符合條件的技能</td></tr>`

  const pagination = root.querySelector<HTMLElement>('[data-pagination-container]')
  if (pagination) pagination.innerHTML = renderPagination(rows.length)

  const announcer = root.querySelector<HTMLElement>('#a11y-announcer')
  if (announcer) announcer.textContent = `已載入 ${paginatedRows.length} 筆結果，共 ${rows.length} 筆。`
}

export function mountLeaderboard(root: HTMLElement): void {
  root.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">排行榜</p>
        <h2>技能明細</h2>
      </div>
      <span class="result-count" data-result-count></span>
    </div>
    <div id="a11y-announcer" aria-live="polite" class="sr-only"></div>
    <div class="toolbar">
      <div class="segmented-control" aria-label="廠商篩選">
        <button type="button" data-vendor-filter="all">全部</button>
        ${VENDORS.map((vendor) => `<button type="button" data-vendor-filter="${vendor}">${vendor}</button>`).join('')}
      </div>
      <div class="segmented-control" aria-label="等級篩選">
        <button type="button" data-grade-filter="all">全部</button>
        ${GRADES.map((grade) => `<button type="button" data-grade-filter="${grade.key}">${grade.key}</button>`).join('')}
      </div>
      <label class="field">
        <span>搜尋</span>
        <input type="search" data-search placeholder="技能、用途、來源" />
      </label>
      <div class="field">
        <span>每頁</span>
        <div class="segmented-control" aria-label="每頁顯示列數">
          <button type="button" data-page-size="5">5</button>
          <button type="button" data-page-size="10">10</button>
          <button type="button" data-page-size="15">15</button>
          <button type="button" data-page-size="all">全部</button>
        </div>
      </div>
      <label class="field field--compact">
        <span>排序</span>
        <select data-sort>
          <option value="score">分數</option>
          <option value="date">日期</option>
          <option value="name">名稱</option>
          <option value="vendor">廠商</option>
        </select>
      </label>
    </div>
    <div data-compare-toast></div>
    <div class="table-frame">
      <table>
        <thead>
          <tr><th>序號</th><th>技能</th><th>廠商</th><th>等級</th><th>分數</th><th>四維</th><th>日期</th><th>資料來源</th><th>比較</th></tr>
        </thead>
        <tbody data-skill-rows></tbody>
      </table>
    </div>
    <div data-pagination-container></div>
  `

  root.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    const vendorButton = target.closest<HTMLButtonElement>('[data-vendor-filter]')
    const gradeButton = target.closest<HTMLButtonElement>('[data-grade-filter]')
    const compareButton = target.closest<HTMLButtonElement>('[data-compare]')
    const pageSizeButton = target.closest<HTMLButtonElement>('[data-page-size]')
    const pageButton = target.closest<HTMLButtonElement>('[data-page]')

    if (vendorButton) store.setVendor(vendorButton.dataset.vendorFilter as Vendor | 'all')
    if (gradeButton) store.setGrade(gradeButton.dataset.gradeFilter as GradeKey | 'all')
    if (compareButton) store.toggleCompare(Number(compareButton.dataset.compare))
    if (pageSizeButton) {
      const value = pageSizeButton.dataset.pageSize
      store.setPageSize(value === 'all' ? -1 : Number(value))
    }
    if (pageButton) {
      const { currentPage, pageSize } = store.get()
      const rows = visibleSkills(store.get())
      const limit = pageSize === -1 ? rows.length || 1 : pageSize
      const totalPages = Math.max(1, Math.ceil(rows.length / limit))
      if (pageButton.dataset.page === 'prev' && currentPage > 1) store.setPage(currentPage - 1)
      if (pageButton.dataset.page === 'next' && currentPage < totalPages) store.setPage(currentPage + 1)
    }
  })

  root.querySelector<HTMLInputElement>('[data-search]')?.addEventListener('input', debounce((event: Event) => {
    store.setSearch((event.target as HTMLInputElement).value)
  }, 300))

  root.querySelector<HTMLSelectElement>('[data-sort]')?.addEventListener('change', (event) => {
    store.setSort((event.currentTarget as HTMLSelectElement).value as AppState['sortBy'])
  })

  store.subscribe(() => renderRows(root))
  renderRows(root)
}
