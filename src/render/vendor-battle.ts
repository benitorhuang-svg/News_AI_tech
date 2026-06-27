import { drawVendorBarChart } from '@/charts/bar-chart'
import type { VendorAverage } from '@/charts/bar-chart'
import { DIMENSIONS, VENDORS, VENDOR_STYLES } from '@/data/skills'
import type { DimensionKey, Skill, Vendor } from '@/data/types'
import { skillsInDateRange } from '@/render/leaderboard-utils'
import { store } from '@/state/store'
import { gradeKey } from '@/utils/scoring'
import { escapeHTML } from '@/utils/dom'

function average(values: number[]): number {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function averageDimension(skills: Skill[], key: DimensionKey): number {
  return Number(average(skills.map((skill) => skill[key])).toFixed(1))
}

function vendorRows(skills: Skill[]): VendorAverage[] {
  return VENDORS.map((vendor) => {
    const vendorSkills = skills.filter((skill) => skill.vendor === vendor)

    return {
      vendor,
      score: Math.round(average(vendorSkills.map((skill) => skill.score))),
      practicality: averageDimension(vendorSkills, 'practicality'),
      accessibility: averageDimension(vendorSkills, 'accessibility'),
      maturity: averageDimension(vendorSkills, 'maturity'),
      uniqueness: averageDimension(vendorSkills, 'uniqueness'),
    }
  })
}

function bestSkill(vendor: Vendor, skills: Skill[]): Skill | undefined {
  return skills.filter((skill) => skill.vendor === vendor)
    .sort((a, b) => b.score - a.score)[0]
}

function renderCards(root: HTMLElement, rows: VendorAverage[], skills: Skill[]): void {
  const list = root.querySelector<HTMLElement>('[data-vendor-cards]')
  if (!list) return

  list.innerHTML = rows.map((row) => {
    const vendorSkills = skills.filter((skill) => skill.vendor === row.vendor)
    const aGradeCount = vendorSkills.filter((skill) => gradeKey(skill.score) === 'A').length
    const topSkill = bestSkill(row.vendor, skills)
    const vendorStyle = VENDOR_STYLES[row.vendor]

    return `
      <article class="vendor-card" style="--vendor-color: ${vendorStyle.primary}">
        <div class="vendor-card__top">
          <span>${row.vendor}</span>
          <strong>${row.score}</strong>
        </div>
        <p>${vendorSkills.length} 個技能 · A 級 ${aGradeCount} 個</p>
        <dl>
          ${DIMENSIONS.map((dimension) => `
            <div>
              <dt>${dimension.label}</dt>
              <dd>${row[dimension.key]}</dd>
            </div>
          `).join('')}
        </dl>
        <small>代表技能：${topSkill ? escapeHTML(topSkill.name) : '無符合資料'}</small>
      </article>
    `
  }).join('')
}

export function mountVendorBattle(root: HTMLElement): void {
  const skills = skillsInDateRange(store.get())
  const rows = vendorRows(skills)

  root.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">廠商比較</p>
        <h2>平台平均表現</h2>
      </div>
    </div>
    <div class="vendor-grid" data-vendor-cards></div>
    <div class="content-section">
      <div class="chart-frame chart-frame--bar">
        <canvas data-vendor-canvas aria-label="廠商平均分數圖" role="img"></canvas>
      </div>
    </div>
  `

  renderCards(root, rows, skills)

  const canvas = root.querySelector<HTMLCanvasElement>('[data-vendor-canvas]')
  if (canvas) drawVendorBarChart(canvas, rows)
}
