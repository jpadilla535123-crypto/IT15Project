import { useCountUp } from './useFx'

export function StatValue({ value, prefix = '', suffix = '' }) {
  const [ref, v] = useCountUp(value)
  return <span ref={ref}>{prefix}{v.toLocaleString()}{suffix}</span>
}

export function Kpi({ icon: Icon, label, children, delay = 0, tone = 'text-[#FF2B66]', bg = 'bg-[#FF2B66]/10' }) {
  return (
    <div style={{ transitionDelay: `${delay}ms` }}
      className="fx-stat-cell rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-4 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-lg font-extrabold text-gray-900 dark:text-white truncate">{children}</p>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">{label}</p>
      </div>
      <div className={`h-10 w-10 shrink-0 rounded-xl ${bg} flex items-center justify-center ${tone}`}>
        <Icon size={18} />
      </div>
    </div>
  )
}

export function PageHeader({ section, icon: Icon, title, children, actions }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#6B7280]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#FF2B66]" /> {section}
        </div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          <Icon size={22} className="text-[#FF2B66]" /> {title}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-[#9CA3AF]">{children}</p>
      </div>
      {actions && <div className="flex flex-col items-start md:items-end gap-3">{actions}</div>}
    </div>
  )
}

export function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative flex-1 min-w-[180px]">
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-gray-50 dark:bg-[#0B0B0E] border border-gray-200 dark:border-[#2A2A36] text-gray-900 dark:text-white rounded-full pl-4 pr-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#FF2B66]/50" />
    </div>
  )
}

export function Chip({ active, onClick, children, size = 'sm' }) {
  return (
    <button onClick={onClick}
      className={`rounded-full font-bold transition-all ${size === 'sm' ? 'px-2.5 py-1 text-[10px]' : 'px-3.5 py-1.5 text-xs'} ${
        active ? 'bg-[#FF2B66] text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-[#9CA3AF] hover:text-[#FF2B66]'
      }`}>
      {children}
    </button>
  )
}
