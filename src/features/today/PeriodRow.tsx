import { useState } from 'react'
import type { ExpectedPeriod } from '../../engine/schedule'
import type { ClassRecord, Subject } from '../../db/types'
import { setSimpleStatus } from '../../lib/recordActions'
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
  period,
  subject,
  subjects,
  record,
}: {
  semesterId: string
  date: string
  period: ExpectedPeriod
  subject: Subject | undefined
  subjects: Subject[]
  record: ClassRecord | undefined
}) {
  const [sheet, setSheet] = useState<Sheet>(null)
  const subjectName = subject?.name ?? 'Unknown subject'

  const quickSet = (status: 'present' | 'absent' | 'cancelled') =>
    setSimpleStatus({ semesterId, date, periodIndex: period.periodIndex, subjectId: period.subjectId, status })

  const isSubstituted = Boolean(record?.substitution)

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: subject?.color ?? '#94a3b8' }} />
          <div>
            <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{subjectName}</div>
            <div className="text-xs text-slate-400">
              {period.startTime && period.endTime ? `${period.startTime} – ${period.endTime}` : `Period ${period.periodIndex}`}
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

      {sheet === 'dutyLeave' && (
        <DutyLeaveSheet
          semesterId={semesterId}
          date={date}
          periodIndex={period.periodIndex}
          subjectId={period.subjectId}
          subjectName={subjectName}
          existing={record?.dutyLeave}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'teacherChanged' && (
        <TeacherChangedSheet
          semesterId={semesterId}
          date={date}
          periodIndex={period.periodIndex}
          subjectId={period.subjectId}
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
