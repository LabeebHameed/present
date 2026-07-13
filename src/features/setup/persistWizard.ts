import { db } from '../../db/schema'
import type { WizardState } from './wizardState'

export async function commitWizard(state: WizardState): Promise<string> {
  const semesterId = crypto.randomUUID()
  const timeByPeriod = new Map(state.periodTimes.map((p) => [p.periodIndex, p]))

  await db.transaction('rw', db.semesters, db.subjects, db.timetableSlots, db.holidays, async () => {
    const activeIds = await db.semesters.filter((s) => s.isActive).primaryKeys()
    if (activeIds.length) await db.semesters.where('id').anyOf(activeIds).modify({ isActive: false })

    await db.semesters.add({
      id: semesterId,
      name: state.name.trim(),
      startDate: state.startDate,
      endDate: state.endDate,
      targetPercent: state.targetPercent,
      dutyLeavePolicy: state.dutyLeavePolicy,
      workingSaturdays: state.workingSaturdays,
      isActive: true,
      createdAt: new Date().toISOString(),
    })

    await db.subjects.bulkAdd(
      state.subjects.map((s) => ({
        id: s.id,
        semesterId,
        name: s.name.trim(),
        code: s.code.trim(),
        facultyName: s.facultyName.trim(),
        color: s.color,
      })),
    )

    await db.timetableSlots.bulkAdd(
      state.cells.map((cell) => {
        const time = timeByPeriod.get(cell.periodIndex)
        return {
          id: crypto.randomUUID(),
          semesterId,
          dayOfWeek: cell.dayOfWeek,
          periodIndex: cell.periodIndex,
          startTime: time?.startTime ?? '',
          endTime: time?.endTime ?? '',
          subjectId: cell.subjectId,
        }
      }),
    )

    await db.holidays.bulkAdd(
      state.holidays.map((h) => ({
        id: h.id,
        semesterId,
        date: h.date,
        name: h.name.trim(),
      })),
    )
  })

  return semesterId
}
