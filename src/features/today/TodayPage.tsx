import { Link } from 'react-router-dom'
import { useActiveSemester } from '../../lib/useActiveSemester'
import { EmptyState } from '../../components/EmptyState'

export function TodayPage() {
  const semester = useActiveSemester()

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

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{semester.name}</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Target attendance: {semester.targetPercent}%
      </p>
      <div className="rounded-2xl border border-slate-200 p-6 text-center text-slate-500 dark:border-slate-800 dark:text-slate-400">
        Today's timetable and quick attendance marking are coming in the next phase.
      </div>
    </div>
  )
}
