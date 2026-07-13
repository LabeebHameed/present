import { useState } from 'react'
import type { DutyLeavePolicy, Semester, Subject } from '../../db/types'
import { updateSemester } from '../../lib/semesterActions'
import { setSubjectTargetOverride } from '../../lib/subjectActions'
import { fieldInput, fieldLabel } from '../setup/inputStyles'

const policyOptions: { value: DutyLeavePolicy; label: string }[] = [
  { value: 'excluded', label: 'Ignore' },
  { value: 'present', label: 'Count as present' },
  { value: 'absent', label: 'Count as absent' },
]

export function AttendanceRulesSection({ semester, subjects }: { semester: Semester; subjects: Subject[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">Attendance rules — {semester.name}</h2>

      <div className="flex flex-col gap-1">
        <label className={fieldLabel} htmlFor="global-target">
          Target attendance %
        </label>
        <input
          id="global-target"
          type="number"
          min={1}
          max={100}
          className={`${fieldInput} w-32`}
          defaultValue={semester.targetPercent}
          onBlur={(e) => {
            const value = Number(e.target.value)
            if (value > 0 && value <= 100) updateSemester(semester.id, { targetPercent: value })
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className={fieldLabel}>Duty leave policy</span>
        <div className="flex gap-2">
          {policyOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateSemester(semester.id, { dutyLeavePolicy: option.value })}
              className={`flex-1 rounded-xl border px-2 py-2 text-xs font-medium ${
                semester.dutyLeavePolicy === option.value
                  ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {subjects.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className={fieldLabel}>Per-subject target override</span>
          {subjects.map((subject) => (
            <SubjectTargetRow key={subject.id} subject={subject} globalTarget={semester.targetPercent} />
          ))}
        </div>
      )}
    </section>
  )
}

function SubjectTargetRow({ subject, globalTarget }: { subject: Subject; globalTarget: number }) {
  const [value, setValue] = useState(subject.targetPercentOverride?.toString() ?? '')

  const commit = () => {
    const trimmed = value.trim()
    if (trimmed === '') {
      setSubjectTargetOverride(subject.id, undefined)
      return
    }
    const parsed = Number(trimmed)
    if (parsed > 0 && parsed <= 100) setSubjectTargetOverride(subject.id, parsed)
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: subject.color }} />
        <span className="text-sm text-slate-700 dark:text-slate-200">{subject.name}</span>
      </div>
      <input
        type="number"
        min={1}
        max={100}
        placeholder={`${globalTarget}`}
        className={`${fieldInput} w-20 text-right`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
      />
    </div>
  )
}
