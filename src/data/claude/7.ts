import type { RawSkill } from '../types'

export const skill: RawSkill = {
  id: 7,
  vendor: 'Claude',
  name: 'Plugins（打包 skills/hooks/代理/MCP）',
  desc: '把技能、子代理、MCP 打包成可安裝單元',
  category: 'Agent/自動化',
  useCase: '團隊一鍵部署整套能力',
  practicality: 4,
  accessibility: 4,
  maturity: 4,
  uniqueness: 3,
  comment: '利於規模化複用',
  source: 'https://www.anthropic.com/news/claude-3-5-sonnet'
}
