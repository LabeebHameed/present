export type DutyLeavePolicy = 'present' | 'excluded' | 'absent'

export type DutyLeaveReason =
  | 'NSS'
  | 'IEDC'
  | 'Hackathon'
  | 'Sports'
  | 'Placement'
  | 'Medical'
  | 'Other'

export type ClassStatus = 'present' | 'absent' | 'cancelled' | 'dutyLeave' | 'holiday'

export type DayOverrideKind = 'cancelPeriod' | 'moveSubject' | 'addPeriod'

/** 0 = Sunday ... 6 = Saturday, matches Date#getDay() */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface Semester {
  id: string
  name: string
  startDate: string // ISO yyyy-MM-dd
  endDate: string // ISO yyyy-MM-dd
  targetPercent: number // 0-100
  dutyLeavePolicy: DutyLeavePolicy
  /** ISO dates (yyyy-MM-dd) of Saturdays that follow a weekday's timetable, e.g. { "2026-07-18": 1 } meaning follow Monday's slots */
  workingSaturdays: Record<string, DayOfWeek>
  isActive: boolean
  createdAt: string
}

export interface Subject {
  id: string
  semesterId: string
  name: string
  code: string
  facultyName: string
  color: string // hex
  targetPercentOverride?: number
}

export interface TimetableSlot {
  id: string
  semesterId: string
  dayOfWeek: DayOfWeek
  periodIndex: number
  startTime: string // HH:mm
  endTime: string // HH:mm
  subjectId: string
}

export interface Holiday {
  id: string
  semesterId: string
  date: string // ISO yyyy-MM-dd
  name: string
}

export interface DayOverride {
  id: string
  semesterId: string
  date: string // ISO yyyy-MM-dd
  periodIndex: number
  kind: DayOverrideKind
  subjectId?: string
  startTime?: string
  endTime?: string
  note?: string
}

export interface DutyLeaveInfo {
  reason: DutyLeaveReason
  note?: string
  proofBlob?: Blob
  proofName?: string
}

export interface SubstitutionInfo {
  teacherName: string
  actualSubjectId?: string
}

export interface ClassRecord {
  id: string
  semesterId: string
  date: string // ISO yyyy-MM-dd
  periodIndex: number
  subjectId: string
  status: ClassStatus
  dutyLeave?: DutyLeaveInfo
  substitution?: SubstitutionInfo
  note?: string
  updatedAt: string
}

export interface SettingsRow {
  key: string
  value: unknown
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  notificationsEnabled: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  notificationsEnabled: false,
}
