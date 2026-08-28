import { X, RotateCcw } from 'lucide-react'
import { EVENT_STATUSES, EVENT_TYPES } from './calendarUtils'

function CheckRow({ label, checked, onToggle }) {
  return (
    <label className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onToggle}
        className="h-4 w-4 rounded accent-[#FF2B66]" />
      {label}
    </label>
  )
}

export default function FilterPopover({ onClose, filters, onChange, venues, clients }) {
  function toggle(key, value) {
    const list = filters[key]
    const next = list.includes(value) ? list.filter(v => v !== value) : [...list, value]
    onChange({ ...filters, [key]: next })
  }

  function clear() {
    onChange({ statuses: [], types: [], venueId: null, clientId: null })
  }

  return (
    <div className="absolute right-0 top-full mt-2 z-40 w-80 rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] shadow-2xl p-5 animate-fade-in space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 dark:text-white">Filters</h3>
        <div className="flex items-center gap-1">
          <button onClick={clear}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#FF2B66] transition-colors" title="Clear filters">
            <RotateCcw size={15} />
          </button>
          <button onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#FF2B66] transition-colors" title="Close">
            <X size={16} />
          </button>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-[#6B7280] mb-2">Event Status</p>
        <div className="grid grid-cols-2 gap-2">
          {EVENT_STATUSES.map(s => (
            <CheckRow key={s} label={s} checked={filters.statuses.includes(s)} onToggle={() => toggle('statuses', s)} />
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-[#6B7280] mb-2">Event Type</p>
        <div className="grid grid-cols-2 gap-2">
          {EVENT_TYPES.map(t => (
            <CheckRow key={t} label={t} checked={filters.types.includes(t)} onToggle={() => toggle('types', t)} />
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-[#6B7280] mb-2">Venue</p>
        <select value={filters.venueId || ''} onChange={e => onChange({ ...filters, venueId: e.target.value ? Number(e.target.value) : null })}
          className="w-full rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#181820] px-3 py-2 text-sm text-gray-700 dark:text-gray-200 outline-none focus:border-[#FF2B66]/50">
          <option value="">All Venues</option>
          {venues.map(v => <option key={v.Id} value={v.Id}>{v.Name}</option>)}
        </select>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-[#6B7280] mb-2">Client</p>
        <select value={filters.clientId || ''} onChange={e => onChange({ ...filters, clientId: e.target.value ? Number(e.target.value) : null })}
          className="w-full rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#181820] px-3 py-2 text-sm text-gray-700 dark:text-gray-200 outline-none focus:border-[#FF2B66]/50">
          <option value="">All Clients</option>
          {clients.map(c => <option key={c.Id} value={c.Id}>{c.CompanyName}</option>)}
        </select>
      </div>
    </div>
  )
}