import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { useActiveSemester } from '../../lib/useActiveSemester'
import { useClassRecords, useDayOverrides, useHolidays, useSubjects, useTimetableSlots } from '../../lib/queries'
import { EmptyState } from '../../components/EmptyState'
import { expandSchedule } from '../../engine/schedule'
import { DAY_DOT_CLASS, dayDotStatus } from './dayStatus'
import { DayDetailSheet } from './DayDetailSheet'
import { fieldInput } from '../setup/inputStyles'

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function CalendarPage() {
  const semester = useActiveSemester()
  const subjects = useSubjects(semester?.id)
  const slots = useTimetableSlots(semester?.id)
  const holidays = useHolidays(semester?.id)
  const overrides = useDayOverrides(semester?.id)
  const records = useClassRecords(semester?.id)

  const [monthAnchor, setMonthAnchor] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const gridStart = startOfWeek(startOfMonth(monthAnchor))
  const gridEnd = endOfWeek(endOfMonth(monthAnchor))
  const gridDays = useMemo(() => eachDayOfInterval({ start: gridStart, end: gridEnd }), [gridStart, gridEnd])

  const holidaySet = useMemo(() => new Set(holidays.map((h) => h.date)), [holidays])
  const recordsByDate = useMemo(() => {
    const map = new Map<string, typeof records>()
    for (const record of records) {
      const list = map.get(record.date) ?? []
      list.push(record)
      map.set(record.date, list)
    }
    return map
  }, [records])

  const expectedByDate = useMemo(() => {
    if (!semester) return new Map<string, number>()
    const from = format(gridStart, 'yyyy-MM-dd')
    const to = format(gridEnd, 'yyyy-MM-dd')
    const expected = expandSchedule({ semester, slots, holidays, overrides, from, to })
    const map = new Map<string, number>()
    for (const period of expected) map.set(period.date, (map.get(period.date) ?? 0) + 1)
    return map
  }, [semester, slots, holidays, overrides, gridStart, gridEnd])

  const subjectById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects])

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return records
      .filter((r) => {
        const subjectName = subjectById.get(r.subjectId)?.name.toLowerCase() ?? ''
        const haystack = [subjectName, r.note, r.dutyLeave?.reason, r.dutyLeave?.note, r.substitution?.teacherName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(q)
      })
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30)
  }, [query, records, subjectById])

  if (!semester) {
    return (
      <EmptyState
        icon="📅"
        title="No active semester"
        description="Set up a semester first to see your attendance calendar."
        action={
          <Link to="/setup" className="mt-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white">
            Set up semester
          </Link>
        }
      />
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <input
        type="search"
        className={fieldInput}
        placeholder="Search attendance history…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {query.trim() ? (
        <div className="flex flex-col gap-2">
          {searchResults.length === 0 ? (
            <p className="text-sm text-slate-400">No matches.</p>
          ) : (
            searchResults.map((r) => (
              <button
                key={r.id}
                type="button"
                className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left dark:border-slate-700"
                onClick={() => setSelectedDate(r.date)}
              >
                <div>
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {subjectById.get(r.subjectId)?.name ?? 'Unknown subject'}
                  </div>
                  <div className="text-xs text-slate-400">
                    {r.date} · {r.status}
                    {r.note && ` · ${r.note}`}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="rounded-full px-3 py-1 text-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              onClick={() => setMonthAnchor((d) => subMonths(d, 1))}
            >
              ‹
            </button>
            <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {format(monthAnchor, 'MMMM yyyy')}
            </h1>
            <button
              type="button"
              className="rounded-full px-3 py-1 text-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              onClick={() => setMonthAnchor((d) => addMonths(d, 1))}
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400">
            {WEEKDAY_LABELS.map((label, i) => (
              <div key={i}>{label}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {gridDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const dayRecords = recordsByDate.get(dateStr) ?? []
              const status = dayDotStatus(dayRecords, (expectedByDate.get(dateStr) ?? 0) > 0, holidaySet.has(dateStr))
              const inMonth = isSameMonth(day, monthAnchor)
              const inSemesterRange = dateStr >= semester.startDate && dateStr <= semester.endDate

              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={!inSemesterRange}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`flex flex-col items-center gap-1 rounded-xl py-2 text-sm ${
                    !inMonth ? 'text-slate-300 dark:text-slate-700' : 'text-slate-700 dark:text-slate-200'
                  } ${isToday(day) ? 'font-bold ring-1 ring-emerald-500' : ''} ${
                    inSemesterRange ? 'hover:bg-slate-50 dark:hover:bg-slate-800' : 'opacity-40'
                  }`}
                >
                  {format(day, 'd')}
                  <span className={`h-1.5 w-1.5 rounded-full ${status ? DAY_DOT_CLASS[status] : ''}`} />
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
            <Legend color="bg-emerald-500" label="Present" />
            <Legend color="bg-red-500" label="Absent" />
            <Legend color="bg-amber-500" label="Duty leave" />
            <Legend color="bg-sky-500" label="Cancelled" />
            <Legend color="bg-slate-400" label="Holiday" />
          </div>
        </>
      )}

      {selectedDate && (
        <DayDetailSheet
          semester={semester}
          date={selectedDate}
          subjects={subjects}
          slots={slots}
          holidays={holidays}
          overrides={overrides}
          records={recordsByDate.get(selectedDate) ?? []}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      {label}
    </span>
  )
}
