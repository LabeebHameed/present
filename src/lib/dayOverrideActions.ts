import { db } from '../db/schema'
import type { DayOverride, DayOverrideKind } from '../db/types'

export async function addDayOverride(params: {
  semesterId: string
  date: string
  periodIndex: number
  kind: DayOverrideKind
  subjectId?: string
  startTime?: string
  endTime?: string
  note?: string
}): Promise<void> {
  const override: DayOverride = {
    id: crypto.randomUUID(),
    ...params,
  }
  await db.dayOverrides.add(override)
}

export async function removeDayOverride(id: string): Promise<void> {
  await db.dayOverrides.delete(id)
}
