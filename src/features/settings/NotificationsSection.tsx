import { notificationsSupported, useNotificationSetting } from '../../lib/useNotificationSetting'

export function NotificationsSection() {
  const { enabled, setEnabled } = useNotificationSetting()

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">Notifications</h2>
      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
        <input
          type="checkbox"
          checked={enabled}
          disabled={!notificationsSupported}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        Remind me about unmarked classes
      </label>
      <p className="text-xs text-slate-400 dark:text-slate-500">
        {notificationsSupported
          ? "Best-effort reminders while the app is open. True scheduled push (e.g. \"class in 10 minutes\") needs a server and isn't available in this offline-first version."
          : "This browser doesn't support notifications."}
      </p>
    </section>
  )
}
