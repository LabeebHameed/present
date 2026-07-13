import { Link } from 'react-router-dom'
import { useActiveSemester } from '../../lib/useActiveSemester'
import { useClassRecords, useSubjects } from '../../lib/queries'
import { EmptyState } from '../../components/EmptyState'
import { computeStats } from '../../engine/stats'
import { weeklyTrend } from '../../engine/trend'
import type { DutyLeaveReason } from '../../db/types'
import { SubjectBarChart } from './charts/SubjectBarChart'
import { TrendLineChart } from './charts/TrendLineChart'
import { DutyLeaveBreakdown } from './charts/DutyLeaveBreakdown'
import { StatTile } from './StatTile'

const DL_REASONS: DutyLeaveReason[] = ['NSS', 'IEDC', 'Hackathon', 'Sports', 'Placement', 'Medical', 'Other']

export function StatsPage() {
  const semester = useActiveSemester()
  const subjects = useSubjects(semester?.id)
  const records = useClassRecords(semester?.id)

  if (!semester) {
    return (
      <EmptyState
        icon="📊"
        title="No active semester"
        description="Set up a semester first to see statistics."
        action={
          <Link to="/setup" className="mt-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white">
            Set up semester
          </Link>
        }
      />
    )
  }

  const { bySubject } = computeStats(records, subjects, semester.dutyLeavePolicy)
  const buckets = weeklyTrend(records, subjects, semester.dutyLeavePolicy)

  const dlCounts = DL_REASONS.reduce(
    (acc, reason) => {
      acc[reason] = records.filter((r) => r.status === 'dutyLeave' && r.dutyLeave?.reason === reason).length
      return acc
    },
    {} as Record<DutyLeaveReason, number>,
  )

  const mostMissed = subjects
    .map((s) => ({ subject: s, absent: bySubject[s.id]?.absentCount ?? 0 }))
    .sort((a, b) => b.absent - a.absent)[0]

  const mostDutyLeave = subjects
    .map((s) => ({ subject: s, count: bySubject[s.id]?.dutyLeaveCount ?? 0 }))
    .sort((a, b) => b.count - a.count)[0]

  const substitutionCount = records.filter((r) => r.substitution).length

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Statistics</h1>
        <Link to="/report" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          Semester report →
        </Link>
      </div>

      {subjects.length === 0 ? (
        <p className="text-sm text-slate-400">No subjects yet.</p>
      ) : (
        <>
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">Subject-wise attendance</h2>
            <SubjectBarChart subjects={subjects} bySubject={bySubject} target={semester.targetPercent} />
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">Attendance trend</h2>
            {buckets.length > 0 ? (
              <TrendLineChart buckets={buckets} />
            ) : (
              <p className="text-sm text-slate-400">Not enough marked weeks yet.</p>
            )}
          </section>

          <section className="grid grid-cols-2 gap-2">
            <StatTile
              label="Most missed subject"
              value={mostMissed && mostMissed.absent > 0 ? mostMissed.subject.name : '—'}
              sub={mostMissed && mostMissed.absent > 0 ? `${mostMissed.absent} absences` : undefined}
            />
            <StatTile
              label="Most duty leaves"
              value={mostDutyLeave && mostDutyLeave.count > 0 ? mostDutyLeave.subject.name : '—'}
              sub={mostDutyLeave && mostDutyLeave.count > 0 ? `${mostDutyLeave.count} duty leaves` : undefined}
            />
            <StatTile label="Teacher substitutions" value={String(substitutionCount)} />
            <StatTile label="Subjects tracked" value={String(subjects.length)} />
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">Duty leave by reason</h2>
            <DutyLeaveBreakdown counts={dlCounts} />
          </section>
        </>
      )}
    </div>
  )
}
