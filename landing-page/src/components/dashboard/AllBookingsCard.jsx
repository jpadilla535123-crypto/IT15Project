import { CalendarRange } from 'lucide-react'
import { toDate } from './format'
import { timeRange, statusMeta } from '../calendar/calendarUtils'

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
  const venueById = new Map(data.venues.map(v => [v.Id, v]))
  const clientById = new Map(data.clients.map(c => [c.Id, c]))

  const bookings = data.events
    .filter(e => ACTIVE_STATUSES.includes(e.Status))
    .sort((a, b) => {
      const d = toDate(a.StartDate) - toDate(b.StartDate)
      if (d !== 0) return d
      return String(a.StartTime).localeCompare(String(b.StartTime))
    })

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-4 flex flex-col justify-between h-full min-w-0">
      <header className="flex items-center justify-between shrink-0 border-b border-gray-200 dark:border-[#2A2A36]/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#FF2B66]/10 flex items-center justify-center text-[#FF2B66]">
            <CalendarRange size={16} />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white">All Bookings</h3>
        </div>
        <button className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] hover:text-[#FF2B66] transition-colors">
          All &gt;
        </button>
      </header>

      <div className="flex-1 flex flex-col gap-2.5 my-3 overflow-y-auto no-scrollbar min-h-0 pr-1">
        {bookings.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-[#9CA3AF] py-6 text-center">No active bookings.</p>
        ) : (
          bookings.map((e, i) => {
            const meta = statusMeta(e.Status)
            const clientName = clientById.get(e.ClientId)?.CompanyName || '—'
            const venueName = venueById.get(e.VenueId)?.Name || '—'
            return (
              <div key={e.Id}
                className={`flex items-center justify-between gap-3 rounded-lg border-l-4 ${meta.left} bg-gray-50 dark:bg-[#181820] p-2`}>
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

      <footer className="shrink-0 pt-2 border-t border-gray-200 dark:border-[#2A2A36]/60 text-center">
        <button className="text-xs font-semibold text-[#FF2B66] hover:underline">
          View all {bookings.length} bookings →
        </button>
      </footer>
    </section>
  )
}