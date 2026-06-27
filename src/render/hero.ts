import { GRADES, SKILLS, VENDORS } from '@/data/skills'
import { gradeKey } from '@/utils/scoring'

function average(values: number[]): number {
  return values.length
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : 0
}

export function renderHero(root: HTMLElement): void {
  const topSkill = [...SKILLS].sort((a, b) => b.score - a.score)[0]
  const avgScore = average(SKILLS.map((skill) => skill.score))
  const aGradeCount = SKILLS.filter((skill) => gradeKey(skill.score) === 'A').length
  const leadingVendor = VENDORS.map((vendor) => {
    const vendorSkills = SKILLS.filter((skill) => skill.vendor === vendor)
    return {
      vendor,
      score: average(vendorSkills.map((skill) => skill.score)),
    }
  }).sort((a, b) => b.score - a.score)[0]

  root.innerHTML = `
    <div class="hero__content">
      <p class="eyebrow">AI Skill Value Index</p>
      <h1>AI 技能含金量評分 Dashboard</h1>
      <p class="hero__lead">
        以「一般上班族工作流實用度」為主，從實用度、落地門檻、成熟度與獨特性四大維度，系統化評估與比較 Gemini、ChatGPT、Claude 最新釋出的 50 項技能。
      </p>
      <div class="hero__stats" aria-label="總覽指標">
        <article class="metric-card">
          <span class="metric-card__label">技能數</span>
          <strong>${SKILLS.length}</strong>
        </article>
        <article class="metric-card">
          <span class="metric-card__label">平均分</span>
          <strong>${avgScore}</strong>
        </article>
        <article class="metric-card">
          <span class="metric-card__label">${GRADES[0].label}</span>
          <strong>${aGradeCount}</strong>
        </article>
        <article class="metric-card">
          <span class="metric-card__label">領先廠商</span>
          <strong>${leadingVendor.vendor}</strong>
        </article>
      </div>
      <div class="hero__highlight">
        <span>最高分技能</span>
        <strong>${topSkill.name}</strong>
        <small>${topSkill.vendor} · ${topSkill.score} 分 · ${topSkill.grade}</small>
      </div>
    </div>
  `
}
