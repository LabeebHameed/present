import { describe, expect, it } from 'vitest'
import { expandSchedule } from './schedule'
import type { DayOverride, Holiday, Semester, TimetableSlot } from '../db/types'

const semester: Pick<Semester, 'startDate' | 'endDate' | 'workingSaturdays'> = {
  startDate: '2026-07-01',
  endDate: '2026-07-31',
  workingSaturdays: {},
}

// 2026-07-13 is a Monday, 2026-07-14 Tuesday, ... 2026-07-19 Sunday
const slots: TimetableSlot[] = [
  { id: 's1', semesterId: 'sem1', dayOfWeek: 1, periodIndex: 1, startTime: '09:00', endTime: '10:00', subjectId: 'COA' },
  { id: 's2', semesterId: 'sem1', dayOfWeek: 1, periodIndex: 2, startTime: '10:00', endTime: '11:00', subjectId: 'DBMS' },
  { id: 's3', semesterId: 'sem1', dayOfWeek: 2, periodIndex: 1, startTime: '09:00', endTime: '10:00', subjectId: 'AI' },
]

describe('expandSchedule', () => {
  it('expands weekday periods from the weekly timetable', () => {
    const result = expandSchedule({
      semester,
      slots,
      holidays: [],
      overrides: [],
      from: '2026-07-13',
      to: '2026-07-13',
    })
    expect(result).toEqual([
      { date: '2026-07-13', periodIndex: 1, subjectId: 'COA', startTime: '09:00', endTime: '10:00' },
      { date: '2026-07-13', periodIndex: 2, subjectId: 'DBMS', startTime: '10:00', endTime: '11:00' },
    ])
  })

  it('produces no periods on Sunday', () => {
    const result = expandSchedule({
      semester,
      slots,
      holidays: [],
      overrides: [],
      from: '2026-07-19',
      to: '2026-07-19',
    })
    expect(result).toEqual([])
  })

  it('produces no periods on a non-working Saturday', () => {
    const result = expandSchedule({
      semester,
      slots,
      holidays: [],
      overrides: [],
      from: '2026-07-18',
      to: '2026-07-18',
    })
    expect(result).toEqual([])
  })

  it('follows the mapped weekday timetable on a working Saturday', () => {
    const result = expandSchedule({
      semester: { ...semester, workingSaturdays: { '2026-07-18': 1 } },
      slots,
      holidays: [],
      overrides: [],
      from: '2026-07-18',
      to: '2026-07-18',
    })
    expect(result.map((p) => p.subjectId)).toEqual(['COA', 'DBMS'])
  })

  it('skips a holiday even if it would otherwise have classes', () => {
    const holidays: Holiday[] = [{ id: 'h1', semesterId: 'sem1', date: '2026-07-13', name: 'Festival' }]
    const result = expandSchedule({ semester, slots, holidays, overrides: [], from: '2026-07-13', to: '2026-07-13' })
    expect(result).toEqual([])
  })

  it('applies a cancelPeriod override to remove one period', () => {
    const overrides: DayOverride[] = [
      { id: 'o1', semesterId: 'sem1', date: '2026-07-13', periodIndex: 2, kind: 'cancelPeriod' },
    ]
    const result = expandSchedule({ semester, slots, holidays: [], overrides, from: '2026-07-13', to: '2026-07-13' })
    expect(result).toEqual([
      { date: '2026-07-13', periodIndex: 1, subjectId: 'COA', startTime: '09:00', endTime: '10:00' },
    ])
  })

  it('applies a moveSubject override to change the subject at an existing period', () => {
    const overrides: DayOverride[] = [
      { id: 'o1', semesterId: 'sem1', date: '2026-07-13', periodIndex: 1, kind: 'moveSubject', subjectId: 'Maths' },
    ]
    const result = expandSchedule({ semester, slots, holidays: [], overrides, from: '2026-07-13', to: '2026-07-13' })
    expect(result[0]).toMatchObject({ periodIndex: 1, subjectId: 'Maths' })
  })

  it('applies an addPeriod override to add a brand new period', () => {
    const overrides: DayOverride[] = [
      {
        id: 'o1',
        semesterId: 'sem1',
        date: '2026-07-13',
        periodIndex: 5,
        kind: 'addPeriod',
        subjectId: 'Extra',
        startTime: '15:00',
        endTime: '16:00',
      },
    ]
    const result = expandSchedule({ semester, slots, holidays: [], overrides, from: '2026-07-13', to: '2026-07-13' })
    expect(result).toContainEqual({
      date: '2026-07-13',
      periodIndex: 5,
      subjectId: 'Extra',
      startTime: '15:00',
      endTime: '16:00',
    })
  })

  it('honors an addPeriod override even on a holiday', () => {
    const holidays: Holiday[] = [{ id: 'h1', semesterId: 'sem1', date: '2026-07-13', name: 'Festival' }]
    const overrides: DayOverride[] = [
      { id: 'o1', semesterId: 'sem1', date: '2026-07-13', periodIndex: 1, kind: 'addPeriod', subjectId: 'Special' },
    ]
    const result = expandSchedule({ semester, slots, holidays, overrides, from: '2026-07-13', to: '2026-07-13' })
    expect(result).toEqual([{ date: '2026-07-13', periodIndex: 1, subjectId: 'Special', startTime: undefined, endTime: undefined }])
  })

  it('honors an addPeriod override even on a non-working Sunday', () => {
    const overrides: DayOverride[] = [
      { id: 'o1', semesterId: 'sem1', date: '2026-07-19', periodIndex: 1, kind: 'addPeriod', subjectId: 'Special' },
    ]
    const result = expandSchedule({ semester, slots, holidays: [], overrides, from: '2026-07-19', to: '2026-07-19' })
    expect(result.map((p) => p.subjectId)).toEqual(['Special'])
  })

  it('clamps the expansion range to the semester start/end dates', () => {
    const result = expandSchedule({
      semester,
      slots,
      holidays: [],
      overrides: [],
      from: '2026-06-01',
      to: '2026-08-31',
    })
    expect(result.every((p) => p.date >= semester.startDate && p.date <= semester.endDate)).toBe(true)
  })

  it('returns an empty array when the range is entirely outside the semester', () => {
    const result = expandSchedule({
      semester,
      slots,
      holidays: [],
      overrides: [],
      from: '2026-01-01',
      to: '2026-01-31',
    })
    expect(result).toEqual([])
  })

  it('sorts periods by periodIndex within a day', () => {
    const overrides: DayOverride[] = [
      { id: 'o1', semesterId: 'sem1', date: '2026-07-13', periodIndex: 0, kind: 'addPeriod', subjectId: 'Early' },
    ]
    const result = expandSchedule({ semester, slots, holidays: [], overrides, from: '2026-07-13', to: '2026-07-13' })
    expect(result.map((p) => p.periodIndex)).toEqual([0, 1, 2])
  })
})
