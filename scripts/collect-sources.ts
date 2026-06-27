import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

interface SourceItem {
  vendor: string
  title: string
  url: string
  date: string
}

// 官方且可靠的資料來源 RSS / Blog API
const SOURCE_FEEDS = [
  {
    vendor: 'Gemini',
    name: 'Google AI Blog',
    url: 'https://blog.google/technology/ai/rss/',
    parser: 'rss',
  },
  {
    vendor: 'ChatGPT',
    name: 'OpenAI Blog',
    url: 'https://openai.com/blog/rss.xml',
    parser: 'rss',
  },
]

function cleanText(text: string): string {
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, '')
    .trim()
}

async function fetchRssFeed(url: string, vendor: string): Promise<SourceItem[]> {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const xml = await res.text()

    const items: SourceItem[] = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemContent = match[1]
      const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/)
      const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/)
      const dateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/)

      if (titleMatch && linkMatch) {
        items.push({
          vendor,
          title: cleanText(titleMatch[1]),
          url: cleanText(linkMatch[1]),
          date: dateMatch ? cleanText(dateMatch[1]) : new Date().toISOString(),
        })
      }
    }

    return items.slice(0, 10) // Only keep top 10 latest items
  } catch (error) {
    console.error(`[Error] Failed to fetch feed for ${vendor} from ${url}:`, error)
    return []
  }
}

async function collectSources(): Promise<void> {
  console.log('⏳ Starting data source collection from official feeds...')
  const allItems: SourceItem[] = []

  for (const feed of SOURCE_FEEDS) {
    console.log(`📡 Fetching ${feed.name}...`)
    const items = await fetchRssFeed(feed.url, feed.vendor)
    allItems.push(...items)
  }

  // Save parsed items to a public json folder so it can be committed/viewed in PR
  const outputPath = join(import.meta.dirname, '..', 'data-sources-latest.json')
  let existingItems: SourceItem[] = []

  if (existsSync(outputPath)) {
    try {
      existingItems = JSON.parse(readFileSync(outputPath, 'utf-8'))
    } catch {
      existingItems = []
    }
  }

  // Merge unique items by URL
  const urlSet = new Set(existingItems.map((item) => item.url))
  const newItems = allItems.filter((item) => !urlSet.has(item.url))

  if (newItems.length > 0) {
    console.log(`✨ Found ${newItems.length} new AI releases/articles!`)
    const updatedList = [...newItems, ...existingItems].slice(0, 100) // Keep last 100
    writeFileSync(outputPath, JSON.stringify(updatedList, null, 2), 'utf-8')
    console.log(`💾 Saved updated list to ${outputPath}`)
  } else {
    console.log('✅ No new AI releases found since last scan.')
  }
}

collectSources().catch((err) => {
  console.error('[Fatal Error] Source collection failed:', err)
  process.exit(1)
})
