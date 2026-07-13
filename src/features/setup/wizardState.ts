import type { DayOfWeek, DutyLeavePolicy } from '../../db/types'

export interface SubjectDraft {
  id: string
  name: string
  code: string
  facultyName: string
  color: string
}

export interface SlotDraft {
  id: string
  dayOfWeek: DayOfWeek
  periodIndex: number
  startTime: string
  endTime: string
  subjectId: string
}

export interface HolidayDraft {
  id: string
  date: string
  name: string
}

export interface WizardState {
  name: string
  startDate: string
  endDate: string
  targetPercent: number
  dutyLeavePolicy: DutyLeavePolicy
  subjects: SubjectDraft[]
  slots: SlotDraft[]
  holidays: HolidayDraft[]
  workingSaturdays: Record<string, DayOfWeek>
}

export const SUBJECT_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#84cc16',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
]

export const WEEKDAYS: { day: DayOfWeek; label: string; short: string }[] = [
  { day: 1, label: 'Monday', short: 'Mon' },
  { day: 2, label: 'Tuesday', short: 'Tue' },
  { day: 3, label: 'Wednesday', short: 'Wed' },
  { day: 4, label: 'Thursday', short: 'Thu' },
  { day: 5, label: 'Friday', short: 'Fri' },
  { day: 6, label: 'Saturday', short: 'Sat' },
]

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function inFourMonths(): string {
  const d = new Date()
  d.setMonth(d.getMonth() + 4)
  return d.toISOString().slice(0, 10)
}

export function createInitialWizardState(): WizardState {
  return {
    name: '',
    startDate: todayISO(),
    endDate: inFourMonths(),
    targetPercent: 75,
    dutyLeavePolicy: 'excluded',
    subjects: [],
    slots: [],
    holidays: [],
    workingSaturdays: {},
  }
}

export function basicsStepIsValid(state: WizardState): boolean {
  return (
    state.name.trim().length > 0 &&
    state.startDate <= state.endDate &&
    state.targetPercent > 0 &&
    state.targetPercent <= 100
  )
}

export function subjectsStepIsValid(state: WizardState): boolean {
  return state.subjects.length > 0 && state.subjects.every((s) => s.name.trim().length > 0)
}

export type WizardAction =
  | { type: 'SET_BASICS'; patch: Partial<Pick<WizardState, 'name' | 'startDate' | 'endDate' | 'targetPercent' | 'dutyLeavePolicy'>> }
  | { type: 'ADD_SUBJECT' }
  | { type: 'UPDATE_SUBJECT'; id: string; patch: Partial<Omit<SubjectDraft, 'id'>> }
  | { type: 'REMOVE_SUBJECT'; id: string }
  | { type: 'UPSERT_SLOT'; slot: SlotDraft }
  | { type: 'REMOVE_SLOT'; id: string }
  | { type: 'COPY_DAY'; from: DayOfWeek; to: DayOfWeek }
  | { type: 'ADD_HOLIDAY'; holiday: HolidayDraft }
  | { type: 'REMOVE_HOLIDAY'; id: string }
  | { type: 'SET_WORKING_SATURDAY'; date: string; mirrorsDay: DayOfWeek | null }

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_BASICS':
      return { ...state, ...action.patch }

    case 'ADD_SUBJECT': {
      const color = SUBJECT_COLORS[state.subjects.length % SUBJECT_COLORS.length]
      const subject: SubjectDraft = { id: crypto.randomUUID(), name: '', code: '', facultyName: '', color }
      return { ...state, subjects: [...state.subjects, subject] }
    }

    case 'UPDATE_SUBJECT':
      return {
        ...state,
        subjects: state.subjects.map((s) => (s.id === action.id ? { ...s, ...action.patch } : s)),
      }

    case 'REMOVE_SUBJECT':
      return {
        ...state,
        subjects: state.subjects.filter((s) => s.id !== action.id),
        slots: state.slots.filter((slot) => slot.subjectId !== action.id),
      }

    case 'UPSERT_SLOT': {
      const withoutOld = state.slots.filter((s) => s.id !== action.slot.id)
      return { ...state, slots: [...withoutOld, action.slot] }
    }

    case 'REMOVE_SLOT':
      return { ...state, slots: state.slots.filter((s) => s.id !== action.id) }

    case 'COPY_DAY': {
      const sourceSlots = state.slots.filter((s) => s.dayOfWeek === action.from)
      const targetOthers = state.slots.filter((s) => s.dayOfWeek !== action.to)
      const copied = sourceSlots.map((s) => ({ ...s, id: crypto.randomUUID(), dayOfWeek: action.to }))
      return { ...state, slots: [...targetOthers, ...copied] }
    }

    case 'ADD_HOLIDAY':
      return { ...state, holidays: [...state.holidays, action.holiday] }

    case 'REMOVE_HOLIDAY':
      return { ...state, holidays: state.holidays.filter((h) => h.id !== action.id) }

    case 'SET_WORKING_SATURDAY': {
      const workingSaturdays = { ...state.workingSaturdays }
      if (action.mirrorsDay === null) {
        delete workingSaturdays[action.date]
      } else {
        workingSaturdays[action.date] = action.mirrorsDay
      }
      return { ...state, workingSaturdays }
    }

    default:
      return state
  }
}
