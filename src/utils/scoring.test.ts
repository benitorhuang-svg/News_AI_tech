import { describe, it, expect } from 'vitest'
import { computeScore, computeGrade, gradeKey } from './scoring'

describe('Scoring Utilities', () => {
  it('computes the weighted score correctly', () => {
    // practicality * 8 + accessibility * 5 + maturity * 4 + uniqueness * 3
    // max = 40 + 25 + 20 + 15 = 100
    expect(computeScore(5, 5, 5, 5)).toBe(100)
    expect(computeScore(0, 0, 0, 0)).toBe(0)
    expect(computeScore(3, 4, 2, 5)).toBe(3 * 8 + 4 * 5 + 2 * 4 + 5 * 3)
  })

  it('assigns the correct grade key', () => {
    expect(gradeKey(100)).toBe('A')
    expect(gradeKey(80)).toBe('A')
    expect(gradeKey(79)).toBe('B')
    expect(gradeKey(65)).toBe('B')
    expect(gradeKey(64)).toBe('C')
    expect(gradeKey(50)).toBe('C')
    expect(gradeKey(49)).toBe('D')
    expect(gradeKey(0)).toBe('D')
  })

  it('returns the correct grade label', () => {
    expect(computeGrade(85)).toBe('A 乾貨')
    expect(computeGrade(30)).toBe('退件')
  })
})
