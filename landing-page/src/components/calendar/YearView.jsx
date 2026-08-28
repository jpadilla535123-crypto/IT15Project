import { useMemo } from 'react'
import { dateKey, sameDay } from './calendarUtils'

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function MiniMonth({ year, month, groups, today, onJumpDay }) {
  const first = new Date(year, month, 1)
  const lead = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []

  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  return (
    <div className="rounded-xl border border-gray-200 dark:border-[#2A2A36] p-3">
      <p className="text-xs font-bold text-gray-900 dark:text-white mb-2">{MONTH_NAMES[month]}</p>
      <div className="grid grid-cols-7 gap-1">
        {DAY_LETTERS.map((l, i) => (
          <span key={i} className="text-center text-[9px] font-bold text-gray-400 dark:text-[#6B7280]">{l}</span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={`b${i}`} />
          const isToday = sameDay(d, today)
          const hasEvent = groups.get(dateKey(d))?.length > 0
          return (
            <button key={i} onClick={() => onJumpDay(d)}
              className={`relative h-7 flex flex-col items-center justify-center rounded-md text-[11px] font-semibold transition-colors ${
                isToday ? 'bg-[#FF2B66] text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
              } ${hasEvent && !isToday ? 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10' : ''}`}>
              {d.getDate()}
              {hasEvent && (
                <span className={`absolute bottom-0.5 h-[3px] w-3 rounded-full ${isToday ? 'bg-white' : 'bg-emerald-500'}`} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function YearView({ viewDate, events, onJumpDay }) {
  const year = viewDate.getFullYear()
  const today = new Date()

  const groups = useMemo(() => {
    const m = new Map()
    events.forEach(e => {
      const k = dateKey(e.StartDate)
      if (!m.has(k)) m.set(k, [])
      m.get(k).push(e)
    })
    return m
  }, [events])

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5 flex-1 min-h-0 overflow-y-auto">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }, (_, m) => (
          <MiniMonth key={m} year={year} month={m} groups={groups} today={today} onJumpDay={onJumpDay} />
        ))}
      </div>
    </section>
  )
}