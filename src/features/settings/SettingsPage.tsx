import { useTheme } from '../../lib/useTheme'
import type { AppSettings } from '../../db/types'

const themeOptions: { value: AppSettings['theme']; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

export function SettingsPage() {
  const { theme, setTheme } = useTheme()

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
        <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">Semesters</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Duty-leave policy, target attendance, and semester management are coming in a later build phase.
        </p>
      </section>
    </div>
  )
}
