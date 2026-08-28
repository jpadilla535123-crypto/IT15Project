import { useState } from 'react'
import {
  X, Mail, Phone, Home, CalendarDays, CalendarRange, CircleDot, Ban, Save, Check, ChevronDown, ArrowRight, Search,
} from 'lucide-react'
import { formatFullDate, formatCurrency } from '../dashboard/format'
import { EVENT_STATUS_TONES } from './BookedEventCard'
import BookingStepper, { bookingSteps } from './BookingStepper'
import VenuePicker from './VenuePicker'
import BookingCard from './BookingCard'

const PIPELINE_STEPS = bookingSteps.slice(0, 5)
const PAYMENT_METHODS = ['Bank Transfer', 'GCash', 'Credit Card', 'Cash']
const EVENT_TYPES = ['Corporate Event', 'Wedding', 'Birthday Party', 'Festival', 'Seminar', 'Anniversary']

function paymentFor(event) {
  const method = PAYMENT_METHODS[(event.Id - 1) % PAYMENT_METHODS.length]
  const deposit = Math.round((event.fee || 0) * 0.3)
  return { method, deposit, balance: (event.fee || 0) - deposit }
}

function toISO(d) {
  if (!d) return ''
  const date = d instanceof Date ? d : new Date(d)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function Row({ label, value }) {
  return (
    <div className="flex flex-col items-start">
      <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280] mb-1">{label}</dt>
      <dd className="text-sm text-gray-700 dark:text-gray-300">{value || '—'}</dd>
    </div>
  )
}

function Meta({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="h-8 w-8 shrink-0 rounded-lg bg-gray-100 dark:bg-[#181820] text-gray-400 dark:text-[#9CA3AF] flex items-center justify-center">
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">{label}</p>
        <p className="truncate text-sm text-gray-900 dark:text-white">{value || '—'}</p>
      </div>
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

function StepFooter({ onSave, onProceed, proceedLabel = 'Proceed', proceedIcon: ProceedIcon = ArrowRight }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-2">
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
  )
}

export default function EventDetailDrawer({ event, client, venue, venues = [], employees = [], onClose, onCancel, onSave, onConfirm }) {
  const showPipeline = event.Status === 'New' || event.Status === 'Pending'
  const [pipelineStep, setPipelineStep] = useState(0)
  const [form, setForm] = useState({
    Name: event.Name,
    EventType: event.EventType,
    VenueId: event.VenueId,
    Guests: event.Guests,
    StartTime: event.StartTime,
    EventDate: toISO(event.StartDate),
    SpecialRequirements: event.SpecialRequirements,
  })
  const [venueId, setVenueId] = useState(event.VenueId)
  const [localVenues, setLocalVenues] = useState(venues)
  const [venueSearch, setVenueSearch] = useState('')
  const [addVenueMode, setAddVenueMode] = useState(false)
  const [venueForm, setVenueForm] = useState({ Name: '', Address: '', Capacity: '', PricePerDay: '' })
  const [staffRows, setStaffRows] = useState([
    { teamId: null, venueId: event.VenueId },
    { teamId: null, venueId: null },
  ])

  const payment = paymentFor(event)
  const palette = EVENT_STATUS_TONES[event.Status] || EVENT_STATUS_TONES.Pending
  const displayName = client?.CompanyName || event.Name
  const displayEmail = client?.Email || '—'
  const selectedVenue = localVenues.find(v => v.Id === venueId) || venue

  const teamOptions = employees.map(e => ({ id: e.Id, label: `${e.FirstName} ${e.LastName}`, sub: e.Role }))
  const venueOptions = localVenues.map(v => ({ id: v.Id, label: v.Name, sub: v.City }))
  const assignedStaff = staffRows.filter(r => r.teamId).length
  const filteredVenues = localVenues.filter(v =>
    `${v.Name} ${v.Address} ${v.City}`.toLowerCase().includes(venueSearch.toLowerCase())
  )

  const bookingFor = {
    title: event.Name,
    client: client?.CompanyName,
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

  function renderBookingForm() {
    return (
      <div className="rounded-xl border border-[#E5E7EB] dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5">
        <p className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Event Detail</p>

        <div className="space-y-4">
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
                  {localVenues.map(v => (
                    <option key={v.Id} value={v.Id}>{v.Name}</option>
                  ))}
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

          <StepFooter onSave={() => onSave && onSave(buildPayload())} onProceed={() => setPipelineStep(1)} />
        </div>
      </div>
    )
  }

  function renderAddVenue() {
    return (
      <div className="rounded-xl border border-[#E5E7EB] dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5">
        <p className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Add Venue</p>

        <div className="space-y-4">
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
            onSave={() => { createVenue(); setAddVenueMode(false) }}
            onProceed={() => { createVenue(); setAddVenueMode(false); setPipelineStep(2) }}
          />
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
          <div className="space-y-4">
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6B7280]" />
              <input type="text" className={`${inputClass} pl-9`} placeholder="Search venues..."
                value={venueSearch}
                onChange={e => setVenueSearch(e.target.value)} />
            </div>
            <VenuePicker venues={filteredVenues} selectedId={venueId} onSelect={setVenueId}
              onAddVenue={() => setAddVenueMode(true)} />
            <StepFooter onSave={() => onSave && onSave({ VenueId: venueId })} onProceed={() => setPipelineStep(2)} />
          </div>
        )
      case 2:
        return (
          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] shadow-sm">
              <BookingCard
                booking={bookingFor}
                expandedDefault
                teamOptions={teamOptions}
                venueOptions={venueOptions}
                rows={staffRows}
                onRowsChange={setStaffRows}
              />
            </div>
            <StepFooter onSave={() => onSave && onSave({ staff: staffRows })} onProceed={() => setPipelineStep(3)} />
          </div>
        )
      case 3:
        return (
          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-[#2A2A36]/60">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Payment Summary</p>
                <p className="text-[11px] text-gray-400 dark:text-[#6B7280]">Venue fees only · Extras: ₱0</p>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-[#2A2A36]/60">
                <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Venue</span>
                  <span className="truncate text-sm font-medium text-gray-900 dark:text-white">{selectedVenue?.Name}</span>
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Venue Fee</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(event.fee)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Deposit (30%)</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(payment.deposit)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Method</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{payment.method}</span>
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Balance</span>
                  <span className="text-sm font-bold text-[#FF2B66]">{formatCurrency(payment.balance)}</span>
                </div>
              </div>
            </div>
            <StepFooter onSave={() => onSave && onSave({})} onProceed={() => setPipelineStep(4)} />
          </div>
        )
      case 4:
        return (
          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-4 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Confirm Your Booking</p>
              <div className="divide-y divide-gray-100 dark:divide-[#2A2A36]/60">
                <div className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-gray-400 dark:text-[#6B7280]">Client</span>
                  <span className="truncate font-medium text-gray-900 dark:text-white">{client?.CompanyName}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-gray-400 dark:text-[#6B7280]">Event</span>
                  <span className="truncate font-medium text-gray-900 dark:text-white">{event.Name}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-gray-400 dark:text-[#6B7280]">Venue</span>
                  <span className="truncate font-medium text-gray-900 dark:text-white">
                    {selectedVenue ? selectedVenue.Name : 'Not selected yet'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-gray-400 dark:text-[#6B7280]">Staff assigned</span>
                  <span className="font-medium text-gray-900 dark:text-white">{assignedStaff} team member(s)</span>
                </div>
                <div className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-gray-400 dark:text-[#6B7280]">Total</span>
                  <span className="font-bold text-[#FF2B66]">{formatCurrency(event.fee)}</span>
                </div>
              </div>
            </div>
            <StepFooter
              onSave={() => onSave && onSave({})}
              onProceed={() => onConfirm && onConfirm(event)}
              proceedLabel="Confirm Booking"
              proceedIcon={Check}
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
      <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-2xl bg-white dark:bg-[#0B0B0E] h-full shadow-2xl flex flex-col overflow-y-auto animate-slide-in-right border-l border-gray-200 dark:border-[#2A2A36]">
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

        <div className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Meta icon={Phone} label="Phone" value={client?.Phone} />
            <Meta icon={Home} label="Address" value={client?.Address} />
            <Meta icon={CalendarRange} label="Event Type" value={event.EventType} />
            <Meta icon={CircleDot} label="Status" value={event.Status} />
          </div>

          {showPipeline && (
            <div className="border-t border-gray-100 dark:border-[#2A2A36]/60 pt-5">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Booking</p>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-[#6B7280] mb-3">
                Please double check the booking before you submit the confirmation.
              </p>
              <BookingStepper steps={PIPELINE_STEPS} currentStep={pipelineStep} onStepChange={setPipelineStep} />
            </div>
          )}

          <div className="border-t border-gray-100 dark:border-[#2A2A36]/60 pt-5">
            <div className="flex items-center justify-end mb-5">
              <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-[#9CA3AF]">
                <CalendarDays size={15} className="text-[#FF2B66]" />
                {formatFullDate(event.StartDate)}
              </span>
            </div>

            {showPipeline ? renderPipelineStep() : event.Status === 'Booked' || event.Status === 'Completed' ? (
              <>
                <dl className="space-y-4">
                  <Row label="Client" value={client?.CompanyName} />
                  <Row label="Venue" value={venue?.Name} />
                  <Row label="Event Type" value={event.EventType} />
                  <Row label="Guests" value={event.Guests ? `${event.Guests.toLocaleString()} guests` : ''} />
                  <Row label="Time" value={event.StartTime} />
                  <Row label="Special Requirements" value={event.SpecialRequirements} />
                </dl>
                <div className="mt-5 border-t border-gray-100 dark:border-[#2A2A36]/60 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280] mb-3">
                    Mode of Payment
                  </p>
                  <dl className="space-y-4">
                    <Row label="Method" value={payment.method} />
                    <Row label="Deposit (30%)" value={formatCurrency(payment.deposit)} />
                    <Row label="Balance" value={formatCurrency(payment.balance)} />
                    <Row label="Due" value="7 days before the event" />
                  </dl>
                </div>
                {event.Status === 'Booked' && (
                  <button onClick={() => onCancel && onCancel(event)}
                    className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
                    <Ban size={14} /> Cancel Booking
                  </button>
                )}
              </>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  )
}