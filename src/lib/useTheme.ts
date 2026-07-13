import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import type { AppSettings } from '../db/types'
import { DEFAULT_SETTINGS } from '../db/types'

function applyTheme(theme: AppSettings['theme']) {
  const root = document.documentElement
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark)
  root.classList.toggle('dark', isDark)
}

export function useTheme() {
  const theme = useLiveQuery(async () => {
    const row = await db.settings.get('theme')
    return (row?.value as AppSettings['theme']) ?? DEFAULT_SETTINGS.theme
  }, [], DEFAULT_SETTINGS.theme)

  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => applyTheme('system')
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [theme])

  const setTheme = async (next: AppSettings['theme']) => {
    await db.settings.put({ key: 'theme', value: next })
  }

  return { theme, setTheme }
}
