import { db } from '../db/schema'
import type { DayOfWeek } from '../db/types'
import type { CellDraft, HolidayDraft, PeriodTime, SubjectDraft, WizardState } from '../features/setup/wizardState'

const TEMPLATE_TYPE = 'classtrack-workspace'
const TEMPLATE_VERSION = 1

export interface WorkspaceTemplate {
  type: typeof TEMPLATE_TYPE
  version: typeof TEMPLATE_VERSION
  name: string
  startDate: string
  endDate: string
  subjects: { localId: string; name: string; code: string; facultyName: string; color: string }[]
  periodCount: number
  periodTimes: PeriodTime[]
  cells: { dayOfWeek: DayOfWeek; periodIndex: number; subjectLocalId: string }[]
  holidays: { date: string; name: string }[]
  workingSaturdays: Record<string, DayOfWeek>
}

/**
 * Exports just the semester's *structure* — subjects, timetable, holidays —
 * for sharing with classmates. Deliberately excludes attendance records,
 * target %, and duty-leave policy: those are personal, not shared.
 */
export async function exportWorkspaceTemplate(semesterId: string): Promise<WorkspaceTemplate> {
  const semester = await db.semesters.get(semesterId)
  if (!semester) throw new Error('Semester not found')

  const [subjects, slots, holidays] = await Promise.all([
    db.subjects.where('semesterId').equals(semesterId).toArray(),
    db.timetableSlots.where('semesterId').equals(semesterId).toArray(),
    db.holidays.where('semesterId').equals(semesterId).toArray(),
  ])

  const subjectIdToLocal = new Map(subjects.map((s, i) => [s.id, `s${i}`]))

  const periodTimeByIndex = new Map<number, { startTime: string; endTime: string }>()
  for (const slot of slots) {
    if (!periodTimeByIndex.has(slot.periodIndex)) {
      periodTimeByIndex.set(slot.periodIndex, { startTime: slot.startTime, endTime: slot.endTime })
    }
  }
  const periodCount = Math.max(0, ...slots.map((s) => s.periodIndex))

  return {
    type: TEMPLATE_TYPE,
    version: TEMPLATE_VERSION,
    name: semester.name,
    startDate: semester.startDate,
    endDate: semester.endDate,
    subjects: subjects.map((s) => ({
      localId: subjectIdToLocal.get(s.id)!,
      name: s.name,
      code: s.code,
      facultyName: s.facultyName,
      color: s.color,
    })),
    periodCount,
    periodTimes: Array.from({ length: periodCount }, (_, i) => {
      const periodIndex = i + 1
      return { periodIndex, ...(periodTimeByIndex.get(periodIndex) ?? { startTime: '', endTime: '' }) }
    }),
    cells: slots.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      periodIndex: s.periodIndex,
      subjectLocalId: subjectIdToLocal.get(s.subjectId)!,
    })),
    holidays: holidays.map((h) => ({ date: h.date, name: h.name })),
    workingSaturdays: semester.workingSaturdays,
  }
}

export function parseWorkspaceTemplate(text: string): WorkspaceTemplate {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('That doesn’t look like valid JSON.')
  }
  const t = parsed as Partial<WorkspaceTemplate>
  if (t?.type !== TEMPLATE_TYPE) throw new Error('Not a ClassTrack workspace file.')
  if (t.version !== TEMPLATE_VERSION) throw new Error(`Unsupported workspace version: ${t.version}`)
  return t as WorkspaceTemplate
}

/** Rebuilds a fresh WizardState from an imported template, with new local IDs. */
export function workspaceTemplateToWizardState(template: WorkspaceTemplate): WizardState {
  const localToNewId = new Map(template.subjects.map((s) => [s.localId, crypto.randomUUID()]))

  const subjects: SubjectDraft[] = template.subjects.map((s) => ({
    id: localToNewId.get(s.localId)!,
    name: s.name,
    code: s.code,
    facultyName: s.facultyName,
    color: s.color,
  }))

  const cells: CellDraft[] = template.cells
    .filter((c) => localToNewId.has(c.subjectLocalId))
    .map((c) => ({ dayOfWeek: c.dayOfWeek, periodIndex: c.periodIndex, subjectId: localToNewId.get(c.subjectLocalId)! }))

  const holidays: HolidayDraft[] = template.holidays.map((h) => ({ id: crypto.randomUUID(), date: h.date, name: h.name }))

  return {
    name: template.name,
    startDate: template.startDate,
    endDate: template.endDate,
    targetPercent: 75,
    dutyLeavePolicy: 'excluded',
    subjects,
    periodCount: Math.max(1, template.periodCount),
    periodTimes: template.periodTimes,
    cells,
    holidays,
    workingSaturdays: template.workingSaturdays,
  }
}
