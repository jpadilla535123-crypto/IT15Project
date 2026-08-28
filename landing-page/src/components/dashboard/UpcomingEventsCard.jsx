import { ChevronRight, Calendar } from 'lucide-react'
import { isUpcoming, formatMonthDay } from './format'

export default function UpcomingEventsCard({ data }) {
  const clientsById = Object.fromEntries(data.clients.map(c => [c.Id, c]))

  const upcoming = data.events
    .filter(isUpcoming)
    .sort((a, b) => new Date(a.StartDate) - new Date(b.StartDate))
    .slice(0, 5)

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Upcoming Events</h2>
        <a href="#manage-events" className="inline-flex items-center gap-0.5 text-sm font-semibold text-[#FF2B66] hover:gap-1.5 transition-all">
          View All <ChevronRight size={15} />
        </a>
      </div>

      {upcoming.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-[#9CA3AF] py-6 text-center">No upcoming events.</p>
      ) : (
        <ul className="space-y-3.5">
          {upcoming.map(e => {
            const client = clientsById[e.ClientId]
            return (
              <li key={e.Id} className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-[#FF2B66]/10 flex items-center justify-center text-[#FF2B66]">
                  <Calendar size={17} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{e.Name}</p>
                  <p className="text-xs text-gray-500 dark:text-[#9CA3AF] mt-0.5">
                    {formatMonthDay(e.StartDate)} <span className="text-gray-400 dark:text-[#6B7280]">•</span> {client?.CompanyName || '—'}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}