import { useMemo, useState } from 'react'
import {
  Search, Plus, List, LayoutGrid, ChevronDown, ChevronLeft, ChevronRight, CalendarDays,
  MapPin, Users, Clock,
} from 'lucide-react'
import { EVENT_STATUS_TONES } from './BookedEventCard'
import '../../pages/landingFx.css'

const PAGE_SIZE = 10

const STATUS_ORDER = { New: 0, Pending: 1, Booked: 2, Completed: 3, Cancelled: 4 }

const FILTER_OPTIONS = ['All Events', 'New', 'Pending', 'Booked', 'Completed', 'Cancelled']

function statusBadge(status) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${EVENT_STATUS_TONES[status] || EVENT_STATUS_TONES.Pending}`}>
      {status}
    </span>
  )
}

export default function BookingsTable({ events, onSelect, onBookNew }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All Events')
  const [page, setPage] = useState(1)
  const [view, setView] = useState('list')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = events.filter(e => {
      if (filter !== 'All Events' && e.Status !== filter) return false
      if (!q) return true
      return [e.Name, e.ClientName, e.EventType, e.VenueName].some(v =>
        String(v || '').toLowerCase().includes(q)
      )
    })
    return [...rows].sort((a, b) => {
      const statusDiff = (STATUS_ORDER[a.Status] ?? 9) - (STATUS_ORDER[b.Status] ?? 9)
      if (statusDiff !== 0) return statusDiff
      return String(a.Name || '').localeCompare(String(b.Name || ''))
    })
  }, [events, query, filter])

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const from = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const to = Math.min(safePage * PAGE_SIZE, total)

  return (
    <section className="flex flex-col h-full rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217]">
      <div className="p-5 flex flex-col md:flex-row md:items-center gap-3 border-b border-gray-200 dark:border-[#2A2A36] shrink-0">
        <div className="flex flex-1 max-w-sm items-center gap-2.5 rounded-xl bg-gray-100 dark:bg-[#181820] px-3.5 py-2.5 border border-transparent focus-within:border-[#FF2B66]/50 transition-colors">
          <Search size={16} className="text-gray-400 dark:text-[#6B7280]" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1) }}
            placeholder="Search events..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-[#6B7280] text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 md:ml-auto">
          <div className="flex h-10 rounded-xl bg-gray-100 dark:bg-[#181820] p-1">
            {[['list', List, 'List'], ['grid', LayoutGrid, 'Grid']].map(([key, Icon, label]) => (
              <button key={key} onClick={() => setView(key)} title={`${label} view`}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-all ${
                  view === key ? 'bg-white dark:bg-[#22222C] text-[#FF2B66] shadow-sm' : 'text-gray-500 dark:text-[#9CA3AF] hover:text-gray-900 dark:hover:text-white'
                }`}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          <div className="relative h-10">
            <select
              value={filter}
              onChange={e => { setFilter(e.target.value); setPage(1) }}
              className="h-10 appearance-none rounded-xl bg-gray-100 dark:bg-[#181820] pl-3.5 pr-9 text-sm font-medium text-gray-600 dark:text-[#9CA3AF] focus:outline-none cursor-pointer">
              {FILTER_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <button onClick={onBookNew}
            className="inline-flex items-center gap-1.5 bg-[#FF2B66] hover:bg-[#E0245A] text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-all hover:shadow-lg hover:shadow-rose-500/20 active:scale-95">
            <Plus size={16} /> Book Event
          </button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="flex-1 overflow-y-auto p-4">
          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500 dark:text-[#9CA3AF]">No events found.</p>
          ) : (
            <div key={`${filter}-${safePage}-${query}`} className="fx-mode-swap grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {rows.map(event => {
                const clickable = event.Status !== 'Cancelled'
                return (
                  <button key={event.Id} disabled={!clickable}
                    onClick={() => clickable && onSelect && onSelect(event)}
                    className={`text-left rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-gray-50 dark:bg-[#181820] p-4 transition-all ${
                      clickable ? 'hover:border-[#FF2B66]/40 hover:-translate-y-0.5 hover:shadow-md cursor-pointer' : 'opacity-60'
                    }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-9 w-9 shrink-0 rounded-lg bg-[#FF2B66]/10 text-[#FF2B66] flex items-center justify-center">
                          <CalendarDays size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900 dark:text-white text-sm">{event.Name}</p>
                          <p className="truncate text-xs text-gray-500 dark:text-[#9CA3AF]">{event.ClientName || '—'}</p>
                        </div>
                      </div>
                      {statusBadge(event.Status)}
                    </div>
                    <div className="mt-3 space-y-1.5 text-xs text-gray-500 dark:text-[#9CA3AF]">
                      <p className="flex items-center gap-1.5 truncate">
                        <Clock size={12} className="shrink-0" />
                        {event.StartDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {event.StartTime}
                      </p>
                      <p className="flex items-center gap-1.5 truncate">
                        <MapPin size={12} className="shrink-0" /> {event.VenueName || '—'}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Users size={12} className="shrink-0" /> {event.Guests ? `${event.Guests.toLocaleString()} guests` : '—'}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ) : (
      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-[#2A2A36]">
            <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">Event</th>
            <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">Client</th>
            <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">Schedule</th>
            <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">Venue</th>
            <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">Guests</th>
            <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-[#2A2A36]/60">
          {rows.map(event => {
            const clickable = event.Status !== 'Cancelled'
            const schedule = event.StartDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            return (
              <tr
                key={event.Id}
                onClick={() => clickable && onSelect && onSelect(event)}
                className={`transition-colors ${clickable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02]' : 'opacity-60'}`}
              >
                <td className="px-3 py-4 max-w-[260px]">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-[#FF2B66]/10 text-[#FF2B66] flex items-center justify-center">
                      <CalendarDays size={14} />
                    </div>
                    <span className="truncate font-semibold text-gray-900 dark:text-white">{event.Name}</span>
                  </div>
                </td>
                <td className="px-3 py-4 max-w-[180px]">
                  <span className="block truncate text-gray-600 dark:text-gray-300">{event.ClientName || '—'}</span>
                </td>
                <td className="px-3 py-4 text-[13px] whitespace-nowrap text-gray-500 dark:text-[#9CA3AF]">
                  {event.StartTime} · {schedule}
                </td>
                <td className="px-3 py-4 max-w-[160px]">
                  <span className="block truncate text-[13px] text-gray-500 dark:text-[#9CA3AF]">{event.VenueName || '—'}</span>
                </td>
                <td className="px-3 py-4 text-[13px] whitespace-nowrap text-gray-500 dark:text-[#9CA3AF]">
                  {event.Guests ? `${event.Guests.toLocaleString()} guests` : '—'}
                </td>
                <td className="px-3 py-4 text-right whitespace-nowrap">{statusBadge(event.Status)}</td>
              </tr>
            )
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-[#9CA3AF]">No events found.</td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
      )}

      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-200 dark:border-[#2A2A36] shrink-0">
        <p className="text-sm text-gray-500 dark:text-[#9CA3AF]">
          Showing {from}–{to} of {total} events
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage <= 1}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-40 transition-colors">
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map(n => (
            <button key={n} onClick={() => setPage(n)}
              className={`h-8 w-8 rounded-lg text-sm font-semibold transition-colors ${n === safePage ? 'bg-[#FF2B66] text-white' : 'text-gray-500 dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-white/10'}`}>
              {n}
            </button>
          ))}
          <button onClick={() => setPage(Math.min(pageCount, safePage + 1))} disabled={safePage >= pageCount}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-40 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  )
}