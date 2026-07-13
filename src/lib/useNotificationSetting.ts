import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import { DEFAULT_SETTINGS } from '../db/types'

export const notificationsSupported = typeof window !== 'undefined' && 'Notification' in window

export function useNotificationSetting() {
  const enabled = useLiveQuery(async () => {
    const row = await db.settings.get('notificationsEnabled')
    return (row?.value as boolean) ?? DEFAULT_SETTINGS.notificationsEnabled
  }, [], DEFAULT_SETTINGS.notificationsEnabled)

  const setEnabled = async (value: boolean) => {
    let granted = value
    if (value && notificationsSupported && Notification.permission === 'default') {
      granted = (await Notification.requestPermission()) === 'granted'
    } else if (value && notificationsSupported && Notification.permission !== 'granted') {
      granted = false
    }
    await db.settings.put({ key: 'notificationsEnabled', value: granted })
  }

  return { enabled, setEnabled }
}
