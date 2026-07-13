import { useEffect, useReducer, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { basicsStepIsValid, createInitialWizardState, subjectsStepIsValid, wizardReducer, type WizardState } from './wizardState'
import { commitWizard } from './persistWizard'
import { clearWizardDraft, loadWizardDraft, saveWizardDraft } from './wizardDraft'
import { primaryButton, secondaryButton } from './inputStyles'
import { BasicsStep } from './steps/BasicsStep'
import { SubjectsStep } from './steps/SubjectsStep'
import { TimetableStep } from './steps/TimetableStep'
import { CalendarExceptionsStep } from './steps/CalendarExceptionsStep'
import { ReviewStep } from './steps/ReviewStep'

const STEPS = ['Basics', 'Subjects', 'Timetable', 'Calendar', 'Review'] as const

export function SetupWizard({
  onCancel,
  initialState,
}: {
  onCancel?: () => void
  initialState?: WizardState
}) {
  const [state, dispatch] = useReducer(wizardReducer, undefined, () => initialState ?? createInitialWizardState())
  const [stepIndex, setStepIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [restoredDraft, setRestoredDraft] = useState(false)
  const navigate = useNavigate()
  const hydrated = useRef(Boolean(initialState))

  // Restore an in-progress draft (state + which step) on first mount, unless we
  // were handed explicit initial state (e.g. an imported workspace).
  useEffect(() => {
    if (initialState) return
    let cancelled = false
    loadWizardDraft().then((draft) => {
      if (cancelled || !draft) return
      dispatch({ type: 'LOAD_DRAFT', state: draft.state })
      setStepIndex(Math.min(draft.stepIndex, STEPS.length - 1))
      setRestoredDraft(true)
      hydrated.current = true
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Autosave the draft as the user works, debounced. Skipped until the initial
  // load/restore has settled so we don't immediately overwrite a saved draft
  // with the blank initial state on the very first render.
  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true
      return
    }
    const timeout = setTimeout(() => saveWizardDraft({ state, stepIndex }), 400)
    return () => clearTimeout(timeout)
  }, [state, stepIndex])

  const step = STEPS[stepIndex]
  const isLastStep = stepIndex === STEPS.length - 1

  const canGoNext =
    step === 'Basics' ? basicsStepIsValid(state) : step === 'Subjects' ? subjectsStepIsValid(state) : true

  const handleFinish = async () => {
    setSaving(true)
    try {
      await commitWizard(state)
      await clearWizardDraft()
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

      {restoredDraft && (
        <p className="bg-emerald-50 px-4 py-1.5 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          Picked up where you left off.
        </p>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {step === 'Basics' && <BasicsStep state={state} dispatch={dispatch} />}
        {step === 'Subjects' && <SubjectsStep state={state} dispatch={dispatch} />}
        {step === 'Timetable' && <TimetableStep state={state} dispatch={dispatch} />}
        {step === 'Calendar' && <CalendarExceptionsStep state={state} dispatch={dispatch} />}
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
