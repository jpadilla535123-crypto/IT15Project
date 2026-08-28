import { CalendarDays, ChevronRight } from 'lucide-react'

export const EVENT_STATUS_TONES = {
  New: 'bg-blue-500/10 text-blue-500',
  Pending: 'bg-amber-500/10 text-amber-500',
  Booked: 'bg-[#FF2B66]/10 text-[#FF2B66]',
  Completed: 'bg-emerald-500/10 text-emerald-500',
  Cancelled: 'bg-red-500/10 text-red-500',
}

export default function BookedEventCard({ event, onClick }) {
  const pill = event.StartDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  const clickable = event.Status !== 'Cancelled'

  const content = (
    <>
      <div className="flex items-center gap-3 min-w-0">
        <span className="h-9 w-9 shrink-0 rounded-xl bg-[#FF2B66]/10 flex items-center justify-center">
          <CalendarDays size={16} className="text-[#FF2B66]" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{event.Name}</p>
          <p className="truncate text-[11px] text-gray-400 dark:text-[#6B7280]">
            {event.ClientName || '—'} · {event.EventType}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <span className="hidden sm:inline rounded-full bg-gray-100 dark:bg-[#2A2A36] px-2.5 py-0.5 text-[11px] font-medium text-gray-500 dark:text-[#9CA3AF]">
          {event.StartTime} · {pill}
        </span>
        <span className="hidden md:inline rounded-full bg-gray-100 dark:bg-[#2A2A36] px-2.5 py-0.5 text-[11px] font-medium text-gray-500 dark:text-[#9CA3AF]">
          {event.Guests} guests
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${EVENT_STATUS_TONES[event.Status] || EVENT_STATUS_TONES.Pending}`}>
          {event.Status}
        </span>
        {clickable && <ChevronRight size={15} className="text-gray-400 dark:text-[#6B7280]" />}
      </div>
    </>
  )

  if (!clickable) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] px-4 py-3 opacity-60 shadow-sm">
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onClick && onClick(event)}
      className="w-full flex items-center justify-between gap-3 rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] px-4 py-3 text-left shadow-sm hover:border-[#FF2B66]/40 hover:shadow transition-all group"
    >
      {content}
    </button>
  )
}