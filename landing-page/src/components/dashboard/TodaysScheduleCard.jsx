import { Clock } from 'lucide-react'
import { toDate, isToday } from './format'
import { statusMeta, timeRange, formatTime12 } from '../calendar/calendarUtils'

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

export default function TodaysScheduleCard({ data }) {
  const venueById = new Map(data.venues.map(v => [v.Id, v]))
  const clientById = new Map(data.clients.map(c => [c.Id, c]))

  const items = data.events
    .filter(e => isToday(e.StartDate))
    .sort((a, b) => String(a.StartTime).localeCompare(String(b.StartTime)))

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-4 flex flex-col justify-between flex-1 min-h-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#FF2B66]/10 flex items-center justify-center text-[#FF2B66]">
            <Clock size={16} />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white">Today's Schedule</h3>
          <span className="rounded-full bg-[#FF2B66]/10 text-[#FF2B66] text-[11px] font-bold px-2 py-0.5">
            {items.length}
          </span>
        </div>
        <button className="text-xs font-semibold text-[#FF2B66] hover:underline">View all &gt;</button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-[#9CA3AF] py-6 text-center">No events scheduled today.</p>
      ) : (
        <ol className="relative flex-1">
          {items.length > 1 && (
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-200 dark:bg-[#2A2A36]" />
          )}
          {items.map((e, i) => {
            const meta = statusMeta(e.Status)
            const clientName = clientById.get(e.ClientId)?.CompanyName || '—'
            const venueName = venueById.get(e.VenueId)?.Name || '—'
            return (
              <li key={e.Id} className="relative flex gap-4 pb-4 last:pb-0">
                <div className="flex flex-col items-center w-8 shrink-0">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-[#9CA3AF] whitespace-nowrap">
                    {formatTime12(e.StartTime).toUpperCase()}
                  </span>
                  <span className={`mt-2 h-2.5 w-2.5 rounded-full ring-4 ring-gray-100 dark:ring-[#121217] ${meta.dot}`} />
                </div>
                <div className="flex flex-1 min-w-0 items-center gap-3 rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-gray-50 dark:bg-white/5 p-3">
                  <div className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${AVATAR_BG[i % AVATAR_BG.length]}`}>
                    {initials(clientName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{e.Name}</p>
                    <p className="text-xs text-gray-500 dark:text-[#9CA3AF] truncate">
                      {timeRange(e.StartTime, e.EndTime)} · {venueName}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.badge}`}>
                    {e.Status}
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}