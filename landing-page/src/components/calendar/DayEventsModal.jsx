import { X } from 'lucide-react'
import { statusMeta, timeRange } from './calendarUtils'
import { formatFullDate } from '../dashboard/format'

export default function DayEventsModal({ date, list, onClose, onSelect }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[80vh] overflow-y-auto rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5 shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Events</h3>
            <p className="text-xs text-gray-500 dark:text-[#9CA3AF]">{formatFullDate(date)}</p>
          </div>
          <button onClick={onClose}
            className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-[#181820] flex items-center justify-center text-gray-500 dark:text-[#9CA3AF] hover:text-[#FF2B66] transition-colors">
            <X size={18} />
          </button>
        </div>

        <ul className="space-y-2">
          {list.map(e => {
            const meta = statusMeta(e.Status)
            return (
              <li key={e.Id}>
                <button onClick={() => onSelect(e)}
                  className="w-full text-left rounded-xl border border-gray-200 dark:border-[#2A2A36] hover:border-[#FF2B66]/50 p-3 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{e.Name}</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-[#9CA3AF] mt-1 pl-4">
                    {timeRange(e.StartTime, e.EndTime)} · {e.ClientName}
                  </p>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}