import { Building2, Check, Plus, CircleSlash } from 'lucide-react'
import { formatCurrency } from '../dashboard/format'

export default function VenuePicker({ venues, selectedId, onSelect, onAddVenue, disabledVenues }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {venues.map(v => {
        const isSelected = v.Id === selectedId
        const reason = disabledVenues ? disabledVenues[v.Id] : null
        return (
          <button
            key={v.Id}
            type="button"
            disabled={!!reason}
            onClick={() => onSelect(isSelected ? null : v.Id)}
            title={reason || (isSelected ? 'Selected venue' : 'Select venue')}
            className={`text-left flex flex-col gap-2.5 rounded-2xl border p-4 transition-all ${
              reason
                ? 'opacity-55 saturate-50 border-gray-200 dark:border-[#2A2A36] bg-gray-50 dark:bg-[#0D0D11] cursor-not-allowed'
                : isSelected
                  ? 'border-[#FF2B66] ring-2 ring-[#FF2B66]/30 bg-white dark:bg-[#121217]'
                  : 'border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] hover:border-[#FF2B66]/40 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`h-9 w-9 rounded-xl flex items-center justify-center ${reason ? 'bg-gray-100 dark:bg-white/5' : 'bg-[#FF2B66]/10'}`}>
                <Building2 size={16} className={reason ? 'text-gray-400 dark:text-[#6B7280]' : 'text-[#FF2B66]'} />
              </span>
              {isSelected && !reason && (
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
            {reason ? (
              <p className="flex items-center gap-1 text-[11px] font-bold text-amber-500 dark:text-amber-400">
                <CircleSlash size={12} className="shrink-0" /> {reason}
              </p>
            ) : (
              <p className="text-sm font-bold text-[#FF2B66]">{formatCurrency(v.PricePerDay)}<span className="text-[11px] font-medium text-gray-400 dark:text-[#6B7280]"> /day</span></p>
            )}
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