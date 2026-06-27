import type { RawSkill } from '../types'

export const skill: RawSkill = {
  id: 10,
  vendor: 'Claude',
  name: 'Claude in Chrome',
  desc: '在 Chrome 內操作網頁（Max 方案 beta）',
  category: 'Agent/自動化',
  useCase: '網頁操作、查資料自動化',
  practicality: 4,
  accessibility: 3,
  maturity: 3,
  uniqueness: 3,
  comment: '實用但 beta、限 Max',
  source: 'https://www.anthropic.com/news/claude-3-5-sonnet'
}
