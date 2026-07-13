import { Link } from 'react-router-dom'
import { addDays, endOfWeek, format } from 'date-fns'
import { useActiveSemester } from '../../lib/useActiveSemester'
import { useClassRecords, useDayOverrides, useHolidays, useSubjects, useTimetableSlots } from '../../lib/queries'
import { EmptyState } from '../../components/EmptyState'
import { classesNeededToReach, classesSafeToMiss, computeStats } from '../../engine/stats'
import { predictAttendance } from '../../engine/predict'
import { todayISO } from '../../lib/date'
import { AnalyticsCard } from './AnalyticsCard'

export function AnalyticsPage() {
  const semester = useActiveSemester()
  const subjects = useSubjects(semester?.id)
  const slots = useTimetableSlots(semester?.id)
  const holidays = useHolidays(semester?.id)
  const overrides = useDayOverrides(semester?.id)
  const records = useClassRecords(semester?.id)

  if (!semester) {
    return (
      <EmptyState
        icon="📈"
        title="No active semester"
        description="Set up a semester first to see per-subject analytics."
        action={
          <Link to="/setup" className="mt-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white">
            Set up semester
          </Link>
        }
      />
    )
  }

  const { bySubject } = computeStats(records, subjects, semester.dutyLeavePolicy)

  const today = todayISO()
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const prediction =
    tomorrow <= weekEnd
      ? predictAttendance({
          records,
          subjects,
          policy: semester.dutyLeavePolicy,
          semester,
          slots,
          holidays,
          overrides,
          from: tomorrow,
          to: weekEnd,
          assumeAttendAll: true,
        })
      : null

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <Link to="/" className="text-xs font-medium text-slate-400">
          ← Today
        </Link>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Subject breakdown</h1>
        <p className="text-xs text-slate-400">{today}</p>
      </div>

      {subjects.length === 0 ? (
        <p className="text-sm text-slate-400">No subjects yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {subjects.map((subject) => {
            const stats = bySubject[subject.id]
            const target = subject.targetPercentOverride ?? semester.targetPercent
            return (
              <AnalyticsCard
                key={subject.id}
                subject={subject}
                stats={stats}
                target={target}
                safeToMiss={classesSafeToMiss(stats.attended, stats.total, target)}
                neededToAttend={classesNeededToReach(stats.attended, stats.total, target)}
                predictedPercent={prediction?.bySubject[subject.id]?.percent ?? null}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
