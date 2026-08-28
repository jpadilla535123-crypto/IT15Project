import { useMemo } from 'react'
import { monthCells, sameDay, isSameMonth, dateKey, statusMeta, formatTime12 } from './calendarUtils'

const DAY_LETTERS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function MiniEvent({ event, onSelect }) {
  const meta = statusMeta(event.Status)
  return (
    <button onClick={e => { e.stopPropagation(); onSelect(event) }}
      className={`w-full text-left rounded-md border-l-2 ${meta.left} bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 px-1.5 py-1 transition-colors`}>
      <p className="text-[11px] leading-tight font-semibold text-gray-900 dark:text-white truncate">{event.Name}</p>
      <p className="text-[10px] text-gray-400 dark:text-[#6B7280] truncate">{formatTime12(event.StartTime)}</p>
    </button>
  )
}

function DayCell({ date, eventsList, isCurrentMonth, isToday, onSelect, onMore }) {
  const M = 3
  const visible = eventsList.slice(0, 2)
  const more = eventsList.length - visible.length

  return (
    <div className={`min-h-0 overflow-hidden bg-white dark:bg-[#121217] p-1.5 flex flex-col ${isCurrentMonth ? '' : 'opacity-60'} ${isToday ? 'bg-[#FF2B66]/5 dark:bg-[#FF2B66]/5' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold ${
          isToday ? 'bg-[#FF2B66] text-white' : isCurrentMonth ? 'text-gray-600 dark:text-gray-300' : 'text-gray-300 dark:text-[#4B5563]'
        }`}>
          {date.getDate()}
        </span>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden space-y-0.5">
        {eventsList.length <= M
          ? eventsList.map(e => <MiniEvent key={e.Id} event={e} onSelect={onSelect} />)
          : (
              <>
                {visible.map(e => <MiniEvent key={e.Id} event={e} onSelect={onSelect} />)}
                <button onClick={() => onMore(date, eventsList)}
                  className="w-full text-left text-[10px] font-bold text-[#FF2B66] px-1.5 py-0.5 hover:underline">
                  +{more} more
                </button>
              </>
            )}
      </div>
    </div>
  )
}

export default function MonthView({ viewDate, events, onSelect, onMore }) {
  const cells = useMemo(() => monthCells(viewDate), [viewDate])

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
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-[#2A2A36]">
        {DAY_LETTERS.map(d => (
          <div key={d} className="py-2.5 text-center text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#6B7280]">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-fr gap-px bg-gray-100 dark:bg-[#2A2A36] flex-1 min-h-0 overflow-hidden">
        {cells.map((d, i) => (
          <DayCell
            key={i}
            date={d}
            isCurrentMonth={isSameMonth(d, viewDate)}
            isToday={sameDay(d, today)}
            eventsList={groups.get(dateKey(d)) || []}
            onSelect={onSelect}
            onMore={onMore}
          />
        ))}
      </div>
    </section>
  )
}