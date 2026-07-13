import { eachDayOfInterval, formatISO, getDay, parseISO } from 'date-fns'
import type { Dispatch } from 'react'
import type { DayOfWeek } from '../../../db/types'
import type { WizardAction, WizardState } from '../wizardState'
import { WEEKDAYS } from '../wizardState'
import { fieldInput } from '../inputStyles'

function saturdaysInRange(startDate: string, endDate: string): string[] {
  if (startDate > endDate) return []
  return eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) })
    .filter((d) => getDay(d) === 6)
    .map((d) => formatISO(d, { representation: 'date' }))
}

export function SaturdaysStep({ state, dispatch }: { state: WizardState; dispatch: Dispatch<WizardAction> }) {
  const saturdays = saturdaysInRange(state.startDate, state.endDate)

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Some Saturdays might follow a weekday's timetable. Leave the rest as "Not working".
      </p>

      <div className="flex flex-col gap-2">
        {saturdays.map((date) => (
          <div key={date} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700">
            <span className="text-sm text-slate-700 dark:text-slate-200">{date}</span>
            <select
              className={`${fieldInput} w-auto`}
              value={state.workingSaturdays[date] ?? ''}
              onChange={(e) =>
                dispatch({
                  type: 'SET_WORKING_SATURDAY',
                  date,
                  mirrorsDay: e.target.value ? (Number(e.target.value) as DayOfWeek) : null,
                })
              }
            >
              <option value="">Not working</option>
              {WEEKDAYS.map((w) => (
                <option key={w.day} value={w.day}>
                  Follows {w.label}
                </option>
              ))}
            </select>
          </div>
        ))}
        {saturdays.length === 0 && <p className="text-xs text-slate-400">No Saturdays in the semester range.</p>}
      </div>
    </div>
  )
}
