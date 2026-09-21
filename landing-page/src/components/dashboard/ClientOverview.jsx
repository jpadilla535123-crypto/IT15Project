import { useMemo } from 'react'
import { Users, Globe } from 'lucide-react'

const DOTS = {
  New: 'bg-[#FF2B66]',
  Booked: 'bg-emerald-500',
  Completed: 'bg-blue-500',
  Cancelled: 'bg-red-400',
}

export default function ClientOverview({ clients }) {
  const total = clients.length

  const counts = useMemo(() => {
    const c = { New: 0, Booked: 0, Completed: 0, Cancelled: 0 }
    clients.forEach(x => { if (c[x.Status] != null) c[x.Status] += 1 })
    return c
  }, [clients])

  const sources = useMemo(() => {
    const m = {}
    clients.forEach(c => { m[c.Source] = (m[c.Source] || 0) + 1 })
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 3)
  }, [clients])

  const rows = [
    { label: 'Total Clients', value: total, dot: null },
    { label: 'New', value: counts.New, dot: DOTS.New },
    { label: 'Booked', value: counts.Booked, dot: DOTS.Booked },
    { label: 'Completed', value: counts.Completed, dot: DOTS.Completed },
    { label: 'Cancelled', value: counts.Cancelled, dot: DOTS.Cancelled },
  ]

  return (
    <aside className="space-y-6">
      <section className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-[#FF2B66]/10 flex items-center justify-center text-[#FF2B66]">
            <Users size={16} />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white">Client Overview</h3>
        </div>
        <ul className="space-y-3">
          {rows.map(r => (
            <li key={r.label} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-gray-500 dark:text-[#9CA3AF]">
                {r.dot && <span className={`h-2 w-2 rounded-full ${r.dot}`} />}
                {r.label}
              </span>
              <span className="font-bold text-gray-900 dark:text-white">{r.value}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-[#FF2B66]/10 flex items-center justify-center text-[#FF2B66]">
            <Globe size={16} />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white">Client Sources</h3>
        </div>
        <ul className="space-y-3">
          {sources.map(([label, value]) => (
            <li key={label} className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-[#9CA3AF]">{label}</span>
              <span className="font-bold text-gray-900 dark:text-white">{value}</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  )
}