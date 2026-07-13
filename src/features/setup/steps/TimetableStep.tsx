import { useState, type Dispatch } from 'react'
import type { DayOfWeek } from '../../../db/types'
import type { WizardAction, WizardState } from '../wizardState'
import { WEEKDAYS } from '../wizardState'
import { secondaryButton } from '../inputStyles'
import { TimetableCellSheet } from './TimetableCellSheet'

interface CellGroup {
  start: number
  end: number
  subjectId: string | null
}

function computeRowGroups(cellsForDay: WizardState['cells'], periodCount: number): CellGroup[] {
  const subjectByPeriod = new Map(cellsForDay.map((c) => [c.periodIndex, c.subjectId]))
  const groups: CellGroup[] = []
  let i = 1
  while (i <= periodCount) {
    const subjectId = subjectByPeriod.get(i) ?? null
    if (subjectId === null) {
      groups.push({ start: i, end: i, subjectId: null })
      i++
      continue
    }
    let j = i
    while (j + 1 <= periodCount && subjectByPeriod.get(j + 1) === subjectId) j++
    groups.push({ start: i, end: j, subjectId })
    i = j + 1
  }
  return groups
}

export function TimetableStep({ state, dispatch }: { state: WizardState; dispatch: Dispatch<WizardAction> }) {
  const [selectedCell, setSelectedCell] = useState<{ dayOfWeek: DayOfWeek; start: number; end: number } | null>(null)

  if (state.subjects.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Add at least one subject in the previous step before building the timetable.
      </p>
    )
  }

  const subjectById = new Map(state.subjects.map((s) => [s.id, s]))
  const cellsByDay = new Map<DayOfWeek, WizardState['cells']>()
  for (const cell of state.cells) {
    const list = cellsByDay.get(cell.dayOfWeek) ?? []
    list.push(cell)
    cellsByDay.set(cell.dayOfWeek, list)
  }

  const copyMondayToAll = () => {
    for (const day of WEEKDAYS.filter((w) => w.day !== 1)) {
      dispatch({ type: 'COPY_DAY', from: 1, to: day.day })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <label htmlFor="period-count" className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Periods per day
        </label>
        <input
          id="period-count"
          type="number"
          min={1}
          max={12}
          className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
          value={state.periodCount}
          onChange={(e) => dispatch({ type: 'SET_PERIOD_COUNT', count: Number(e.target.value) || 1 })}
        />
        <button type="button" className={`${secondaryButton} ml-auto text-xs`} onClick={copyMondayToAll}>
          Copy Monday to all days
        </button>
      </div>

      <p className="text-xs text-slate-400">
        Tap a cell to assign a subject. Setting the same subject on two periods in a row merges them into one block —
        tap the block to split it apart again.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
        <table className="border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-14 border-b border-r border-slate-200 bg-white p-1.5 text-xs font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-900">
                Day
              </th>
              {state.periodTimes.map((p) => (
                <th
                  key={p.periodIndex}
                  className="border-b border-slate-200 bg-slate-50 p-1.5 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  P{p.periodIndex}
                </th>
              ))}
            </tr>
            <tr>
              <th className="sticky left-0 z-10 border-b border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900" />
              {state.periodTimes.map((p) => (
                <th key={p.periodIndex} className="border-b border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex flex-col gap-0.5">
                    <input
                      type="time"
                      value={p.startTime}
                      onChange={(e) => dispatch({ type: 'SET_PERIOD_TIME', periodIndex: p.periodIndex, startTime: e.target.value, endTime: p.endTime })}
                      className="w-[72px] rounded border border-slate-200 bg-white px-1 py-0.5 text-[11px] dark:border-slate-600 dark:bg-slate-900"
                    />
                    <input
                      type="time"
                      value={p.endTime}
                      onChange={(e) => dispatch({ type: 'SET_PERIOD_TIME', periodIndex: p.periodIndex, startTime: p.startTime, endTime: e.target.value })}
                      className="w-[72px] rounded border border-slate-200 bg-white px-1 py-0.5 text-[11px] dark:border-slate-600 dark:bg-slate-900"
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WEEKDAYS.map((day) => {
              const groups = computeRowGroups(cellsByDay.get(day.day) ?? [], state.periodCount)
              return (
                <tr key={day.day}>
                  <td className="sticky left-0 z-10 border-r border-b border-slate-200 bg-white p-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    {day.short}
                  </td>
                  {groups.map((group) => {
                    const subject = group.subjectId ? subjectById.get(group.subjectId) : undefined
                    return (
                      <td
                        key={group.start}
                        colSpan={group.end - group.start + 1}
                        onClick={() => setSelectedCell({ dayOfWeek: day.day, start: group.start, end: group.end })}
                        className={`h-12 min-w-[56px] cursor-pointer border-b border-slate-100 p-1 text-center align-middle text-xs dark:border-slate-800 ${
                          subject ? '' : 'text-slate-300 dark:text-slate-700'
                        }`}
                        style={subject ? { backgroundColor: `${subject.color}22`, color: subject.color } : undefined}
                      >
                        {subject ? subject.code || subject.name : '+'}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {selectedCell && (
        <TimetableCellSheet
          dayOfWeek={selectedCell.dayOfWeek}
          periodStart={selectedCell.start}
          periodEnd={selectedCell.end}
          currentSubjectId={
            state.cells.find((c) => c.dayOfWeek === selectedCell.dayOfWeek && c.periodIndex === selectedCell.start)
              ?.subjectId ?? null
          }
          subjects={state.subjects}
          dispatch={dispatch}
          onClose={() => setSelectedCell(null)}
        />
      )}
    </div>
  )
}
