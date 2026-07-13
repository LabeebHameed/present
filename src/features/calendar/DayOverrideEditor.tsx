import { useState } from 'react'
import type { ExpectedPeriod } from '../../engine/schedule'
import type { DayOverride, DayOverrideKind, Subject } from '../../db/types'
import { addDayOverride, removeDayOverride } from '../../lib/dayOverrideActions'
import { fieldInput, fieldLabel, primaryButton } from '../setup/inputStyles'

const KIND_LABELS: Record<DayOverrideKind, string> = {
  cancelPeriod: 'Cancelled',
  moveSubject: 'Subject changed',
  addPeriod: 'Extra period added',
}

export function DayOverrideEditor({
  semesterId,
  date,
  subjects,
  periods,
  existingOverrides,
}: {
  semesterId: string
  date: string
  subjects: Subject[]
  periods: ExpectedPeriod[]
  existingOverrides: DayOverride[]
}) {
  const [kind, setKind] = useState<DayOverrideKind>('cancelPeriod')
  const [periodIndex, setPeriodIndex] = useState<string>(periods[0]?.periodIndex.toString() ?? '1')
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  const handleAdd = async () => {
    const index = Number(periodIndex)
    if (!Number.isFinite(index)) return
    await addDayOverride({
      semesterId,
      date,
      periodIndex: index,
      kind,
      subjectId: kind === 'cancelPeriod' ? undefined : subjectId,
      startTime: kind === 'cancelPeriod' ? undefined : startTime || undefined,
      endTime: kind === 'cancelPeriod' ? undefined : endTime || undefined,
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
      {existingOverrides.length > 0 && (
        <div className="flex flex-col gap-1">
          {existingOverrides.map((override) => (
            <div
              key={override.id}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1 text-xs dark:bg-slate-800"
            >
              <span>
                P{override.periodIndex} · {KIND_LABELS[override.kind]}
                {override.subjectId && ` · ${subjects.find((s) => s.id === override.subjectId)?.name ?? ''}`}
              </span>
              <button
                type="button"
                className="font-medium text-red-500"
                onClick={() => removeDayOverride(override.id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {(['cancelPeriod', 'moveSubject', 'addPeriod'] as DayOverrideKind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium ${
              kind === k
                ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950'
                : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            {KIND_LABELS[k]}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <label className={fieldLabel} htmlFor="override-period">
          Period number
        </label>
        <input
          id="override-period"
          type="number"
          min={0}
          className={fieldInput}
          value={periodIndex}
          onChange={(e) => setPeriodIndex(e.target.value)}
        />
      </div>

      {kind !== 'cancelPeriod' && (
        <>
          <div className="flex flex-col gap-1">
            <label className={fieldLabel} htmlFor="override-subject">
              Subject
            </label>
            <select
              id="override-subject"
              className={fieldInput}
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="time" className={fieldInput} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <span className="text-slate-400">–</span>
            <input type="time" className={fieldInput} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </>
      )}

      <button type="button" className={primaryButton} onClick={handleAdd} disabled={subjects.length === 0}>
        Save adjustment
      </button>
    </div>
  )
}
