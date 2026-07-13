import { describe, expect, it } from 'vitest'
import { weeklyTrend } from './trend'

const subjects = [{ id: 'COA' }]

describe('weeklyTrend', () => {
  it('buckets records into Monday-start weeks and computes each week percent', () => {
    // 2026-07-13 is a Monday, 2026-07-20 is the next Monday
    const records = [
      { subjectId: 'COA', status: 'present' as const, date: '2026-07-13' },
      { subjectId: 'COA', status: 'absent' as const, date: '2026-07-14' },
      { subjectId: 'COA', status: 'present' as const, date: '2026-07-20' },
    ]
    const buckets = weeklyTrend(records, subjects, 'excluded')
    expect(buckets).toEqual([
      { weekStart: '2026-07-13', attended: 1, total: 2, percent: 50 },
      { weekStart: '2026-07-20', attended: 1, total: 1, percent: 100 },
    ])
  })

  it('sorts buckets chronologically regardless of input order', () => {
    const records = [
      { subjectId: 'COA', status: 'present' as const, date: '2026-07-20' },
      { subjectId: 'COA', status: 'present' as const, date: '2026-07-06' },
    ]
    const buckets = weeklyTrend(records, subjects, 'excluded')
    expect(buckets.map((b) => b.weekStart)).toEqual(['2026-07-06', '2026-07-20'])
  })

  it('excludes weeks where nothing counts toward the denominator', () => {
    const records = [{ subjectId: 'COA', status: 'cancelled' as const, date: '2026-07-13' }]
    expect(weeklyTrend(records, subjects, 'excluded')).toEqual([])
  })

  it('returns an empty array for no records', () => {
    expect(weeklyTrend([], subjects, 'excluded')).toEqual([])
  })
})
