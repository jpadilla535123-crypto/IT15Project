import { PieChart } from 'lucide-react'

const SEGMENTS = [
  { key: 'Booked', label: 'Booked', color: '#10B981' },
  { key: 'New', label: 'New', color: '#3B82F6' },
  { key: 'Pending', label: 'Pending', color: '#F59E0B' },
  { key: 'Completed', label: 'Completed', color: '#9CA3AF' },
  { key: 'Cancelled', label: 'Cancelled', color: '#EF4444' },
]

export default function StatusOverviewCard({ data }) {
  const total = data.events.length || 1

  const segs = SEGMENTS
    .map(s => ({ ...s, count: data.events.filter(e => e.Status === s.key).length }))
    .filter(s => s.count > 0)

  let acc = 0
  const stops = segs
    .map(s => {
      const from = (acc / total) * 100
      acc += s.count
      const to = (acc / total) * 100
      return `${s.color} ${from}% ${to}%`
    })
    .join(', ')

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5 flex flex-col justify-between flex-1 min-h-0">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-[#FF2B66]/10 flex items-center justify-center text-[#FF2B66]">
          <PieChart size={16} />
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white">Status Overview</h3>
      </div>

      <div className="relative mx-auto h-40 w-40">
        <div className="h-40 w-40 rounded-full" style={{ background: `conic-gradient(${stops})` }} />
        <div className="absolute inset-[14px] rounded-full bg-white dark:bg-[#121217] flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-gray-900 dark:text-white">{data.events.length}</span>
          <span className="text-[9px] font-bold tracking-widest text-gray-400 dark:text-[#6B7280]">EVENTS</span>
        </div>
      </div>

      <ul className="mt-5 space-y-2">
        {segs.map(s => (
          <li key={s.key} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-gray-500 dark:text-[#9CA3AF]">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
            <span className="font-bold text-gray-900 dark:text-white">
              {s.count} <span className="text-xs font-semibold text-gray-400 dark:text-[#6B7280]">({Math.round((s.count / total) * 100)}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}