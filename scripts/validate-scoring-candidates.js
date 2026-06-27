import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

const OUTPUT_DIR = process.env.SCORING_REVIEW_DIR
  ? pathToFileURL(`${resolve(process.env.SCORING_REVIEW_DIR)}${sep}`)
  : new URL('../scoring-review/', import.meta.url)
const INPUT_FILE = new URL('./candidates.json', OUTPUT_DIR)
const OUTPUT_FILE = new URL('./validation.json', OUTPUT_DIR)
const WEIGHTS = {
  practicality: 8,
  accessibility: 5,
  maturity: 4,
  uniqueness: 3,
}
const DIMENSIONS = Object.keys(WEIGHTS)
const EVIDENCE_LEVELS = new Set(['official-doc', 'official-blog', 'trusted-media', 'rumor'])
const VENDORS = new Set(['Gemini', 'ChatGPT', 'Claude'])

function computeScore(scores) {
  return DIMENSIONS.reduce((sum, key) => sum + scores[key] * WEIGHTS[key], 0)
}

function computeGrade(score) {
  if (score >= 80) return 'A 乾貨'
  if (score >= 65) return 'B 不錯'
  if (score >= 50) return 'C 普通'
  return '退件'
}

function isUrl(value) {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}

function validateCandidate(candidate, index) {
  const path = `candidates[${index}]`
  const errors = []
  const warnings = []

  if (!candidate.id) errors.push(`${path}.id is required`)
  if (!VENDORS.has(candidate.vendor)) errors.push(`${path}.vendor must be Gemini, ChatGPT, or Claude`)
  if (!candidate.skillName) errors.push(`${path}.skillName is required`)
  if (!EVIDENCE_LEVELS.has(candidate.evidenceLevel)) errors.push(`${path}.evidenceLevel is invalid`)
  if (candidate.humanReviewRequired !== true) errors.push(`${path}.humanReviewRequired must be true`)

  for (const key of DIMENSIONS) {
    const value = candidate.scores?.[key]
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      errors.push(`${path}.scores.${key} must be an integer from 1 to 5`)
    }
  }

  if (!Array.isArray(candidate.evidence) || !candidate.evidence.length) {
    errors.push(`${path}.evidence must include at least one source`)
  } else {
    candidate.evidence.forEach((evidence, evidenceIndex) => {
      if (!isUrl(evidence.url)) {
        errors.push(`${path}.evidence[${evidenceIndex}].url must be an http(s) URL`)
      }
    })
  }

  const expectedScore = computeScore(candidate.scores ?? {})
  if (candidate.totalScore !== expectedScore) {
    errors.push(`${path}.totalScore must equal ${expectedScore}`)
  }

  const expectedGrade = computeGrade(expectedScore)
  if (candidate.grade !== expectedGrade) {
    errors.push(`${path}.grade must equal ${expectedGrade}`)
  }

  if (typeof candidate.confidence !== 'number' || candidate.confidence < 0 || candidate.confidence > 1) {
    errors.push(`${path}.confidence must be a number from 0 to 1`)
  }

  const riskFlags = new Set(candidate.riskFlags ?? [])
  if (candidate.confidence < 0.75 && !riskFlags.has('needs-human-review')) {
    errors.push(`${path} has low confidence and must include needs-human-review`)
  }

  if (candidate.evidenceLevel === 'trusted-media' && candidate.scores?.maturity > 4) {
    errors.push(`${path} trusted-media maturity cannot exceed 4`)
  }

  if (candidate.evidenceLevel === 'rumor' && candidate.scores?.maturity > 2) {
    errors.push(`${path} rumor maturity cannot exceed 2`)
  }

  if (candidate.totalScore >= 80 && !['official-doc', 'official-blog'].includes(candidate.evidenceLevel)) {
    warnings.push(`${path} is A-grade without official evidence; keep manual review`)
  }

  if (!Array.isArray(candidate.reasons) || !candidate.reasons.length) {
    warnings.push(`${path}.reasons is empty`)
  }

  return { errors, warnings }
}

async function readCandidates() {
  try {
    const content = await readFile(INPUT_FILE, 'utf8')

    return JSON.parse(content.replace(/^\uFEFF/, ''))
  } catch {
    return { generatedAt: null, agent: null, candidates: [] }
  }
}

const payload = await readCandidates()
const results = (payload.candidates ?? []).map(validateCandidate)
const errors = results.flatMap((result) => result.errors)
const warnings = results.flatMap((result) => result.warnings)
const validation = {
  checkedAt: new Date().toISOString(),
  ok: errors.length === 0,
  candidateCount: payload.candidates?.length ?? 0,
  errors,
  warnings,
}

await mkdir(OUTPUT_DIR, { recursive: true })
await writeFile(OUTPUT_FILE, `${JSON.stringify(validation, null, 2)}\n`, 'utf8')

if (errors.length) {
  console.error(JSON.stringify(validation, null, 2))
  process.exit(1)
}

console.log(JSON.stringify(validation, null, 2))
