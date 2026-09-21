import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

interface WatchlistEntry {
  repo: string
  category: string
  label: string
}

interface RepoSnapshot {
  repo: string
  label: string
  category: string
  stars: number
  starsWeekly: number
  language: string
  description: string
  topics: string[]
  pushedAt: string
  collectedAt: string
}

interface GitHubApiResponse {
  full_name: string
  stargazers_count: number
  description: string | null
  language: string | null
  topics: string[]
  pushed_at: string
}

const GITHUB_API = 'https://api.github.com'
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || ''
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'ai-skill-dashboard-collector',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (TOKEN) h['Authorization'] = `Bearer ${TOKEN}`
  return h
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithRetry(url: string, attempt = 1): Promise<Response> {
  try {
    const res = await fetch(url, { headers: headers(), signal: AbortSignal.timeout(15000) })
    if (res.status === 403 && attempt <= MAX_RETRIES) {
      console.warn(`⚠️  Rate limited on ${url}, retrying in ${RETRY_DELAY_MS * attempt}ms...`)
      await sleep(RETRY_DELAY_MS * attempt)
      return fetchWithRetry(url, attempt + 1)
    }
    return res
  } catch (err) {
    if (attempt <= MAX_RETRIES) {
      console.warn(`⚠️  Fetch failed for ${url}, retrying (${attempt}/${MAX_RETRIES})...`)
      await sleep(RETRY_DELAY_MS * attempt)
      return fetchWithRetry(url, attempt + 1)
    }
    throw err
  }
}

async function fetchRepoData(repoFullName: string): Promise<GitHubApiResponse | null> {
  try {
    const res = await fetchWithRetry(`${GITHUB_API}/repos/${repoFullName}`)
    if (!res.ok) {
      console.error(`[Error] ${repoFullName}: HTTP ${res.status} ${res.statusText}`)
      return null
    }
    return (await res.json()) as GitHubApiResponse
  } catch (err) {
    console.error(`[Error] Failed to fetch ${repoFullName}:`, err)
    return null
  }
}

async function collectGitHubTrending(): Promise<void> {
  const scriptDir = import.meta.dirname
  const watchlistPath = join(scriptDir, 'github-watchlist.json')
  const snapshotPath = join(scriptDir, '..', 'github-trending-snapshot.json')

  if (!existsSync(watchlistPath)) {
    console.error('[Fatal] github-watchlist.json not found')
    process.exit(1)
  }

  const watchlist: WatchlistEntry[] = JSON.parse(readFileSync(watchlistPath, 'utf-8'))
  console.log(`⏳ Collecting GitHub stars for ${watchlist.length} repositories...`)

  if (!TOKEN) {
    console.warn('⚠️  No GITHUB_TOKEN set — API rate limit is 60 req/hour (unauthenticated)')
  }

  // Load previous snapshot for delta calculation
  let previousSnapshot: RepoSnapshot[] = []
  if (existsSync(snapshotPath)) {
    try {
      previousSnapshot = JSON.parse(readFileSync(snapshotPath, 'utf-8'))
    } catch {
      previousSnapshot = []
    }
  }
  const previousMap = new Map(previousSnapshot.map((r) => [r.repo, r]))

  const collectedAt = new Date().toISOString()
  const results: RepoSnapshot[] = []

  for (const entry of watchlist) {
    console.log(`  📡 ${entry.label} (${entry.repo})...`)
    const data = await fetchRepoData(entry.repo)

    if (data) {
      const prev = previousMap.get(entry.repo)
      const starsWeekly = prev ? data.stargazers_count - prev.stars : 0

      results.push({
        repo: data.full_name,
        label: entry.label,
        category: entry.category,
        stars: data.stargazers_count,
        starsWeekly,
        language: data.language ?? 'Unknown',
        description: data.description ?? '',
        topics: data.topics ?? [],
        pushedAt: data.pushed_at,
        collectedAt,
      })
    }

    // Polite delay between requests
    await sleep(300)
  }

  if (results.length === 0) {
    console.error('[Fatal] No data collected — all API calls failed')
    process.exit(1)
  }

  // Sort by stars descending
  results.sort((a, b) => b.stars - a.stars)

  writeFileSync(snapshotPath, JSON.stringify(results, null, 2), 'utf-8')
  console.log(`\n✅ Collected ${results.length}/${watchlist.length} repos`)
  console.log(`💾 Saved snapshot to ${snapshotPath}`)

  // Summary
  const topMovers = [...results].sort((a, b) => b.starsWeekly - a.starsWeekly).slice(0, 5)
  if (topMovers.some((r) => r.starsWeekly > 0)) {
    console.log('\n🔥 Top movers this period:')
    topMovers.forEach((r) => {
      if (r.starsWeekly > 0) {
        console.log(`   ${r.label}: +${r.starsWeekly} ⭐ (total: ${r.stars.toLocaleString()})`)
      }
    })
  }
}

collectGitHubTrending().catch((err) => {
  console.error('[Fatal Error] GitHub trending collection failed:', err)
  process.exit(1)
})
