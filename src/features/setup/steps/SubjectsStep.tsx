import type { Dispatch } from 'react'
import type { WizardAction, WizardState } from '../wizardState'
import { SUBJECT_COLORS } from '../wizardState'
import { fieldInput, fieldLabel, secondaryButton } from '../inputStyles'

export function SubjectsStep({ state, dispatch }: { state: WizardState; dispatch: Dispatch<WizardAction> }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Add every subject you have this semester. You'll build the weekly timetable from these next.
      </p>

      {state.subjects.map((subject, index) => (
        <div
          key={subject.id}
          className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-700"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Subject {index + 1}</span>
            <button
              type="button"
              className="text-xs font-medium text-red-500"
              onClick={() => dispatch({ type: 'REMOVE_SUBJECT', id: subject.id })}
            >
              Remove
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Name</label>
              <input
                className={fieldInput}
                placeholder="e.g. Database Systems"
                value={subject.name}
                onChange={(e) => dispatch({ type: 'UPDATE_SUBJECT', id: subject.id, patch: { name: e.target.value } })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={fieldLabel}>Code</label>
              <input
                className={fieldInput}
                placeholder="e.g. DBMS"
                value={subject.code}
                onChange={(e) => dispatch({ type: 'UPDATE_SUBJECT', id: subject.id, patch: { code: e.target.value } })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className={fieldLabel}>Faculty</label>
            <input
              className={fieldInput}
              placeholder="e.g. Dr. Arun"
              value={subject.facultyName}
              onChange={(e) =>
                dispatch({ type: 'UPDATE_SUBJECT', id: subject.id, patch: { facultyName: e.target.value } })
              }
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={fieldLabel}>Color</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={color}
                  onClick={() => dispatch({ type: 'UPDATE_SUBJECT', id: subject.id, patch: { color } })}
                  className="h-7 w-7 rounded-full"
                  style={{
                    backgroundColor: color,
                    outline: subject.color === color ? '2px solid currentColor' : 'none',
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      ))}

      <button type="button" className={secondaryButton} onClick={() => dispatch({ type: 'ADD_SUBJECT' })}>
        + Add subject
      </button>
    </div>
  )
}
