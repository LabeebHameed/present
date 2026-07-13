import { useState } from 'react'
import type { ExpectedPeriod } from '../../engine/schedule'
import type { ClassRecord, Subject } from '../../db/types'
import { groupAdjacentPeriods, recordsCompatible } from './periodGrouping'
import { PeriodRow } from './PeriodRow'

function groupKey(periods: ExpectedPeriod[]): string {
  return `${periods[0].periodIndex}-${periods[periods.length - 1].periodIndex}`
}

export function PeriodList({
  semesterId,
  date,
  periods,
  recordsByPeriod,
  subjectById,
  subjects,
}: {
  semesterId: string
  date: string
  periods: ExpectedPeriod[]
  recordsByPeriod: Map<number, ClassRecord>
  subjectById: Map<string, Subject>
  subjects: Subject[]
}) {
  const [forceSplit, setForceSplit] = useState<Set<string>>(new Set())

  const toggleSplit = (key: string, split: boolean) => {
    setForceSplit((prev) => {
      const next = new Set(prev)
      if (split) next.add(key)
      else next.delete(key)
      return next
    })
  }

  const groups = groupAdjacentPeriods(periods)

  return (
    <div className="flex flex-col gap-2">
      {groups.map((group) => {
        const records = group.map((p) => recordsByPeriod.get(p.periodIndex))
        const key = groupKey(group)
        const mergeable = group.length > 1
        const effectivelySplit = mergeable && (forceSplit.has(key) || !recordsCompatible(records))
        const wasForcedApart = forceSplit.has(key)

        if (!mergeable || !effectivelySplit) {
          return (
            <PeriodRow
              key={key}
              semesterId={semesterId}
              date={date}
              periods={group}
              records={records}
              subject={subjectById.get(group[0].subjectId)}
              subjects={subjects}
              onSplit={mergeable ? () => toggleSplit(key, true) : undefined}
            />
          )
        }

        return group.map((period, i) => (
          <PeriodRow
            key={period.periodIndex}
            semesterId={semesterId}
            date={date}
            periods={[period]}
            records={[recordsByPeriod.get(period.periodIndex)]}
            subject={subjectById.get(period.subjectId)}
            subjects={subjects}
            onMerge={i === 0 && wasForcedApart && recordsCompatible(records) ? () => toggleSplit(key, false) : undefined}
          />
        ))
      })}
    </div>
  )
}
