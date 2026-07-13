import type { ClassRecord, DayOverride, DutyLeavePolicy, Holiday, Semester, Subject, TimetableSlot } from '../db/types'
import { expandSchedule } from './schedule'
import { simulate, type HypotheticalEvent } from './simulate'
import type { AttendanceReport } from './stats'

export interface PredictParams {
  records: Pick<ClassRecord, 'subjectId' | 'status'>[]
  subjects: Pick<Subject, 'id'>[]
  policy: DutyLeavePolicy
  semester: Pick<Semester, 'startDate' | 'endDate' | 'workingSaturdays'>
  slots: TimetableSlot[]
  holidays: Holiday[]
  overrides: DayOverride[]
  /** exclusive of already-recorded days, e.g. tomorrow's date */
  from: string
  to: string
  /** true = best case (attend everything), false = worst case (miss everything) */
  assumeAttendAll?: boolean
}

/**
 * Projects attendance stats forward assuming every remaining expected class in
 * [from, to] is attended (or missed, for a worst-case projection). Used for
 * "if I attend everything this week, what's my %?" style predictions.
 */
export function predictAttendance(params: PredictParams): AttendanceReport {
  const { records, subjects, policy, semester, slots, holidays, overrides, from, to, assumeAttendAll = true } = params

  const expected = expandSchedule({ semester, slots, holidays, overrides, from, to })

  const countBySubject = new Map<string, number>()
  for (const period of expected) {
    countBySubject.set(period.subjectId, (countBySubject.get(period.subjectId) ?? 0) + 1)
  }

  const events: HypotheticalEvent[] = [...countBySubject.entries()].map(([subjectId, count]) => ({
    type: assumeAttendAll ? 'attend' : 'skip',
    subjectId,
    count,
  }))

  return simulate(records, subjects, policy, events)
}
