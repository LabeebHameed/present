import Dexie, { type EntityTable } from 'dexie'
import type {
  ClassRecord,
  DayOverride,
  Holiday,
  Semester,
  SettingsRow,
  Subject,
  TimetableSlot,
} from './types'

export class ClassTrackDB extends Dexie {
  semesters!: EntityTable<Semester, 'id'>
  subjects!: EntityTable<Subject, 'id'>
  timetableSlots!: EntityTable<TimetableSlot, 'id'>
  holidays!: EntityTable<Holiday, 'id'>
  dayOverrides!: EntityTable<DayOverride, 'id'>
  classRecords!: EntityTable<ClassRecord, 'id'>
  settings!: EntityTable<SettingsRow, 'key'>

  constructor() {
    super('classtrack')

    this.version(1).stores({
      semesters: 'id, isActive',
      subjects: 'id, semesterId',
      timetableSlots: 'id, semesterId, [semesterId+dayOfWeek]',
      holidays: 'id, semesterId, date',
      dayOverrides: 'id, semesterId, date, [semesterId+date]',
      classRecords: 'id, semesterId, date, subjectId, [semesterId+date], [semesterId+subjectId]',
      settings: 'key',
    })
  }
}

export const db = new ClassTrackDB()
