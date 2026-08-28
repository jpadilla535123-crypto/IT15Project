import { useState } from 'react'
import {
  X, Mail, Phone, Home, CalendarDays, CalendarRange, CircleDot, Ban, Save, Check, ChevronDown, ArrowRight, Search, ArrowLeft,
  QrCode, CreditCard, Smartphone, Wallet,
} from 'lucide-react'
import { formatFullDate, formatCurrency } from '../dashboard/format'
import { EVENT_STATUS_TONES } from './BookedEventCard'
import BookingStepper, { bookingSteps } from './BookingStepper'
import VenuePicker from './VenuePicker'
import BookingCard from './BookingCard'

const PIPELINE_STEPS = bookingSteps.slice(0, 5)
const PAYMENT_METHODS = ['Bank Transfer', 'GCash', 'Credit Card', 'Cash']
const EVENT_TYPES = ['Corporate Event', 'Wedding', 'Birthday Party', 'Festival', 'Seminar', 'Anniversary']
const PAY_METHODS = [
  { key: 'Card', icon: CreditCard },
  { key: 'G-Cash', icon: Smartphone },
  { key: 'PayPal', icon: Wallet },
]

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

function BrandBadge({ type }) {
  const label =
    type === 'G-Cash'
      ? { text: 'GCASH', className: 'text-blue-600 dark:text-blue-400' }
      : type === 'PayPal'
        ? { text: 'PayPal', className: 'font-italic text-blue-700 dark:text-blue-400' }
        : { text: 'VISA', className: 'italic text-blue-800 dark:text-blue-400' }
  return (
    <div className="mb-2 flex h-7 w-12 items-center justify-center rounded border border-gray-200 dark:border-[#2A2A36] bg-gray-50 dark:bg-[#0B0B0E] p-1">
      <span className={`text-[9px] font-bold ${label.className}`}>{label.text}</span>
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
  })
  const [venueId, setVenueId] = useState(event.VenueId)
  const [localVenues, setLocalVenues] = useState(venues)
  const [venueSearch, setVenueSearch] = useState('')
  const [addVenueMode, setAddVenueMode] = useState(false)
  const [venueForm, setVenueForm] = useState({ Name: '', Address: '', Capacity: '', PricePerDay: '' })
  const [localEmployees, setLocalEmployees] = useState(employees)
  const [staffRows, setStaffRows] = useState([
    { teamId: null, venueId: event.VenueId },
    { teamId: null, venueId: null },
  ])
  const [payMethod, setPayMethod] = useState('Card')
  const [showQr, setShowQr] = useState(false)
  const [cardForm, setCardForm] = useState({ Holder: '', Number: '', Expiry: '', Cvv: '' })
  const [gcashForm, setGcashForm] = useState({ Number: '', Name: '' })
  const [paypalForm, setPaypalForm] = useState({ Email: '' })

  const payment = paymentFor(event)
  const cardLast4 = cardForm.Number.replace(/\D/g, '').slice(-4)
  const gcashLast4 = gcashForm.Number.replace(/\D/g, '').slice(-4)
  const displayName = client?.CompanyName || event.Name
  const displayEmail = client?.Email || '—'
  const selectedVenue = localVenues.find(v => v.Id === venueId) || venue

  const teamOptions = localEmployees.map(e => ({ id: e.Id, label: `${e.FirstName} ${e.LastName}`, sub: e.Role }))
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

  function addStaffRow() {
    setStaffRows(prev => [...prev, { teamId: null, venueId: null }])
  }

  function renderBookingForm() {
    return (
      <div className="flex flex-1 flex-col rounded-xl border border-[#E5E7EB] dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5">
        <p className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Event Detail</p>

        <div className="flex flex-1 flex-col gap-4">
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

          <StepFooter onSave={() => onSave && onSave(buildPayload())} onProceed={() => setPipelineStep(1)} onCancel={handleCancelBooking} />
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
            onSave={() => { createVenue(); setAddVenueMode(false) }}
            onProceed={() => { createVenue(); setAddVenueMode(false); setPipelineStep(2) }}
            onCancel={handleCancelBooking}
          />
        </div>
      </div>
    )
  }

  function renderCardForm() {
    return (
      <div className="space-y-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Card</p>
        <div>
          <Label>Cardholder Name <Required /></Label>
          <input type="text" className={inputClass} placeholder="Enter cardholder name"
            value={cardForm.Holder}
            onChange={e => setCardForm(f => ({ ...f, Holder: e.target.value }))} />
        </div>
        <div>
          <Label>Card Number <Required /></Label>
          <input type="text" inputMode="numeric" className={inputClass} placeholder="1234 5678 9012 3456"
            value={cardForm.Number}
            onChange={e => setCardForm(f => ({ ...f, Number: e.target.value }))} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Expiry Date <Required /></Label>
            <input type="text" className={inputClass} placeholder="MM/YY"
              value={cardForm.Expiry}
              onChange={e => setCardForm(f => ({ ...f, Expiry: e.target.value }))} />
          </div>
          <div>
            <Label>CVV <Required /></Label>
            <input type="text" inputMode="numeric" maxLength={4} className={inputClass} placeholder="123"
              value={cardForm.Cvv}
              onChange={e => setCardForm(f => ({ ...f, Cvv: e.target.value }))} />
          </div>
        </div>
      </div>
    )
  }

  function renderGCashForm() {
    return (
      <div className="space-y-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">G-Cash</p>
        <div>
          <Label>GCash Number <Required /></Label>
          <input type="text" inputMode="numeric" className={inputClass} placeholder="09XX XXX XXXX"
            value={gcashForm.Number}
            onChange={e => setGcashForm(f => ({ ...f, Number: e.target.value }))} />
        </div>
        <div>
          <Label hint="Optional">Account Name</Label>
          <input type="text" className={inputClass} placeholder="Enter registered GCash name"
            value={gcashForm.Name}
            onChange={e => setGcashForm(f => ({ ...f, Name: e.target.value }))} />
        </div>
      </div>
    )
  }

  function renderPayPalForm() {
    return (
      <div className="space-y-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">PayPal</p>
        <div>
          <Label>PayPal Email <Required /></Label>
          <input type="email" className={inputClass} placeholder="you@example.com"
            value={paypalForm.Email}
            onChange={e => setPaypalForm(f => ({ ...f, Email: e.target.value }))} />
        </div>
      </div>
    )
  }

  function handleCancelBooking() {
    onCancel && onCancel(event)
  }

  function renderConfirmationView({ allowEdit }) {
    return (
      <div className="grid min-h-0 flex-1 auto-rows-auto md:auto-rows-fr grid-cols-1 md:grid-cols-2 border-dashed border-gray-200 dark:border-[#2A2A36]/60">
        <div className="px-6 pt-2 pb-10 md:pb-0 md:pt-2 md:pl-0 md:pr-12">
          <ConfirmSection title="Client's Information" onEdit={allowEdit ? () => setPipelineStep(0) : null}>
            <Detail label="Company" value={client?.CompanyName} />
            <Detail label="Phone" value={client?.Phone} />
            <Detail label="Email" value={client?.Email} />
            <Detail label="Address" value={client?.Address} />
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
            {payMethod === 'Card' && (
              <>
                <BrandBadge type="Card" />
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  Visa card ending in {cardLast4 || '••••'}
                </p>
              </>
            )}
            {payMethod === 'G-Cash' && (
              <>
                <BrandBadge type="G-Cash" />
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  GCash ending in {gcashLast4 || '••••'}
                </p>
              </>
            )}
            {payMethod === 'PayPal' && (
              <>
                <BrandBadge type="PayPal" />
                <p className="break-words font-medium text-gray-700 dark:text-gray-300">
                  {paypalForm.Email || 'PayPal account'}
                </p>
              </>
            )}
          </ConfirmSection>
        </div>

        <div className="px-6 pt-10 pb-6 border-t border-dashed border-gray-200 dark:border-[#2A2A36]/60 md:pt-14 md:pb-0 md:pl-12 md:pr-0 md:border-l">
          <ConfirmSection title="Receipt/Invoice" onEdit={allowEdit ? () => setPipelineStep(3) : null}>
            <Detail label="Venue Fee" value={formatCurrency(event.fee)} />
            <Detail label="Deposit (30%)" value={formatCurrency(payment.deposit)} />
            <Detail label="Balance" value={formatCurrency(payment.balance)} />
            <Detail label="Total" value={formatCurrency(event.fee)} />
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
              <VenuePicker venues={filteredVenues} selectedId={venueId} onSelect={setVenueId}
                onAddVenue={() => setAddVenueMode(true)} />
            </div>
            <StepFooter onSave={() => onSave && onSave({ VenueId: venueId })} onProceed={() => setPipelineStep(2)} onCancel={handleCancelBooking} />
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
                rows={staffRows}
                onRowsChange={setStaffRows}
                onAddRow={addStaffRow}
              />
            </div>
            <StepFooter onSave={() => onSave && onSave({ staff: staffRows })} onProceed={() => setPipelineStep(3)} onCancel={handleCancelBooking} />
          </div>
        )
      case 3:
        return (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="shrink-0">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xl font-bold text-gray-900 dark:text-white">Payment details</p>
                <button onClick={() => setShowQr(q => !q)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#FF2B66]/40 bg-[#FF2B66]/10 px-2.5 py-1 text-xs font-semibold text-[#FF2B66] hover:bg-[#FF2B66]/20 transition-colors">
                  <QrCode size={14} /> QR code
                </button>
              </div>
              {showQr && (
                <div className="mt-3 rounded-xl border-2 border-dashed border-[#FF2B66]/40 bg-[#FF2B66]/5 p-4 text-center">
                  <QrCode size={56} className="mx-auto text-[#FF2B66]" />
                  <p className="mt-2 text-xs font-medium text-gray-500 dark:text-[#9CA3AF]">
                    Scan to pay with your GCash or bank app
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 shrink-0">
              {PAY_METHODS.map(m => {
                const active = payMethod === m.key
                const Icon = m.icon
                return (
                  <button key={m.key} onClick={() => setPayMethod(m.key)}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all ${
                      active
                        ? 'bg-[#FF2B66] text-white shadow-lg shadow-[#FF2B66]/25'
                        : 'bg-[#F4F4F9] dark:bg-[#181820] text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#22222C]'
                    }`}>
                    <Icon size={16} /> {m.key}
                  </button>
                )
              })}
            </div>

            <div className="flex-1 rounded-xl border border-[#E5E7EB] dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5">
              {payMethod === 'Card' && renderCardForm()}
              {payMethod === 'G-Cash' && renderGCashForm()}
              {payMethod === 'PayPal' && renderPayPalForm()}
            </div>

            <div className="rounded-xl border border-[#E5E7EB] dark:border-[#2A2A36] bg-white dark:bg-[#121217] divide-y divide-gray-100 dark:divide-[#2A2A36]/60">
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
                <span className="text-sm font-medium text-gray-900 dark:text-white">{payMethod}</span>
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Balance</span>
                <span className="text-sm font-bold text-[#FF2B66]">{formatCurrency(payment.balance)}</span>
              </div>
            </div>
            <StepFooter
              onSave={() => onSave && onSave({ paymentMethod: payMethod, card: cardForm, gcash: gcashForm, paypal: paypalForm })}
              onProceed={() => setPipelineStep(4)}
              onCancel={handleCancelBooking}
            />
          </div>
        )
      case 4:
        return (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            {renderConfirmationView({ allowEdit: true })}
            <StepFooter
              onSave={() => onSave && onSave({})}
              onProceed={() => onConfirm && onConfirm(event)}
              proceedLabel="Confirm Booking"
              proceedIcon={Check}
              onCancel={handleCancelBooking}
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
              <Meta icon={Phone} label="Phone" value={client?.Phone} />
              <Meta icon={Home} label="Address" value={client?.Address} />
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
                <div className="flex min-h-0 flex-1 flex-col">{renderPipelineStep()}</div>
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
