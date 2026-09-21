import snapshot from '@/../github-trending-snapshot.json'
import type { GitHubRepo, RepoCategory } from '@/data/types'

export const REPO_CATEGORIES: { key: RepoCategory; label: string; color: string }[] = [
  { key: 'agent-framework',  label: 'Agent 框架', color: 'var(--cat-agent)' },
  { key: 'inference-engine', label: '推理引擎',   color: 'var(--cat-inference)' },
  { key: 'dev-tool',         label: '開發工具',   color: 'var(--cat-devtool)' },
  { key: 'foundation-model', label: '基礎模型',   color: 'var(--cat-model)' },
  { key: 'application',      label: '應用層',     color: 'var(--cat-app)' },
]

export const CATEGORY_COLOR_MAP: Record<RepoCategory, string> = {
  'agent-framework':  '#7c3aed',
  'inference-engine': '#0891b2',
  'dev-tool':         '#ea580c',
  'foundation-model': '#2563eb',
  'application':      '#16a34a',
}

export const GITHUB_REPOS: GitHubRepo[] = snapshot as GitHubRepo[]
