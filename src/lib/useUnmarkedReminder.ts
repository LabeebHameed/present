import { useEffect } from 'react'
import { notificationsSupported } from './useNotificationSetting'

const LAST_REMINDER_KEY = 'classtrack:lastReminderDate'

/**
 * Best-effort, in-session reminder only — fires at most once per calendar day
 * while the app happens to be open. There is no background scheduler here:
 * true push notifications (e.g. "class in 10 minutes") need a server.
 */
export function useUnmarkedReminder(enabled: boolean, unmarkedCount: number, today: string, semesterName: string) {
  useEffect(() => {
    if (!enabled || unmarkedCount === 0) return
    if (!notificationsSupported || Notification.permission !== 'granted') return
    if (localStorage.getItem(LAST_REMINDER_KEY) === today) return

    localStorage.setItem(LAST_REMINDER_KEY, today)
    new Notification('Unmarked classes', {
      body: `You have ${unmarkedCount} unmarked class${unmarkedCount === 1 ? '' : 'es'} today in ${semesterName}.`,
    })
  }, [enabled, unmarkedCount, today, semesterName])
}
