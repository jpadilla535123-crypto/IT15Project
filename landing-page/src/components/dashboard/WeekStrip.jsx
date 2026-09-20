import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarHeart } from 'lucide-react'
import { startOfWeekMonday, addDays } from './format'
import { dateKey } from '../calendar/calendarUtils'

const CELL = [
  'bg-gray-100 dark:bg-white/[0.03]',
  'bg-[#FF2B66]/10',
  'bg-[#FF2B66]/25',
  'bg-[#FF2B66]/45',
]

const LEGEND = [
  { label: '0', cls: CELL[0] },
  { label: '1', cls: CELL[1] },
  { label: '2–3', cls: CELL[2] },
  { label: '4+', cls: CELL[3] },
]

function densityLevel(count) {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  return 3
}

function padMonth(year, month) {
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDay = (first.getDay() + 6) % 7

  const cells = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function WeekStrip({ data }) {
  const navigate = useNavigate()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const monthName = now.toLocaleDateString('en-US', { month: 'long' })
  const cells = useMemo(() => padMonth(year, month), [year, month])

  const dayCounts = useMemo(() => {
    const map = {}
    data.events.forEach(e => {
      const d = dateKey(e.StartDate)
      map[d] = (map[d] || 0) + 1
    })
    return map
  }, [data.events])

  const todayKey = dateKey(now)
  const totalMonth = cells.filter(Boolean).length
  const daysWithEvents = cells.filter(d => d && dayCounts[dateKey(d)]).length
  const maxDensity = Math.max(0, ...Object.values(dayCounts))

  function handleClick(d) {
    if (!d) return
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    navigate(`/calendar?date=${iso}`)
  }

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#FF2B66]/10 flex items-center justify-center text-[#FF2B66]">
            <CalendarHeart size={16} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{monthName} {year}</h3>
            <p className="text-[11px] text-gray-400 dark:text-[#6B7280]">{daysWithEvents} of {totalMonth} days with events</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {LEGEND.map(l => (
            <div key={l.label} className="flex items-center gap-1">
              <span className={`h-2.5 w-2.5 rounded-sm ${l.cls}`} />
              <span className="text-[9px] font-semibold text-gray-400 dark:text-[#6B7280]">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* day-of-week labels */}
      <div className="grid grid-cols-7 gap-[3px] mb-[3px]">
        {['M','T','W','T','F','S','S'].map((l, i) => (
          <span key={i} className="text-center text-[9px] font-bold text-gray-400 dark:text-[#6B7280]">{l}</span>
        ))}
      </div>

      {/* heatmap grid */}
      <div className="grid grid-cols-7 gap-[3px]">
        {cells.map((d, i) => {
          if (!d) return <div key={`pad-${i}`} />
          const k = dateKey(d)
          const count = dayCounts[k] || 0
          const level = densityLevel(count)
          const isToday = k === todayKey
          return (
            <button key={k} onClick={() => handleClick(d)}
              title={`${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}${count ? ` — ${count} event${count > 1 ? 's' : ''}` : ''}`}
              className={`relative aspect-square rounded-md flex items-center justify-center text-[10px] font-bold transition-all hover:scale-110 hover:z-10 ${
                CELL[level]
              } ${isToday ? 'ring-2 ring-[#FF2B66]' : ''} ${
                isToday ? 'text-[#FF2B66]' : level === 3 ? 'text-white' : 'text-gray-700 dark:text-gray-300'
              }`}>
              {d.getDate()}
            </button>
          )
        })}
      </div>
    </section>
  )
}