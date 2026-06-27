import type { RawSkill } from '../types'

export const skill: RawSkill = {
  id: 9,
  vendor: 'Claude',
  name: 'Outcomes（評分代理自動重跑）',
  desc: '獨立評分代理依評分表打分，不合格自動退回重做',
  category: '品質控管',
  useCase: '確保自動產出的品質、降低錯誤',
  practicality: 4,
  accessibility: 3,
  maturity: 3,
  uniqueness: 4,
  comment: '自動把關品質',
  source: 'https://www.anthropic.com/news/claude-3-5-sonnet'
}
