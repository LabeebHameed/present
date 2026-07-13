import { describe, expect, it } from 'vitest'
import { classesNeededToReach, classesSafeToMiss, computeStats } from './stats'
import type { ClassRecord } from '../db/types'

type R = Pick<ClassRecord, 'subjectId' | 'status'>

const subjects = [{ id: 'COA' }, { id: 'DBMS' }]

describe('computeStats', () => {
  it('counts present and absent toward the denominator', () => {
    const records: R[] = [
      { subjectId: 'COA', status: 'present' },
      { subjectId: 'COA', status: 'present' },
      { subjectId: 'COA', status: 'absent' },
    ]
    const { overall } = computeStats(records, subjects, 'excluded')
    expect(overall).toMatchObject({ attended: 2, total: 3, percent: (2 / 3) * 100, absentCount: 1 })
  })

  it('excludes cancelled classes from the denominator entirely', () => {
    const records: R[] = [
      { subjectId: 'COA', status: 'present' },
      { subjectId: 'COA', status: 'cancelled' },
      { subjectId: 'COA', status: 'cancelled' },
    ]
    const { overall } = computeStats(records, subjects, 'excluded')
    expect(overall).toMatchObject({ attended: 1, total: 1, percent: 100, cancelledCount: 2 })
  })

  it('excludes holiday-status records from the denominator', () => {
    const records: R[] = [
      { subjectId: 'COA', status: 'present' },
      { subjectId: 'COA', status: 'holiday' },
    ]
    const { overall } = computeStats(records, subjects, 'excluded')
    expect(overall).toMatchObject({ attended: 1, total: 1 })
  })

  it('reports 0% (not NaN) when there are no counted classes', () => {
    const { overall } = computeStats([], subjects, 'excluded')
    expect(overall).toMatchObject({ attended: 0, total: 0, percent: 0 })
  })

  describe('duty leave policies', () => {
    const records: R[] = [
      { subjectId: 'COA', status: 'present' },
      { subjectId: 'COA', status: 'dutyLeave' },
    ]

    it('"present" policy counts duty leave as attended', () => {
      const { overall } = computeStats(records, subjects, 'present')
      expect(overall).toMatchObject({ attended: 2, total: 2, percent: 100, dutyLeaveCount: 1 })
    })

    it('"absent" policy counts duty leave against the student', () => {
      const { overall } = computeStats(records, subjects, 'absent')
      expect(overall).toMatchObject({ attended: 1, total: 2, percent: 50, dutyLeaveCount: 1 })
    })

    it('"excluded" policy removes duty leave from the denominator', () => {
      const { overall } = computeStats(records, subjects, 'excluded')
      expect(overall).toMatchObject({ attended: 1, total: 1, percent: 100, dutyLeaveCount: 1 })
    })
  })

  it('aggregates per-subject stats independently of overall', () => {
    const records: R[] = [
      { subjectId: 'COA', status: 'present' },
      { subjectId: 'COA', status: 'absent' },
      { subjectId: 'DBMS', status: 'present' },
    ]
    const { overall, bySubject } = computeStats(records, subjects, 'excluded')
    expect(overall).toMatchObject({ attended: 2, total: 3 })
    expect(bySubject.COA).toMatchObject({ attended: 1, total: 2 })
    expect(bySubject.DBMS).toMatchObject({ attended: 1, total: 1 })
  })

  it('includes subjects with zero records at 0%, not missing', () => {
    const { bySubject } = computeStats([], subjects, 'excluded')
    expect(bySubject.COA).toMatchObject({ attended: 0, total: 0, percent: 0 })
    expect(bySubject.DBMS).toMatchObject({ attended: 0, total: 0, percent: 0 })
  })

  it('tallies a substituted class under the actually-taught subject, not the scheduled one', () => {
    const records = [
      { subjectId: 'COA', status: 'present' as const, substitution: { actualSubjectId: 'DBMS' } },
      { subjectId: 'COA', status: 'present' as const },
    ]
    const { bySubject } = computeStats(records, subjects, 'excluded')
    expect(bySubject.DBMS).toMatchObject({ attended: 1, total: 1 })
    expect(bySubject.COA).toMatchObject({ attended: 1, total: 1 })
  })

  it('overall stats are unaffected by substitution reassignment', () => {
    const records = [{ subjectId: 'COA', status: 'present' as const, substitution: { actualSubjectId: 'DBMS' } }]
    const { overall } = computeStats(records, subjects, 'excluded')
    expect(overall).toMatchObject({ attended: 1, total: 1 })
  })
})

describe('classesSafeToMiss', () => {
  it('is 0 exactly at the target boundary', () => {
    // 30/40 = 75%, target 75% — missing even one more drops below target
    expect(classesSafeToMiss(30, 40, 75)).toBe(0)
  })

  it('allows missing exactly down to the target boundary', () => {
    // 39/40 = 97.5%; can miss 12 more: 39/52 = 75% exactly
    const n = classesSafeToMiss(39, 40, 75)
    expect(n).toBe(12)
    expect((39 / (40 + n)) * 100).toBeCloseTo(75, 5)
    expect((39 / (40 + n + 1)) * 100).toBeLessThan(75)
  })

  it('is 0 when there are no classes yet', () => {
    expect(classesSafeToMiss(0, 0, 75)).toBe(0)
  })

  it('is 0 when already below target', () => {
    expect(classesSafeToMiss(5, 20, 75)).toBe(0)
  })

  it('is 0 at a 100% target unless every class so far was attended perfectly and none missed', () => {
    expect(classesSafeToMiss(10, 10, 100)).toBe(0)
    expect(classesSafeToMiss(9, 10, 100)).toBe(0)
  })
})

describe('classesNeededToReach', () => {
  it('is 0 when already at or above target', () => {
    expect(classesNeededToReach(30, 40, 75)).toBe(0)
    expect(classesNeededToReach(35, 40, 75)).toBe(0)
  })

  it('computes the minimum consecutive attendance to reach target', () => {
    // 10/40 = 25%, target 75%
    const n = classesNeededToReach(10, 40, 75)
    expect((10 + n) / (40 + n)).toBeGreaterThanOrEqual(0.75)
    expect((10 + n - 1) / (40 + n - 1)).toBeLessThan(0.75)
  })

  it('is 0 for a brand new subject with no classes yet, regardless of target', () => {
    expect(classesNeededToReach(0, 0, 75)).toBe(0)
  })

  it('is infinite at a 100% target once any class has been missed', () => {
    expect(classesNeededToReach(9, 10, 100)).toBe(Number.POSITIVE_INFINITY)
  })

  it('is 0 at a 100% target when already perfect', () => {
    expect(classesNeededToReach(10, 10, 100)).toBe(0)
  })
})
