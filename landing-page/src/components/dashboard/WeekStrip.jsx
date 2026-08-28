import { CalendarHeart } from 'lucide-react'
import { startOfWeekMonday, addDays, formatMonthDay, isToday } from './format'
import { dateKey } from '../calendar/calendarUtils'

const DAY_LETTERS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

const PILL_CLASS = {
  Booked: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  New: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  Completed: 'bg-gray-100 text-gray-500 dark:bg-gray-500/15 dark:text-gray-300',
  Cancelled: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300',
}

export default function WeekStrip({ data }) {
  const today = new Date()
  const start = startOfWeekMonday(today)
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))

  const groups = new Map()
  data.events.forEach(e => {
    const k = dateKey(e.StartDate)
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k).push(e)
  })

  return (
    <section className="shrink-0 rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#FF2B66]/10 flex items-center justify-center text-[#FF2B66]">
            <CalendarHeart size={16} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white leading-tight">This Week</h3>
            <p className="text-[11px] text-gray-400 dark:text-[#6B7280]">
              {formatMonthDay(days[0])} – {formatMonthDay(days[6])}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d, i) => {
          const isCur = isToday(d)
          const list = groups.get(dateKey(d)) || []
          const visible = list.slice(0, 2)
          const more = list.length - visible.length
          return (
            <div key={i}
              className={`flex flex-col rounded-xl border p-2 min-h-[110px] ${
                isCur ? 'border-[#FF2B66] bg-[#FF2B66]/5' : 'border-gray-200 dark:border-[#2A2A36]'
              }`}>
              <div className="flex flex-col items-center">
                <span className={`text-[10px] font-bold ${isCur ? 'text-[#FF2B66]' : 'text-gray-400 dark:text-[#6B7280]'}`}>
                  {DAY_LETTERS[i]}
                </span>
                <span className={`mt-0.5 h-7 w-7 flex items-center justify-center rounded-full text-sm font-bold ${
                  isCur ? 'bg-[#FF2B66] text-white' : 'text-gray-900 dark:text-white'
                }`}>
                  {d.getDate()}
                </span>
              </div>
              <div className="mt-2 space-y-1">
                {list.length === 0 ? (
                  <span className="block text-center text-[9px] text-gray-300 dark:text-[#4B5563]">—</span>
                ) : (
                  <>
                    {visible.map(e => (
                      <span key={e.Id}
                        className={`block truncate rounded px-1.5 py-0.5 text-[9px] font-semibold ${PILL_CLASS[e.Status] || PILL_CLASS.New}`}>
                        {e.Name}
                      </span>
                    ))}
                    {more > 0 && (
                      <span className="block text-center text-[9px] font-bold text-[#FF2B66]">+{more} more</span>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}