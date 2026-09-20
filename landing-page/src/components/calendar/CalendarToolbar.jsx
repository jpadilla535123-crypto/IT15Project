import { ChevronLeft, ChevronRight, Plus, SlidersHorizontal } from 'lucide-react'
import FilterPopover from './FilterPopover'

const VIEWS = [
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
]

export default function CalendarToolbar(props) {
  const {
    view, onViewChange, title, onNavigate,
    onNewEvent, venues, clients,
    filters, onFilterChange, filterOpen, onToggleFilter,
  } = props

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1 rounded-xl bg-gray-100 dark:bg-[#121217] border border-gray-200 dark:border-[#2A2A36] p-1">
        {VIEWS.map(v => (
          <button key={v.key} onClick={() => onViewChange(v.key)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
              view === v.key
                ? 'bg-[#FF2B66] text-white'
                : 'text-gray-500 dark:text-[#9CA3AF] hover:text-gray-900 dark:hover:text-white'
            }`}>
            {v.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 ml-1">
        <button onClick={() => onNavigate(-1)}
          className="h-8 w-8 rounded-xl flex items-center justify-center text-gray-500 dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-white/5 hover:text-[#FF2B66] transition-colors">
          <ChevronLeft size={18} />
        </button>
        <span className="min-w-[130px] text-center text-sm font-bold text-gray-900 dark:text-white">{title}</span>
        <button onClick={() => onNavigate(1)}
          className="h-8 w-8 rounded-xl flex items-center justify-center text-gray-500 dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-white/5 hover:text-[#FF2B66] transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2.5 ml-auto relative">
        <button onClick={onToggleFilter}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
            filterOpen || filters.statuses.length || filters.types.length || filters.venueId || filters.clientId
              ? 'border-[#FF2B66]/50 text-[#FF2B66] bg-[#FF2B66]/5'
              : 'border-gray-200 dark:border-[#2A2A36] text-gray-600 dark:text-gray-200 hover:border-[#FF2B66]/50 hover:text-[#FF2B66]'
          }`}>
          <SlidersHorizontal size={14} /> Filter
        </button>
        <button onClick={onNewEvent}
          className="inline-flex items-center gap-1.5 bg-[#FF2B66] hover:bg-[#E0245A] text-white text-sm font-semibold rounded-xl px-4 py-2 transition-colors">
          <Plus size={16} /> New Event
        </button>

        {filterOpen && (
          <FilterPopover
            onClose={onToggleFilter}
            filters={filters}
            onChange={onFilterChange}
            venues={venues}
            clients={clients}
          />
        )}
      </div>
    </div>
  )
}