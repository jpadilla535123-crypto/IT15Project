import { useEffect, useState } from 'react'
import { PieChart } from 'lucide-react'
import { useInView } from './useFx'
import '../../pages/landingFx.css'

const SEGMENTS = [
  { key: 'Booked', label: 'Booked', color: '#10B981' },
  { key: 'New', label: 'New', color: '#3B82F6' },
  { key: 'Pending', label: 'Pending', color: '#F59E0B' },
  { key: 'Completed', label: 'Completed', color: '#9CA3AF' },
  { key: 'Cancelled', label: 'Cancelled', color: '#EF4444' },
]

export default function StatusOverviewCard({ data }) {
  const [progress, setProgress] = useState(0)   // 0 → 1 draw animation
  const [hover, setHover] = useState(null)      // hovered segment key
  const [ref, inView] = useInView(0.3)
  const total = data.events.length || 1

  const segs = SEGMENTS
    .map(s => ({ ...s, count: data.events.filter(e => e.Status === s.key).length }))
    .filter(s => s.count > 0)

  /* sweep the donut in when it scrolls into view */
  useEffect(() => {
    if (!inView) return
    let raf
    const start = performance.now()
    const tick = now => {
      const p = Math.min((now - start) / 900, 1)
      setProgress(1 - Math.pow(1 - p, 3))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView])

  /* full conic stops, scaled by draw progress */
  const buildStops = (entries, scale) => {
    let acc = 0
    return entries
      .map(s => {
        const from = (acc / total) * 100 * scale
        acc += s.count
        const to = (acc / total) * 100 * scale
        return `${s.color} ${from}% ${to}%`
      })
      .join(', ')
  }

  /* dim overlay covering everything except the hovered segment */
  const dimStops = () => {
    if (!hover) return null
    let acc = 0
    const parts = []
    for (const s of segs) {
      const from = (acc / total) * 100
      acc += s.count
      const to = (acc / total) * 100
      parts.push(`${s.key === hover ? 'transparent' : 'rgba(18,18,23,0.72)'} ${from}% ${to}%`)
    }
    return parts.join(', ')
  }

  const hovered = segs.find(s => s.key === hover)

  return (
    <section ref={ref}
      className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5 flex flex-col justify-between flex-1 min-h-0">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-[#FF2B66]/10 flex items-center justify-center text-[#FF2B66]">
          <PieChart size={16} />
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white">Status Overview</h3>
      </div>

      <div className="relative mx-auto h-40 w-40"
        onMouseLeave={() => setHover(null)}>
        <div className="h-40 w-40 rounded-full transition-transform duration-300"
          style={{
            background: `conic-gradient(${buildStops(segs, progress)}, #2A2A36 0)`,
            transform: hover ? 'scale(1.05)' : 'scale(1)',
          }} />
        {hover && (
          <div className="absolute inset-0 rounded-full"
            style={{ background: `conic-gradient(${dimStops()})` }} />
        )}
        <div className="absolute inset-[14px] rounded-full bg-white dark:bg-[#121217] flex flex-col items-center justify-center pointer-events-none">
          {hovered ? (
            <div key={hovered.key} className="fx-mode-swap flex flex-col items-center">
              <span className="text-2xl font-extrabold" style={{ color: hovered.color }}>{hovered.count}</span>
              <span className="text-[9px] font-bold tracking-widest text-gray-400 dark:text-[#6B7280]">
                {hovered.label.toUpperCase()}
              </span>
            </div>
          ) : (
            <>
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white">{data.events.length}</span>
              <span className="text-[9px] font-bold tracking-widest text-gray-400 dark:text-[#6B7280]">EVENTS</span>
            </>
          )}
        </div>
      </div>

      <ul className="mt-5 space-y-2">
        {segs.map(s => (
          <li key={s.key}
            onMouseEnter={() => setHover(s.key)}
            className={`flex items-center justify-between text-sm rounded-lg px-2 py-1 -mx-2 cursor-pointer transition-colors ${hover === s.key ? 'bg-gray-100 dark:bg-white/5' : ''}`}>
            <span className="flex items-center gap-2 text-gray-500 dark:text-[#9CA3AF]">
              <span className="h-2 w-2 rounded-full transition-transform duration-200"
                style={{ backgroundColor: s.color, transform: hover === s.key ? 'scale(1.5)' : 'scale(1)' }} />
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
