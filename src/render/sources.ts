import { SKILLS } from '@/data/skills'

interface SourceGroup {
  source: string
  count: number
  vendors: string[]
}

function sourceGroups(): SourceGroup[] {
  const groups = new Map<string, Set<string>>()

  SKILLS.forEach((skill) => {
    if (!groups.has(skill.source)) groups.set(skill.source, new Set())
    groups.get(skill.source)?.add(skill.vendor)
  })

  return Array.from(groups.entries())
    .map(([source, vendors]) => ({
      source,
      vendors: Array.from(vendors),
      count: SKILLS.filter((skill) => skill.source === source).length,
    }))
    .sort((a, b) => b.count - a.count)
}

export function renderSources(root: HTMLElement): void {
  const rows = sourceGroups()

  root.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">Sources</p>
        <h2>資料來源與更新</h2>
      </div>
    </div>
    <div class="source-layout">
      <div class="source-note">
        <strong>更新策略</strong>
        <p>每週以 GitHub Actions 掃描官方發布來源，保留標題、日期與連結，後續人工審閱再進入正式評分資料。</p>
      </div>
      <div class="source-list">
        ${rows.map((row) => `
          <article class="source-item">
            <span>${row.source}</span>
            <strong>${row.count}</strong>
            <small>${row.vendors.join('、')}</small>
          </article>
        `).join('')}
      </div>
    </div>
  `
}
