import type { Subject } from '../../db/types'
import type { SubjectStats } from '../../engine/stats'
import { PercentRing } from '../../components/PercentRing'

export function AnalyticsCard({
  subject,
  stats,
  target,
  safeToMiss,
  neededToAttend,
  predictedPercent,
}: {
  subject: Subject
  stats: SubjectStats
  target: number
  safeToMiss: number
  neededToAttend: number
  predictedPercent: number | null
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
      <div className="flex items-center gap-3">
        <PercentRing percent={stats.percent} target={target} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: subject.color }} />
            <span className="font-medium text-slate-800 dark:text-slate-100">{subject.name}</span>
          </div>
          <div className="text-xs text-slate-400">
            {stats.attended} / {stats.total} classes · target {target}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          Can miss <span className="font-semibold">{Number.isFinite(safeToMiss) ? safeToMiss : '∞'}</span>
        </div>
        <div className="rounded-xl bg-amber-50 p-2 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          Need{' '}
          <span className="font-semibold">
            {Number.isFinite(neededToAttend) ? neededToAttend : '∞'}
          </span>{' '}
          consecutive
        </div>
      </div>

      {predictedPercent !== null && (
        <p className="text-xs text-slate-400">
          If you attend every class this week: <span className="font-medium text-slate-600 dark:text-slate-300">{predictedPercent.toFixed(1)}%</span>
        </p>
      )}
    </div>
  )
}
