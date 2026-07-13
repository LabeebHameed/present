import { formatISO, parseISO, startOfWeek } from 'date-fns'
import type { DutyLeavePolicy, Subject } from '../db/types'
import { computeStats, type StatsRecord } from './stats'

export interface WeekBucket {
  weekStart: string
  attended: number
  total: number
  percent: number
}

/**
 * Buckets records into Monday-start weeks and computes that week's overall
 * percent, skipping weeks with nothing that counts toward the denominator
 * (e.g. a week of cancelled-only classes) so the trend doesn't show a
 * misleading flat 0%.
 */
export function weeklyTrend(
  records: (StatsRecord & { date: string })[],
  subjects: Pick<Subject, 'id'>[],
  policy: DutyLeavePolicy,
): WeekBucket[] {
  const byWeek = new Map<string, (StatsRecord & { date: string })[]>()
  for (const record of records) {
    const weekStart = formatISO(startOfWeek(parseISO(record.date), { weekStartsOn: 1 }), { representation: 'date' })
    const list = byWeek.get(weekStart) ?? []
    list.push(record)
    byWeek.set(weekStart, list)
  }

  return [...byWeek.entries()]
    .map(([weekStart, weekRecords]) => {
      const { overall } = computeStats(weekRecords, subjects, policy)
      return { weekStart, attended: overall.attended, total: overall.total, percent: overall.percent }
    })
    .filter((bucket) => bucket.total > 0)
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
}
