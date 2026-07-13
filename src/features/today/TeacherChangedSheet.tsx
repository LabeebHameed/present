import { useState } from 'react'
import { BottomSheet } from '../../components/BottomSheet'
import { fieldInput, fieldLabel, primaryButton } from '../setup/inputStyles'
import { setTeacherChanged } from '../../lib/recordActions'
import type { Subject, SubstitutionInfo } from '../../db/types'

export function TeacherChangedSheet({
  semesterId,
  date,
  periodIndexes,
  subjectId,
  subjectName,
  subjects,
  existing,
  onClose,
}: {
  semesterId: string
  date: string
  periodIndexes: number[]
  subjectId: string
  subjectName: string
  subjects: Subject[]
  existing?: SubstitutionInfo
  onClose: () => void
}) {
  const [teacherName, setTeacherName] = useState(existing?.teacherName ?? '')
  const [differentSubject, setDifferentSubject] = useState(Boolean(existing?.actualSubjectId))
  const [actualSubjectId, setActualSubjectId] = useState(existing?.actualSubjectId ?? subjectId)
  const [status, setStatus] = useState<'present' | 'absent'>('present')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!teacherName.trim()) return
    setSaving(true)
    try {
      const substitution: SubstitutionInfo = {
        teacherName: teacherName.trim(),
        actualSubjectId: differentSubject ? actualSubjectId : undefined,
      }
      await Promise.all(
        periodIndexes.map((periodIndex) =>
          setTeacherChanged({ semesterId, date, periodIndex, subjectId, status, substitution }),
        ),
      )
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet title={`Teacher changed — ${subjectName}`} onClose={onClose}>
      <div className="flex flex-col gap-1">
        <label className={fieldLabel} htmlFor="sub-teacher">
          Taken by
        </label>
        <input
          id="sub-teacher"
          className={fieldInput}
          placeholder="e.g. Mrs. Anjali"
          value={teacherName}
          onChange={(e) => setTeacherName(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className={fieldLabel}>Subject taught</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDifferentSubject(false)}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
              !differentSubject
                ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950'
                : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            Still {subjectName}
          </button>
          <button
            type="button"
            onClick={() => setDifferentSubject(true)}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
              differentSubject
                ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950'
                : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            Different subject
          </button>
        </div>
        {differentSubject && (
          <select className={fieldInput} value={actualSubjectId} onChange={(e) => setActualSubjectId(e.target.value)}>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className={fieldLabel}>Did you attend?</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStatus('present')}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
              status === 'present'
                ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950'
                : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            Present
          </button>
          <button
            type="button"
            onClick={() => setStatus('absent')}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
              status === 'absent'
                ? 'border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-950'
                : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            Absent
          </button>
        </div>
      </div>

      <button type="button" className={primaryButton} disabled={saving || !teacherName.trim()} onClick={handleSave}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </BottomSheet>
  )
}
