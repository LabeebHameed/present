import { db } from '../db/schema'
import type { ClassRecord, DutyLeaveInfo, SubstitutionInfo } from '../db/types'

export function recordId(semesterId: string, date: string, periodIndex: number): string {
  return `${semesterId}__${date}__${periodIndex}`
}

/** Sets present/absent/cancelled. Tapping the same plain status again unmarks (deletes) the record. */
export async function setSimpleStatus(params: {
  semesterId: string
  date: string
  periodIndex: number
  subjectId: string
  status: 'present' | 'absent' | 'cancelled'
}): Promise<void> {
  const id = recordId(params.semesterId, params.date, params.periodIndex)
  const existing = await db.classRecords.get(id)
  if (existing?.status === params.status && !existing.dutyLeave && !existing.substitution) {
    await db.classRecords.delete(id)
    return
  }
  const record: ClassRecord = {
    id,
    semesterId: params.semesterId,
    date: params.date,
    periodIndex: params.periodIndex,
    subjectId: params.subjectId,
    status: params.status,
    updatedAt: new Date().toISOString(),
  }
  await db.classRecords.put(record)
}

export async function setDutyLeave(params: {
  semesterId: string
  date: string
  periodIndex: number
  subjectId: string
  dutyLeave: DutyLeaveInfo
}): Promise<void> {
  const record: ClassRecord = {
    id: recordId(params.semesterId, params.date, params.periodIndex),
    semesterId: params.semesterId,
    date: params.date,
    periodIndex: params.periodIndex,
    subjectId: params.subjectId,
    status: 'dutyLeave',
    dutyLeave: params.dutyLeave,
    updatedAt: new Date().toISOString(),
  }
  await db.classRecords.put(record)
}

export async function setTeacherChanged(params: {
  semesterId: string
  date: string
  periodIndex: number
  subjectId: string
  status: 'present' | 'absent'
  substitution: SubstitutionInfo
}): Promise<void> {
  const record: ClassRecord = {
    id: recordId(params.semesterId, params.date, params.periodIndex),
    semesterId: params.semesterId,
    date: params.date,
    periodIndex: params.periodIndex,
    subjectId: params.subjectId,
    status: params.status,
    substitution: params.substitution,
    updatedAt: new Date().toISOString(),
  }
  await db.classRecords.put(record)
}

export async function removeRecord(semesterId: string, date: string, periodIndex: number): Promise<void> {
  await db.classRecords.delete(recordId(semesterId, date, periodIndex))
}

export async function markAllPresent(
  semesterId: string,
  date: string,
  periods: { periodIndex: number; subjectId: string }[],
  alreadyMarkedPeriods: Set<number>,
): Promise<void> {
  const toMark = periods.filter((p) => !alreadyMarkedPeriods.has(p.periodIndex))
  if (!toMark.length) return
  const now = new Date().toISOString()
  await db.classRecords.bulkPut(
    toMark.map((p) => ({
      id: recordId(semesterId, date, p.periodIndex),
      semesterId,
      date,
      periodIndex: p.periodIndex,
      subjectId: p.subjectId,
      status: 'present' as const,
      updatedAt: now,
    })),
  )
}
