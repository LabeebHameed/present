import type { ClassRecord, DutyLeavePolicy, Subject } from '../db/types'

export interface SubjectStats {
  attended: number
  total: number
  percent: number
  dutyLeaveCount: number
  cancelledCount: number
  absentCount: number
}

export interface AttendanceReport {
  overall: SubjectStats
  bySubject: Record<string, SubjectStats>
}

function emptyStats(): SubjectStats {
  return { attended: 0, total: 0, percent: 0, dutyLeaveCount: 0, cancelledCount: 0, absentCount: 0 }
}

function applyRecord(stats: SubjectStats, record: Pick<ClassRecord, 'status'>, policy: DutyLeavePolicy) {
  switch (record.status) {
    case 'present':
      stats.attended += 1
      stats.total += 1
      break
    case 'absent':
      stats.absentCount += 1
      stats.total += 1
      break
    case 'cancelled':
      stats.cancelledCount += 1
      break
    case 'holiday':
      break
    case 'dutyLeave':
      stats.dutyLeaveCount += 1
      if (policy === 'present') {
        stats.attended += 1
        stats.total += 1
      } else if (policy === 'absent') {
        stats.total += 1
      }
      break
  }
}

function finalize(stats: SubjectStats): SubjectStats {
  return { ...stats, percent: stats.total === 0 ? 0 : (stats.attended / stats.total) * 100 }
}

/**
 * Aggregates recorded attendance into overall + per-subject stats. Only actual
 * ClassRecords are considered — unmarked expected periods are a UI concern
 * (see engine/schedule.ts), not part of the computed percentage.
 */
export function computeStats(
  records: Pick<ClassRecord, 'subjectId' | 'status'>[],
  subjects: Pick<Subject, 'id'>[],
  policy: DutyLeavePolicy,
): AttendanceReport {
  const overall = emptyStats()
  const bySubject: Record<string, SubjectStats> = {}
  for (const subject of subjects) bySubject[subject.id] = emptyStats()

  for (const record of records) {
    applyRecord(overall, record, policy)
    const subjectStats = bySubject[record.subjectId] ?? (bySubject[record.subjectId] = emptyStats())
    applyRecord(subjectStats, record, policy)
  }

  return {
    overall: finalize(overall),
    bySubject: Object.fromEntries(Object.entries(bySubject).map(([id, s]) => [id, finalize(s)])),
  }
}

/**
 * Max additional classes that can be missed (added as absences) while keeping
 * attended/total at or above targetPercent. Assumes future misses only.
 */
export function classesSafeToMiss(attended: number, total: number, targetPercent: number): number {
  if (targetPercent <= 0) return Number.POSITIVE_INFINITY
  const raw = (attended * 100) / targetPercent - total
  return Math.max(0, Math.floor(raw + 1e-9))
}

/**
 * Min additional classes that must be attended consecutively (added as both
 * attended and total) to bring attended/total up to targetPercent.
 */
export function classesNeededToReach(attended: number, total: number, targetPercent: number): number {
  if (total > 0 && attended / total >= targetPercent / 100) return 0
  if (targetPercent >= 100) return attended === total ? 0 : Number.POSITIVE_INFINITY
  const raw = ((targetPercent / 100) * total - attended) / (1 - targetPercent / 100)
  return Math.max(0, Math.ceil(raw - 1e-9))
}
