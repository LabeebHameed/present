import { addMonths, format } from 'date-fns'
import type { DayOfWeek, DutyLeavePolicy } from '../../db/types'
import { todayISO } from '../../lib/date'

export interface SubjectDraft {
  id: string
  name: string
  code: string
  facultyName: string
  color: string
}

/** One weekly time range per period index, shared across every day (how real timetables work). */
export interface PeriodTime {
  periodIndex: number
  startTime: string
  endTime: string
}

/** A single (day, period) cell assignment. Absence from this list means "unset". */
export interface CellDraft {
  dayOfWeek: DayOfWeek
  periodIndex: number
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
  periodCount: number
  periodTimes: PeriodTime[]
  cells: CellDraft[]
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

const DEFAULT_PERIOD_COUNT = 6

function inFourMonths(): string {
  return format(addMonths(new Date(), 4), 'yyyy-MM-dd')
}

function defaultPeriodTimes(count: number): PeriodTime[] {
  return Array.from({ length: count }, (_, i) => ({ periodIndex: i + 1, startTime: '', endTime: '' }))
}

export function createInitialWizardState(): WizardState {
  return {
    name: '',
    startDate: todayISO(),
    endDate: inFourMonths(),
    targetPercent: 75,
    dutyLeavePolicy: 'excluded',
    subjects: [],
    periodCount: DEFAULT_PERIOD_COUNT,
    periodTimes: defaultPeriodTimes(DEFAULT_PERIOD_COUNT),
    cells: [],
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
  | { type: 'SET_PERIOD_COUNT'; count: number }
  | { type: 'SET_PERIOD_TIME'; periodIndex: number; startTime: string; endTime: string }
  | { type: 'SET_CELL'; dayOfWeek: DayOfWeek; periodIndex: number; subjectId: string | null }
  | { type: 'SPLIT_CELL_GROUP'; dayOfWeek: DayOfWeek; fromPeriodIndex: number; toPeriodIndex: number }
  | { type: 'COPY_DAY'; from: DayOfWeek; to: DayOfWeek }
  | { type: 'ADD_HOLIDAY'; holiday: HolidayDraft }
  | { type: 'REMOVE_HOLIDAY'; id: string }
  | { type: 'SET_WORKING_SATURDAY'; date: string; mirrorsDay: DayOfWeek | null }
  | { type: 'LOAD_DRAFT'; state: WizardState }

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
        cells: state.cells.filter((c) => c.subjectId !== action.id),
      }

    case 'SET_PERIOD_COUNT': {
      const count = Math.max(1, Math.min(12, action.count))
      const existingByIndex = new Map(state.periodTimes.map((p) => [p.periodIndex, p]))
      const periodTimes = Array.from({ length: count }, (_, i) => {
        const periodIndex = i + 1
        return existingByIndex.get(periodIndex) ?? { periodIndex, startTime: '', endTime: '' }
      })
      return { ...state, periodCount: count, periodTimes, cells: state.cells.filter((c) => c.periodIndex <= count) }
    }

    case 'SET_PERIOD_TIME':
      return {
        ...state,
        periodTimes: state.periodTimes.map((p) =>
          p.periodIndex === action.periodIndex ? { ...p, startTime: action.startTime, endTime: action.endTime } : p,
        ),
      }

    case 'SET_CELL': {
      const withoutCell = state.cells.filter(
        (c) => !(c.dayOfWeek === action.dayOfWeek && c.periodIndex === action.periodIndex),
      )
      if (action.subjectId === null) return { ...state, cells: withoutCell }
      return {
        ...state,
        cells: [...withoutCell, { dayOfWeek: action.dayOfWeek, periodIndex: action.periodIndex, subjectId: action.subjectId }],
      }
    }

    case 'SPLIT_CELL_GROUP': {
      // Clears every period in the merged group except the first, so each becomes individually editable again.
      const cells = state.cells.filter(
        (c) =>
          !(c.dayOfWeek === action.dayOfWeek && c.periodIndex > action.fromPeriodIndex && c.periodIndex <= action.toPeriodIndex),
      )
      return { ...state, cells }
    }

    case 'COPY_DAY': {
      const sourceCells = state.cells.filter((c) => c.dayOfWeek === action.from)
      const targetOthers = state.cells.filter((c) => c.dayOfWeek !== action.to)
      const copied = sourceCells.map((c) => ({ ...c, dayOfWeek: action.to }))
      return { ...state, cells: [...targetOthers, ...copied] }
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

    case 'LOAD_DRAFT':
      return action.state

    default:
      return state
  }
}
