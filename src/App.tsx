import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { TodayPage } from './features/today/TodayPage'
import { SetupPage } from './features/setup/SetupPage'
import { CalendarPage } from './features/calendar/CalendarPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { AnalyticsPage } from './features/analytics/AnalyticsPage'
import { SimulatorPage } from './features/simulator/SimulatorPage'
import { ReportPage } from './features/report/ReportPage'
import { useTheme } from './lib/useTheme'

// Recharts is heavy — keep it out of the main bundle for a mobile-first PWA.
const StatsPage = lazy(() => import('./features/stats/StatsPage').then((m) => ({ default: m.StatsPage })))

function App() {
  useTheme()

  return (
    <div className="flex min-h-svh flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <main className="flex flex-1 flex-col pb-16">
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/simulator" element={<SimulatorPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route
            path="/stats"
            element={
              <Suspense fallback={<div className="flex flex-1 items-center justify-center text-sm text-slate-400">Loading…</div>}>
                <StatsPage />
              </Suspense>
            }
          />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}

export default App
