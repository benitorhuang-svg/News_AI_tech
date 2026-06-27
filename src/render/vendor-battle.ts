import { drawVendorBarChart } from '@/charts/bar-chart'
import type { VendorAverage } from '@/charts/bar-chart'
import { DIMENSIONS, SKILLS, VENDORS, VENDOR_STYLES } from '@/data/skills'
import type { DimensionKey, Skill, Vendor } from '@/data/types'
import { gradeKey } from '@/utils/scoring'

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function averageDimension(skills: Skill[], key: DimensionKey): number {
  return Number(average(skills.map((skill) => skill[key])).toFixed(1))
}

function vendorRows(): VendorAverage[] {
  return VENDORS.map((vendor) => {
    const skills = SKILLS.filter((skill) => skill.vendor === vendor)

    return {
      vendor,
      score: Math.round(average(skills.map((skill) => skill.score))),
      practicality: averageDimension(skills, 'practicality'),
      accessibility: averageDimension(skills, 'accessibility'),
      maturity: averageDimension(skills, 'maturity'),
      uniqueness: averageDimension(skills, 'uniqueness'),
    }
  })
}

function bestSkill(vendor: Vendor): Skill {
  return SKILLS.filter((skill) => skill.vendor === vendor)
    .sort((a, b) => b.score - a.score)[0]
}

function renderCards(root: HTMLElement, rows: VendorAverage[]): void {
  const list = root.querySelector<HTMLElement>('[data-vendor-cards]')
  if (!list) return

  list.innerHTML = rows.map((row) => {
    const vendorSkills = SKILLS.filter((skill) => skill.vendor === row.vendor)
    const aGradeCount = vendorSkills.filter((skill) => gradeKey(skill.score) === 'A').length
    const topSkill = bestSkill(row.vendor)
    const vendorStyle = VENDOR_STYLES[row.vendor]

    return `
      <article class="vendor-card" style="--vendor-color: ${vendorStyle.primary}">
        <div class="vendor-card__top">
          <span>${row.vendor}</span>
          <strong>${row.score}</strong>
        </div>
        <p>${vendorSkills.length} 個技能 · A 級 ${aGradeCount} 個</p>
        <dl>
          ${DIMENSIONS.map((dimension) => (
            `<div><dt>${dimension.label}</dt><dd>${row[dimension.key]}</dd></div>`
          )).join('')}
        </dl>
        <small>代表技能：${topSkill.name}</small>
      </article>
    `
  }).join('')
}

export function mountVendorBattle(root: HTMLElement): void {
  const rows = vendorRows()

  root.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">Vendor Battle</p>
        <h2>廠商對決</h2>
      </div>
    </div>
    <div class="vendor-grid" data-vendor-cards></div>
    <div class="chart-frame chart-frame--bar">
      <canvas data-vendor-canvas aria-label="廠商平均分數圖" role="img"></canvas>
    </div>
  `

  renderCards(root, rows)

  const canvas = root.querySelector<HTMLCanvasElement>('[data-vendor-canvas]')
  if (canvas) drawVendorBarChart(canvas, rows)
}
