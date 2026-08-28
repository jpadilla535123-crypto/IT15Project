import { Info, ArrowRight } from 'lucide-react'
import { formatCurrency } from '../dashboard/format'

export default function BookingFooter({ step, totalSteps, total, breakdown, showTotal, onSave, onNext, onBack }) {
  return (
    <div className="mt-auto flex items-center justify-end rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] px-4 py-3 shadow-lg">
      <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-3">
        {showTotal && (
          <div className="text-right">
            <p className="flex items-center justify-end gap-1.5 text-sm font-bold text-gray-900 dark:text-white">
              Total: {formatCurrency(total)}
              <Info size={14} className="text-gray-400 dark:text-[#6B7280]" />
            </p>
            <p className="text-[11px] text-gray-400 dark:text-[#6B7280]">{breakdown}</p>
          </div>
        )}

        <div className="flex items-center gap-2.5">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#0B0B0E] px-4 py-2 text-sm font-semibold text-gray-700 dark:text-white hover:border-[#FF2B66]/50 hover:text-[#FF2B66] transition-colors"
            >
              ← Back
            </button>
          )}
          <button
            type="button"
            onClick={onSave}
            className="rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#0B0B0E] px-4 py-2 text-sm font-semibold text-gray-700 dark:text-white hover:border-[#FF2B66]/50 hover:text-[#FF2B66] transition-colors"
          >
            Save &amp; Exit
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={step >= totalSteps - 1}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF2B66] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e00f4d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}