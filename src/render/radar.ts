import { drawRadarChart } from '@/charts/radar-chart'
import { GRADES, SKILLS, VENDOR_STYLES } from '@/data/skills'
import type { Skill } from '@/data/types'
import { skillsInDateRange } from '@/render/leaderboard-utils'
import { store } from '@/state/store'
import { gradeKey } from '@/utils/scoring'
import { escapeHTML } from '@/utils/dom'

const dimensions = [
  ['實用度', 'practicality'],
  ['落地門檻', 'accessibility'],
  ['成熟度', 'maturity'],
  ['獨特性', 'uniqueness'],
] as const

function selectedSkills(): Skill[] {
  const { compareIds } = store.get()

  if (!compareIds.length) {
    return skillsInDateRange(store.get()).sort((a, b) => b.score - a.score).slice(0, 3)
  }

  return compareIds
    .map((id) => SKILLS.find((skill) => skill.id === id))
    .filter((skill): skill is Skill => Boolean(skill))
}

function gradeColor(skill: Skill): string {
  return GRADES.find((grade) => grade.key === gradeKey(skill.score))?.color ?? '#667085'
}

function sourceUrl(skill: Skill): string {
  return skill.source.startsWith('http') ? skill.source : `https://${skill.source}`
}

function renderSelection(root: HTMLElement, skills: Skill[]): void {
  const list = root.querySelector<HTMLElement>('[data-compare-list]')
  const clear = root.querySelector<HTMLButtonElement>('[data-clear-compare]')
  if (clear) clear.disabled = store.get().compareIds.length === 0
  if (!list) return

  list.innerHTML = skills.map((skill) => `
    <span class="compare-chip">
      <b>${skill.score}</b>
      ${escapeHTML(skill.name)}
      <button type="button" data-remove-compare="${skill.id}" aria-label="移除 ${escapeHTML(skill.name)}">×</button>
    </span>
  `).join('')
}

function renderSummary(root: HTMLElement, skills: Skill[]): void {
  const container = root.querySelector<HTMLElement>('[data-compare-summary]')
  if (!container) return

  container.innerHTML = `
    <div class="summary-list">
      ${skills.map((skill) => {
        const vendorStyle = VENDOR_STYLES[skill.vendor]
        return `
          <div class="summary-row">
            <div>
              <strong>${skill.score}</strong>
              <span>${escapeHTML(skill.name)}</span>
            </div>
            <span class="vendor-badge" style="--vendor-color: ${vendorStyle.primary}">
              ${skill.vendor}
            </span>
          </div>
        `
      }).join('')}
    </div>
  `
}

function renderDetails(root: HTMLElement, skills: Skill[]): void {
  const container = root.querySelector<HTMLElement>('[data-compare-details]')
  if (!container) return

  container.innerHTML = skills.map((skill) => {
    const vendorStyle = VENDOR_STYLES[skill.vendor]
    return `
      <article class="vendor-card" style="--vendor-color: ${vendorStyle.primary}">
        <div class="vendor-card__top">
          <span>${escapeHTML(skill.name)}</span>
          <strong>${skill.score}</strong>
        </div>
        <p>${skill.vendor} · ${escapeHTML(skill.category)}</p>
        <dl>
          ${dimensions.map(([label, key]) => `
            <div>
              <dt>${label}</dt>
              <dd>${skill[key]} / 5</dd>
            </div>
          `).join('')}
        </dl>
        <p>${escapeHTML(skill.desc)}</p>
        <small>${escapeHTML(skill.useCase)}</small>
        <div class="card-footer">
          <a href="${escapeHTML(sourceUrl(skill))}" target="_blank" rel="noopener">來源</a>
          <span class="grade-pill" style="--grade-color: ${gradeColor(skill)}">${skill.grade}</span>
        </div>
      </article>
    `
  }).join('')
}

function renderRadar(root: HTMLElement): void {
  const skills = selectedSkills()
  const canvas = root.querySelector<HTMLCanvasElement>('[data-radar-canvas]')

  renderSelection(root, skills)
  renderSummary(root, skills)
  renderDetails(root, skills)
  if (canvas) drawRadarChart(canvas, skills)
}

export function mountRadar(root: HTMLElement): void {
  root.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">比較</p>
        <h2>四維能力比較</h2>
      </div>
      <button class="ghost-button" type="button" data-clear-compare>清除比較</button>
    </div>
    <div class="compare-list" data-compare-list></div>
    <div class="content-section--split">
      <div class="chart-frame chart-frame--radar">
        <canvas data-radar-canvas aria-label="技能雷達圖" role="img"></canvas>
      </div>
      <div data-compare-summary></div>
    </div>
    <section class="content-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">明細</p>
          <h2>比較矩陣</h2>
        </div>
      </div>
      <div class="detail-grid" data-compare-details></div>
    </section>
  `

  root.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    const removeButton = target.closest<HTMLButtonElement>('[data-remove-compare]')
    const clearButton = target.closest<HTMLButtonElement>('[data-clear-compare]')

    if (removeButton) store.toggleCompare(Number(removeButton.dataset.removeCompare))
    if (clearButton) store.clearCompare()
  })

  store.subscribe(() => renderRadar(root))
  renderRadar(root)
}
