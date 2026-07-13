import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useIsDarkMode } from '../../../lib/useIsDarkMode'
import { chartTheme } from './chartTheme'
import type { Subject } from '../../../db/types'
import type { SubjectStats } from '../../../engine/stats'

interface BarDatum {
  subjectId: string
  name: string
  percent: number
  attended: number
  total: number
  color: string
}

function BarTooltip({ active, payload, theme }: { active?: boolean; payload?: { payload: BarDatum }[]; theme: ReturnType<typeof chartTheme> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div
      className="rounded-lg border px-2.5 py-1.5 text-xs shadow-sm"
      style={{ background: theme.surface, borderColor: theme.grid, color: theme.textPrimary }}
    >
      <div className="flex items-center gap-1.5 font-semibold">
        <span className="inline-block h-2 w-3 rounded-sm" style={{ backgroundColor: d.color }} />
        {d.percent.toFixed(1)}%
      </div>
      <div style={{ color: theme.textSecondary }}>
        {d.name} · {d.attended}/{d.total}
      </div>
    </div>
  )
}

export function SubjectBarChart({
  subjects,
  bySubject,
  target,
}: {
  subjects: Subject[]
  bySubject: Record<string, SubjectStats>
  target: number
}) {
  const isDark = useIsDarkMode()
  const theme = chartTheme(isDark)

  const data: BarDatum[] = subjects.map((s) => {
    const stats = bySubject[s.id] ?? { attended: 0, total: 0, percent: 0 }
    return {
      subjectId: s.id,
      name: s.code || s.name,
      percent: stats.percent,
      attended: stats.attended,
      total: stats.total,
      color: s.color,
    }
  })

  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: theme.muted, fontSize: 11 }}
            axisLine={{ stroke: theme.axis }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fill: theme.muted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          {[25, 50, 75].map((y) => (
            <ReferenceLine key={y} y={y} stroke={theme.grid} strokeWidth={1} />
          ))}
          <ReferenceLine y={target} stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1.5} />
          <Tooltip content={<BarTooltip theme={theme} />} cursor={{ fill: theme.grid, opacity: 0.3 }} />
          <Bar dataKey="percent" radius={[4, 4, 0, 0]} maxBarSize={24}>
            {data.map((d) => (
              <Cell key={d.subjectId} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
