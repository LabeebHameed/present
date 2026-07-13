import type { Dispatch } from 'react'
import type { WizardAction, WizardState } from '../wizardState'
import type { DutyLeavePolicy } from '../../../db/types'
import { fieldInput, fieldLabel } from '../inputStyles'

const policyOptions: { value: DutyLeavePolicy; label: string; description: string }[] = [
  { value: 'excluded', label: 'Ignore', description: 'Duty leave does not count in the denominator' },
  { value: 'present', label: 'Count as present', description: 'Duty leave boosts your attendance' },
  { value: 'absent', label: 'Count as absent', description: 'Duty leave counts against you' },
]

export function BasicsStep({ state, dispatch }: { state: WizardState; dispatch: Dispatch<WizardAction> }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label className={fieldLabel} htmlFor="semester-name">
          Semester name
        </label>
        <input
          id="semester-name"
          className={fieldInput}
          placeholder="e.g. Semester 5"
          value={state.name}
          onChange={(e) => dispatch({ type: 'SET_BASICS', patch: { name: e.target.value } })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={fieldLabel} htmlFor="start-date">
            Start date
          </label>
          <input
            id="start-date"
            type="date"
            className={fieldInput}
            value={state.startDate}
            onChange={(e) => dispatch({ type: 'SET_BASICS', patch: { startDate: e.target.value } })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={fieldLabel} htmlFor="end-date">
            End date
          </label>
          <input
            id="end-date"
            type="date"
            className={fieldInput}
            value={state.endDate}
            onChange={(e) => dispatch({ type: 'SET_BASICS', patch: { endDate: e.target.value } })}
          />
        </div>
      </div>

      {state.startDate > state.endDate && (
        <p className="text-xs font-medium text-red-500">End date must be after the start date.</p>
      )}

      <div className="flex flex-col gap-1">
        <label className={fieldLabel} htmlFor="target-percent">
          Target attendance %
        </label>
        <input
          id="target-percent"
          type="number"
          min={1}
          max={100}
          className={fieldInput}
          value={state.targetPercent}
          onChange={(e) =>
            dispatch({ type: 'SET_BASICS', patch: { targetPercent: Number(e.target.value) || 0 } })
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className={fieldLabel}>Duty leave policy</span>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          How should duty leave (NSS, hackathons, sports, etc.) affect your percentage? You can change this later
          in Settings.
        </p>
        <div className="flex flex-col gap-2">
          {policyOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => dispatch({ type: 'SET_BASICS', patch: { dutyLeavePolicy: option.value } })}
              className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                state.dutyLeavePolicy === option.value
                  ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="font-medium text-slate-800 dark:text-slate-100">{option.label}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{option.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
