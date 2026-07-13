import { describe, expect, it } from 'vitest'
import { predictAttendance } from './predict'
import type { ClassRecord, Semester, TimetableSlot } from '../db/types'

type R = Pick<ClassRecord, 'subjectId' | 'status'>

const semester: Pick<Semester, 'startDate' | 'endDate' | 'workingSaturdays'> = {
  startDate: '2026-07-01',
  endDate: '2026-07-31',
  workingSaturdays: {},
}

// Monday 2026-07-13 through Sunday 2026-07-19
const slots: TimetableSlot[] = [
  { id: 's1', semesterId: 'sem1', dayOfWeek: 1, periodIndex: 1, startTime: '09:00', endTime: '10:00', subjectId: 'COA' },
  { id: 's2', semesterId: 'sem1', dayOfWeek: 2, periodIndex: 1, startTime: '09:00', endTime: '10:00', subjectId: 'COA' },
]

const subjects = [{ id: 'COA' }]

describe('predictAttendance', () => {
  it('projects a best-case percentage assuming every remaining class this week is attended', () => {
    const records: R[] = [
      { subjectId: 'COA', status: 'present' },
      { subjectId: 'COA', status: 'absent' },
    ]
    const { overall } = predictAttendance({
      records,
      subjects,
      policy: 'excluded',
      semester,
      slots,
      holidays: [],
      overrides: [],
      from: '2026-07-13',
      to: '2026-07-14',
      assumeAttendAll: true,
    })
    // 2 existing + 2 expected classes (Mon COA, Tue COA), all attended
    expect(overall).toMatchObject({ attended: 3, total: 4 })
  })

  it('projects a worst-case percentage assuming every remaining class is missed', () => {
    const { overall } = predictAttendance({
      records: [{ subjectId: 'COA', status: 'present' }],
      subjects,
      policy: 'excluded',
      semester,
      slots,
      holidays: [],
      overrides: [],
      from: '2026-07-13',
      to: '2026-07-14',
      assumeAttendAll: false,
    })
    expect(overall).toMatchObject({ attended: 1, total: 3 })
  })

  it('adds no synthetic events when the projection range has no expected classes', () => {
    const records: R[] = [{ subjectId: 'COA', status: 'present' }]
    const { overall } = predictAttendance({
      records,
      subjects,
      policy: 'excluded',
      semester,
      slots,
      holidays: [],
      overrides: [],
      from: '2026-07-19', // Sunday, no classes
      to: '2026-07-19',
    })
    expect(overall).toMatchObject({ attended: 1, total: 1 })
  })
})
