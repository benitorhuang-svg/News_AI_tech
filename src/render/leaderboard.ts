import { GRADES, SKILLS, VENDORS, VENDOR_STYLES } from '@/data/skills'
import type { AppState, GradeKey, Skill, Vendor } from '@/data/types'
import { store } from '@/state/store'
import { gradeKey } from '@/utils/scoring'

function matchesQuery(skill: Skill, query: string): boolean {
  const target = [
    skill.name,
    skill.desc,
    skill.category,
    skill.useCase,
    skill.comment,
    skill.source,
  ].join(' ')

  return target.toLowerCase().includes(query.trim().toLowerCase())
}

function compareSkills(sortBy: AppState['sortBy']) {
  return (a: Skill, b: Skill) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name, 'zh-Hant')
    if (sortBy === 'vendor') return a.vendor.localeCompare(b.vendor, 'en')
    return b.score - a.score
  }
}

function visibleSkills(): Skill[] {
  const state = store.get()

  return SKILLS.filter((skill) => {
    const vendorMatch = state.vendorFilter === 'all' || skill.vendor === state.vendorFilter
    const gradeMatch = state.gradeFilter === 'all' || gradeKey(skill.score) === state.gradeFilter
    const queryMatch = !state.searchQuery || matchesQuery(skill, state.searchQuery)

    return vendorMatch && gradeMatch && queryMatch
  }).sort(compareSkills(state.sortBy))
}

function gradeColor(skill: Skill): string {
  return GRADES.find((grade) => grade.key === gradeKey(skill.score))?.color ?? '#667085'
}

function skillRow(skill: Skill): string {
  const selected = store.get().compareIds.includes(skill.id)
  const vendorStyle = VENDOR_STYLES[skill.vendor]

  return `
    <tr>
      <td class="rank-cell">${skill.score}</td>
      <td>
        <div class="skill-title">${skill.name}</div>
        <div class="skill-desc">${skill.desc}</div>
        <div class="skill-meta">${skill.category} · ${skill.useCase}</div>
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
      <td class="dimension-cell">
        <span>${skill.practicality}</span>
        <span>${skill.accessibility}</span>
        <span>${skill.maturity}</span>
        <span>${skill.uniqueness}</span>
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

  const search = root.querySelector<HTMLInputElement>('[data-search]')
  const sort = root.querySelector<HTMLSelectElement>('[data-sort]')
  if (search && search.value !== state.searchQuery) search.value = state.searchQuery
  if (sort) sort.value = state.sortBy
}

function renderToast(root: HTMLElement): void {
  const toastContainer = root.querySelector<HTMLElement>('[data-compare-toast]')
  if (!toastContainer) return

  const { compareIds } = store.get()
  if (compareIds.length === 0) {
    toastContainer.innerHTML = ''
    return
  }

  toastContainer.innerHTML = `
    <div class="compare-chip" style="width: 100%; justify-content: space-between; margin-bottom: 1rem; padding: 0.5rem 1rem;">
      <span>已選擇 <b>${compareIds.length}</b> 個技能進行比較 (上限 3 個)</span>
      <div style="display: flex; gap: 0.5rem;">
        <button class="ghost-button" type="button" data-toast-clear style="min-height: 2rem;">清除</button>
        <button class="ghost-button" type="button" data-toast-go style="border-color: var(--vendor-gemini); color: var(--vendor-gemini); min-height: 2rem;">立即比較 →</button>
      </div>
    </div>
  `

  toastContainer.querySelector('[data-toast-clear]')?.addEventListener('click', () => {
    store.clearCompare()
  })

  toastContainer.querySelector('[data-toast-go]')?.addEventListener('click', () => {
    store.setActiveTab('radar')
  })
}

function renderRows(root: HTMLElement): void {
  updateControls(root)
  renderToast(root)

  const rows = visibleSkills()
  const count = root.querySelector<HTMLElement>('[data-result-count]')
  const tbody = root.querySelector<HTMLTableSectionElement>('[data-skill-rows]')

  if (count) count.textContent = `${rows.length} / ${SKILLS.length}`
  if (!tbody) return

  tbody.innerHTML = rows.length
    ? rows.map(skillRow).join('')
    : `<tr><td colspan="6" class="empty-row">沒有符合條件的技能</td></tr>`
}

export function mountLeaderboard(root: HTMLElement): void {
  root.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">Leaderboard</p>
        <h2>技能排行榜</h2>
      </div>
      <span class="result-count" data-result-count></span>
    </div>
    <div class="toolbar">
      <div class="segmented-control" aria-label="廠商篩選">
        <button type="button" data-vendor-filter="all">全部</button>
        ${VENDORS.map((vendor) => (
          `<button type="button" data-vendor-filter="${vendor}">${vendor}</button>`
        )).join('')}
      </div>
      <div class="segmented-control" aria-label="等級篩選">
        <button type="button" data-grade-filter="all">全部</button>
        ${GRADES.map((grade) => (
          `<button type="button" data-grade-filter="${grade.key}">${grade.key}</button>`
        )).join('')}
      </div>
      <label class="field">
        <span>搜尋</span>
        <input type="search" data-search placeholder="技能、用途、來源" />
      </label>
      <label class="field field--compact">
        <span>排序</span>
        <select data-sort>
          <option value="score">分數</option>
          <option value="name">名稱</option>
          <option value="vendor">廠商</option>
        </select>
      </label>
    </div>
    <div data-compare-toast></div>
    <div class="table-frame">
      <table>
        <thead>
          <tr>
            <th>分數</th>
            <th>技能</th>
            <th>廠商</th>
            <th>等級</th>
            <th>四維</th>
            <th>比較</th>
          </tr>
        </thead>
        <tbody data-skill-rows></tbody>
      </table>
    </div>
  `

  root.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    const vendorButton = target.closest<HTMLButtonElement>('[data-vendor-filter]')
    const gradeButton = target.closest<HTMLButtonElement>('[data-grade-filter]')
    const compareButton = target.closest<HTMLButtonElement>('[data-compare]')

    if (vendorButton) store.setVendor(vendorButton.dataset.vendorFilter as Vendor | 'all')
    if (gradeButton) store.setGrade(gradeButton.dataset.gradeFilter as GradeKey | 'all')
    if (compareButton) store.toggleCompare(Number(compareButton.dataset.compare))
  })

  root.querySelector<HTMLInputElement>('[data-search]')?.addEventListener('input', (event) => {
    store.setSearch((event.currentTarget as HTMLInputElement).value)
  })

  root.querySelector<HTMLSelectElement>('[data-sort]')?.addEventListener('change', (event) => {
    store.setSort((event.currentTarget as HTMLSelectElement).value as AppState['sortBy'])
  })

  store.subscribe(() => renderRows(root))
  renderRows(root)
}
