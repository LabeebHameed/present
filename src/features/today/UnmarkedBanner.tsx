export function UnmarkedBanner({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
      🔔 {count} unmarked class{count === 1 ? '' : 'es'} today — don't forget to mark attendance.
    </div>
  )
}
