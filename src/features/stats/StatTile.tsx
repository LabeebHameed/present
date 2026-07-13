export function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">{value}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  )
}
