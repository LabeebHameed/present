function ringColor(percent: number, target: number): string {
  if (percent >= target) return '#10b981'
  if (percent >= target - 10) return '#f59e0b'
  return '#ef4444'
}

export function PercentRing({
  percent,
  target,
  size = 64,
  strokeWidth = 6,
}: {
  percent: number
  target: number
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, percent))
  const offset = circumference * (1 - clamped / 100)
  const color = ringColor(percent, target)

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-slate-100 dark:stroke-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-200">
        {percent.toFixed(0)}%
      </div>
    </div>
  )
}
