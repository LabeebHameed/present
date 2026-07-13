import { useState, type Dispatch } from 'react'
import type { DayOfWeek } from '../../../db/types'
import type { WizardAction, WizardState } from '../wizardState'
import { WEEKDAYS } from '../wizardState'
import { fieldInput, secondaryButton } from '../inputStyles'

export function TimetableStep({ state, dispatch }: { state: WizardState; dispatch: Dispatch<WizardAction> }) {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(1)
  const [copyFrom, setCopyFrom] = useState<DayOfWeek | ''>('')

  const daySlots = state.slots
    .filter((s) => s.dayOfWeek === selectedDay)
    .sort((a, b) => a.periodIndex - b.periodIndex)

  const addPeriod = () => {
    const nextIndex = daySlots.length ? Math.max(...daySlots.map((s) => s.periodIndex)) + 1 : 1
    dispatch({
      type: 'UPSERT_SLOT',
      slot: {
        id: crypto.randomUUID(),
        dayOfWeek: selectedDay,
        periodIndex: nextIndex,
        startTime: '',
        endTime: '',
        subjectId: state.subjects[0]?.id ?? '',
      },
    })
  }

  if (state.subjects.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Add at least one subject in the previous step before building the timetable.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {WEEKDAYS.map(({ day, short }) => (
          <button
            key={day}
            type="button"
            onClick={() => setSelectedDay(day)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
              selectedDay === day
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {short}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <select
          className={fieldInput}
          value={copyFrom}
          onChange={(e) => setCopyFrom(e.target.value ? (Number(e.target.value) as DayOfWeek) : '')}
        >
          <option value="">Copy periods from...</option>
          {WEEKDAYS.filter((w) => w.day !== selectedDay).map((w) => (
            <option key={w.day} value={w.day}>
              {w.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={secondaryButton}
          disabled={copyFrom === ''}
          onClick={() => {
            if (copyFrom === '') return
            dispatch({ type: 'COPY_DAY', from: copyFrom, to: selectedDay })
            setCopyFrom('')
          }}
        >
          Copy
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {daySlots.map((slot) => (
          <div key={slot.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-6 shrink-0 text-center text-xs font-semibold text-slate-400">
                P{slot.periodIndex}
              </span>
              <select
                className={fieldInput}
                value={slot.subjectId}
                onChange={(e) => dispatch({ type: 'UPSERT_SLOT', slot: { ...slot, subjectId: e.target.value } })}
              >
                {state.subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name || subject.code || 'Untitled subject'}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="shrink-0 text-xs font-medium text-red-500"
                onClick={() => dispatch({ type: 'REMOVE_SLOT', id: slot.id })}
              >
                Remove
              </button>
            </div>
            <div className="flex items-center gap-2 pl-8">
              <input
                type="time"
                className={fieldInput}
                value={slot.startTime}
                onChange={(e) => dispatch({ type: 'UPSERT_SLOT', slot: { ...slot, startTime: e.target.value } })}
              />
              <span className="text-slate-400">–</span>
              <input
                type="time"
                className={fieldInput}
                value={slot.endTime}
                onChange={(e) => dispatch({ type: 'UPSERT_SLOT', slot: { ...slot, endTime: e.target.value } })}
              />
            </div>
          </div>
        ))}
      </div>

      <button type="button" className={secondaryButton} onClick={addPeriod}>
        + Add period
      </button>
    </div>
  )
}
