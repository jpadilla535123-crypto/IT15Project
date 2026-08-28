import { useMemo, useState } from 'react'
import AppLayout from './AppLayout'
import CalendarToolbar from '../components/calendar/CalendarToolbar'
import MonthView from '../components/calendar/MonthView'
import WeekView from '../components/calendar/WeekView'
import YearView from '../components/calendar/YearView'
import EventDetailPanel from '../components/calendar/EventDetailPanel'
import NewEventModal from '../components/calendar/NewEventModal'
import DayEventsModal from '../components/calendar/DayEventsModal'
import { weekDays } from '../components/calendar/calendarUtils'
import { formatMonthDay } from '../components/dashboard/format'
import { dashboardData } from '../components/dashboard/sampleData'

export default function EventCalendar({ user }) {
  const [view, setView] = useState('month')
  const [viewDate, setViewDate] = useState(() => new Date())
  const [events, setEvents] = useState(dashboardData.events)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ statuses: [], types: [], venueId: null, clientId: null })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [dayEvents, setDayEvents] = useState(null)
  const [modal, setModal] = useState({ open: false, edit: null })

  const clientById = useMemo(() => new Map(dashboardData.clients.map(c => [c.Id, c])), [])
  const venueById = useMemo(() => new Map(dashboardData.venues.map(v => [v.Id, v])), [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return events.filter(e => {
      if (filters.statuses.length && !filters.statuses.includes(e.Status)) return false
      if (filters.types.length && !filters.types.includes(e.EventType)) return false
      if (filters.venueId && e.VenueId !== filters.venueId) return false
      if (filters.clientId && e.ClientId !== filters.clientId) return false
      if (q) {
        const client = clientById.get(e.ClientId)
        const venue = venueById.get(e.VenueId)
        const hay = [e.Name, e.EventType, client?.CompanyName, venue?.Name].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [events, query, filters, clientById, venueById])

  const enriched = useMemo(() =>
    filtered.map(e => ({
      ...e,
      ClientName: clientById.get(e.ClientId)?.CompanyName || '—',
      VenueName: venueById.get(e.VenueId)?.Name || '—',
    })),
  [filtered, clientById, venueById])

  const selected = enriched.find(e => e.Id === selectedId) || null

  const title = useMemo(() => {
    if (view === 'week') {
      const days = weekDays(viewDate)
      return `${formatMonthDay(days[0])} – ${formatMonthDay(days[6])}, ${days[6].getFullYear()}`
    }
    if (view === 'year') return String(viewDate.getFullYear())
    return viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }, [view, viewDate])

  function navigate(dir) {
    const d = new Date(viewDate)
    if (view === 'week') d.setDate(d.getDate() + 7 * dir)
    else if (view === 'year') d.setFullYear(d.getFullYear() + dir)
    else d.setMonth(d.getMonth() + dir)
    setViewDate(d)
  }

  function goToday() {
    setViewDate(new Date())
  }

  function handleCreate(data) {
    const id = Math.max(0, ...events.map(e => e.Id)) + 1
    setEvents(prev => [...prev, { ...data, Id: id }])
    setModal({ open: false, edit: null })
  }

  function handleUpdate(data) {
    setEvents(prev => prev.map(e => (e.Id === data.Id ? { ...e, ...data } : e)))
    setSelectedId(null)
    setModal({ open: false, edit: null })
  }

  function handleCancelEvent(event) {
    setEvents(prev => prev.map(e => (e.Id === event.Id ? { ...e, Status: 'Cancelled' } : e)))
  }

  function handleMore(date, list) {
    setDayEvents({ date, list })
  }

  function handleSelect(event) {
    setSelectedId(event.Id)
  }

  return (
    <AppLayout user={user} badgeCount={dashboardData.leads.length} searchValue={query} onSearchChange={setQuery}>
      <div className="h-full min-h-0 flex flex-col gap-4">
        <CalendarToolbar
          view={view}
          onViewChange={setView}
          title={title}
          onNavigate={navigate}
          onToday={goToday}
          onNewEvent={() => setModal({ open: true, edit: null })}
          venues={dashboardData.venues}
          clients={dashboardData.clients}
          filters={filters}
          onFilterChange={setFilters}
          filterOpen={filtersOpen}
          onToggleFilter={() => setFiltersOpen(o => !o)}
        />

        <div className="flex-1 min-h-0">
          {view === 'month' && (
            <MonthView viewDate={viewDate} events={enriched} onSelect={handleSelect} onMore={handleMore} />
          )}
          {view === 'week' && (
            <WeekView viewDate={viewDate} events={enriched} onSelect={handleSelect} />
          )}
          {view === 'year' && (
            <YearView viewDate={viewDate} events={events} onJumpDay={d => { setView('month'); setViewDate(d) }} />
          )}
        </div>

        {query && (
          <p className="text-xs text-gray-500 dark:text-[#9CA3AF]">
            {filtered.length} event{filtered.length === 1 ? '' : 's'} matching "{query}"
          </p>
        )}

        {selected && (
          <EventDetailPanel
            event={selected}
            onClose={() => setSelectedId(null)}
            onEdit={e => setModal({ open: true, edit: e })}
            onCancelEvent={handleCancelEvent}
          />
        )}

        {dayEvents && (
          <DayEventsModal
            date={dayEvents.date}
            list={dayEvents.list}
            onClose={() => setDayEvents(null)}
            onSelect={e => { setDayEvents(null); setSelectedId(e.Id) }}
          />
        )}

        {modal.open && (
          <NewEventModal
            key={modal.edit ? modal.edit.Id : 'new'}
            edit={modal.edit}
            onClose={() => setModal({ open: false, edit: null })}
            onCreate={handleCreate}
            onUpdate={handleUpdate}
            events={events}
            clients={dashboardData.clients}
            venues={dashboardData.venues}
          />
        )}
      </div>
    </AppLayout>
  )
}