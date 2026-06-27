import { drawRadarChart } from '@/charts/radar-chart'
import { SKILLS, VENDOR_STYLES } from '@/data/skills'
import type { Skill } from '@/data/types'
import { store } from '@/state/store'

function selectedSkills(): Skill[] {
  const { compareIds } = store.get()

  if (!compareIds.length) {
    return [...SKILLS].sort((a, b) => b.score - a.score).slice(0, 3)
  }

  return compareIds
    .map((id) => SKILLS.find((skill) => skill.id === id))
    .filter((skill): skill is Skill => Boolean(skill))
}

function renderSelection(root: HTMLElement, skills: Skill[]): void {
  const list = root.querySelector<HTMLElement>('[data-compare-list]')
  const clear = root.querySelector<HTMLButtonElement>('[data-clear-compare]')
  const isDefault = store.get().compareIds.length === 0

  if (clear) clear.disabled = isDefault
  if (!list) return

  list.innerHTML = skills.map((skill) => `
    <span class="compare-chip">
      <b>${skill.score}</b>
      ${skill.name}
      ${isDefault ? '' : `
        <button type="button" data-remove-compare="${skill.id}" aria-label="移除 ${skill.name}">×</button>
      `}
    </span>
  `).join('')
}

function renderDetails(root: HTMLElement, skills: Skill[]): void {
  const container = root.querySelector<HTMLElement>('[data-compare-details]')
  if (!container) return

  container.innerHTML = skills.map((skill) => {
    const vendorStyle = VENDOR_STYLES[skill.vendor]
    return `
      <article class="vendor-card" style="--vendor-color: ${vendorStyle.primary}; margin-bottom: 0px;">
        <div class="vendor-card__top">
          <span style="font-weight: 700; font-size: 0.95rem;">${skill.name}</span>
          <strong style="color: ${vendorStyle.primary}; font-size: 1.1rem;">${skill.score} 分</strong>
        </div>
        <p style="margin-top: 0.2rem; font-weight: 700; font-size: 0.75rem; color: ${vendorStyle.primary}; text-transform: uppercase;">
          ${skill.vendor} · ${skill.category}
        </p>
        <p style="margin-top: 0.5rem; color: var(--color-text-light); font-size: 0.85rem; line-height: 1.5;">
          <b>一句話說明：</b>${skill.desc}
        </p>
        <p style="margin-top: 0.25rem; color: var(--color-text-light); font-size: 0.85rem; line-height: 1.5;">
          <b>上班用途：</b>${skill.useCase}
        </p>
        <p style="margin-top: 0.25rem; color: var(--color-muted); font-size: 0.85rem; line-height: 1.5; font-style: italic;">
          <b>評價：</b>${skill.comment}
        </p>
        <div style="margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px solid var(--color-line); display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.72rem; color: var(--color-muted)">
            實用 ${skill.practicality} · 門檻 ${skill.accessibility} · 成熟 ${skill.maturity} · 獨特 ${skill.uniqueness}
          </span>
          <a class="source-link" href="https://${skill.source}" target="_blank" rel="noopener" style="font-size: 0.72rem; padding: 0.15rem 0.4rem; min-height: auto;">
            來源
          </a>
        </div>
      </article>
    `
  }).join('')
}

function renderRadar(root: HTMLElement): void {
  const skills = selectedSkills()
  const canvas = root.querySelector<HTMLCanvasElement>('[data-radar-canvas]')

  renderSelection(root, skills)
  renderDetails(root, skills)
  if (canvas) drawRadarChart(canvas, skills)
}

export function mountRadar(root: HTMLElement): void {
  root.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">Radar Comparison</p>
        <h2>四維能力比較</h2>
      </div>
      <button class="ghost-button" type="button" data-clear-compare>清除比較</button>
    </div>
    <div class="compare-list" data-compare-list></div>
    
    <div class="content-section--split">
      <div class="chart-frame chart-frame--radar">
        <canvas data-radar-canvas aria-label="技能雷達圖" role="img"></canvas>
      </div>
      <div style="display: flex; flex-direction: column; gap: 1rem;" data-compare-details></div>
    </div>
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
