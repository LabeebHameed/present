import type { Dispatch } from 'react'
import { BottomSheet } from '../../../components/BottomSheet'
import type { DayOfWeek } from '../../../db/types'
import type { SubjectDraft, WizardAction } from '../wizardState'
import { WEEKDAYS } from '../wizardState'
import { secondaryButton } from '../inputStyles'

export function TimetableCellSheet({
  dayOfWeek,
  periodStart,
  periodEnd,
  currentSubjectId,
  subjects,
  dispatch,
  onClose,
}: {
  dayOfWeek: DayOfWeek
  periodStart: number
  periodEnd: number
  currentSubjectId: string | null
  subjects: SubjectDraft[]
  dispatch: Dispatch<WizardAction>
  onClose: () => void
}) {
  const dayLabel = WEEKDAYS.find((w) => w.day === dayOfWeek)?.label ?? ''
  const periodLabel = periodStart === periodEnd ? `Period ${periodStart}` : `Periods ${periodStart}–${periodEnd}`
  const isMerged = periodStart !== periodEnd

  const setSubject = (subjectId: string | null) => {
    for (let p = periodStart; p <= periodEnd; p++) {
      dispatch({ type: 'SET_CELL', dayOfWeek, periodIndex: p, subjectId })
    }
    onClose()
  }

  const split = () => {
    dispatch({ type: 'SPLIT_CELL_GROUP', dayOfWeek, fromPeriodIndex: periodStart, toPeriodIndex: periodEnd })
    onClose()
  }

  return (
    <BottomSheet title={`${dayLabel} — ${periodLabel}`} onClose={onClose}>
      <div className="flex flex-col gap-1">
        {subjects.map((subject) => (
          <button
            key={subject.id}
            type="button"
            onClick={() => setSubject(subject.id)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm ${
              currentSubjectId === subject.id
                ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950'
                : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: subject.color }} />
            {subject.name || 'Untitled subject'}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {currentSubjectId && (
          <button type="button" className={secondaryButton} onClick={() => setSubject(null)}>
            Clear
          </button>
        )}
        {isMerged && (
          <button type="button" className={secondaryButton} onClick={split}>
            Split these periods
          </button>
        )}
      </div>
    </BottomSheet>
  )
}
