import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

const INPUT_FILE = process.env.SOURCE_REVIEW_FILE
  ? pathToFileURL(resolve(process.env.SOURCE_REVIEW_FILE))
  : new URL('../source-review/latest.json', import.meta.url)
const OUTPUT_DIR = process.env.SCORING_REVIEW_DIR
  ? pathToFileURL(`${resolve(process.env.SCORING_REVIEW_DIR)}${sep}`)
  : new URL('../scoring-review/', import.meta.url)
const OUTPUT_FILE = new URL('./candidates.json', OUTPUT_DIR)
const RUBRIC_VERSION = '2026-06-27.v1'
const WEIGHTS = {
  practicality: 8,
  accessibility: 5,
  maturity: 4,
  uniqueness: 3,
}

function hashText(text) {
  return createHash('sha256').update(text).digest('hex').slice(0, 12)
}

function clampScore(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return 1

  return Math.max(1, Math.min(5, Math.round(number)))
}

function computeScore(scores) {
  return Object.entries(WEIGHTS).reduce((sum, [key, weight]) => {
    return sum + clampScore(scores[key]) * weight
  }, 0)
}

function computeGrade(score) {
  if (score >= 80) return 'A 乾貨'
  if (score >= 65) return 'B 不錯'
  if (score >= 50) return 'C 普通'
  return '退件'
}

async function readSourceReview() {
  try {
    const content = await readFile(INPUT_FILE, 'utf8')

    return JSON.parse(content.replace(/^\uFEFF/, ''))
  } catch {
    return { checkedAt: null, sources: [] }
  }
}

function inferVendor(text) {
  const lower = text.toLowerCase()
  if (lower.includes('openai') || lower.includes('chatgpt') || lower.includes('gpt')) return 'ChatGPT'
  if (lower.includes('anthropic') || lower.includes('claude')) return 'Claude'
  if (lower.includes('google') || lower.includes('gemini')) return 'Gemini'
  return 'ChatGPT'
}

function inferEvidenceLevel(sourceName, url) {
  const lower = `${sourceName} ${url}`.toLowerCase()
  if (lower.includes('docs.') || lower.includes('developers.')) return 'official-doc'
  if (lower.includes('blog.') || lower.includes('/news')) return 'official-blog'
  return 'trusted-media'
}

function keywordScore(text, keywords, fallback, hitScore) {
  const lower = text.toLowerCase()

  return keywords.some((keyword) => lower.includes(keyword)) ? hitScore : fallback
}

function inferScores(title, evidenceLevel) {
  const lower = title.toLowerCase()
  const practicality = keywordScore(
    lower,
    ['agent', 'workflow', 'connector', 'excel', 'tasks', 'deep research', 'canvas', 'memory'],
    3,
    4,
  )
  const accessibility = keywordScore(
    lower,
    ['api', 'sdk', 'developer', 'codex', 'mcp', 'enterprise'],
    4,
    3,
  )
  let maturity = evidenceLevel === 'official-doc' ? 4 : 3
  if (lower.includes('ga') || lower.includes('available') || lower.includes('launch')) maturity += 1
  if (lower.includes('preview') || lower.includes('beta') || lower.includes('research')) maturity -= 1
  const uniqueness = keywordScore(
    lower,
    ['agent', 'multi-agent', 'deep research', 'mcp', 'memory', 'orchestration'],
    3,
    4,
  )

  return {
    practicality,
    accessibility,
    maturity: clampScore(maturity),
    uniqueness,
  }
}

function trimSkillName(title) {
  return title
    .replace(/\s+[|-]\s+(OpenAI|Anthropic|Google|Claude|Gemini).*$/i, '')
    .replace(/^(Introducing|Announcing|Launching|New)\s+/i, '')
    .trim()
    .slice(0, 96)
}

function collectReviewItems(sourceReview) {
  const items = []

  for (const source of sourceReview.sources ?? []) {
    const sourceItems = source.items?.length
      ? source.items.filter((item) => item.changed)
      : []

    if (!sourceItems.length && source.changed) {
      sourceItems.push({
        changed: true,
        title: source.title,
        url: source.url,
      })
    }

    for (const item of sourceItems) {
      items.push({
        checkedAt: source.checkedAt,
        sourceName: source.name,
        status: source.status,
        title: item.title,
        url: item.url,
      })
    }
  }

  return items.slice(0, 24)
}

function toRuleCandidate(item) {
  const evidenceLevel = inferEvidenceLevel(item.sourceName, item.url)
  const vendor = inferVendor(`${item.sourceName} ${item.title} ${item.url}`)
  const scores = inferScores(item.title, evidenceLevel)
  const totalScore = computeScore(scores)
  const riskFlags = ['needs-human-review', 'rule-based-agent']

  if (evidenceLevel !== 'official-doc') riskFlags.push('confirm-product-availability')

  return {
    id: hashText(`${item.sourceName}:${item.url}:${item.title}`),
    proposedAction: 'review-new-or-updated-skill',
    vendor,
    skillName: trimSkillName(item.title),
    evidenceLevel,
    evidence: [
      {
        checkedAt: item.checkedAt,
        sourceName: item.sourceName,
        status: item.status,
        title: item.title,
        url: item.url,
      },
    ],
    scores,
    totalScore,
    grade: computeGrade(totalScore),
    confidence: 0.58,
    humanReviewRequired: true,
    reasons: [
      '規則型 agent 只能依來源標題與 URL 初評。',
      '正式上榜前需人工確認功能可用性、方案限制與地區限制。',
    ],
    riskFlags,
  }
}

function normalizeCandidate(candidate, item, mode) {
  const scores = {
    practicality: clampScore(candidate.scores?.practicality),
    accessibility: clampScore(candidate.scores?.accessibility),
    maturity: clampScore(candidate.scores?.maturity),
    uniqueness: clampScore(candidate.scores?.uniqueness),
  }
  const totalScore = computeScore(scores)
  const evidence = Array.isArray(candidate.evidence) && candidate.evidence.length
    ? candidate.evidence
    : [{
      checkedAt: item.checkedAt,
      sourceName: item.sourceName,
      status: item.status,
      title: item.title,
      url: item.url,
    }]
  const riskFlags = new Set(candidate.riskFlags ?? [])

  riskFlags.add('needs-human-review')
  if (mode !== 'openai') riskFlags.add('rule-based-agent')

  return {
    id: candidate.id ?? hashText(`${item.sourceName}:${item.url}:${candidate.skillName ?? item.title}`),
    proposedAction: candidate.proposedAction ?? 'review-new-or-updated-skill',
    vendor: candidate.vendor ?? inferVendor(`${item.sourceName} ${item.title}`),
    skillName: trimSkillName(candidate.skillName ?? item.title),
    evidenceLevel: candidate.evidenceLevel ?? inferEvidenceLevel(item.sourceName, item.url),
    evidence,
    scores,
    totalScore,
    grade: computeGrade(totalScore),
    confidence: Math.max(0, Math.min(1, Number(candidate.confidence ?? 0.5))),
    humanReviewRequired: true,
    reasons: Array.isArray(candidate.reasons) ? candidate.reasons.slice(0, 4) : [],
    riskFlags: Array.from(riskFlags),
  }
}

function buildAgentPrompt(items) {
  return [
    '你是 AI 技能含金量評分 agent。請只輸出 JSON，不要 Markdown。',
    '根據 evidence title/url/sourceName，為每個候選技能提出初評。',
    '分數只能是 1-5。成熟度不能只因新聞稿就給 5。',
    '所有候選都必須 humanReviewRequired=true，且低信心要加 needs-human-review。',
    'JSON schema: {"candidates":[{"vendor":"Gemini|ChatGPT|Claude","skillName":"string","proposedAction":"review-new-or-updated-skill","evidenceLevel":"official-doc|official-blog|trusted-media|rumor","scores":{"practicality":1,"accessibility":1,"maturity":1,"uniqueness":1},"confidence":0.0,"reasons":["string"],"riskFlags":["needs-human-review"]}]}',
    `Rubric version: ${RUBRIC_VERSION}`,
    `Evidence items: ${JSON.stringify(items, null, 2)}`,
  ].join('\n\n')
}

function extractOutputText(responseJson) {
  if (typeof responseJson.output_text === 'string') return responseJson.output_text

  for (const output of responseJson.output ?? []) {
    for (const content of output.content ?? []) {
      if (content.type === 'output_text' && typeof content.text === 'string') return content.text
    }
  }

  return ''
}

async function scoreWithOpenAI(items) {
  const model = process.env.SCORING_AGENT_MODEL
  const apiKey = process.env.OPENAI_API_KEY
  if (!model || !apiKey) return null

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      input: buildAgentPrompt(items),
      max_output_tokens: 4000,
      model,
      store: false,
      tool_choice: 'none',
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI scoring failed: ${response.status} ${await response.text()}`)
  }

  const text = extractOutputText(await response.json())
  return JSON.parse(text)
}

async function buildCandidates() {
  const sourceReview = await readSourceReview()
  const items = collectReviewItems(sourceReview)
  let mode = 'rules'
  let rawCandidates = items.map(toRuleCandidate)

  if (items.length && process.env.OPENAI_API_KEY && process.env.SCORING_AGENT_MODEL) {
    mode = 'openai'
    const aiResult = await scoreWithOpenAI(items)
    rawCandidates = (aiResult?.candidates ?? []).map((candidate, index) => {
      return normalizeCandidate(candidate, items[index] ?? items[0], mode)
    })
  }

  return {
    generatedAt: new Date().toISOString(),
    agent: {
      mode,
      model: mode === 'openai' ? process.env.SCORING_AGENT_MODEL : 'rules-v1',
      rubricVersion: RUBRIC_VERSION,
    },
    sourceReviewCheckedAt: sourceReview.checkedAt,
    candidates: rawCandidates,
  }
}

const output = await buildCandidates()

await mkdir(OUTPUT_DIR, { recursive: true })
await writeFile(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`, 'utf8')

console.table(output.candidates.map((candidate) => ({
  vendor: candidate.vendor,
  skillName: candidate.skillName,
  totalScore: candidate.totalScore,
  grade: candidate.grade,
  confidence: candidate.confidence,
})))
