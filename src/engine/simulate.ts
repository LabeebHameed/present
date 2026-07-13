import type { ClassRecord, DutyLeavePolicy, Subject } from '../db/types'
import { computeStats, type AttendanceReport } from './stats'

export type HypotheticalEvent =
  | { type: 'attend'; subjectId: string; count?: number }
  | { type: 'skip'; subjectId: string; count?: number }

function eventsToSyntheticRecords(events: HypotheticalEvent[]): Pick<ClassRecord, 'subjectId' | 'status'>[] {
  const synthetic: Pick<ClassRecord, 'subjectId' | 'status'>[] = []
  for (const event of events) {
    const count = event.count ?? 1
    const status = event.type === 'attend' ? 'present' : 'absent'
    for (let i = 0; i < count; i++) {
      synthetic.push({ subjectId: event.subjectId, status })
    }
  }
  return synthetic
}

/**
 * Answers "what happens if..." questions (skip N classes, attend N extra classes)
 * by layering hypothetical events on top of existing records and recomputing stats.
 * Existing records are never mutated.
 */
export function simulate(
  records: Pick<ClassRecord, 'subjectId' | 'status'>[],
  subjects: Pick<Subject, 'id'>[],
  policy: DutyLeavePolicy,
  events: HypotheticalEvent[],
): AttendanceReport {
  return computeStats([...records, ...eventsToSyntheticRecords(events)], subjects, policy)
}
