import { eachDayOfInterval, formatISO, getDay, max, min, parseISO } from 'date-fns'
import type { DayOfWeek, DayOverride, Holiday, Semester, TimetableSlot } from '../db/types'

export interface ExpectedPeriod {
  date: string
  periodIndex: number
  subjectId: string
  startTime?: string
  endTime?: string
}

export interface ExpandScheduleParams {
  semester: Pick<Semester, 'startDate' | 'endDate' | 'workingSaturdays'>
  slots: TimetableSlot[]
  holidays: Holiday[]
  overrides: DayOverride[]
  from: string
  to: string
}

function toISODate(date: Date): string {
  return formatISO(date, { representation: 'date' })
}

/**
 * Derives what classes are expected to happen on each date in [from, to], from the
 * weekly timetable, holidays, working-Saturday mappings, and per-date overrides.
 * Overrides always take precedence, even on holidays/Sundays, since they represent
 * an explicit decision for that exact date.
 */
export function expandSchedule(params: ExpandScheduleParams): ExpectedPeriod[] {
  const { semester, slots, holidays, overrides, from, to } = params

  const rangeStart = max([parseISO(from), parseISO(semester.startDate)])
  const rangeEnd = min([parseISO(to), parseISO(semester.endDate)])
  if (rangeStart > rangeEnd) return []

  const holidaySet = new Set(holidays.map((h) => h.date))
  const slotsByDay = new Map<DayOfWeek, TimetableSlot[]>()
  for (const slot of slots) {
    const list = slotsByDay.get(slot.dayOfWeek) ?? []
    list.push(slot)
    slotsByDay.set(slot.dayOfWeek, list)
  }

  const overridesByDate = new Map<string, DayOverride[]>()
  for (const override of overrides) {
    const list = overridesByDate.get(override.date) ?? []
    list.push(override)
    overridesByDate.set(override.date, list)
  }

  const result: ExpectedPeriod[] = []

  for (const dateObj of eachDayOfInterval({ start: rangeStart, end: rangeEnd })) {
    const date = toISODate(dateObj)
    const dayOfWeek = getDay(dateObj) as DayOfWeek
    const isHoliday = holidaySet.has(date)

    const periods = new Map<number, { subjectId: string; startTime?: string; endTime?: string }>()

    if (!isHoliday) {
      let effectiveDay: DayOfWeek | null = null
      if (dayOfWeek === 6) {
        effectiveDay = semester.workingSaturdays[date] ?? null
      } else if (dayOfWeek !== 0) {
        effectiveDay = dayOfWeek
      }

      if (effectiveDay !== null) {
        for (const slot of slotsByDay.get(effectiveDay) ?? []) {
          periods.set(slot.periodIndex, {
            subjectId: slot.subjectId,
            startTime: slot.startTime,
            endTime: slot.endTime,
          })
        }
      }
    }

    const dayOverrides = overridesByDate.get(date) ?? []
    for (const override of dayOverrides.filter((o) => o.kind === 'cancelPeriod')) {
      periods.delete(override.periodIndex)
    }
    for (const override of dayOverrides.filter((o) => o.kind === 'moveSubject' || o.kind === 'addPeriod')) {
      if (!override.subjectId) continue
      periods.set(override.periodIndex, {
        subjectId: override.subjectId,
        startTime: override.startTime,
        endTime: override.endTime,
      })
    }

    for (const [periodIndex, period] of [...periods.entries()].sort((a, b) => a[0] - b[0])) {
      result.push({ date, periodIndex, ...period })
    }
  }

  return result
}
