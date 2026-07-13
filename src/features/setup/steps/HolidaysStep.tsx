import { useState, type Dispatch } from 'react'
import type { WizardAction, WizardState } from '../wizardState'
import { fieldInput, fieldLabel, secondaryButton } from '../inputStyles'

export function HolidaysStep({ state, dispatch }: { state: WizardState; dispatch: Dispatch<WizardAction> }) {
  const [date, setDate] = useState('')
  const [name, setName] = useState('')

  const addHoliday = () => {
    if (!date) return
    dispatch({ type: 'ADD_HOLIDAY', holiday: { id: crypto.randomUUID(), date, name: name.trim() || 'Holiday' } })
    setDate('')
    setName('')
  }

  const sorted = [...state.holidays].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Add dates with no classes — festivals, breaks, exam days. These are skipped automatically.
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
        {sorted.map((holiday) => (
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
        {sorted.length === 0 && <p className="text-xs text-slate-400">No holidays added yet.</p>}
      </div>
    </div>
  )
}
