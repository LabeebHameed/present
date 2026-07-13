import { useReducer, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { basicsStepIsValid, createInitialWizardState, subjectsStepIsValid, wizardReducer } from './wizardState'
import { commitWizard } from './persistWizard'
import { primaryButton, secondaryButton } from './inputStyles'
import { BasicsStep } from './steps/BasicsStep'
import { SubjectsStep } from './steps/SubjectsStep'
import { TimetableStep } from './steps/TimetableStep'
import { HolidaysStep } from './steps/HolidaysStep'
import { SaturdaysStep } from './steps/SaturdaysStep'
import { ReviewStep } from './steps/ReviewStep'

const STEPS = ['Basics', 'Subjects', 'Timetable', 'Holidays', 'Saturdays', 'Review'] as const

export function SetupWizard({ onCancel }: { onCancel?: () => void }) {
  const [state, dispatch] = useReducer(wizardReducer, undefined, createInitialWizardState)
  const [stepIndex, setStepIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const step = STEPS[stepIndex]
  const isLastStep = stepIndex === STEPS.length - 1

  const canGoNext =
    step === 'Basics' ? basicsStepIsValid(state) : step === 'Subjects' ? subjectsStepIsValid(state) : true

  const handleFinish = async () => {
    setSaving(true)
    try {
      await commitWizard(state)
      navigate('/')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        {STEPS.map((label, index) => (
          <div
            key={label}
            className={`flex shrink-0 items-center gap-1.5 text-xs font-medium ${
              index === stepIndex
                ? 'text-emerald-600 dark:text-emerald-400'
                : index < stepIndex
                  ? 'text-slate-400'
                  : 'text-slate-300 dark:text-slate-600'
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                index === stepIndex
                  ? 'bg-emerald-600 text-white'
                  : index < stepIndex
                    ? 'bg-slate-300 text-white dark:bg-slate-600'
                    : 'bg-slate-100 dark:bg-slate-800'
              }`}
            >
              {index + 1}
            </span>
            {label}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {step === 'Basics' && <BasicsStep state={state} dispatch={dispatch} />}
        {step === 'Subjects' && <SubjectsStep state={state} dispatch={dispatch} />}
        {step === 'Timetable' && <TimetableStep state={state} dispatch={dispatch} />}
        {step === 'Holidays' && <HolidaysStep state={state} dispatch={dispatch} />}
        {step === 'Saturdays' && <SaturdaysStep state={state} dispatch={dispatch} />}
        {step === 'Review' && <ReviewStep state={state} />}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-200 p-4 dark:border-slate-800">
        <button
          type="button"
          className={secondaryButton}
          onClick={() => (stepIndex === 0 ? onCancel?.() : setStepIndex((i) => i - 1))}
        >
          {stepIndex === 0 ? 'Cancel' : 'Back'}
        </button>

        {isLastStep ? (
          <button type="button" className={primaryButton} disabled={saving} onClick={handleFinish}>
            {saving ? 'Saving…' : 'Finish setup'}
          </button>
        ) : (
          <button
            type="button"
            className={primaryButton}
            disabled={!canGoNext}
            onClick={() => setStepIndex((i) => i + 1)}
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
}
