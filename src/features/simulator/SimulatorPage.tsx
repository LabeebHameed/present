import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { addDays, endOfWeek, format } from 'date-fns'
import { useActiveSemester } from '../../lib/useActiveSemester'
import { useClassRecords, useDayOverrides, useHolidays, useSubjects, useTimetableSlots } from '../../lib/queries'
import { EmptyState } from '../../components/EmptyState'
import { expandSchedule } from '../../engine/schedule'
import { computeStats } from '../../engine/stats'
import { simulate, type HypotheticalEvent } from '../../engine/simulate'
import { fieldInput, fieldLabel, secondaryButton } from '../setup/inputStyles'
import { ComparisonRow } from './ComparisonRow'

type EventType = 'attend' | 'skip'

export function SimulatorPage() {
  const semester = useActiveSemester()
  const subjects = useSubjects(semester?.id)
  const slots = useTimetableSlots(semester?.id)
  const holidays = useHolidays(semester?.id)
  const overrides = useDayOverrides(semester?.id)
  const records = useClassRecords(semester?.id)

  const [subjectId, setSubjectId] = useState('')
  const [eventType, setEventType] = useState<EventType>('skip')
  const [count, setCount] = useState(1)
  const [skipDate, setSkipDate] = useState('')

  const activeSubjectId = subjectId || subjects[0]?.id || ''

  const currentReport = useMemo(
    () => (semester ? computeStats(records, subjects, semester.dutyLeavePolicy) : null),
    [semester, records, subjects],
  )

  const customReport = useMemo(() => {
    if (!semester || !activeSubjectId) return null
    const events: HypotheticalEvent[] = [{ type: eventType, subjectId: activeSubjectId, count }]
    return simulate(records, subjects, semester.dutyLeavePolicy, events)
  }, [semester, records, subjects, activeSubjectId, eventType, count])

  const skipDayReport = useMemo(() => {
    if (!semester || !skipDate) return null
    const periods = expandSchedule({ semester, slots, holidays, overrides, from: skipDate, to: skipDate })
    if (periods.length === 0) return { report: null, subjectNames: [] as string[] }
    const counts = new Map<string, number>()
    for (const p of periods) counts.set(p.subjectId, (counts.get(p.subjectId) ?? 0) + 1)
    const events: HypotheticalEvent[] = [...counts.entries()].map(([id, c]) => ({ type: 'skip', subjectId: id, count: c }))
    const report = simulate(records, subjects, semester.dutyLeavePolicy, events)
    const subjectNames = [...counts.keys()].map((id) => subjects.find((s) => s.id === id)?.name ?? 'Unknown')
    return { report, subjectNames }
  }, [semester, slots, holidays, overrides, records, subjects, skipDate])

  const weekReport = useMemo(() => {
    if (!semester) return null
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')
    const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    if (tomorrow > weekEnd) return null
    const periods = expandSchedule({ semester, slots, holidays, overrides, from: tomorrow, to: weekEnd })
    if (periods.length === 0) return null
    const counts = new Map<string, number>()
    for (const p of periods) counts.set(p.subjectId, (counts.get(p.subjectId) ?? 0) + 1)
    const events: HypotheticalEvent[] = [...counts.entries()].map(([id, c]) => ({ type: 'attend', subjectId: id, count: c }))
    return simulate(records, subjects, semester.dutyLeavePolicy, events)
  }, [semester, slots, holidays, overrides, records, subjects])

  const dutyLeaveReport = useMemo(() => {
    if (!semester) return null
    const hasDutyLeave = records.some((r) => r.status === 'dutyLeave')
    if (!hasDutyLeave || semester.dutyLeavePolicy === 'present') return null
    return computeStats(records, subjects, 'present')
  }, [semester, records, subjects])

  if (!semester) {
    return (
      <EmptyState
        icon="🔮"
        title="No active semester"
        description="Set up a semester first to try what-if scenarios."
        action={
          <Link to="/setup" className="mt-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white">
            Set up semester
          </Link>
        }
      />
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-5 p-4">
      <div>
        <Link to="/" className="text-xs font-medium text-slate-400">
          ← Today
        </Link>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">What if...?</h1>
        <p className="text-xs text-slate-400">Plan ahead before you decide to skip or attend a class.</p>
      </div>

      {weekReport && currentReport && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">
            If you attend every remaining class this week
          </h2>
          <ComparisonRow label="Overall" current={currentReport.overall.percent} simulated={weekReport.overall.percent} />
        </section>
      )}

      {dutyLeaveReport && currentReport && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">If your duty leave is approved (counted as present)</h2>
          <ComparisonRow label="Overall" current={currentReport.overall.percent} simulated={dutyLeaveReport.overall.percent} />
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">If you skip a specific day</h2>
        <input
          type="date"
          className={fieldInput}
          min={semester.startDate}
          max={semester.endDate}
          value={skipDate}
          onChange={(e) => setSkipDate(e.target.value)}
        />
        {skipDayReport?.report && currentReport && (
          <>
            <p className="text-xs text-slate-400">Affects: {skipDayReport.subjectNames.join(', ')}</p>
            <ComparisonRow label="Overall" current={currentReport.overall.percent} simulated={skipDayReport.report.overall.percent} />
          </>
        )}
        {skipDate && skipDayReport?.report === null && (
          <p className="text-xs text-slate-400">No classes scheduled that day.</p>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
        <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">Custom scenario</h2>

        <div className="flex flex-col gap-1">
          <label className={fieldLabel} htmlFor="sim-subject">
            Subject
          </label>
          <select
            id="sim-subject"
            className={fieldInput}
            value={activeSubjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
              eventType === 'attend'
                ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950'
                : 'border-slate-200 dark:border-slate-700'
            }`}
            onClick={() => setEventType('attend')}
          >
            Attend
          </button>
          <button
            type="button"
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
              eventType === 'skip'
                ? 'border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-950'
                : 'border-slate-200 dark:border-slate-700'
            }`}
            onClick={() => setEventType('skip')}
          >
            Skip
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className={secondaryButton} onClick={() => setCount((c) => Math.max(1, c - 1))}>
            −
          </button>
          <span className="w-10 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">{count}</span>
          <button type="button" className={secondaryButton} onClick={() => setCount((c) => c + 1)}>
            +
          </button>
          <span className="text-sm text-slate-400">more class{count === 1 ? '' : 'es'}</span>
        </div>

        {customReport && currentReport && (
          <div className="flex flex-col gap-2">
            <ComparisonRow label="Overall" current={currentReport.overall.percent} simulated={customReport.overall.percent} />
            <ComparisonRow
              label={subjects.find((s) => s.id === activeSubjectId)?.name ?? 'Subject'}
              current={currentReport.bySubject[activeSubjectId]?.percent ?? 0}
              simulated={customReport.bySubject[activeSubjectId]?.percent ?? 0}
            />
          </div>
        )}
      </section>

      <p className="text-xs text-slate-400 dark:text-slate-500">Nothing here changes your real attendance record.</p>
    </div>
  )
}
