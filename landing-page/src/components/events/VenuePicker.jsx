import { Building2, Check, Plus } from 'lucide-react'
import { formatCurrency } from '../dashboard/format'

export default function VenuePicker({ venues, selectedId, onSelect, onAddVenue }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {venues.map(v => {
        const isSelected = v.Id === selectedId
        return (
          <button
            key={v.Id}
            type="button"
            onClick={() => onSelect(isSelected ? null : v.Id)}
            className={`text-left flex flex-col gap-2.5 rounded-2xl border p-4 transition-all ${
              isSelected
                ? 'border-[#FF2B66] ring-2 ring-[#FF2B66]/30 bg-white dark:bg-[#121217]'
                : 'border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] hover:border-[#FF2B66]/40'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="h-9 w-9 rounded-xl bg-[#FF2B66]/10 flex items-center justify-center">
                <Building2 size={16} className="text-[#FF2B66]" />
              </span>
              {isSelected && (
                <span className="h-5 w-5 rounded-full bg-[#FF2B66] text-white flex items-center justify-center">
                  <Check size={12} />
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{v.Name}</p>
              <p className="text-[11px] text-gray-400 dark:text-[#6B7280]">
                {v.City} · {v.Capacity} pax
              </p>
            </div>
            <p className="text-sm font-bold text-[#FF2B66]">{formatCurrency(v.PricePerDay)}<span className="text-[11px] font-medium text-gray-400 dark:text-[#6B7280]"> /day</span></p>
          </button>
        )
      })}

      <button
        type="button"
        onClick={onAddVenue}
        className="group flex min-h-[130px] flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-gray-300 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-4 text-gray-400 dark:text-[#6B7280] hover:border-[#FF2B66]/60 hover:text-[#FF2B66] transition-all"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF2B66]/10 group-hover:bg-[#FF2B66]/20">
          <Plus size={18} className="text-[#FF2B66]" />
        </span>
        <span className="text-sm font-semibold">Add Venue</span>
      </button>
    </div>
  )
}