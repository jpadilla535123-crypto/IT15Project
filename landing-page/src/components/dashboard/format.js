export function toDate(value) {
  return value instanceof Date ? value : new Date(value)
}

export function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function formatMonthDay(value) {
  return toDate(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatFullDate(value) {
  return toDate(value).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function formatCurrency(amount) {
  return `₱${Number(amount || 0).toLocaleString('en-US')}`
}

export function isEventActive(event) {
  return event.Status !== 'Completed' && event.Status !== 'Cancelled'
}

export function isUpcoming(event) {
  return isEventActive(event) && toDate(event.StartDate) >= startOfToday()
}

export function startOfDay(value) {
  const d = toDate(value)
  d.setHours(0, 0, 0, 0)
  return d
}

export function sameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}

export function isToday(value) {
  return sameDay(value, new Date())
}

export function startOfWeekMonday(value) {
  const d = startOfDay(value)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  return d
}

export function addDays(value, n) {
  const d = toDate(value)
  d.setDate(d.getDate() + n)
  return d
}

export function daysAgo(value) {
  return Math.max(0, Math.round((startOfToday() - startOfDay(value)) / 86400000))
}