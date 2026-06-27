import latestSources from '@/../data-sources-latest.json'
import { drawVendorBarChart } from '@/charts/bar-chart'
import { SKILLS, VENDORS, VENDOR_STYLES } from '@/data/skills'
import type { Vendor } from '@/data/types'
import { skillsInDateRange } from '@/render/leaderboard-utils'
import { store } from '@/state/store'
import { gradeKey } from '@/utils/scoring'
import { escapeHTML, qs } from '@/utils/dom'

function average(values: number[]): number {
  return values.length
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : 0
}

function getVendorAverages(skills = SKILLS) {
  return VENDORS.map((vendor) => {
    const vendorSkills = skills.filter((skill) => skill.vendor === vendor)

    return {
      vendor,
      score: average(vendorSkills.map((skill) => skill.score)),
      practicality: average(vendorSkills.map((skill) => skill.practicality)),
      accessibility: average(vendorSkills.map((skill) => skill.accessibility)),
      maturity: average(vendorSkills.map((skill) => skill.maturity)),
      uniqueness: average(vendorSkills.map((skill) => skill.uniqueness)),
    }
  })
}

function metric(label: string, value: string | number, note: string): string {
  return `
    <article class="metric-card">
      <span class="metric-card__label">${label}</span>
      <strong>${value}</strong>
      <small>${note}</small>
    </article>
  `
}

function sourceRows(): string {
  return latestSources.slice(0, 4).map((source) => {
    const vendor = source.vendor as Vendor
    const color = VENDOR_STYLES[vendor].primary
    const date = source.date.split(' ').slice(1, 4).join(' ')

    return `
      <article class="source-item">
        <div>
          <span class="vendor-badge" style="--vendor-color: ${color}">
            ${vendor}
          </span>
          <small>${date}</small>
        </div>
        <strong class="source-item__title">${escapeHTML(source.title)}</strong>
        <a href="${source.url}" target="_blank" rel="noopener">查看來源</a>
      </article>
    `
  }).join('')
}

export function renderOverview(root: HTMLElement): void {
  const skills = skillsInDateRange(store.get())
  const topSkill = [...skills].sort((a, b) => b.score - a.score)[0]
  const avgScore = average(skills.map((skill) => skill.score))
  const aGradeCount = skills.filter((skill) => gradeKey(skill.score) === 'A').length
  const leadingVendor = getVendorAverages(skills).sort((a, b) => b.score - a.score)[0]
  const topSkillSummary = topSkill
    ? `${topSkill.vendor} · ${topSkill.score} 分 · ${topSkill.grade} · ${escapeHTML(topSkill.comment)}`
    : '目前日期區間沒有資料'

  root.innerHTML = `
    <div class="hero">
      <div class="hero__content">
        <p class="eyebrow">總覽</p>
        <h1>技能應用含金量評分</h1>
        <p class="hero__lead">
          以一般知識工作者的日常工作流為基準，從實用度、落地門檻、成熟度與獨特性比較三個平台的技能價值。
        </p>
        <div class="insight-strip" aria-label="評分方法摘要">
          <span>50 項技能</span>
          <span>4 個評分維度</span>
          <span>人工審閱後上榜</span>
        </div>

        <div class="hero__stats" aria-label="總覽指標">
          ${metric('評估技能數', skills.length, `共 ${SKILLS.length} 筆資料`)}
          ${metric('全體平均分', avgScore, '滿分 100')}
          ${metric('A 級技能', aGradeCount, '優先學習清單')}
          ${metric('目前領先', leadingVendor.vendor, `${leadingVendor.score} 分平均`)}
        </div>

        <div class="content-section--split overview-grid">
          <section>
            <div class="section-heading">
              <div>
                <p class="eyebrow">平均分</p>
                <h2>廠商比較</h2>
              </div>
            </div>
            <div class="chart-frame chart-frame--bar">
              <canvas id="overview-bar-canvas" aria-label="廠商平均分數圖" role="img"></canvas>
            </div>
            <div class="hero__highlight">
              <span>最高分技能</span>
              <strong>${topSkill ? escapeHTML(topSkill.name) : '無符合資料'}</strong>
              <small>${topSkillSummary}</small>
            </div>
          </section>

          <section>
            <div class="section-heading">
              <div>
                <p class="eyebrow">來源追蹤</p>
                <h2>近期更新</h2>
              </div>
            </div>
            <div class="summary-list">
              ${sourceRows()}
            </div>
          </section>
        </div>
      </div>
    </div>
  `

  drawVendorBarChart(qs<HTMLCanvasElement>('#overview-bar-canvas'), getVendorAverages(skills))
}
