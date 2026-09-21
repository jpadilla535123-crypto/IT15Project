import { useState } from 'react'
import {
  X, Mail, Phone, Home, CalendarDays, CalendarRange, CircleDot, Ban, Save, Check, ChevronDown, ArrowRight, Search, ArrowLeft,
  Plus, ImagePlus, Trash2, Loader2, ExternalLink, CheckCircle2, Smartphone, CreditCard,
} from 'lucide-react'
import { formatFullDate, formatCurrency } from '../dashboard/format'
import { EVENT_TYPES, toISO } from '../calendar/calendarUtils'
import BookingStepper, { bookingSteps } from './BookingStepper'
import VenuePicker from './VenuePicker'
import BookingCard from './BookingCard'
import { useSystem, venueUnavailableReason, employeeUnavailableReason } from '../dashboard/SystemState'
import { useData } from '../../api/data'
import { api, API_URL } from '../../api/client'
import '../../pages/landingFx.css'

const PIPELINE_STEPS = bookingSteps.slice(0, 5)

function Meta({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="h-8 w-8 shrink-0 rounded-lg bg-gray-100 dark:bg-[#181820] text-gray-400 dark:text-[#9CA3AF] flex items-center justify-center">
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">{label}</p>
        <p className="text-sm leading-snug break-all text-gray-900 dark:text-white">{value || '—'}</p>
      </div>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-gray-400 dark:text-[#6B7280]">{label}</span>
      <span className="min-w-0 break-words text-right font-medium text-gray-900 dark:text-white">{value || '—'}</span>
    </div>
  )
}

function ConfirmSection({ title, onEdit, children }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
        {onEdit && (
          <button type="button" onClick={onEdit}
            className="text-sm font-medium text-[#FF2B66] hover:underline">
            Edit
          </button>
        )}
      </div>
      <div className="mt-3 mb-3 border-b border-dashed border-gray-200 dark:border-[#2A2A36]/60 pb-3" />
      <div className="space-y-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">{children}</div>
    </div>
  )
}

function Label({ children, hint }) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{children}</span>
      {hint && <span className="text-xs font-normal text-gray-400 dark:text-[#6B7280]">{hint}</span>}
    </div>
  )
}

function Required() {
  return <span className="text-red-500">*</span>
}

const inputClass =
  'w-full rounded-lg border border-[#E5E7EB] dark:border-[#2A2A36] bg-[#F9FAFB] dark:bg-[#121217] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none transition focus:bg-white dark:focus:bg-[#0B0B0E] focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#FF2B66]/40 focus:border-blue-500 dark:focus:border-[#FF2B66]'

function Select({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`${inputClass} appearance-none pr-9`}
      >
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
    </div>
  )
}

function StepFooter({ onSave, onProceed, proceedLabel = 'Proceed', proceedIcon: ProceedIcon = ArrowRight, onCancel }) {
  return (
    <div className="mt-auto flex items-center justify-between gap-3 pt-4">
      {onCancel && (
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
          <Ban size={15} /> Cancel Booking
        </button>
      )}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={onSave}
          className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] dark:border-[#2A2A36] bg-white dark:bg-[#121217] px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-[#9CA3AF] hover:border-green-500/60 hover:text-green-600 dark:hover:text-green-400 transition-colors">
          <Save size={15} /> Save as Draft
        </button>
        <button
          onClick={onProceed}
          className="inline-flex items-center gap-2 rounded-lg bg-[#FF2B66] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e00f4d] transition-colors">
          {proceedLabel} <ProceedIcon size={15} />
        </button>
      </div>
    </div>
  )
}

export default function EventDetailDrawer({ event, client, venue, venues = [], employees = [], onClose, onCancel, onSave, onConfirm }) {
  const [editMode, setEditMode] = useState(false)
  const showPipeline = event.Status === 'New' || event.Status === 'Pending' || editMode
  const [pipelineStep, setPipelineStep] = useState(0)
  const [form, setForm] = useState({
    Name: event.Name,
    EventType: event.EventType,
    VenueId: event.VenueId,
    Guests: event.Guests,
    StartTime: event.StartTime,
    EventDate: toISO(event.StartDate),
    SpecialRequirements: event.SpecialRequirements,
    AccessType: event.AccessType || 'Private',
  })
  const [clientForm, setClientForm] = useState({
    CompanyName: client?.CompanyName || '',
    ContactName: client?.ContactPerson || '',
    Email: client?.Email || '',
    Phone: client?.Phone || '',
    Address: client?.Address || '',
  })
  const isNewBooking = typeof event.Id === 'string'
  const [venueId, setVenueId] = useState(event.VenueId)
  const [localVenues, setLocalVenues] = useState(venues)
  const [venueSearch, setVenueSearch] = useState('')
  const [addVenueMode, setAddVenueMode] = useState(false)
  const [venueForm, setVenueForm] = useState({ Name: '', Address: '', Capacity: '', PricePerDay: '' })
  const [localEmployees, setLocalEmployees] = useState(employees)
  const { employees: sysEmployees, empStatus, venueStatus, assignments } = useSystem()
  const { data } = useData()
  const allEvents = data.events
  const eventDate = form.EventDate ? new Date(`${form.EventDate}T00:00:00`) : event.StartDate
  const currentEvent = { ...event, StartDate: eventDate }

  const cancelAction = isNewBooking ? null : handleCancelBooking

  const venueBlocked = {}
  ;(localVenues || []).forEach(v => {
    const r = venueUnavailableReason(v, currentEvent, allEvents, venueStatus || {})
    if (r) venueBlocked[v.Id] = r
  })
  const teamSource = sysEmployees && sysEmployees.length ? sysEmployees : localEmployees
  const empBlocked = {}
  teamSource.forEach(e => {
    const r = employeeUnavailableReason(e, currentEvent, allEvents, assignments || {}, empStatus || {})
    if (r) empBlocked[e.Id] = r
  })

  const [staffRows, setStaffRows] = useState([
    { teamId: null, venueId: event.VenueId },
    { teamId: null, venueId: null },
  ])

  /* ── payment entries: each row = method + amount + reference + proof photo.
     A row only "counts" (stacks) once a proof photo is attached. ── */
  function makeRow() {
    return {
      key: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      method: 'GCash',
      amount: '',
      reference: '',
      file: null,
      preview: null,
      sessionId: null,
      paymongoBusy: false,
    }
  }
  const [payRows, setPayRows] = useState([makeRow()])
  function setRow(key, patch) {
    setPayRows(rs => rs.map(r => (r.key === key ? { ...r, ...patch } : r)))
  }
  function removeRow(key) {
    setPayRows(rs => rs.filter(r => r.key !== key))
  }
  function addRow() {
    const last = payRows[payRows.length - 1]
    if (last && !last.preview) { alert('Complete the current payment first — attach its proof screenshot before adding another.'); return }
    setPayRows(rs => [...rs, makeRow()])
  }
  function attachEvidence(key, file) {
    if (!file || !file.type.startsWith('image/')) { alert('Payment proof must be an image (png, jpg, jpeg, gif, webp).'); return }
    setRow(key, { file, preview: URL.createObjectURL(file) })
  }
  async function payOnline(row) {
    const amount = Number(row.amount) || 0
    if (amount <= 0) { alert('Enter an amount first.'); return }
    setRow(row.key, { paymongoBusy: true })
    try {
      const res = await api.post('/api/payments/paymongo-checkout', {
        amount,
        description: form.Name || event.Name || 'Event booking',
        successUrl: `${window.location.origin}${window.location.pathname}?paymongo=success`,
        cancelUrl: `${window.location.origin}${window.location.pathname}?paymongo=cancelled`,
      })
      setRow(row.key, { sessionId: res.sessionId, reference: row.reference || res.sessionId.slice(-10) })
      window.open(res.checkoutUrl, '_blank', 'noopener')
    } catch (err) {
      alert(err.message || 'Could not create the payment link.')
    } finally {
      setRow(row.key, { paymongoBusy: false })
    }
  }

  const filledRows = payRows.filter(r => r.preview)
  const totalPaid = filledRows.reduce((s, r) => s + (Number(r.amount) || 0), 0)
  const fee = event.fee || 0

  /* For existing Booked/Completed bookings, pull real recorded payments from the
     backend so the confirmation tab reflects reality; for the live booking-flow
     we use the in-progress filledRows instead. */
  const existingInvoice = !isNewBooking ? (data.invoices || []).find(i => i.eventId === event.Id) : null
  const existingPayments = existingInvoice
    ? (data.payments || []).filter(p => p.InvoiceId === existingInvoice.id)
    : []
  const viewPayments = !isNewBooking && existingPayments.length > 0
    ? existingPayments.map(p => ({ key: `ep-${p.Id}`, method: p.Method, amount: p.Amount, reference: p.Reference, img: p.EvidencePath ? `${API_URL}${p.EvidencePath}` : null }))
    : filledRows.map(r => ({ key: r.key, method: r.method, amount: Number(r.amount) || 0, reference: r.reference || '', img: r.preview || null }))
  const viewTotal = !isNewBooking && existingPayments.length > 0
    ? existingPayments.reduce((s, p) => s + (Number(p.Amount) || 0), 0)
    : totalPaid

  const draftClient = !client && isNewBooking
    ? { CompanyName: clientForm.CompanyName, ContactPerson: clientForm.ContactName, Email: clientForm.Email, Phone: clientForm.Phone, Address: clientForm.Address }
    : null
  const effectiveClient = client || draftClient
  const displayName = effectiveClient?.CompanyName || event.Name || 'New Booking'
  const displayEmail = effectiveClient?.Email || '—'
  const selectedVenue = localVenues.find(v => v.Id === venueId) || venue

  const teamOptions = teamSource.map(e => ({ id: e.Id, label: `${e.FirstName} ${e.LastName}`, sub: e.Role }))
  const venueOptions = localVenues.map(v => ({ id: v.Id, label: v.Name, sub: v.City }))
  const filteredVenues = localVenues.filter(v =>
    `${v.Name} ${v.Address} ${v.City}`.toLowerCase().includes(venueSearch.toLowerCase())
  )

  const bookingFor = {
    title: event.Name,
    client: effectiveClient?.CompanyName,
    weekday: event.StartDate.toLocaleDateString('en-US', { weekday: 'long' }),
    timeLabel: event.StartTime,
    dateLabel: event.StartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fee: event.fee,
  }

  function buildPayload() {
    return {
      Name: form.Name,
      EventType: form.EventType,
      VenueId: Number(form.VenueId),
      Guests: Number(form.Guests) || 0,
      StartTime: form.StartTime,
      StartDate: new Date(`${form.EventDate}T00:00:00`),
      SpecialRequirements: form.SpecialRequirements,
      AccessType: form.AccessType,
    }
  }

  function createVenue() {
    const nextId = localVenues.reduce((m, v) => Math.max(m, v.Id), 0) + 1
    const v = {
      Id: nextId,
      Name: venueForm.Name,
      Address: venueForm.Address,
      City: '—',
      Capacity: Number(venueForm.Capacity) || 0,
      PricePerDay: Number(venueForm.PricePerDay) || 0,
    }
    setLocalVenues(prev => [...prev, v])
    setVenueForm({ Name: '', Address: '', Capacity: '', PricePerDay: '' })
    return v
  }

  function addStaffRow() {
    setStaffRows(prev => [...prev, { teamId: null, venueId: null }])
  }

  function renderBookingForm() {
    return (
      <div className="flex flex-1 flex-col rounded-xl border border-[#E5E7EB] dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5">
        <p className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Event Detail</p>

        <div className="flex flex-1 flex-col gap-4">
          {!client && (
            <section className="rounded-xl border border-[#E5E7EB] dark:border-[#2A2A36] bg-gray-50 dark:bg-[#0B0B0E] p-4 space-y-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Client Information</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Client / Company Name</Label>
                  <input type="text" className={inputClass} placeholder="e.g. Heritage Bank" value={clientForm.CompanyName}
                    onChange={e => setClientForm(f => ({ ...f, CompanyName: e.target.value }))} />
                </div>
                <div>
                  <Label>Contact Person</Label>
                  <input type="text" className={inputClass} placeholder="Full name" value={clientForm.ContactName}
                    onChange={e => setClientForm(f => ({ ...f, ContactName: e.target.value }))} />
                </div>
                <div>
                  <Label>Email</Label>
                  <input type="email" className={inputClass} placeholder="client@email.com" value={clientForm.Email}
                    onChange={e => setClientForm(f => ({ ...f, Email: e.target.value }))} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <input type="text" className={inputClass} placeholder="+63 900 000 0000" value={clientForm.Phone}
                    onChange={e => setClientForm(f => ({ ...f, Phone: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <Label>Address</Label>
                  <input type="text" className={inputClass} placeholder="City / Province" value={clientForm.Address}
                    onChange={e => setClientForm(f => ({ ...f, Address: e.target.value }))} />
                </div>
              </div>
            </section>
          )}

          <div>
            <Label>Event Name <Required /></Label>
            <input type="text" className={inputClass} placeholder="Enter event name" value={form.Name}
              onChange={e => setForm(f => ({ ...f, Name: e.target.value }))} />
          </div>

          <div>
            <Label>Event Date <Required /></Label>
            <input type="date" className={inputClass} value={form.EventDate}
              onChange={e => setForm(f => ({ ...f, EventDate: e.target.value }))} />
          </div>

          <div>
            <Label hint="Optional">Special Requirements</Label>
            <textarea rows={3} className={`${inputClass} resize-y`} placeholder="Enter special requirements"
              value={form.SpecialRequirements}
              onChange={e => setForm(f => ({ ...f, SpecialRequirements: e.target.value }))} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Event Type <Required /></Label>
              <Select value={form.EventType}
                onChange={v => setForm(f => ({ ...f, EventType: v }))}
                options={EVENT_TYPES} />
            </div>
            <div>
              <Label hint="Optional · e.g. 6:00 PM">Start Time</Label>
              <input type="time" className={inputClass} value={form.StartTime}
                onChange={e => setForm(f => ({ ...f, StartTime: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label hint="Public events appear on the site">Access <Required /></Label>
              <Select value={form.AccessType}
                onChange={v => setForm(f => ({ ...f, AccessType: v }))}
                options={['Private', 'Public']} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Venue <Required /></Label>
              <div className="relative">
                <select
                  value={form.VenueId}
                  onChange={e => {
                    const id = Number(e.target.value)
                    setForm(f => ({ ...f, VenueId: id }))
                    setVenueId(id)
                  }}
                  className={`${inputClass} appearance-none pr-9`}
                >
                  {localVenues.map(v => {
                    const blocked = venueBlocked[v.Id]
                    return (
                      <option key={v.Id} value={v.Id} disabled={!!blocked}>
                        {blocked ? `${v.Name} — unavailable this date` : v.Name}
                      </option>
                    )
                  })}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div>
              <Label>Number of Guests <Required /></Label>
              <input type="number" min="0" className={inputClass} placeholder="Enter number of guests"
                value={form.Guests}
                onChange={e => setForm(f => ({ ...f, Guests: Number(e.target.value) }))} />
            </div>
          </div>

          <StepFooter onSave={() => onSave && onSave({ ...buildPayload(), _clientInfo: clientForm })} onProceed={() => setPipelineStep(1)} onCancel={cancelAction} />
        </div>
      </div>
    )
  }

  function renderAddVenue() {
    return (
      <div className="flex flex-1 flex-col rounded-xl border border-[#E5E7EB] dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5">
        <div className="mb-4 flex items-center justify-start">
          <button onClick={() => setAddVenueMode(false)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-[#9CA3AF] hover:text-[#FF2B66] transition-colors">
            <ArrowLeft size={16} /> Back
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4">
          <div>
            <Label>Venue Name <Required /></Label>
            <input type="text" className={inputClass} placeholder="Enter venue name"
              value={venueForm.Name}
              onChange={e => setVenueForm(f => ({ ...f, Name: e.target.value }))} />
          </div>

          <div>
            <Label>Venue Address <Required /></Label>
            <textarea rows={2} className={`${inputClass} resize-y`} placeholder="Enter venue address"
              value={venueForm.Address}
              onChange={e => setVenueForm(f => ({ ...f, Address: e.target.value }))} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Pax (Capacity) <Required /></Label>
              <input type="number" min="0" className={inputClass} placeholder="Enter maximum pax"
                value={venueForm.Capacity}
                onChange={e => setVenueForm(f => ({ ...f, Capacity: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Amount per Day <Required /></Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-[#6B7280]">₱</span>
                <input type="number" min="0" className={`${inputClass} pl-7`} placeholder="0.00"
                  value={venueForm.PricePerDay}
                  onChange={e => setVenueForm(f => ({ ...f, PricePerDay: Number(e.target.value) }))} />
              </div>
            </div>
          </div>

          <StepFooter
            onSave={() => {
              const v = createVenue()
              onSave && onSave({ VenueId: v.Id, _newVenue: v })
              setAddVenueMode(false)
            }}
            onProceed={() => {
              const v = createVenue()
              onSave && onSave({ VenueId: v.Id, _newVenue: v })
              setAddVenueMode(false)
              setPipelineStep(2)
            }}
            onCancel={cancelAction}
          />
        </div>
      </div>
    )
  }

  function handleCancelBooking() {
    onCancel && onCancel(event)
  }

  function renderPaymentStep() {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="shrink-0">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xl font-bold text-gray-900 dark:text-white">Payment details</p>
            <span className="rounded-full bg-[#FF2B66]/10 text-[#FF2B66] text-xs font-extrabold px-2.5 py-1">
              {filledRows.length} paid · {formatCurrency(totalPaid)}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-[#9CA3AF]">
            The client pays online through PayMongo (GCash or Card). After paying, attach the proof screenshot of each payment — an entry only counts once a photo is uploaded, and you can add more for partial payments.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
          {payRows.map((row, i) => {
            const filled = !!row.preview
            return (
              <div key={row.key} className={`rounded-2xl border p-4 bg-white dark:bg-[#121217] transition-colors ${filled ? 'border-emerald-500/50' : 'border-gray-200 dark:border-[#2A2A36]'}`}>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Payment {i + 1}</p>
                  <div className="flex items-center gap-2">
                    {filled ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                        <CheckCircle2 size={11} /> Ready
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 dark:bg-white/5 px-2.5 py-1 text-[10px] font-bold text-gray-400">
                        Needs proof photo
                      </span>
                    )}
                    {payRows.length > 1 && (
                      <button onClick={() => removeRow(row.key)} aria-label="Remove payment"
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Amount (₱)</Label>
                    <input type="number" min="0" className={inputClass} placeholder="0.00"
                      value={row.amount}
                      onChange={e => setRow(row.key, { amount: e.target.value })} />
                  </div>
                  <div>
                    <Label hint="Optional">Reference / Note</Label>
                    <input type="text" className={inputClass} placeholder="e.g. reference # / session id"
                      value={row.reference}
                      onChange={e => setRow(row.key, { reference: e.target.value })} />
                  </div>
                </div>

                <div className="mt-3">
                  <Label hint="The client pays on PayMongo's page — no QR to paste.">Pay online (PayMongo sandbox)</Label>
                  <button onClick={() => payOnline(row)} disabled={row.paymongoBusy}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#FF2B66]/40 bg-[#FF2B66]/10 px-3 py-2.5 text-xs font-bold text-[#FF2B66] hover:bg-[#FF2B66]/20 transition-colors disabled:opacity-60">
                    {row.paymongoBusy ? <Loader2 size={13} className="animate-spin" /> : <ExternalLink size={13} />}
                    {row.sessionId ? 'Open payment link again' : 'Pay with GCash / Card'}
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 dark:border-[#2A2A36] px-4 py-3 text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] hover:border-[#FF2B66]/60 hover:text-[#FF2B66] transition-colors">
                    <ImagePlus size={16} />
                    {row.preview ? 'Replace proof screenshot' : 'Upload proof screenshot'}
                    <input type="file" accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" className="hidden"
                      onChange={e => attachEvidence(row.key, e.target.files?.[0])} />
                  </label>
                  {row.preview && (
                    <img src={row.preview} alt="Payment proof" className="h-14 w-14 shrink-0 rounded-lg object-cover border border-gray-200 dark:border-[#2A2A36]" />
                  )}
                </div>
              </div>
            )
          })}

          <button onClick={addRow}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 dark:border-[#2A2A36] py-3 text-sm font-semibold text-gray-500 dark:text-[#9CA3AF] hover:border-[#FF2B66]/60 hover:text-[#FF2B66] transition-colors">
            <Plus size={16} /> Add another payment
          </button>
        </div>

        <StepFooter
          onSave={() => onSave && onSave({ _payments: filledRows })}
          onProceed={() => setPipelineStep(4)}
          onCancel={cancelAction}
        />
      </div>
    )
  }

  function renderConfirmationView({ allowEdit }) {
    return (
      <div className="grid min-h-0 flex-1 auto-rows-auto md:auto-rows-fr grid-cols-1 md:grid-cols-2 border-dashed border-gray-200 dark:border-[#2A2A36]/60">
        <div className="px-6 pt-2 pb-10 md:pb-0 md:pt-2 md:pl-0 md:pr-12">
          <ConfirmSection title="Client's Information" onEdit={allowEdit ? () => setPipelineStep(0) : null}>
            <Detail label="Company" value={effectiveClient?.CompanyName || '—'} />
            <Detail label="Contact Person" value={effectiveClient?.ContactPerson || '—'} />
            <Detail label="Phone" value={effectiveClient?.Phone || '—'} />
            <Detail label="Email" value={effectiveClient?.Email || '—'} />
            <Detail label="Address" value={effectiveClient?.Address || '—'} />
          </ConfirmSection>
        </div>

        <div className="px-6 pt-10 pb-10 border-t border-dashed border-gray-200 dark:border-[#2A2A36]/60 md:pt-2 md:pb-0 md:pl-12 md:pr-0 md:border-t-0 md:border-l">
          <ConfirmSection title="Event Information" onEdit={allowEdit ? () => setPipelineStep(0) : null}>
            <p className="font-medium text-gray-900 dark:text-white">{selectedVenue?.Name || event.Name}</p>
            <p className="text-gray-400 dark:text-[#6B7280]">
              {selectedVenue?.Address}
              {selectedVenue?.City && selectedVenue.City !== '—' ? ` · ${selectedVenue.City}` : ''}
            </p>
            <div className="space-y-1.5">
              <Detail label="Event Type" value={event.EventType} />
              <Detail label="Date" value={formatFullDate(event.StartDate)} />
              <Detail label="Time" value={event.StartTime} />
              <Detail label="Guests" value={event.Guests ? `${event.Guests.toLocaleString()} guests` : ''} />
            </div>
          </ConfirmSection>
        </div>

        <div className="px-6 pt-10 pb-6 border-t border-dashed border-gray-200 dark:border-[#2A2A36]/60 md:pt-14 md:pb-0 md:pl-0 md:pr-12">
          <ConfirmSection title="Payment" onEdit={allowEdit ? () => setPipelineStep(3) : null}>
            {viewPayments.length === 0 && (
              <p className="text-gray-400 dark:text-[#6B7280]">No payment recorded yet — billed after booking.</p>
            )}
            {viewPayments.map(r => (
              <div key={r.key} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 min-w-0">
                  {r.method === 'GCash'
                    ? <Smartphone size={14} className="shrink-0 text-blue-500" />
                    : <CreditCard size={14} className="shrink-0 text-blue-400" />}
                  <span className="truncate">{r.method}{r.reference ? ` · ${r.reference}` : ''}</span>
                </span>
                <span className="font-medium shrink-0">{formatCurrency(r.amount)}</span>
              </div>
            ))}
            <Detail label="Total paid" value={formatCurrency(viewTotal)} />
          </ConfirmSection>
        </div>

        <div className="px-6 pt-10 pb-6 border-t border-dashed border-gray-200 dark:border-[#2A2A36]/60 md:pt-14 md:pb-0 md:pl-12 md:pr-0 md:border-l">
          <ConfirmSection title="Receipt / Invoice" onEdit={allowEdit ? () => setPipelineStep(3) : null}>
            {viewPayments.length > 0 ? (
              <div className="space-y-2">
                {viewPayments.map(r => (
                  <div key={r.key} className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-[#2A2A36] p-2">
                    {r.img ? (
                      <img src={r.img} alt="Proof" className="h-10 w-10 rounded object-cover shrink-0" />
                    ) : (
                      <span className="h-10 w-10 shrink-0 rounded bg-gray-100 dark:bg-[#181820] flex items-center justify-center text-gray-400">
                        <CreditCard size={14} />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">{r.method} · {formatCurrency(r.amount)}</p>
                      <p className="text-[10px] text-gray-400 dark:text-[#6B7280] truncate">{r.reference || 'No reference'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 dark:text-[#6B7280]">No proof screenshots yet.</p>
            )}
            <Detail label="Venue Fee" value={formatCurrency(fee)} />
            <Detail label="Paid to date" value={formatCurrency(viewTotal)} />
            <Detail label="Balance on event day" value={formatCurrency(Math.max(0, fee - viewTotal))} />
            <Detail label="Total" value={formatCurrency(fee)} />
          </ConfirmSection>
        </div>
      </div>
    )
  }

  function renderPipelineStep() {
    switch (pipelineStep) {
      case 0:
        return renderBookingForm()
      case 1:
        if (addVenueMode) return renderAddVenue()
        return (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="relative shrink-0">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6B7280]" />
              <input type="text" className={`${inputClass} pl-9`} placeholder="Search venues..."
                value={venueSearch}
                onChange={e => setVenueSearch(e.target.value)} />
            </div>
            <div>
              <VenuePicker venues={filteredVenues} selectedId={venueId} onSelect={setVenueId} disabledVenues={venueBlocked}
                onAddVenue={() => setAddVenueMode(true)} />
            </div>
            <StepFooter onSave={() => onSave && onSave({ VenueId: venueId })} onProceed={() => setPipelineStep(2)} onCancel={cancelAction} />
          </div>
        )
      case 2:
        return (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Team Assignments</p>
            <div className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] shadow-sm">
              <BookingCard
                booking={bookingFor}
                expandedDefault
                teamOptions={teamOptions}
                venueOptions={venueOptions}
                disabledTeamOptions={empBlocked}
                disabledVenueOptions={venueBlocked}
                rows={staffRows}
                onRowsChange={setStaffRows}
                onAddRow={addStaffRow}
              />
            </div>
            <StepFooter onSave={() => onSave && onSave({ staff: staffRows })} onProceed={() => setPipelineStep(3)} onCancel={cancelAction} />
          </div>
        )
      case 3:
        return renderPaymentStep()
      case 4:
        return (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            {renderConfirmationView({ allowEdit: true })}
            <StepFooter
              onSave={() => onSave && onSave({})}
              onProceed={() => onConfirm && onConfirm({
                ...event,
                _clientInfo: clientForm,
                Name: form.Name || event.Name,
                EventType: form.EventType,
                VenueId: venueId ?? Number(form.VenueId) ?? event.VenueId,
                Guests: Number(form.Guests) || event.Guests || 0,
                StartTime: form.StartTime || event.StartTime,
                StartDate: eventDate,
                EndDate: eventDate,
                SpecialRequirements: form.SpecialRequirements,
                AccessType: form.AccessType,
              }, filledRows.map(r => ({
                method: r.method,
                amount: Number(r.amount) || 0,
                reference: r.reference || '',
                file: r.file,
              })))}
              proceedLabel="Confirm Booking"
              proceedIcon={Check}
              onCancel={cancelAction}
            />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-2xl bg-white dark:bg-[#0B0B0E] h-full shadow-2xl flex flex-col overflow-hidden animate-slide-in-right border-l border-gray-200 dark:border-[#2A2A36]">
        <header className="shrink-0 p-6 border-b border-gray-100 dark:border-[#2A2A36]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 shrink-0 rounded-full bg-[#FF2B66] text-white font-bold text-sm flex items-center justify-center uppercase">
                {String(displayName || '?').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-900 dark:text-white">{displayName}</p>
                <p className="truncate text-sm text-gray-500 dark:text-[#9CA3AF]">{displayEmail}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-[#2A2A36] px-3 py-2 text-xs font-semibold text-gray-600 dark:text-[#9CA3AF] hover:border-[#FF2B66]/50 hover:text-[#FF2B66] transition-colors">
                <Mail size={14} /> Message
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-[#2A2A36] px-3 py-2 text-xs font-semibold text-gray-600 dark:text-[#9CA3AF] hover:border-[#FF2B66]/50 hover:text-[#FF2B66] transition-colors">
                <Phone size={14} /> Call
              </button>
              <button onClick={onClose}
                className="h-9 w-9 rounded-full bg-gray-100 dark:bg-[#181820] flex items-center justify-center text-gray-500 dark:text-[#9CA3AF] hover:text-[#FF2B66] transition-colors"
                title="Close">
                <X size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto">
          <div className="flex min-h-full flex-col gap-6 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
              <Meta icon={Phone} label="Phone" value={effectiveClient?.Phone} />
              <Meta icon={Home} label="Address" value={effectiveClient?.Address} />
              <Meta icon={CalendarRange} label="Event Type" value={event.EventType} />
              <Meta icon={CircleDot} label="Status" value={event.Status} />
            </div>

            {showPipeline && (
              <div className="shrink-0 border-t border-gray-100 dark:border-[#2A2A36]/60 pt-5">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Booking</p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-[#6B7280] mb-3">
                  Please double check the booking before you submit the confirmation.
                </p>
                <BookingStepper steps={PIPELINE_STEPS} currentStep={pipelineStep} onStepChange={setPipelineStep} />
              </div>
            )}

            <div className="flex min-h-0 flex-1 flex-col border-t border-gray-100 dark:border-[#2A2A36]/60 pt-5">
              <div className="flex items-center justify-end mb-5 shrink-0">
                <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-[#9CA3AF]">
                  <CalendarDays size={15} className="text-[#FF2B66]" />
                  {formatFullDate(event.StartDate)}
                </span>
              </div>

              {showPipeline ? (
                <div key={pipelineStep} className="fx-tab-panel flex min-h-0 flex-1 flex-col">{renderPipelineStep()}</div>
              ) : event.Status === 'Booked' || event.Status === 'Completed' ? (
                <div className="flex min-h-0 flex-1 flex-col">
                  {renderConfirmationView({ allowEdit: false })}
                  {event.Status === 'Booked' && (
                    <div className="mt-auto flex items-center justify-end gap-3 pt-8">
                      <button
                        onClick={() => { setEditMode(true); setPipelineStep(0) }}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] dark:border-[#2A2A36] bg-white dark:bg-[#121217] px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-[#9CA3AF] hover:border-blue-500/60 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <Save size={15} /> Edit
                      </button>
                      <button onClick={() => onCancel && onCancel(event)}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
                        <Ban size={15} /> Cancel Booking
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}