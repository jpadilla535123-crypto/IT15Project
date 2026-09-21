import { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { api } from './client'
import { useAuth } from '../contexts/AuthContext'
import { toDate } from '../components/dashboard/format'

export const DataContext = createContext(null)

/* API → UI field mapping
   Backend returns camelCase rows inside a paged `{ items, total, page, pageSize, totalPages }`
   envelope. The UI reads PascalCase everywhere, so every row is remapped here.
   Fields the DB does not store are synthesized deterministically so the UI keeps
   its shape without inventing mutable state. */

const TIME_SLOTS = [
  ['09:00', '12:00'], ['13:00', '17:00'], ['17:00', '21:00'],
  ['08:00', '12:00'], ['14:00', '18:00'], ['18:00', '22:00'],
  ['10:00', '15:00'], ['11:00', '16:00'],
]

const CLIENT_SOURCES = ['Referral', 'Walk-in', 'Website', 'LinkedIn', 'Facebook']
const SUP_CITIES = ['Quezon City', 'Makati', 'Taguig', 'Pasig', 'Manila', 'Parañaque']
const PO_STATUS = { Booked: 'Ordered', Confirmed: 'Shipped', Completed: 'Delivered' }

const EMPTY = { clients: [], employees: [], venues: [], events: [], leads: [], suppliers: [], purchaseOrders: [], assignments: {}, assignmentRows: [], invoices: [], payments: [], supplierPayments: [], registrations: [] }

function unwrap(res) {
  if (res && Array.isArray(res.items)) return res.items
  if (Array.isArray(res)) return res
  return []
}

function mapEvent(e, venuesById) {
  const slot = TIME_SLOTS[(e.id - 1) % TIME_SLOTS.length] || TIME_SLOTS[0]
  const cap = venuesById.get(e.venueId)?.Capacity || 0
  const guests = cap
    ? Math.max(20, Math.round(cap * (0.3 + ((e.id % 5) * 0.12))))
    : 20 + ((e.id * 13) % 180)
  return {
    Id: e.id,
    Name: e.name,
    EventType: e.eventType,
    Status: e.status,
    AccessType: e.accessType || 'Private',
    ClientId: e.clientId,
    VenueId: e.venueId,
    StartDate: toDate(e.startDate),
    EndDate: toDate(e.endDate),
    StartTime: slot[0],
    EndTime: slot[1],
    Guests: guests,
    SpecialRequirements: e.description || '',
    Description: e.description || '',
    TotalBudget: e.totalBudget || 0,
  }
}

function mapClient(c, events, invoices) {
  const budget = invoices
    .filter(inv => inv.clientId === c.id)
    .reduce((s, inv) => s + (Number(inv.amount) || 0), 0)
  return {
    Id: c.id,
    CompanyName: c.companyName,
    ContactPerson: c.contactPerson,
    Email: c.email,
    Phone: c.phone,
    Address: c.address,
    ClientType: c.clientType,
    Status: c.status,
    DateOfInquiry: toDate(c.dateOfInquiry),
    Source: CLIENT_SOURCES[(c.id - 1) % CLIENT_SOURCES.length],
    Events: events.filter(ev => ev.ClientId === c.id).length,
    Budget: budget,
  }
}

function mapLead(l) {
  return {
    Id: l.id,
    CompanyName: l.companyName,
    ContactName: l.contactName,
    Email: l.email,
    Phone: l.phone,
    Source: l.source || 'Website',
    EventType: l.eventType,
    EstimatedBudget: Number(l.estimatedBudget) || 0,
    Status: l.status,
    Notes: l.notes,
    CreatedDate: toDate(l.createdDate),
  }
}

function mapPayment(p) {
  return {
    Id: p.id,
    InvoiceId: p.invoiceId,
    Amount: Number(p.amount) || 0,
    PaymentDate: p.paymentDate ? toDate(p.paymentDate) : null,
    Method: p.method,
    Reference: p.reference,
    Notes: p.notes,
    EvidencePath: p.evidencePath,
  }
}

function mapSupplierPayment(sp) {
  return {
    Id: sp.id,
    SupplierId: sp.supplierId,
    SupplierName: sp.supplierName,
    EventId: sp.eventId,
    EventName: sp.eventName,
    Description: sp.description,
    Amount: Number(sp.amount) || 0,
    PaymentMethod: sp.paymentMethod,
    ReferenceNumber: sp.referenceNumber,
    EvidencePath: sp.evidencePath,
    Status: sp.status,
    PaymentDate: sp.paymentDate ? toDate(sp.paymentDate) : null,
    CreatedAt: toDate(sp.createdAt),
  }
}

function mapRegistration(r) {
  return {
    Id: r.id,
    FullName: r.fullName,
    Email: r.email,
    Phone: r.phone,
    ClientId: r.clientId,
    EventId: r.eventId,
    EventName: r.eventName,
    VenueName: r.venueName,
    EventStartDate: r.eventStartDate ? toDate(r.eventStartDate) : null,
    PaymentMethod: r.paymentMethod,
    ReferenceNumber: r.referenceNumber,
    PayerName: r.payerName,
    EvidencePath: r.evidencePath,
    EvidenceHash: r.evidenceHash,
    ExpectedAmount: Number(r.expectedAmount) || 0,
    Amount: Number(r.amount) || 0,
    Status: r.status,
    Flags: Array.isArray(r.flags) ? r.flags : [],
    RiskScore: Number(r.riskScore) || 0,
    TicketReference: r.ticketReference,
    CreatedAt: toDate(r.createdAt),
  }
}

function mapVenue(v) {
  return {
    Id: v.id,
    Name: v.name,
    Address: v.address,
    City: v.city,
    Capacity: v.capacity,
    PricePerDay: Number(v.pricePerDay) || 0,
    Status: v.status || 'Available',
    ContactPerson: v.contactPerson,
    Phone: v.phone || '',
    Email: v.email || '',
    Description: v.description || '',
  }
}

function mapEmployee(e) {
  return {
    Id: e.id,
    FirstName: e.firstName,
    LastName: e.lastName,
    FullName: e.fullName || `${e.firstName} ${e.lastName}`,
    Role: e.role,
    Email: e.email,
    Phone: e.phone || '',
    Salary: Number(e.salary) || 0,
    HireDate: toDate(e.hireDate),
    Status: e.status,
  }
}

function mapSupplier(s) {
  return {
    Id: s.id,
    Name: s.name,
    Category: s.category,
    ContactPerson: s.contactPerson,
    Email: s.email,
    Phone: s.phone || '',
    City: SUP_CITIES[(s.id - 1) % SUP_CITIES.length],
    Rating: Number(s.rating) || 0,
    LeadTimeDays: 2 + (s.id % 5),
    Status: (s.rating || 0) >= 4 ? 'Active' : 'Review',
    OnTimeRate: 85 + ((s.id * 7) % 14),
    Notes: s.notes || '',
  }
}

/* purchase orders are derived from the event-supplier lines */
function mapPurchaseOrder(es) {
  return {
    Id: `PO-${String(es.id).padStart(4, '0')}`,
    SupplierId: es.supplierId,
    EventId: es.eventId,
    Item: es.serviceType || 'Service',
    Amount: Number(es.cost) || 0,
    Status: PO_STATUS[es.status] || 'Ordered',
    Date: toDate(es.createdAt),
  }
}

/* eventId → [employeeId], only for active (not Completed/Cancelled) events,
   matching the old seeded-assignment behaviour in SystemState */
function buildAssignments(rows, events) {
  const active = new Set(events.filter(e => e.Status !== 'Completed' && e.Status !== 'Cancelled').map(e => e.Id))
  const map = {}
  rows.forEach(a => {
    if (!active.has(a.eventId)) return
    ;(map[a.eventId] = map[a.eventId] || []).push(a.employeeId)
  })
  return map
}

export function DataProvider({ children }) {
  const { user, logout } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      /* Staff use the dedicated staff portal endpoints (api/staff/*) and never
         need the company-wide dataset, so skip the bulk load entirely. */
      if (user?.role === 'Staff') {
        setData({ ...EMPTY, assignmentRows: [], assignments: {} })
        return
      }

      /* invoices/payments are Admin/Manager/Finance-only on the backend, so
         fetch them only for those roles; every other endpoint is read-accessible
         to any signed-in role. Supplier-payment reads are also finance-only. */
      const canReadInvoices = user?.role === 'Admin' || user?.role === 'Manager' || user?.role === 'Finance'
      const canReadFinance = canReadInvoices

      const fetches = [
        api.get('/api/events', { pageSize: 100 }),
        api.get('/api/clients', { pageSize: 100 }),
        api.get('/api/leads', { pageSize: 100 }),
        api.get('/api/venues', { pageSize: 100 }),
        api.get('/api/employees', { pageSize: 100 }),
        api.get('/api/suppliers', { pageSize: 100 }),
        api.get('/api/EventSuppliers', { pageSize: 100 }),
        api.get('/api/EmployeeAssignments', { pageSize: 100 }),
        api.get('/api/tickets', { pageSize: 100 }),
      ]
      if (canReadInvoices) {
        fetches.push(api.get('/api/invoices', { pageSize: 100 }))
        fetches.push(api.get('/api/payments', { pageSize: 100 }))
      }
      if (canReadFinance) {
        fetches.push(api.get('/api/supplierpayments', { pageSize: 100 }))
      }

      const [events, clients, leads, venues, employees, suppliers, eventSuppliers, assignments, tickets, invoices = { items: [] }, payments = { items: [] }, supplierPayments = { items: [] }] = await Promise.all(fetches)

      const eventsRaw = unwrap(events)
      const venuesRaw = unwrap(venues).map(mapVenue)
      const venuesById = new Map(venuesRaw.map(v => [v.Id, v]))

      const mappedEvents = eventsRaw.map(ev => mapEvent(ev, venuesById))
      const mappedClients = unwrap(clients).map(c => mapClient(c, mappedEvents, unwrap(invoices)))

      setData({
        clients: mappedClients,
        employees: unwrap(employees).map(mapEmployee),
        venues: venuesRaw,
        events: mappedEvents,
        leads: unwrap(leads).map(mapLead),
        suppliers: unwrap(suppliers).map(mapSupplier),
        purchaseOrders: unwrap(eventSuppliers).map(mapPurchaseOrder),
        assignments: buildAssignments(unwrap(assignments), mappedEvents),
        assignmentRows: unwrap(assignments).map(a => ({ Id: a.id, EventId: a.eventId, EmployeeId: a.employeeId, Role: a.role })),
        invoices: unwrap(invoices),
        payments: unwrap(payments).map(mapPayment),
        supplierPayments: unwrap(supplierPayments).map(mapSupplierPayment),
        registrations: unwrap(tickets).map(mapRegistration),
      })
    } catch (err) {
      console.error('DataProvider failed to load:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setData(null)
      setLoading(false)
      return
    }
    load()
  }, [user, load])

  const value = { data: data || EMPTY, loading, error, reload: load }

  if (user && loading && !data) {
    return (
      <div className="min-h-screen bg-[#0B0B0E] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#FF2B66]" />
      </div>
    )
  }

  if (user && error && !data) {
    return (
      <div className="min-h-screen bg-[#0B0B0E] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-sm text-[#9CA3AF]">Could not load data from the server.</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => load()}
              className="rounded-xl bg-[#FF2B66] hover:bg-[#E0245A] text-white text-sm font-semibold px-5 py-2.5 transition-colors">
              Retry
            </button>
            <button
              onClick={() => logout()}
              className="rounded-xl border border-gray-700 hover:bg-white/5 text-gray-300 text-sm font-semibold px-5 py-2.5 transition-colors">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside <DataProvider>')
  return ctx
}