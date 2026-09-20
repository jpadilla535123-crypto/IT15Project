import { useState } from 'react'
import { CalendarRange } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toDate } from './format'
import { timeRange, statusMeta } from '../calendar/calendarUtils'
import '../../pages/landingFx.css'

const AVATAR_BG = [
  'bg-[#FF2B66]/15 text-[#FF2B66]',
  'bg-emerald-500/15 text-emerald-500',
  'bg-blue-500/15 text-blue-500',
  'bg-amber-500/15 text-amber-500',
  'bg-purple-500/15 text-purple-400',
]

function initials(name) {
  return String(name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

const ACTIVE_STATUSES = ['Booked', 'New', 'Pending']

export default function AllBookingsCard({ data }) {
  const [filter, setFilter] = useState('All')
  const navigate = useNavigate()
  const venueById = new Map(data.venues.map(v => [v.Id, v]))
  const clientById = new Map(data.clients.map(c => [c.Id, c]))

  const all = data.events
    .filter(e => ACTIVE_STATUSES.includes(e.Status))
    .sort((a, b) => {
      const d = toDate(a.StartDate) - toDate(b.StartDate)
      if (d !== 0) return d
      return String(a.StartTime).localeCompare(String(b.StartTime))
    })

  const bookings = filter === 'All' ? all : all.filter(e => e.Status === filter)
  const chips = ['All', ...ACTIVE_STATUSES]

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-4 flex flex-col justify-between h-full min-w-0">
      <header className="flex items-center justify-between shrink-0 border-b border-gray-200 dark:border-[#2A2A36]/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#FF2B66]/10 flex items-center justify-center text-[#FF2B66]">
            <CalendarRange size={16} />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white">All Bookings</h3>
        </div>
        <button onClick={() => navigate('/events')} className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] hover:text-[#FF2B66] transition-colors">
          All &gt;
        </button>
      </header>

      {/* status filter chips */}
      <div className="flex flex-wrap gap-1.5 pt-3 shrink-0">
        {chips.map(c => {
          const count = c === 'All' ? all.length : all.filter(e => e.Status === c).length
          return (
            <button key={c} onClick={() => setFilter(c)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-all ${filter === c
                ? 'bg-[#FF2B66] text-white'
                : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-[#9CA3AF] hover:text-[#FF2B66]'}`}>
              {c} <span className={filter === c ? 'text-white/70' : 'opacity-60'}>{count}</span>
            </button>
          )
        })}
      </div>

      <div key={filter} className="fx-mode-swap flex-1 flex flex-col gap-2.5 my-3 overflow-y-auto no-scrollbar min-h-0 pr-1">
        {bookings.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-[#9CA3AF] py-6 text-center">No {filter.toLowerCase()} bookings.</p>
        ) : (
          bookings.map((e, i) => {
            const meta = statusMeta(e.Status)
            const clientName = clientById.get(e.ClientId)?.CompanyName || '—'
            const venueName = venueById.get(e.VenueId)?.Name || '—'
            return (
              <div key={e.Id}
                className={`flex items-center justify-between gap-3 rounded-lg border-l-4 ${meta.left} bg-gray-50 dark:bg-[#181820] p-2 transition-all duration-200 hover:translate-x-1 hover:shadow-sm cursor-pointer`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${AVATAR_BG[i % AVATAR_BG.length]}`}>
                    {initials(clientName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{e.Name}</p>
                    <p className="text-xs text-gray-500 dark:text-[#9CA3AF] truncate">
                      {timeRange(e.StartTime, e.EndTime)} · {venueName}
                    </p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.badge}`}>
                  {e.Status}
                </span>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}