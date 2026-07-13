import { useState } from 'react'
import type { ExpectedPeriod } from '../../engine/schedule'
import type { ClassRecord, Subject } from '../../db/types'
import { setNote, setSimpleStatus } from '../../lib/recordActions'
import { DutyLeaveSheet } from './DutyLeaveSheet'
import { TeacherChangedSheet } from './TeacherChangedSheet'

type Sheet = 'dutyLeave' | 'teacherChanged' | null

const STATUS_LABELS: Record<ClassRecord['status'], string> = {
  present: 'Present',
  absent: 'Absent',
  cancelled: 'Cancelled',
  dutyLeave: 'Duty leave',
  holiday: 'Holiday',
}

export function PeriodRow({
  semesterId,
  date,
  periods,
  records,
  subject,
  subjects,
  onSplit,
  onMerge,
}: {
  semesterId: string
  date: string
  /** 1+ consecutive same-subject periods this row represents (2+ = a merged double period) */
  periods: ExpectedPeriod[]
  /** aligned 1:1 with periods */
  records: (ClassRecord | undefined)[]
  subject: Subject | undefined
  subjects: Subject[]
  /** shown when periods.length > 1: lets the user mark this exception day's periods independently */
  onSplit?: () => void
  /** shown on a lone period that could rejoin its neighbor (a previously forced split) */
  onMerge?: () => void
}) {
  const [sheet, setSheet] = useState<Sheet>(null)
  const [editingNote, setEditingNote] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const subjectName = subject?.name ?? 'Unknown subject'
  const periodIndexes = periods.map((p) => p.periodIndex)
  const record = records.find((r) => r) // representative — merged rows only render when all agree
  const firstPeriod = periods[0]
  const lastPeriod = periods[periods.length - 1]
  const isMerged = periods.length > 1

  const quickSet = (status: 'present' | 'absent' | 'cancelled') =>
    Promise.all(
      periodIndexes.map((periodIndex) =>
        setSimpleStatus({ semesterId, date, periodIndex, subjectId: firstPeriod.subjectId, status }),
      ),
    )

  const isSubstituted = Boolean(record?.substitution)

  const periodLabel = isMerged
    ? `Periods ${firstPeriod.periodIndex}–${lastPeriod.periodIndex}`
    : `Period ${firstPeriod.periodIndex}`
  const timeLabel =
    firstPeriod.startTime && lastPeriod.endTime ? `${firstPeriod.startTime} – ${lastPeriod.endTime}` : periodLabel

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: subject?.color ?? '#94a3b8' }} />
          <div>
            <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{subjectName}</div>
            <div className="text-xs text-slate-400">
              {timeLabel}
              {subject?.facultyName && ` · ${subject.facultyName}`}
            </div>
            {isSubstituted && record?.substitution && (
              <div className="text-xs text-amber-600 dark:text-amber-400">
                Taken by {record.substitution.teacherName}
                {record.substitution.actualSubjectId &&
                  ` · ${subjects.find((s) => s.id === record.substitution!.actualSubjectId)?.name ?? ''}`}
              </div>
            )}
          </div>
        </div>
        {record && (
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            {STATUS_LABELS[record.status]}
          </span>
        )}
      </div>

      <div className="flex gap-1.5">
        <StatusButton
          active={record?.status === 'present' && !isSubstituted}
          onClick={() => quickSet('present')}
          activeClass="bg-emerald-600 text-white"
        >
          ✅
        </StatusButton>
        <StatusButton
          active={record?.status === 'absent' && !isSubstituted}
          onClick={() => quickSet('absent')}
          activeClass="bg-red-500 text-white"
        >
          ❌
        </StatusButton>
        <StatusButton
          active={record?.status === 'cancelled'}
          onClick={() => quickSet('cancelled')}
          activeClass="bg-sky-500 text-white"
        >
          🔵
        </StatusButton>
        <StatusButton
          active={record?.status === 'dutyLeave'}
          onClick={() => setSheet('dutyLeave')}
          activeClass="bg-amber-500 text-white"
        >
          🟡
        </StatusButton>
        <StatusButton active={isSubstituted} onClick={() => setSheet('teacherChanged')} activeClass="bg-violet-500 text-white">
          🔄
        </StatusButton>
      </div>

      <div className="flex items-center justify-between">
        {record ? (
          editingNote ? (
            <textarea
              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              rows={2}
              autoFocus
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              onBlur={() => {
                Promise.all(periodIndexes.map((periodIndex) => setNote(semesterId, date, periodIndex, noteDraft)))
                setEditingNote(false)
              }}
            />
          ) : (
            <button
              type="button"
              className="text-left text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              onClick={() => {
                setNoteDraft(record.note ?? '')
                setEditingNote(true)
              }}
            >
              {record.note ? `📝 ${record.note}` : '+ Add note'}
            </button>
          )
        ) : (
          <span />
        )}

        {isMerged && onSplit && (
          <button type="button" className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" onClick={onSplit}>
            Split periods
          </button>
        )}
        {!isMerged && onMerge && (
          <button type="button" className="text-xs font-medium text-emerald-600 dark:text-emerald-400" onClick={onMerge}>
            Merge back
          </button>
        )}
      </div>

      {sheet === 'dutyLeave' && (
        <DutyLeaveSheet
          semesterId={semesterId}
          date={date}
          periodIndexes={periodIndexes}
          subjectId={firstPeriod.subjectId}
          subjectName={subjectName}
          existing={record?.dutyLeave}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'teacherChanged' && (
        <TeacherChangedSheet
          semesterId={semesterId}
          date={date}
          periodIndexes={periodIndexes}
          subjectId={firstPeriod.subjectId}
          subjectName={subjectName}
          subjects={subjects}
          existing={record?.substitution}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  )
}

function StatusButton({
  active,
  activeClass,
  onClick,
  children,
}: {
  active: boolean
  activeClass: string
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-xl py-2 text-base ${
        active ? activeClass : 'bg-slate-100 dark:bg-slate-800'
      }`}
    >
      {children}
    </button>
  )
}
