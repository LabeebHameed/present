import type { ClassRecord } from '../../db/types'

export type DayDotStatus = 'present' | 'absent' | 'dutyLeave' | 'cancelled' | 'holiday' | 'unmarked' | null

/**
 * A single dominant dot color per calendar day, prioritizing the status a
 * student most needs to notice: an absence outranks duty leave, which
 * outranks a cancelled-only day, which outranks a clean present day.
 */
export function dayDotStatus(records: ClassRecord[], hasExpectedPeriods: boolean, isHoliday: boolean): DayDotStatus {
  if (records.some((r) => r.status === 'absent')) return 'absent'
  if (records.some((r) => r.status === 'dutyLeave')) return 'dutyLeave'
  if (records.some((r) => r.status === 'present')) return 'present'
  if (records.length > 0 && records.every((r) => r.status === 'cancelled')) return 'cancelled'
  if (isHoliday) return 'holiday'
  if (hasExpectedPeriods) return 'unmarked'
  return null
}

export const DAY_DOT_CLASS: Record<Exclude<DayDotStatus, null>, string> = {
  present: 'bg-emerald-500',
  absent: 'bg-red-500',
  dutyLeave: 'bg-amber-500',
  cancelled: 'bg-sky-500',
  holiday: 'bg-slate-400',
  unmarked: 'bg-transparent border border-slate-300 dark:border-slate-600',
}
