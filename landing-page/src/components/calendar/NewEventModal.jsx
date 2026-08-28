import { useMemo, useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { EVENT_TYPES, EVENT_STATUSES, sameDay, isTimeOverlap, toISO, timeRange } from './calendarUtils'
import { formatFullDate } from '../dashboard/format'

export default function NewEventModal({ edit, onClose, onCreate, onUpdate, events, clients, venues }) {
  const [name, setName] = useState(edit?.Name || '')
  const [type, setType] = useState(edit?.EventType || 'Corporate')
  const [status, setStatus] = useState(edit?.Status || 'New')
  const [clientId, setClientId] = useState(edit?.ClientId || '')
  const [venueId, setVenueId] = useState(edit?.VenueId || '')
  const [date, setDate] = useState(edit?.StartDate ? toISO(edit.StartDate) : toISO(new Date()))
  const [start, setStart] = useState(edit?.StartTime || '09:00')
  const [end, setEnd] = useState(edit?.EndTime || '17:00')
  const [guests, setGuests] = useState(edit?.Guests || 0)
  const [requirements, setRequirements] = useState(edit?.SpecialRequirements || '')

  const dateObj = new Date(`${date}T00:00:00`)
  const venueName = venues.find(v => v.Id === Number(venueId))?.Name || ''

  const conflicts = useMemo(() => {
    if (!venueId || !date || !start || !end) return []
    return events.filter(other => {
      if (edit && other.Id === edit.Id) return false
      if (other.VenueId !== Number(venueId)) return false
      if (!sameDay(dateObj, other.StartDate)) return false
      return isTimeOverlap(start, end, other.StartTime, other.EndTime)
    })
  }, [venueId, date, start, end, events, edit])

  const invalid = !name.trim() || !clientId || !venueId || !date || !start || !end

  function handleSubmit(e) {
    e.preventDefault()
    if (invalid || conflicts.length > 0) return
    const payload = {
      Name: name.trim(),
      EventType: type,
      Status: status,
      ClientId: Number(clientId),
      VenueId: Number(venueId),
      StartDate: dateObj,
      EndDate: dateObj,
      StartTime: start,
      EndTime: end,
      Guests: Number(guests) || 0,
      SpecialRequirements: requirements.trim(),
    }
    if (edit) onUpdate({ ...payload, Id: edit.Id })
    else onCreate(payload)
  }

  const input = 'w-full rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#181820] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#FF2B66]/50'
  const label = 'text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] shadow-2xl animate-fade-in">
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217]">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
            {edit ? 'Update Event' : 'Create New Event'}
          </h3>
          <button onClick={onClose}
            className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-[#181820] flex items-center justify-center text-gray-500 dark:text-[#9CA3AF] hover:text-[#FF2B66] transition-colors">
            <X size={18} />
          </button>
        </div>

        {conflicts.length > 0 && (
          <div className="mx-6 mt-4 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-red-600 dark:text-red-400">
              <AlertTriangle size={16} /> Venue Conflict
            </p>
            <p className="mt-1 text-sm text-red-600 dark:text-red-300">
              {venueName || 'This venue'} is already booked:
            </p>
            <ul className="mt-2 space-y-1.5">
              {conflicts.map(c => (
                <li key={c.Id} className="text-sm text-red-600 dark:text-red-300">
                  • {c.Name} — {formatFullDate(c.StartDate)}<br />
                  <span className="text-xs">{timeRange(c.StartTime, c.EndTime)} · {c.EventType}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs font-medium text-red-500">Please select another time or venue.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={label}>Event Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Corporate Annual Meeting" className={input} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Event Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className={input}>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={input}>
                {EVENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Client</label>
              <select value={clientId} onChange={e => setClientId(e.target.value)} className={input}>
                <option value="">Select Client</option>
                {clients.map(c => <option key={c.Id} value={c.Id}>{c.CompanyName}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Venue</label>
              <select value={venueId} onChange={e => setVenueId(e.target.value)} className={input}>
                <option value="">Select Venue</option>
                {venues.map(v => <option key={v.Id} value={v.Id}>{v.Name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={label}>Event Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={input} />
            </div>
            <div>
              <label className={label}>Start Time</label>
              <input type="time" value={start} onChange={e => setStart(e.target.value)} className={input} />
            </div>
            <div>
              <label className={label}>End Time</label>
              <input type="time" value={end} onChange={e => setEnd(e.target.value)} className={input} />
            </div>
          </div>

          <div>
            <label className={label}>Expected Guests</label>
            <input type="number" min="0" value={guests} onChange={e => setGuests(e.target.value)} className={input} />
          </div>

          <div>
            <label className={label}>Special Requirements</label>
            <textarea value={requirements} onChange={e => setRequirements(e.target.value)} rows={2} placeholder="Optional notes..." className={`${input} resize-none`} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="h-11 rounded-xl border border-gray-300 dark:border-[#2A2A36] px-5 text-sm font-semibold text-gray-600 dark:text-gray-200 hover:text-[#FF2B66] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={invalid || conflicts.length > 0}
              className="h-11 rounded-xl bg-[#FF2B66] hover:bg-[#E0245A] disabled:opacity-40 disabled:cursor-not-allowed px-5 text-sm font-semibold text-white transition-colors">
              {edit ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}