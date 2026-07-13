import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { format, parseISO } from 'date-fns'
import { useIsDarkMode } from '../../../lib/useIsDarkMode'
import { chartTheme } from './chartTheme'
import type { WeekBucket } from '../../../engine/trend'

function TrendTooltip({
  active,
  payload,
  theme,
}: {
  active?: boolean
  payload?: { payload: WeekBucket }[]
  theme: ReturnType<typeof chartTheme>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div
      className="rounded-lg border px-2.5 py-1.5 text-xs shadow-sm"
      style={{ background: theme.surface, borderColor: theme.grid, color: theme.textPrimary }}
    >
      <div className="flex items-center gap-1.5 font-semibold">
        <span className="inline-block h-0.5 w-3 rounded-full" style={{ backgroundColor: '#059669' }} />
        {d.percent.toFixed(1)}%
      </div>
      <div style={{ color: theme.textSecondary }}>
        Week of {format(parseISO(d.weekStart), 'MMM d')} · {d.attended}/{d.total}
      </div>
    </div>
  )
}

export function TrendLineChart({ buckets }: { buckets: WeekBucket[] }) {
  const isDark = useIsDarkMode()
  const theme = chartTheme(isDark)
  const lineColor = isDark ? '#34d399' : '#059669'

  const data = buckets.map((b) => ({ ...b, label: format(parseISO(b.weekStart), 'MMM d') }))

  return (
    <div style={{ width: '100%', height: 180 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={theme.grid} strokeDasharray="" />
          <XAxis dataKey="label" tick={{ fill: theme.muted, fontSize: 11 }} axisLine={{ stroke: theme.axis }} tickLine={false} />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 50, 100]}
            tick={{ fill: theme.muted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<TrendTooltip theme={theme} />} cursor={{ stroke: theme.axis, strokeWidth: 1 }} />
          <Line
            type="monotone"
            dataKey="percent"
            stroke={lineColor}
            strokeWidth={2}
            dot={{ r: 4, fill: lineColor, stroke: theme.surface, strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
