import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import type { ClassRecord, DayOverride, Holiday, Subject, TimetableSlot } from '../db/types'

export function useSubjects(semesterId: string | undefined): Subject[] {
  return useLiveQuery(
    (): Promise<Subject[]> =>
      semesterId ? db.subjects.where('semesterId').equals(semesterId).toArray() : Promise.resolve([]),
    [semesterId],
    [] as Subject[],
  )
}

export function useTimetableSlots(semesterId: string | undefined): TimetableSlot[] {
  return useLiveQuery(
    (): Promise<TimetableSlot[]> =>
      semesterId ? db.timetableSlots.where('semesterId').equals(semesterId).toArray() : Promise.resolve([]),
    [semesterId],
    [] as TimetableSlot[],
  )
}

export function useHolidays(semesterId: string | undefined): Holiday[] {
  return useLiveQuery(
    (): Promise<Holiday[]> =>
      semesterId ? db.holidays.where('semesterId').equals(semesterId).toArray() : Promise.resolve([]),
    [semesterId],
    [] as Holiday[],
  )
}

export function useDayOverrides(semesterId: string | undefined): DayOverride[] {
  return useLiveQuery(
    (): Promise<DayOverride[]> =>
      semesterId ? db.dayOverrides.where('semesterId').equals(semesterId).toArray() : Promise.resolve([]),
    [semesterId],
    [] as DayOverride[],
  )
}

export function useClassRecords(semesterId: string | undefined): ClassRecord[] {
  return useLiveQuery(
    (): Promise<ClassRecord[]> =>
      semesterId ? db.classRecords.where('semesterId').equals(semesterId).toArray() : Promise.resolve([]),
    [semesterId],
    [] as ClassRecord[],
  )
}
