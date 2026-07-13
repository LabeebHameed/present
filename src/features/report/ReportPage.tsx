import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { useActiveSemester } from '../../lib/useActiveSemester'
import { useClassRecords, useSubjects } from '../../lib/queries'
import { EmptyState } from '../../components/EmptyState'
import { computeStats } from '../../engine/stats'
import { primaryButton } from '../setup/inputStyles'

function fmt(date: string): string {
  return format(parseISO(date), 'MMM d, yyyy')
}

export function ReportPage() {
  const semester = useActiveSemester()
  const subjects = useSubjects(semester?.id)
  const records = useClassRecords(semester?.id)

  if (!semester) {
    return (
      <EmptyState
        icon="🧾"
        title="No active semester"
        description="Set up a semester first to generate a report."
        action={
          <Link to="/setup" className="mt-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white">
            Set up semester
          </Link>
        }
      />
    )
  }

  const { overall, bySubject } = computeStats(records, subjects, semester.dutyLeavePolicy)
  const subjectById = new Map(subjects.map((s) => [s.id, s]))

  const dutyLeaveRecords = records.filter((r) => r.status === 'dutyLeave').sort((a, b) => a.date.localeCompare(b.date))
  const absentRecords = records.filter((r) => r.status === 'absent').sort((a, b) => a.date.localeCompare(b.date))
  const cancelledRecords = records.filter((r) => r.status === 'cancelled').sort((a, b) => a.date.localeCompare(b.date))
  const substitutionRecords = records.filter((r) => r.substitution).sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 print:p-8">
      <div className="no-print flex items-center justify-between">
        <Link to="/stats" className="text-xs font-medium text-slate-400">
          ← Stats
        </Link>
        <button type="button" className={primaryButton} onClick={() => window.print()}>
          Export as PDF
        </button>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 print:text-black">
          {semester.name} — Attendance Report
        </h1>
        <p className="text-xs text-slate-400 print:text-black">
          {semester.startDate} – {semester.endDate} · generated {format(new Date(), 'MMM d, yyyy')}
        </p>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300 print:text-black">Overall</h2>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 print:text-black">
          {overall.percent.toFixed(1)}%{' '}
          <span className="text-sm font-normal text-slate-400">
            ({overall.attended}/{overall.total} classes, target {semester.targetPercent}%)
          </span>
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300 print:text-black">Subject-wise</h2>
        <ReportTable
          headers={['Subject', 'Attended', 'Total', '%', 'Target', 'Status']}
          rows={subjects.map((s) => {
            const stats = bySubject[s.id]
            const target = s.targetPercentOverride ?? semester.targetPercent
            const met = stats.percent >= target
            return [
              s.name,
              String(stats.attended),
              String(stats.total),
              `${stats.percent.toFixed(1)}%`,
              `${target}%`,
              met ? 'Met' : 'Below',
            ]
          })}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300 print:text-black">
          Duty leave history ({dutyLeaveRecords.length})
        </h2>
        {dutyLeaveRecords.length === 0 ? (
          <EmptyRow />
        ) : (
          <ReportTable
            headers={['Date', 'Subject', 'Reason', 'Note']}
            rows={dutyLeaveRecords.map((r) => [
              fmt(r.date),
              subjectById.get(r.subjectId)?.name ?? '',
              r.dutyLeave?.reason ?? '',
              r.dutyLeave?.note ?? '',
            ])}
          />
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300 print:text-black">
          Absent days ({absentRecords.length})
        </h2>
        {absentRecords.length === 0 ? (
          <EmptyRow />
        ) : (
          <ReportTable
            headers={['Date', 'Subject']}
            rows={absentRecords.map((r) => [fmt(r.date), subjectById.get(r.subjectId)?.name ?? ''])}
          />
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300 print:text-black">
          Cancelled classes ({cancelledRecords.length})
        </h2>
        {cancelledRecords.length === 0 ? (
          <EmptyRow />
        ) : (
          <ReportTable
            headers={['Date', 'Subject']}
            rows={cancelledRecords.map((r) => [fmt(r.date), subjectById.get(r.subjectId)?.name ?? ''])}
          />
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300 print:text-black">
          Teacher substitutions ({substitutionRecords.length})
        </h2>
        {substitutionRecords.length === 0 ? (
          <EmptyRow />
        ) : (
          <ReportTable
            headers={['Date', 'Subject', 'Taken by', 'Actually taught']}
            rows={substitutionRecords.map((r) => [
              fmt(r.date),
              subjectById.get(r.subjectId)?.name ?? '',
              r.substitution?.teacherName ?? '',
              r.substitution?.actualSubjectId ? (subjectById.get(r.substitution.actualSubjectId)?.name ?? '') : 'Same subject',
            ])}
          />
        )}
      </section>
    </div>
  )
}

function EmptyRow() {
  return <p className="text-sm text-slate-400 print:text-black">None</p>
}

function ReportTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-400 print:border-black print:text-black">
            {headers.map((h) => (
              <th key={h} className="py-1.5 pr-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-100 text-slate-700 dark:border-slate-800 dark:text-slate-200 print:border-slate-300 print:text-black">
              {row.map((cell, j) => (
                <td key={j} className="py-1.5 pr-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
