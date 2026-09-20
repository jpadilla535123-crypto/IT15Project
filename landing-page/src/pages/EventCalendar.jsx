import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AppLayout from './AppLayout'
import CalendarToolbar from '../components/calendar/CalendarToolbar'
import MonthView from '../components/calendar/MonthView'
import YearView from '../components/calendar/YearView'
import EventDetailPanel from '../components/calendar/EventDetailPanel'
import NewEventModal from '../components/calendar/NewEventModal'
import DayEventsModal from '../components/calendar/DayEventsModal'
import { useData } from '../api/data'
import { api } from '../api/client'

function isoDate(value) {
  const d = new Date(value)
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function toEventPayload(e) {
  return {
    name: e.Name,
    eventType: e.EventType || 'Corporate',
    status: e.Status || 'New',
    startDate: isoDate(e.StartDate),
    endDate: isoDate(e.EndDate || e.StartDate),
    clientId: e.ClientId ?? null,
    venueId: e.VenueId ?? null,
    description: e.SpecialRequirements || e.Description || '',
  }
}

export default function EventCalendar({ user }) {
  const { data, reload } = useData()
  const [searchParams] = useSearchParams()
  const [view, setView] = useState('month')
  const [viewDate, setViewDate] = useState(() => {
    const param = searchParams.get('date')
    if (param) {
      const parsed = new Date(param)
      if (!isNaN(parsed.getTime())) return parsed
    }
    return new Date()
  })
  const [drafts, setDrafts] = useState([])
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ statuses: [], types: [], venueId: null, clientId: null })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [dayEvents, setDayEvents] = useState(null)
  const [modal, setModal] = useState({ open: false, edit: null })

  const clientById = useMemo(() => new Map(data.clients.map(c => [c.Id, c])), [data.clients])
  const venueById = useMemo(() => new Map(data.venues.map(v => [v.Id, v])), [data.venues])

  const allEvents = useMemo(() => [...data.events, ...drafts], [data.events, drafts])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allEvents.filter(e => {
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
  }, [allEvents, query, filters, clientById, venueById])

  const enriched = useMemo(() =>
    filtered.map(e => ({
      ...e,
      ClientName: clientById.get(e.ClientId)?.CompanyName || '—',
      VenueName: venueById.get(e.VenueId)?.Name || '—',
    })),
  [filtered, clientById, venueById])

  const selected = enriched.find(e => e.Id === selectedId) || null

  const title = useMemo(() => {
    if (view === 'year') return String(viewDate.getFullYear())
    return viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }, [view, viewDate])

  function navigate(dir) {
    const d = new Date(viewDate)
    if (view === 'year') d.setFullYear(d.getFullYear() + dir)
    else d.setMonth(d.getMonth() + dir)
    setViewDate(d)
  }

  function removeDraft(id) {
    setDrafts(prev => prev.filter(d => d.Id !== id))
  }

  function persistCreate(draft) {
    api.post('/api/events', toEventPayload(draft))
      .then(() => { removeDraft(draft.Id); return reload() })
      .catch(err => { console.error('Create event failed:', err); alert(err.message) })
  }

  function handleCreate(data) {
    const draft = { ...data, Id: `draft-${Date.now()}` }
    setDrafts(prev => [...prev, draft])
    setModal({ open: false, edit: null })
    persistCreate(draft)
  }

  function handleUpdate(data) {
    setSelectedId(null)
    setModal({ open: false, edit: null })
    if (typeof data.Id === 'string') {
      /* event may not be persisted yet — ship it as a fresh create */
      persistCreate({ ...data, Status: 'New' })
      return
    }
    api.put(`/api/events/${data.Id}`, toEventPayload(data))
      .then(reload)
      .catch(err => { console.error('Update event failed:', err); alert(err.message) })
  }

  function handleCancelEvent(event) {
    if (typeof event.Id === 'string') {
      setDrafts(prev => prev.filter(d => d.Id !== event.Id))
      setSelectedId(null)
      return
    }
    api.put(`/api/events/${event.Id}`, toEventPayload({ ...event, Status: 'Cancelled' }))
      .then(reload)
      .catch(err => { console.error('Cancel event failed:', err); alert(err.message) })
    setSelectedId(null)
  }

  function handleMore(date, list) {
    setDayEvents({ date, list })
  }

  function handleSelect(event) {
    setSelectedId(event.Id)
  }

  return (
    <AppLayout user={user} badgeCount={data.leads.length} searchValue={query} onSearchChange={setQuery}>
      <div className="h-full min-h-0 flex flex-col gap-4">
        <CalendarToolbar
          view={view}
          onViewChange={setView}
          title={title}
          onNavigate={navigate}
          onNewEvent={() => setModal({ open: true, edit: null })}
          venues={data.venues}
          clients={data.clients}
          filters={filters}
          onFilterChange={setFilters}
          filterOpen={filtersOpen}
          onToggleFilter={() => setFiltersOpen(o => !o)}
        />

        <div className="flex-1 min-h-0">
          {view === 'month' && (
            <MonthView viewDate={viewDate} events={enriched} onSelect={handleSelect} onMore={handleMore} />
          )}
          {view === 'year' && (
            <YearView viewDate={viewDate} events={allEvents} onJumpDay={d => { setView('month'); setViewDate(d) }} />
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
            events={allEvents}
            clients={data.clients}
            venues={data.venues}
          />
        )}
      </div>
    </AppLayout>
  )
}