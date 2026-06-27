import type { DimensionKey, GradeKey } from '@/data/types'

const WEIGHTS: Record<DimensionKey, number> = {
  practicality: 8,
  accessibility: 5,
  maturity: 4,
  uniqueness: 3,
}

export const DIMENSION_KEYS: DimensionKey[] = [
  'practicality',
  'accessibility',
  'maturity',
  'uniqueness',
]

export function computeScore(
  p: number,
  a: number,
  m: number,
  u: number,
): number {
  return p * WEIGHTS.practicality
    + a * WEIGHTS.accessibility
    + m * WEIGHTS.maturity
    + u * WEIGHTS.uniqueness
}

export function computeGrade(score: number): string {
  if (score >= 80) return 'A 乾貨'
  if (score >= 65) return 'B 不錯'
  if (score >= 50) return 'C 普通'
  return '退件'
}

export function gradeKey(score: number): GradeKey {
  if (score >= 80) return 'A'
  if (score >= 65) return 'B'
  if (score >= 50) return 'C'
  return 'D'
}
