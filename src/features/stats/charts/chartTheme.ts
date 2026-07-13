export interface ChartTheme {
  grid: string
  axis: string
  muted: string
  textPrimary: string
  textSecondary: string
  surface: string
}

const LIGHT: ChartTheme = {
  grid: '#e2e8f0',
  axis: '#cbd5e1',
  muted: '#94a3b8',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  surface: '#ffffff',
}

const DARK: ChartTheme = {
  grid: '#334155',
  axis: '#475569',
  muted: '#94a3b8',
  textPrimary: '#f1f5f9',
  textSecondary: '#cbd5e1',
  surface: '#0f172a',
}

export function chartTheme(isDark: boolean): ChartTheme {
  return isDark ? DARK : LIGHT
}
