import { X, CalendarDays, Clock, Info, Pencil, UserCheck, Truck, User, Wallet, Receipt, Ban } from 'lucide-react'
import { statusMeta, timeRange } from './calendarUtils'
import { formatFullDate } from '../dashboard/format'

const ACTIONS = [
  { label: 'View Details', icon: Info },
  { label: 'Edit Event', icon: Pencil, key: 'edit' },
  { label: 'Assign Employees', icon: UserCheck },
  { label: 'Manage Suppliers', icon: Truck },
  { label: 'View Client', icon: User },
  { label: 'View Budget', icon: Wallet },
  { label: 'View Invoice', icon: Receipt },
]

function Row({ label, value }) {
  return (
    <div className="flex flex-col items-start">
      <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280] mb-1">{label}</dt>
      <dd className="text-sm text-gray-700 dark:text-gray-300">{value || '—'}</dd>
    </div>
  )
}

export default function EventDetailPanel({ event, onClose, onEdit, onCancelEvent }) {
  const meta = statusMeta(event.Status)

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white dark:bg-[#0B0B0E] border-l border-gray-200 dark:border-[#2A2A36] shadow-2xl flex flex-col animate-slide-in-right">
        <div className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-gray-200 dark:border-[#2A2A36]">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{event.Name}</h3>
          <button onClick={onClose}
            className="shrink-0 h-9 w-9 rounded-xl bg-gray-100 dark:bg-[#181820] flex items-center justify-center text-gray-500 dark:text-[#9CA3AF] hover:text-[#FF2B66] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-[#9CA3AF]">
            <CalendarDays size={15} className="text-[#FF2B66]" />
            {formatFullDate(event.StartDate)}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-[#9CA3AF]">
            <Clock size={15} className="text-[#FF2B66]" />
            {timeRange(event.StartTime, event.EndTime)}
          </div>

          <dl className="space-y-4 pt-2">
            <Row label="Client" value={event.ClientName} />
            <Row label="Venue" value={event.VenueName} />
            <Row label="Event Type" value={event.EventType} />
            <Row label="Guests" value={event.Guests ? `${event.Guests.toLocaleString()} guests` : ''} />
            <Row label="Status" value={null} />
            <div className="flex flex-col items-start">
              <dd>
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badge}`}>
                  {event.Status}
                </span>
              </dd>
            </div>
          </dl>

          <div className="border-t border-gray-200 dark:border-[#2A2A36] pt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280] mb-3">Actions</p>
            <div className="grid grid-cols-2 gap-2.5">
              {ACTIONS.map(a => (
                <button key={a.label}
                  onClick={a.key === 'edit' ? () => onEdit(event) : undefined}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-[#2A2A36] px-3 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-200 hover:border-[#FF2B66]/50 hover:text-[#FF2B66] transition-colors">
                  <a.icon size={14} className="text-[#FF2B66]" />
                  {a.label}
                </button>
              ))}
              <button onClick={() => onCancelEvent(event)}
                className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
                <Ban size={14} /> Cancel Event
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}