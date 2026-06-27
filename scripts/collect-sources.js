import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const SOURCES = [
  { name: 'Google AI Blog', url: 'https://blog.google/technology/ai/' },
  { name: 'Google Developers Blog', url: 'https://developers.googleblog.com/' },
  { name: 'OpenAI Blog', url: 'https://openai.com/news/' },
  { name: 'OpenAI Developers', url: 'https://developers.openai.com/' },
  { name: 'Anthropic News', url: 'https://www.anthropic.com/news' },
  { name: 'Claude Docs', url: 'https://docs.anthropic.com/' },
]

const outputDir = new URL('../source-review/', import.meta.url)
const outputFile = new URL('./latest.json', outputDir)
const itemLimit = 12
const featureKeywords = [
  'agent',
  'ai',
  'api',
  'canvas',
  'chatgpt',
  'claude',
  'codex',
  'connector',
  'deep research',
  'excel',
  'gemini',
  'gpt',
  'memory',
  'model',
  'skill',
  'task',
  'tool',
  'workflow',
]

function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .trim()
}

function normalizeTitle(html) {
  const raw = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? 'Untitled'

  return cleanText(raw)
}

function stripTags(html) {
  return cleanText(html.replace(/<[^>]*>/g, ' '))
}

function extractHref(attrs) {
  return attrs.match(/\shref=(["'])(.*?)\1/i)?.[2]
}

function isFeatureLike(title) {
  const lower = title.toLowerCase()

  return featureKeywords.some((keyword) => lower.includes(keyword))
}

function hashText(text) {
  return createHash('sha256').update(text).digest('hex').slice(0, 16)
}

function extractItems(html, source, previousItemHashes) {
  const items = new Map()
  const anchorPattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi
  let match = anchorPattern.exec(html)

  while (match && items.size < itemLimit) {
    const href = extractHref(match[1])
    const title = stripTags(match[2])

    if (href && title.length >= 12 && title.length <= 140 && isFeatureLike(title)) {
      try {
        const url = new URL(href, source.url)
        url.hash = ''

        if (['http:', 'https:'].includes(url.protocol)) {
          const key = url.toString()
          const hash = hashText(`${title}:${key}`)

          if (!items.has(key)) {
            items.set(key, {
              changed: previousItemHashes.get(key) !== hash,
              hash,
              title,
              url: key,
            })
          }
        }
      } catch {
        // Ignore malformed hrefs from source pages.
      }
    }

    match = anchorPattern.exec(html)
  }

  return Array.from(items.values())
}

async function readPreviousHashes() {
  try {
    const content = await readFile(outputFile, 'utf8')
    const parsed = JSON.parse(content)

    return new Map((parsed.sources ?? []).map((source) => [source.name, source.hash]))
  } catch {
    return new Map()
  }
}

async function readPreviousItemHashes() {
  try {
    const content = await readFile(outputFile, 'utf8')
    const parsed = JSON.parse(content)
    const items = (parsed.sources ?? []).flatMap((source) => source.items ?? [])

    return new Map(items.map((item) => [item.url, item.hash]))
  } catch {
    return new Map()
  }
}

async function collectSource(source, previousHashes, previousItemHashes, checkedAt) {
  try {
    const response = await fetch(source.url, {
      headers: {
        'user-agent': 'ai-skill-value-dashboard-source-checker',
      },
    })
    const html = await response.text()
    const title = normalizeTitle(html)
    const items = extractItems(html, source, previousItemHashes)
    const hash = hashText(`${response.status}:${title}:${items.map((item) => item.hash).join(',')}`)

    return {
      ...source,
      checkedAt,
      changed: previousHashes.get(source.name) !== hash,
      hash,
      items,
      status: response.status,
      title,
    }
  } catch (error) {
    const title = error instanceof Error ? error.message : 'Unknown error'
    const hash = hashText(`error:${title}`)

    return {
      ...source,
      checkedAt,
      changed: previousHashes.get(source.name) !== hash,
      hash,
      items: [],
      status: 'error',
      title,
    }
  }
}

const checkedAt = new Date().toISOString()
const previousHashes = await readPreviousHashes()
const previousItemHashes = await readPreviousItemHashes()
const sources = await Promise.all(
  SOURCES.map((source) => collectSource(source, previousHashes, previousItemHashes, checkedAt)),
)

await mkdir(outputDir, { recursive: true })
await writeFile(
  outputFile,
  `${JSON.stringify({ checkedAt, sources }, null, 2)}\n`,
  'utf8',
)

console.table(sources.map(({ name, status, changed, items, title }) => ({
  name,
  status,
  changed,
  itemCount: items.length,
  title,
})))
