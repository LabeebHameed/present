import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'

export function useActiveSemester() {
  return useLiveQuery(() => db.semesters.filter((s) => s.isActive).first(), [])
}
