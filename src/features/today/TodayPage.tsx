import { Link } from 'react-router-dom'
import { useActiveSemester } from '../../lib/useActiveSemester'
import { useClassRecords, useDayOverrides, useHolidays, useSubjects, useTimetableSlots } from '../../lib/queries'
import { EmptyState } from '../../components/EmptyState'
import { expandSchedule } from '../../engine/schedule'
import { classesNeededToReach, classesSafeToMiss, computeStats } from '../../engine/stats'
import { todayISO } from '../../lib/date'
import { markAllPresent } from '../../lib/recordActions'
import { PeriodRow } from './PeriodRow'
import { secondaryButton } from '../setup/inputStyles'

export function TodayPage() {
  const semester = useActiveSemester()
  const subjects = useSubjects(semester?.id)
  const slots = useTimetableSlots(semester?.id)
  const holidays = useHolidays(semester?.id)
  const overrides = useDayOverrides(semester?.id)
  const records = useClassRecords(semester?.id)

  if (!semester) {
    return (
      <EmptyState
        icon="🎓"
        title="No active semester yet"
        description="Set up your subjects and weekly timetable to start tracking attendance."
        action={
          <Link
            to="/setup"
            className="mt-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Set up semester
          </Link>
        }
      />
    )
  }

  const today = todayISO()
  const subjectById = new Map(subjects.map((s) => [s.id, s]))
  const { overall } = computeStats(records, subjects, semester.dutyLeavePolicy)
  const safeToMiss = classesSafeToMiss(overall.attended, overall.total, semester.targetPercent)
  const neededToAttend = classesNeededToReach(overall.attended, overall.total, semester.targetPercent)

  const todaysPeriods = expandSchedule({
    semester,
    slots,
    holidays,
    overrides,
    from: today,
    to: today,
  })

  const recordsByPeriod = new Map(
    records.filter((r) => r.date === today).map((r) => [r.periodIndex, r]),
  )
  const markedPeriods = new Set(recordsByPeriod.keys())
  const allMarked = todaysPeriods.length > 0 && todaysPeriods.every((p) => markedPeriods.has(p.periodIndex))

  return (
    <div className="flex flex-1 flex-col gap-5 p-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{semester.name}</h1>
        <p className="text-sm text-slate-400">{today}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {overall.percent.toFixed(1)}%
          </span>
          <span className="text-sm text-slate-400">target {semester.targetPercent}%</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            Safe to miss <span className="font-semibold">{Number.isFinite(safeToMiss) ? safeToMiss : '∞'}</span>
          </div>
          <div className="rounded-xl bg-amber-50 p-2 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            Need to attend{' '}
            <span className="font-semibold">
              {Number.isFinite(neededToAttend) ? neededToAttend : '∞'}
            </span>
          </div>
        </div>
        <div className="mt-3 flex gap-4">
          <Link to="/analytics" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            View subject breakdown →
          </Link>
          <Link to="/simulator" className="text-xs font-semibold text-violet-600 dark:text-violet-400">
            What if...? →
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">Today's timetable</h2>
        {todaysPeriods.length > 0 && !allMarked && (
          <button
            type="button"
            className={secondaryButton}
            onClick={() => markAllPresent(semester.id, today, todaysPeriods, markedPeriods)}
          >
            Mark all present
          </button>
        )}
      </div>

      {todaysPeriods.length === 0 ? (
        <p className="text-sm text-slate-400">No classes scheduled today.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {todaysPeriods.map((period) => (
            <PeriodRow
              key={period.periodIndex}
              semesterId={semester.id}
              date={today}
              period={period}
              subject={subjectById.get(period.subjectId)}
              subjects={subjects}
              record={recordsByPeriod.get(period.periodIndex)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
