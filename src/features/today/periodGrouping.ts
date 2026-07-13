import type { ExpectedPeriod } from '../../engine/schedule'
import type { ClassRecord } from '../../db/types'

/** Groups consecutive periods that share the same subject — a "double period" candidate. */
export function groupAdjacentPeriods(periods: ExpectedPeriod[]): ExpectedPeriod[][] {
  const sorted = [...periods].sort((a, b) => a.periodIndex - b.periodIndex)
  const groups: ExpectedPeriod[][] = []
  for (const period of sorted) {
    const last = groups.at(-1)
    const prev = last?.at(-1)
    if (prev && prev.subjectId === period.subjectId && prev.periodIndex === period.periodIndex - 1) {
      last!.push(period)
    } else {
      groups.push([period])
    }
  }
  return groups
}

function statusesMatch(a: ClassRecord, b: ClassRecord): boolean {
  if (a.status !== b.status) return false
  if (a.status === 'dutyLeave' && a.dutyLeave?.reason !== b.dutyLeave?.reason) return false
  if (a.substitution?.teacherName !== b.substitution?.teacherName) return false
  if (a.substitution?.actualSubjectId !== b.substitution?.actualSubjectId) return false
  return true
}

/**
 * Whether a merged group's records are consistent enough to still show as one
 * combined row: either nothing marked yet, or every marked period agrees.
 * Anything else (e.g. present for period 1 but absent for period 2, because
 * the substitute only took half the double period) forces a split view.
 */
export function recordsCompatible(records: (ClassRecord | undefined)[]): boolean {
  const marked = records.filter((r): r is ClassRecord => Boolean(r))
  if (marked.length === 0) return true
  if (marked.length !== records.length) return false
  const [first, ...rest] = marked
  return rest.every((r) => statusesMatch(r, first))
}
