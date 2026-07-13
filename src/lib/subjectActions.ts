import { db } from '../db/schema'

export async function setSubjectTargetOverride(subjectId: string, targetPercentOverride: number | undefined): Promise<void> {
  await db.subjects.update(subjectId, { targetPercentOverride })
}
