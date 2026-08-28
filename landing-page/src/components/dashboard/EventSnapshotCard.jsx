import { CalendarDays, CalendarClock, CheckCircle2, XCircle, ChevronRight } from 'lucide-react'
import { isUpcoming } from './format'

export default function EventSnapshotCard({ data }) {
  const total = data.events.length
  const upcoming = data.events.filter(isUpcoming).length
  const completed = data.events.filter(e => e.Status === 'Completed').length
  const cancelled = data.events.filter(e => e.Status === 'Cancelled').length

  const stats = [
    { label: 'Total Events', value: total, icon: CalendarDays },
    { label: 'Upcoming', value: upcoming, icon: CalendarClock },
    { label: 'Completed', value: completed, icon: CheckCircle2 },
    { label: 'Cancelled', value: cancelled, icon: XCircle },
  ]

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-6 lg:col-span-2">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Event Snapshot</h2>
        <a href="#" className="inline-flex items-center gap-0.5 text-sm font-semibold text-[#FF2B66] hover:gap-1.5 transition-all">
          Show All <ChevronRight size={15} />
        </a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-xl bg-gray-50 dark:bg-[#181820] border border-gray-200 dark:border-[#2A2A36] p-4">
              <div className="w-9 h-9 rounded-lg bg-[#FF2B66]/10 flex items-center justify-center mb-3">
                <Icon size={17} className="text-[#FF2B66]" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{s.value}</div>
              <div className="text-xs text-gray-500 dark:text-[#9CA3AF] mt-0.5">{s.label}</div>
            </div>
          )
        })}
      </div>
    </section>
  )
}