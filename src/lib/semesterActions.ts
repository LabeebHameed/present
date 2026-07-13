import { db } from '../db/schema'
import type { Semester } from '../db/types'

export async function updateSemester(
  id: string,
  patch: Partial<Pick<Semester, 'targetPercent' | 'dutyLeavePolicy'>>,
): Promise<void> {
  await db.semesters.update(id, patch)
}

export async function setActiveSemester(id: string): Promise<void> {
  await db.transaction('rw', db.semesters, async () => {
    const activeIds = await db.semesters.filter((s) => s.isActive).primaryKeys()
    if (activeIds.length) await db.semesters.where('id').anyOf(activeIds).modify({ isActive: false })
    await db.semesters.update(id, { isActive: true })
  })
}

export async function deleteSemester(id: string): Promise<void> {
  await db.transaction(
    'rw',
    [db.semesters, db.subjects, db.timetableSlots, db.holidays, db.dayOverrides, db.classRecords],
    async () => {
      await db.subjects.where('semesterId').equals(id).delete()
      await db.timetableSlots.where('semesterId').equals(id).delete()
      await db.holidays.where('semesterId').equals(id).delete()
      await db.dayOverrides.where('semesterId').equals(id).delete()
      await db.classRecords.where('semesterId').equals(id).delete()
      await db.semesters.delete(id)
    },
  )
}
