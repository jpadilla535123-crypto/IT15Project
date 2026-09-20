import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AppLayout from './AppLayout'
import BookingsTable from '../components/events/BookingsTable'
import EventDetailDrawer from '../components/events/EventDetailDrawer'
import { useData } from '../api/data'
import { api } from '../api/client'

const PERSIST_KEYS = ['Name', 'EventType', 'VenueId', 'Guests', 'StartTime', 'StartDate', 'SpecialRequirements']

function isoDate(value) {
  const d = new Date(value)
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function toEventPayload(e, status, venueId) {
  return {
    name: e.Name,
    eventType: e.EventType || 'Corporate',
    status,
    startDate: isoDate(e.StartDate),
    endDate: isoDate(e.EndDate || e.StartDate),
    clientId: e.ClientId ?? null,
    venueId: venueId ?? e.VenueId ?? null,
    description: e.SpecialRequirements || e.Description || '',
    accessType: e.AccessType || 'Private',
  }
}

export default function EventManagement({ user }) {
  const { data, reload } = useData()
  const { venues, employees, clients } = data
  /* local[id] holds edits while the drawer is open: for real events it's a
     partial overlay, for new bookings ("draft-...") it is the full draft. */
  const [local, setLocal] = useState({})
  const [selectedId, setSelectedId] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()

  const venueById = new Map(venues.map(v => [v.Id, v]))
  const clientById = new Map(clients.map(c => [c.Id, c]))

  function effectiveOf(id) {
    const base = data.events.find(e => e.Id === id)
    const patch = local[id]
    if (!base && !patch) return null
    return base ? { ...base, ...patch } : patch
  }

  const allEvents = data.events.map(e => effectiveOf(e.Id)).filter(Boolean)
  const drafts = Object.values(local).filter(p => typeof p.Id === 'string')
  const combined = [...allEvents, ...drafts]

  // Bookings table shows only events already confirmed in the DB, never in-progress drafts.
  const enrichedEvents = allEvents.map(e => ({
    ...e,
    ClientName: clientById.get(e.ClientId)?.CompanyName || '—',
    VenueName: venueById.get(e.VenueId)?.Name || '—',
    fee: venueById.get(e.VenueId)?.PricePerDay || 0,
  }))

  const enrichedCombined = combined.map(e => ({
    ...e,
    ClientName: clientById.get(e.ClientId)?.CompanyName || '—',
    VenueName: venueById.get(e.VenueId)?.Name || '—',
    fee: venueById.get(e.VenueId)?.PricePerDay || 0,
  }))

  const selected = enrichedCombined.find(e => e.Id === selectedId) || null
  const selectedClient = selected ? clientById.get(selected.ClientId) : null
  const selectedVenueFor = selected ? venueById.get(selected.VenueId) : null

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setSearchParams({}, { replace: true })
      handleBookNew()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function patch(id, fields) {
    setLocal(prev => ({ ...prev, [id]: { ...(prev[id] || {}), ...fields } }))
  }

  function handleBookNew() {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    const draft = {
      Id: `draft-${Date.now()}`,
      Name: '', EventType: 'Corporate', Status: 'New',
      ClientId: null, VenueId: venues[0]?.Id,
      StartDate: tomorrow, EndDate: tomorrow, StartTime: '09:00', EndTime: '17:00',
      Guests: 50, SpecialRequirements: '',
      AccessType: 'Private',
    }
    patch(draft.Id, draft)
    setSelectedId(draft.Id)
  }

  function handleCancel(event) {
    setSelectedId(null)
    if (typeof event.Id === 'string') {
      setLocal(prev => {
        const next = { ...prev }
        delete next[event.Id]
        return next
      })
      return
    }
    const effective = effectiveOf(event.Id)
    Promise.resolve()
      .then(() => api.put(`/api/events/${event.Id}`, toEventPayload(effective, 'Cancelled')))
      .then(reload)
      .catch(err => console.error('Cancel failed:', err))
  }

  function handleSave(merge) {
    const key = Object.keys(merge)[0]
    const id = selected.Id
    const isDraft = typeof id === 'string'

    patch(id, merge)

    if (isDraft) {
      const effective = { ...effectiveOf(id), ...merge }
      // "Save as Draft" persists the draft as a real event with status Pending.
      if (effective.Name) {
        api.post('/api/events', toEventPayload(effective, 'Pending'))
          .then(res => {
            setLocal(prev => {
              const next = { ...prev }
              delete next[id]
              next[res.id] = { ...effective, Id: res.id, Status: 'Pending' }
              return next
            })
            setSelectedId(res.id)
            reload()
          })
          .catch(err => console.error('Save draft failed:', err))
      }
      return
    }

    const effective = { ...effectiveOf(id), ...merge }
    if (PERSIST_KEYS.includes(key) && effective.Name) {
      Promise.resolve()
        .then(() => api.put(`/api/events/${id}`, toEventPayload(effective, effective.Status)))
        .catch(err => console.error('Save failed:', err))
    }
  }

  async function handleConfirm(event, pays = []) {
    try {
      let venueId = event.VenueId
      const isRealVenue = venues.some(v => v.Id === venueId)
      if (!isRealVenue && event._newVenue) {
        const vd = await api.post('/api/venues', {
          name: event._newVenue.Name || '',
          address: event._newVenue.Address || '',
          city: event._newVenue.City || '',
          capacity: Number(event._newVenue.Capacity) || 0,
          pricePerDay: Number(event._newVenue.PricePerDay) || 0,
        })
        venueId = vd.id
      }

      // If the event has no linked client yet but the drawer captured client
      // details, create the client first so the event can reference it.
      let clientId = event.ClientId ?? null
      const ci = event._clientInfo
      if (clientId == null && ci && (ci.CompanyName?.trim() || ci.ContactName?.trim())) {
        const cd = await api.post('/api/clients', {
          companyName: ci.CompanyName?.trim() || ci.ContactName?.trim(),
          contactPerson: ci.ContactName?.trim() || null,
          email: ci.Email?.trim() || null,
          phone: ci.Phone?.trim() || null,
          address: ci.Address?.trim() || null,
          clientType: 'Corporate',
          status: 'Booked',
          dateOfInquiry: new Date().toISOString().slice(0, 10),
        })
        clientId = cd.id
      }

      const payload = toEventPayload(event, 'Booked', venueId)
      payload.clientId = clientId

      let eventId
      if (typeof event.Id === 'string') {
        const created = await api.post('/api/events', payload)
        eventId = created.id
      } else {
        await api.put(`/api/events/${event.Id}`, payload)
        eventId = event.Id
      }

      // Record each payment that has a proof screenshot attached. This also
      // auto-creates the invoice for the event when none exists yet.
      for (const pay of pays) {
        if (!pay.file || !(pay.amount > 0)) continue
        const fd = new FormData()
        fd.append('eventId', String(eventId))
        if (clientId) fd.append('clientId', String(clientId))
        fd.append('amount', String(pay.amount))
        fd.append('paymentDate', new Date().toISOString().slice(0, 10))
        fd.append('method', pay.method)
        fd.append('reference', pay.reference || '')
        fd.append('evidence', pay.file)
        await api.post('/api/payments/with-evidence', fd)
      }

      await reload()
      setSelectedId(null)
      setLocal({})
    } catch (err) {
      console.error('Confirm failed:', err)
      alert(err.message)
    }
  }

  return (
    <AppLayout user={user} badgeCount={data.leads.length}>
      <div className="flex flex-col gap-4 h-full min-h-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Event Management</h1>
          <p className="text-sm text-gray-400 dark:text-[#6B7280]">
            Book events, pick venues, assign your team, and manage payments.
          </p>
        </div>

        <div className="flex-1 min-h-0">
          <BookingsTable events={enrichedEvents} onSelect={e => setSelectedId(e.Id)} onBookNew={handleBookNew} />
        </div>
      </div>

      {selected && (
        <EventDetailDrawer
          key={selected.Id}
          event={selected}
          client={selectedClient}
          venue={selectedVenueFor}
          venues={venues}
          employees={employees}
          onClose={() => setSelectedId(null)}
          onCancel={handleCancel}
          onSave={handleSave}
          onConfirm={handleConfirm}
        />
      )}
    </AppLayout>
  )
}