import { format } from 'date-fns'

/** Local (not UTC) calendar date as yyyy-MM-dd. */
export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}
