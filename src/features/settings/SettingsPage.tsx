import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTheme } from '../../lib/useTheme'
import { db } from '../../db/schema'
import type { AppSettings } from '../../db/types'
import { deleteSemester, setActiveSemester } from '../../lib/semesterActions'
import { secondaryButton } from '../setup/inputStyles'

const themeOptions: { value: AppSettings['theme']; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const semesters = useLiveQuery(
    async () => (await db.semesters.toArray()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [],
  )

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This removes its subjects, timetable, and attendance records.`)) return
    await deleteSemester(id)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Settings</h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">Appearance</h2>
        <div className="flex gap-2">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                theme === option.value
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">Semesters</h2>
          <Link to="/setup" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            + New semester
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          {semesters?.map((semester) => (
            <div
              key={semester.id}
              className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 ${
                semester.isActive
                  ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{semester.name}</div>
                <div className="text-xs text-slate-400">
                  {semester.startDate} – {semester.endDate} · target {semester.targetPercent}%
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!semester.isActive && (
                  <button
                    type="button"
                    className="text-xs font-medium text-emerald-600 dark:text-emerald-400"
                    onClick={() => setActiveSemester(semester.id)}
                  >
                    Activate
                  </button>
                )}
                <button
                  type="button"
                  className="text-xs font-medium text-red-500"
                  onClick={() => handleDelete(semester.id, semester.name)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {semesters?.length === 0 && (
            <div className="flex flex-col items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
              <p>No semesters yet.</p>
              <Link to="/setup" className={secondaryButton}>
                Set up your first semester
              </Link>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500">
          Per-subject target overrides and richer duty-leave controls are coming in a later build phase.
        </p>
      </section>
    </div>
  )
}
