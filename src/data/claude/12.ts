import type { RawSkill } from '../types'

export const skill: RawSkill = {
  id: 12,
  vendor: 'Claude',
  name: 'Subagents（專門子代理）',
  desc: '針對特定任務的專門代理（如安全稽核）',
  category: 'Agent/自動化',
  useCase: '拆分任務給多個專家代理',
  practicality: 3,
  accessibility: 3,
  maturity: 4,
  uniqueness: 3,
  comment: '概念好，偏開發場景',
  source: 'https://www.anthropic.com/news/claude-3-5-sonnet'
}
