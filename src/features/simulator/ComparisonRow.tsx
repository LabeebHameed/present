export function ComparisonRow({ label, current, simulated }: { label: string; current: number; simulated: number }) {
  const delta = simulated - current
  const deltaLabel = delta === 0 ? '±0.0%' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`
  const deltaClass =
    delta > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : delta < 0
        ? 'text-red-500 dark:text-red-400'
        : 'text-slate-400'

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700">
      <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-400">{current.toFixed(1)}%</span>
        <span className="text-slate-300">→</span>
        <span className="font-semibold text-slate-800 dark:text-slate-100">{simulated.toFixed(1)}%</span>
        <span className={`text-xs font-medium ${deltaClass}`}>{deltaLabel}</span>
      </div>
    </div>
  )
}
