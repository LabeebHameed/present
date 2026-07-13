import { describe, expect, it } from 'vitest'
import { simulate } from './simulate'
import type { ClassRecord } from '../db/types'

type R = Pick<ClassRecord, 'subjectId' | 'status'>

const subjects = [{ id: 'COA' }]

describe('simulate', () => {
  it('lowers the percentage when simulating a skip', () => {
    const records: R[] = [
      { subjectId: 'COA', status: 'present' },
      { subjectId: 'COA', status: 'present' },
      { subjectId: 'COA', status: 'present' },
    ]
    const before = 100
    const { overall } = simulate(records, subjects, 'excluded', [{ type: 'skip', subjectId: 'COA' }])
    expect(overall.percent).toBeLessThan(before)
    expect(overall).toMatchObject({ attended: 3, total: 4 })
  })

  it('raises the percentage when simulating extra attended classes', () => {
    const records: R[] = [
      { subjectId: 'COA', status: 'present' },
      { subjectId: 'COA', status: 'absent' },
      { subjectId: 'COA', status: 'absent' },
      { subjectId: 'COA', status: 'absent' },
    ]
    const { overall } = simulate(records, subjects, 'excluded', [{ type: 'attend', subjectId: 'COA', count: 2 }])
    expect(overall).toMatchObject({ attended: 3, total: 6 })
  })

  it('applies a count of more than one event', () => {
    const { overall } = simulate([], subjects, 'excluded', [{ type: 'skip', subjectId: 'COA', count: 3 }])
    expect(overall).toMatchObject({ attended: 0, total: 3 })
  })

  it('does not mutate the original records array', () => {
    const records: R[] = [{ subjectId: 'COA', status: 'present' }]
    const snapshot = [...records]
    simulate(records, subjects, 'excluded', [{ type: 'skip', subjectId: 'COA', count: 5 }])
    expect(records).toEqual(snapshot)
  })

  it('returns the same stats as no-op when given no events', () => {
    const records: R[] = [
      { subjectId: 'COA', status: 'present' },
      { subjectId: 'COA', status: 'absent' },
    ]
    const { overall } = simulate(records, subjects, 'excluded', [])
    expect(overall).toMatchObject({ attended: 1, total: 2 })
  })
})
