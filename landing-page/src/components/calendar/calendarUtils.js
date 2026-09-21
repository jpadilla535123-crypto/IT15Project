import { toDate } from '../dashboard/format'

export const EVENT_TYPES = [
  'Corporate',
  'Wedding',
  'Birthday',
  'Conference',
  'Seminar',
  'Product Launch',
  'Debut',
  'Private Event',
  'Other',
]

export const EVENT_STATUSES = ['New', 'Booked', 'Completed', 'Cancelled', 'Pending']

export const STATUS_META = {
  Booked: { dot: 'bg-emerald-400', left: 'border-l-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
  New: { dot: 'bg-blue-400', left: 'border-l-blue-400', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' },
  Completed: { dot: 'bg-gray-400', left: 'border-l-gray-400', badge: 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-300' },
  Cancelled: { dot: 'bg-red-400', left: 'border-l-red-400', badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' },
  Pending: { dot: 'bg-amber-400', left: 'border-l-amber-400', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
}

export function statusMeta(status) {
  return STATUS_META[status] || STATUS_META.Pending
}

export function startOfDay(value) {
  const d = toDate(value)
  d.setHours(0, 0, 0, 0)
  return d
}

export function sameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}

export function isSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

export function dateKey(value) {
  const d = startOfDay(value)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function addDays(value, n) {
  const d = toDate(value)
  d.setDate(d.getDate() + n)
  return d
}

export function startOfWeekSunday(value) {
  const d = startOfDay(value)
  d.setDate(d.getDate() - d.getDay())
  return d
}

export function monthCells(value) {
  const first = new Date(value.getFullYear(), value.getMonth(), 1)
  const lead = first.getDay()
  const daysInMonth = new Date(value.getFullYear(), value.getMonth() + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(value.getFullYear(), value.getMonth(), d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function weekDays(value) {
  const start = startOfWeekSunday(value)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function toISO(value) {
  const d = startOfDay(value)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function formatTime12(value) {
  if (!value) return ''
  const [hh, mm] = String(value).split(':')
  let h = parseInt(hh, 10)
  const m = mm || '00'
  const ap = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${m} ${ap}`
}

export function timeRange(start, end) {
  const s = formatTime12(start)
  const e = formatTime12(end)
  return `${s}${end ? ` – ${e}` : ''}`
}

export function toMinutes(value) {
  const parts = String(value || '00:00').split(':')
  return parseInt(parts[0], 10) * 60 + (parseInt(parts[1], 10) || 0)
}

export function isTimeOverlap(aStart, aEnd, bStart, bEnd) {
  const aE = toMinutes(aEnd || aStart)
  const bE = toMinutes(bEnd || bStart)
  return toMinutes(aStart) < bE && toMinutes(bStart) < aE
}

/* Fixed-date Philippine public holidays. Movable holidays (Holy Week,
   EDSA, etc.) vary by decree, so only legislated fixed dates are marked. */
export function isPhilippineHoliday(value) {
  const d = toDate(value)
  const m = d.getMonth() + 1
  const day = d.getDate()
  return (
    (m === 1 && day === 1) ||    // New Year's Day
    (m === 4 && day === 9) ||    // Araw ng Kagitingan
    (m === 5 && day === 1) ||    // Labor Day
    (m === 6 && day === 12) ||   // Independence Day
    (m === 8 && day === 21) ||   // Ninoy Aquino Day
    (m === 11 && day === 30) ||  // Bonifacio Day
    (m === 12 && day === 25) ||  // Christmas Day
    (m === 12 && day === 30) ||  // Rizal Day
    (m === 12 && day === 31)     // Last Day of the Year
  )
}

export function isPastDate(value) {
  return startOfDay(value).getTime() < startOfDay(new Date()).getTime()
}