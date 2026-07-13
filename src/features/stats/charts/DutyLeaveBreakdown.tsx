import type { DutyLeaveReason } from '../../../db/types'

export function DutyLeaveBreakdown({ counts }: { counts: Record<DutyLeaveReason, number> }) {
  const entries = Object.entries(counts).filter(([, count]) => count > 0) as [DutyLeaveReason, number][]
  const max = Math.max(...entries.map(([, c]) => c), 1)

  if (entries.length === 0) {
    return <p className="text-sm text-slate-400">No duty leave recorded yet.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {entries
        .sort((a, b) => b[1] - a[1])
        .map(([reason, count]) => (
          <div key={reason} className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-xs text-slate-500 dark:text-slate-400">{reason}</span>
            <div className="h-4 flex-1 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded bg-amber-500"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
            <span className="w-5 shrink-0 text-right text-xs font-semibold text-slate-600 dark:text-slate-300">
              {count}
            </span>
          </div>
        ))}
    </div>
  )
}
