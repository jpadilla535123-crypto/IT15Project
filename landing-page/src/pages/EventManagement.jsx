import { useState } from 'react'
import AppLayout from './AppLayout'
import BookingsTable from '../components/events/BookingsTable'
import EventDetailDrawer from '../components/events/EventDetailDrawer'
import { dashboardData } from '../components/dashboard/sampleData'

export default function EventManagement({ user }) {
  const { venues, employees, clients } = dashboardData
  const [events, setEvents] = useState(dashboardData.events)
  const [selectedId, setSelectedId] = useState(null)

  const venueById = new Map(venues.map(v => [v.Id, v]))
  const clientById = new Map(clients.map(c => [c.Id, c]))

  const enrichedEvents = events.map(e => ({
    ...e,
    ClientName: clientById.get(e.ClientId)?.CompanyName || '—',
    VenueName: venueById.get(e.VenueId)?.Name || '—',
    fee: venueById.get(e.VenueId)?.PricePerDay || 0,
  }))

  const selected = enrichedEvents.find(e => e.Id === selectedId) || null
  const selectedClient = selected ? clientById.get(selected.ClientId) : null
  const selectedVenueFor = selected ? venueById.get(selected.VenueId) : null

  function handleCancel(event) {
    setEvents(prev => prev.map(e => (e.Id === event.Id ? { ...e, Status: 'Cancelled' } : e)))
    setSelectedId(null)
  }

  function handleSave(data) {
    setEvents(prev => prev.map(e => (e.Id === selected.Id ? { ...e, ...data } : e)))
  }

  function handleConfirm(event) {
    setEvents(prev => prev.map(e => (e.Id === event.Id ? { ...e, Status: 'Booked' } : e)))
    setSelectedId(null)
  }

  return (
    <AppLayout user={user} badgeCount={dashboardData.leads.length}>
      <div className="flex flex-col gap-4 h-full min-h-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Event Management</h1>
          <p className="text-sm text-gray-400 dark:text-[#6B7280]">
            Book events, pick venues, assign your team, and manage payments.
          </p>
        </div>

        <div className="flex-1 min-h-0">
          <BookingsTable events={enrichedEvents} onSelect={e => setSelectedId(e.Id)} />
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