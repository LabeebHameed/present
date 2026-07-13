import type { WizardState } from '../wizardState'

export function ReviewStep({ state }: { state: WizardState }) {
  const workingSaturdayCount = Object.keys(state.workingSaturdays).length

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">{state.name || 'Untitled semester'}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {state.startDate} – {state.endDate}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Target attendance: {state.targetPercent}%</p>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
          <dt className="text-xs text-slate-400">Subjects</dt>
          <dd className="text-lg font-semibold text-slate-800 dark:text-slate-100">{state.subjects.length}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
          <dt className="text-xs text-slate-400">Weekly periods</dt>
          <dd className="text-lg font-semibold text-slate-800 dark:text-slate-100">{state.slots.length}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
          <dt className="text-xs text-slate-400">Holidays</dt>
          <dd className="text-lg font-semibold text-slate-800 dark:text-slate-100">{state.holidays.length}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
          <dt className="text-xs text-slate-400">Working Saturdays</dt>
          <dd className="text-lg font-semibold text-slate-800 dark:text-slate-100">{workingSaturdayCount}</dd>
        </div>
      </dl>

      <ul className="flex flex-col gap-1">
        {state.subjects.map((subject) => (
          <li key={subject.id} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: subject.color }} />
            {subject.name || 'Untitled'} {subject.facultyName && `— ${subject.facultyName}`}
          </li>
        ))}
      </ul>
    </div>
  )
}
