import { eachDayOfInterval, formatISO, getDay, parseISO } from 'date-fns'
import { useState, type Dispatch } from 'react'
import type { DayOfWeek } from '../../../db/types'
import type { WizardAction, WizardState } from '../wizardState'
import { WEEKDAYS } from '../wizardState'
import { fieldInput, fieldLabel, secondaryButton } from '../inputStyles'

function saturdaysInRange(startDate: string, endDate: string): string[] {
  if (startDate > endDate) return []
  return eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) })
    .filter((d) => getDay(d) === 6)
    .map((d) => formatISO(d, { representation: 'date' }))
}

export function CalendarExceptionsStep({ state, dispatch }: { state: WizardState; dispatch: Dispatch<WizardAction> }) {
  const [date, setDate] = useState('')
  const [name, setName] = useState('')
  const [showSaturdays, setShowSaturdays] = useState(false)
  const saturdays = saturdaysInRange(state.startDate, state.endDate)
  const workingSaturdayCount = Object.keys(state.workingSaturdays).length

  const addHoliday = () => {
    if (!date) return
    dispatch({ type: 'ADD_HOLIDAY', holiday: { id: crypto.randomUUID(), date, name: name.trim() || 'Holiday' } })
    setDate('')
    setName('')
  }

  const sortedHolidays = [...state.holidays].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Optional — you probably don't know the full holiday list yet. Add what you know now and the rest anytime
        from Settings.
      </p>

      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
        <div className="flex flex-col gap-1">
          <label className={fieldLabel} htmlFor="holiday-date">
            Date
          </label>
          <input
            id="holiday-date"
            type="date"
            className={fieldInput}
            min={state.startDate}
            max={state.endDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={fieldLabel} htmlFor="holiday-name">
            Name (optional)
          </label>
          <input
            id="holiday-name"
            className={fieldInput}
            placeholder="e.g. Onam"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <button type="button" className={secondaryButton} disabled={!date} onClick={addHoliday}>
          + Add holiday
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {sortedHolidays.map((holiday) => (
          <div
            key={holiday.id}
            className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700"
          >
            <div>
              <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{holiday.name}</div>
              <div className="text-xs text-slate-400">{holiday.date}</div>
            </div>
            <button
              type="button"
              className="text-xs font-medium text-red-500"
              onClick={() => dispatch({ type: 'REMOVE_HOLIDAY', id: holiday.id })}
            >
              Remove
            </button>
          </div>
        ))}
        {sortedHolidays.length === 0 && <p className="text-xs text-slate-400">No holidays added yet — that's fine.</p>}
      </div>

      <button
        type="button"
        className="text-left text-xs font-semibold text-emerald-600 dark:text-emerald-400"
        onClick={() => setShowSaturdays((v) => !v)}
      >
        {showSaturdays ? 'Hide' : 'Working Saturdays'} ({workingSaturdayCount} set) {showSaturdays ? '▲' : '▼'}
      </button>

      {showSaturdays && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-slate-400">Some Saturdays might follow a weekday's timetable. Leave the rest as "Not working".</p>
          {saturdays.map((satDate) => (
            <div key={satDate} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700">
              <span className="text-sm text-slate-700 dark:text-slate-200">{satDate}</span>
              <select
                className={`${fieldInput} w-auto`}
                value={state.workingSaturdays[satDate] ?? ''}
                onChange={(e) =>
                  dispatch({
                    type: 'SET_WORKING_SATURDAY',
                    date: satDate,
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
      )}
    </div>
  )
}
