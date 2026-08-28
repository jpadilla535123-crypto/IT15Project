import { CalendarDays, Inbox, CheckCircle2, Building2, MessageCircle } from 'lucide-react'
import { isToday, daysAgo, startOfWeekMonday, addDays, toDate, startOfDay } from './format'
import { formatTime12 } from '../calendar/calendarUtils'

const PILL = {
  red: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
  green: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  orange: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
}

export default function DashStats({ data }) {
  const { events, leads, venues } = data

  const todayCount = events.filter(e => isToday(e.StartDate)).length
  const pending = leads.filter(l => l.Status === 'New')
  const oldest = pending.length ? Math.max(...pending.map(p => daysAgo(p.CreatedDate))) : 0

  const wkStart = startOfWeekMonday(new Date())
  const wkEnd = addDays(wkStart, 6)
  const bookedThisWeek = events.filter(e => {
    if (e.Status !== 'Booked') return false
    const t = toDate(e.StartDate).getTime()
    return t >= wkStart.getTime() && t <= wkEnd.getTime()
  })

  const nextBooked = events
    .filter(e => e.Status !== 'Completed' && e.Status !== 'Cancelled')
    .map(e => ({ e, t: toDate(e.StartDate).getTime() }))
    .filter(x => x.t >= startOfDay(new Date()).getTime())
    .sort((a, b) => {
      const d = a.t - b.t
      if (d !== 0) return d
      return String(a.e.StartTime).localeCompare(String(b.e.StartTime))
    })[0]
  const next = nextBooked
    ? `${toDate(nextBooked.e.StartDate).toLocaleDateString('en-US', { weekday: 'short' })} ${toDate(nextBooked.e.StartDate).getDate()} · ${formatTime12(nextBooked.e.StartTime)}`
    : '—'

  const unread = leads.length

  const metrics = [
    {
      icon: CalendarDays,
      value: todayCount,
      label: "Today's Events",
      sub: `(${todayCount} active now · +${Math.max(todayCount - 1, 1)} vs avg)`,
      pill: null,
    },
    {
      icon: Inbox,
      value: pending.length,
      label: 'Pending Requests',
      sub: `(Oldest: ${oldest} days ago)`,
      pill: { tone: PILL.red, text: 'needs action' },
    },
    {
      icon: CheckCircle2,
      value: bookedThisWeek.length,
      label: 'Confirmed',
      sub: `(Next: ${next})`,
      pill: { tone: PILL.green, text: 'on track' },
    },
    {
      icon: Building2,
      value: venues.length,
      label: 'Venues',
      sub: '(2 availability checks open)',
      pill: { tone: PILL.red, text: '2 overdue' },
    },
    {
      icon: MessageCircle,
      value: unread,
      label: 'Unread',
      sub: `(3 direct · ${Math.max(unread - 3, 0)} channels)`,
      pill: { tone: PILL.orange, text: `+${unread} today` },
    },
  ]

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-4">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {metrics.map((m, i) => (
          <div key={m.label}
            className={`flex flex-col px-4 py-2 ${i > 0 ? 'xl:border-l xl:border-gray-200 dark:xl:border-[#2A2A36]' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-[#FF2B66]/10 flex items-center justify-center text-[#FF2B66]">
                <m.icon size={17} />
              </div>
              {m.pill && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${m.pill.tone}`}>{m.pill.text}</span>
              )}
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white">{m.value}</span>
              <span className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF]">{m.label}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-gray-400 dark:text-[#6B7280]">{m.sub}</p>
          </div>
        ))}
      </div>
    </section>
  )
}