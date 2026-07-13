import { db } from '../db/schema'
import type {
  ClassRecord,
  DayOverride,
  DutyLeaveReason,
  Holiday,
  Semester,
  SettingsRow,
  Subject,
  TimetableSlot,
} from '../db/types'

const BACKUP_VERSION = 1

interface BackupDutyLeave {
  reason: DutyLeaveReason
  note?: string
  proofName?: string
  proofBlobBase64?: string
  proofBlobType?: string
}

interface BackupClassRecord extends Omit<ClassRecord, 'dutyLeave'> {
  dutyLeave?: BackupDutyLeave
}

interface BackupFile {
  version: number
  exportedAt: string
  semesters: Semester[]
  subjects: Subject[]
  timetableSlots: TimetableSlot[]
  holidays: Holiday[]
  dayOverrides: DayOverride[]
  classRecords: BackupClassRecord[]
  settings: SettingsRow[]
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function base64ToBlob(base64: string, type: string): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type })
}

export async function exportBackup(): Promise<Blob> {
  const [semesters, subjects, timetableSlots, holidays, dayOverrides, classRecords, settings] = await Promise.all([
    db.semesters.toArray(),
    db.subjects.toArray(),
    db.timetableSlots.toArray(),
    db.holidays.toArray(),
    db.dayOverrides.toArray(),
    db.classRecords.toArray(),
    db.settings.toArray(),
  ])

  const backupRecords: BackupClassRecord[] = await Promise.all(
    classRecords.map(async (record) => {
      if (!record.dutyLeave) return record as BackupClassRecord
      const { proofBlob, ...rest } = record.dutyLeave
      const dutyLeave: BackupDutyLeave = { ...rest }
      if (proofBlob) {
        dutyLeave.proofBlobBase64 = await blobToBase64(proofBlob)
        dutyLeave.proofBlobType = proofBlob.type
      }
      return { ...record, dutyLeave }
    }),
  )

  const backup: BackupFile = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    semesters,
    subjects,
    timetableSlots,
    holidays,
    dayOverrides,
    classRecords: backupRecords,
    settings,
  }

  return new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
}

export async function importBackup(file: File): Promise<void> {
  const text = await file.text()
  const backup = JSON.parse(text) as BackupFile
  if (backup.version !== BACKUP_VERSION) {
    throw new Error(`Unsupported backup version: ${backup.version}`)
  }

  const classRecords: ClassRecord[] = backup.classRecords.map((record) => {
    if (!record.dutyLeave) return record as ClassRecord
    const { proofBlobBase64, proofBlobType, ...rest } = record.dutyLeave
    return {
      ...record,
      dutyLeave: {
        ...rest,
        proofBlob: proofBlobBase64 ? base64ToBlob(proofBlobBase64, proofBlobType ?? 'application/octet-stream') : undefined,
      },
    } as ClassRecord
  })

  const tables = [db.semesters, db.subjects, db.timetableSlots, db.holidays, db.dayOverrides, db.classRecords, db.settings]
  await db.transaction('rw', tables, async () => {
    await Promise.all(tables.map((t) => t.clear()))
    await db.semesters.bulkAdd(backup.semesters)
    await db.subjects.bulkAdd(backup.subjects)
    await db.timetableSlots.bulkAdd(backup.timetableSlots)
    await db.holidays.bulkAdd(backup.holidays)
    await db.dayOverrides.bulkAdd(backup.dayOverrides)
    await db.classRecords.bulkAdd(classRecords)
    await db.settings.bulkAdd(backup.settings)
  })
}
