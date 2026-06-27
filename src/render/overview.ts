import latestSources from '@/../data-sources-latest.json'
import { drawVendorBarChart } from '@/charts/bar-chart'
import { SKILLS, VENDORS } from '@/data/skills'
import { gradeKey } from '@/utils/scoring'
import { qs } from '@/utils/dom'

function average(values: number[]): number {
  return values.length
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : 0
}

function getVendorAverages() {
  return VENDORS.map((vendor) => {
    const vendorSkills = SKILLS.filter((skill) => skill.vendor === vendor)
    const scores = vendorSkills.map((skill) => skill.score)
    const practicality = vendorSkills.map((skill) => skill.practicality)
    const accessibility = vendorSkills.map((skill) => skill.accessibility)
    const maturity = vendorSkills.map((skill) => skill.maturity)
    const uniqueness = vendorSkills.map((skill) => skill.uniqueness)

    return {
      vendor,
      score: average(scores),
      practicality: Number((average(practicality)).toFixed(1)),
      accessibility: Number((average(accessibility)).toFixed(1)),
      maturity: Number((average(maturity)).toFixed(1)),
      uniqueness: Number((average(uniqueness)).toFixed(1)),
    }
  })
}

export function renderOverview(root: HTMLElement): void {
  const topSkill = [...SKILLS].sort((a, b) => b.score - a.score)[0]
  const avgScore = average(SKILLS.map((skill) => skill.score))
  const aGradeCount = SKILLS.filter((skill) => gradeKey(skill.score) === 'A').length
  const leadingVendor = getVendorAverages().sort((a, b) => b.score - a.score)[0]

  root.innerHTML = `
    <div class="hero">
      <div class="hero__content">
        <p class="eyebrow">Executive Summary</p>
        <h1 style="font-size: 2.2rem; font-weight: 800; color: var(--color-text); margin-bottom: 0.5rem;">AI 技能應用含金量評分</h1>
        <p class="hero__lead" style="margin-bottom: 1.5rem;">
          本儀表板以「一般上班族工作流實用度」為評估核心，採用四維權衡公式（實用度×8 + 落地門檻×5 + 成熟度×4 + 獨特性×3），多維解析 Gemini、ChatGPT、Claude 三大平台共計 50 項最新釋出技能。
        </p>

        <div class="hero__stats" aria-label="總覽指標" style="margin-bottom: 2rem;">
          <article class="metric-card">
            <span class="metric-card__label">評估技能數</span>
            <strong>${SKILLS.length}</strong>
          </article>
          <article class="metric-card">
            <span class="metric-card__label">全體平均分</span>
            <strong>${avgScore}</strong>
          </article>
          <article class="metric-card">
            <span class="metric-card__label">頂級乾貨 (A級)</span>
            <strong>${aGradeCount}</strong>
          </article>
          <article class="metric-card">
            <span class="metric-card__label">領先品牌</span>
            <strong>${leadingVendor.vendor}</strong>
          </article>
        </div>

        <div class="content-section--split" style="gap: 2rem;">
          <div>
            <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--color-text); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
              <span style="width: 3px; height: 1.1em; background: var(--vendor-gemini); display: inline-block; border-radius: 2px;"></span>
              廠商含金量平均分對比
            </h3>
            <div class="chart-frame chart-frame--bar" style="height: 280px; padding: 1rem;">
              <canvas id="overview-bar-canvas" aria-label="廠商平均分數圖" role="img"></canvas>
            </div>
            <div class="hero__highlight" style="width: 100%; margin-top: 1rem;">
              <span>最高分技能高亮</span>
              <strong>${topSkill.name}</strong>
              <small>${topSkill.vendor} · ${topSkill.score} 分 · ${topSkill.grade} · ${topSkill.comment}</small>
            </div>
          </div>

          <div>
            <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--color-text); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
              <span style="width: 3px; height: 1.1em; background: var(--vendor-chatgpt); display: inline-block; border-radius: 2px;"></span>
              最新發布情報速遞 (GitHub Actions 自動監控)
            </h3>
            <div style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 380px; overflow-y: auto; padding-right: 0.25rem;">
              ${latestSources.slice(0, 4).map((source) => `
                <article class="source-item" style="padding: 0.75rem 1rem; border-radius: var(--radius-sm);">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="vendor-badge" style="--vendor-color: ${source.vendor === 'Gemini' ? 'var(--vendor-gemini)' : 'var(--vendor-chatgpt)'}">
                      ${source.vendor}
                    </span>
                    <small style="color: var(--color-muted); font-size: 0.75rem;">
                      ${source.date.split(' ').slice(1, 4).join(' ')}
                    </small>
                  </div>
                  <strong style="font-size: 0.85rem; font-weight: 700; color: var(--color-text); margin-top: 0.35rem; line-height: 1.4; display: block;">
                    ${source.title}
                  </strong>
                  <a href="${source.url}" target="_blank" rel="noopener" style="font-size: 0.75rem; color: var(--vendor-gemini); margin-top: 0.25rem; display: inline-block;">
                    閱讀官方發布說明 →
                  </a>
                </article>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  const canvas = qs<HTMLCanvasElement>('#overview-bar-canvas')
  const rows = getVendorAverages()
  drawVendorBarChart(canvas, rows)
}
