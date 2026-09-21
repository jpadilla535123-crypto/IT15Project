import { useMemo } from 'react'
import { weekDays, sameDay, dateKey, statusMeta, timeRange } from './calendarUtils'

const DAY_LETTERS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function WeekEvent({ event, onSelect }) {
  const meta = statusMeta(event.Status)
  return (
    <button onClick={() => onSelect(event)}
      className={`w-full text-left rounded-lg border-l-2 ${meta.left} bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 p-2 transition-colors`}>
      <p className="text-[11px] font-bold truncate text-gray-400 dark:text-[#6B7280]">{timeRange(event.StartTime, event.EndTime)}</p>
      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate mt-0.5">{event.Name}</p>
      <p className="text-[10px] text-gray-400 dark:text-[#6B7280] truncate">{event.ClientName}</p>
    </button>
  )
}

export default function WeekView({ viewDate, events, onSelect }) {
  const days = useMemo(() => weekDays(viewDate), [viewDate])

  const groups = useMemo(() => {
    const m = new Map()
    events.forEach(e => {
      const k = dateKey(e.StartDate)
      if (!m.has(k)) m.set(k, [])
      m.get(k).push(e)
    })
    return m
  }, [events])

  const today = new Date()

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] overflow-hidden flex flex-col h-full">
      <div className="flex flex-1 min-h-0">
        {days.map(d => {
          const isToday = sameDay(d, today)
          const list = (groups.get(dateKey(d)) || []).slice().sort((a, b) => String(a.StartTime).localeCompare(String(b.StartTime)))
          return (
            <div key={dateKey(d)} className={`flex flex-col min-w-0 flex-1 border-r border-gray-100 dark:border-[#2A2A36]/60 last:border-r-0 ${isToday ? 'bg-[#FF2B66]/5 dark:bg-[#FF2B66]/5' : ''}`}>
              <div className={`shrink-0 border-b border-gray-100 dark:border-[#2A2A36]/60 px-2 py-2.5 text-center ${isToday ? 'bg-[#FF2B66]/5' : ''}`}>
                <p className={`text-[11px] font-bold uppercase tracking-widest ${isToday ? 'text-[#FF2B66]' : 'text-gray-400 dark:text-[#6B7280]'}`}>
                  {DAY_LETTERS[d.getDay()]}
                </p>
                <p className={`text-sm font-bold mt-0.5 ${isToday ? 'text-[#FF2B66]' : 'text-gray-900 dark:text-white'}`}>{d.getDate()}</p>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-2">
                <div className="pb-px space-y-1.5">
                  {list.length === 0 ? (
                    <p className="text-[11px] text-gray-300 dark:text-[#4B5563] text-center pt-8">—</p>
                  ) : (
                    list.map(e => <WeekEvent key={e.Id} event={e} onSelect={onSelect} />)
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}