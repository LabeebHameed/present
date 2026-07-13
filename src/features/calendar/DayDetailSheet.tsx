import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { BottomSheet } from '../../components/BottomSheet'
import { PeriodList } from '../today/PeriodList'
import { expandSchedule } from '../../engine/schedule'
import type { ClassRecord, DayOverride, Holiday, Semester, Subject, TimetableSlot } from '../../db/types'
import { DayOverrideEditor } from './DayOverrideEditor'

export function DayDetailSheet({
  semester,
  date,
  subjects,
  slots,
  holidays,
  overrides,
  records,
  onClose,
}: {
  semester: Semester
  date: string
  subjects: Subject[]
  slots: TimetableSlot[]
  holidays: Holiday[]
  overrides: DayOverride[]
  records: ClassRecord[]
  onClose: () => void
}) {
  const [showOverrideEditor, setShowOverrideEditor] = useState(false)
  const subjectById = new Map(subjects.map((s) => [s.id, s]))
  const recordsByPeriod = new Map(records.map((r) => [r.periodIndex, r]))
  const isHoliday = holidays.some((h) => h.date === date)

  const periods = expandSchedule({ semester, slots, holidays, overrides, from: date, to: date })
  const dayOverrides = overrides.filter((o) => o.date === date)

  return (
    <BottomSheet title={format(parseISO(date), 'EEEE, MMMM d')} onClose={onClose}>
      {isHoliday && periods.length === 0 && (
        <p className="rounded-xl bg-slate-100 p-3 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          Holiday — no classes expected.
        </p>
      )}

      {periods.length === 0 && !isHoliday && (
        <p className="text-sm text-slate-400">No classes expected on this day.</p>
      )}

      <PeriodList
        semesterId={semester.id}
        date={date}
        periods={periods}
        recordsByPeriod={recordsByPeriod}
        subjectById={subjectById}
        subjects={subjects}
      />

      <button
        type="button"
        className="text-left text-xs font-semibold text-emerald-600 dark:text-emerald-400"
        onClick={() => setShowOverrideEditor((v) => !v)}
      >
        {showOverrideEditor ? 'Hide' : 'Adjust'} this day's timetable {showOverrideEditor ? '▲' : '▼'}
      </button>

      {showOverrideEditor && (
        <DayOverrideEditor
          semesterId={semester.id}
          date={date}
          subjects={subjects}
          periods={periods}
          existingOverrides={dayOverrides}
        />
      )}
    </BottomSheet>
  )
}
