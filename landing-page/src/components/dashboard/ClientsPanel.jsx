import { useMemo, useState } from 'react'
import { Search, Plus, Calendar, ChevronRight, ChevronDown } from 'lucide-react'
import { formatCurrency } from './format'

const STATUS_ORDER = { New: 0, Booked: 1, Completed: 2, Cancelled: 3 }
const TABS = ['All Clients', 'New', 'Booked', 'Completed', 'Cancelled']
const TYPES = ['All Types', 'Individual', 'Company']

function initials(name) {
  return String(name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function ClientsPanel({ clients, onSelect, onAddClient }) {
  const [tab, setTab] = useState('All Clients')
  const [query, setQuery] = useState('')
  const [type, setType] = useState('All Types')

  const counts = useMemo(() => {
    const c = { 'All Clients': clients.length, New: 0, Booked: 0, Completed: 0, Cancelled: 0 }
    clients.forEach(x => { if (c[x.Status] != null) c[x.Status] += 1 })
    return c
  }, [clients])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return clients
      .filter(c => {
        if (tab !== 'All Clients' && c.Status !== tab) return false
        if (type !== 'All Types' && c.ClientType !== type) return false
        if (!q) return true
        return [c.ContactPerson, c.CompanyName, c.Email].some(v => String(v || '').toLowerCase().includes(q))
      })
      .sort((a, b) => {
        const d = (STATUS_ORDER[a.Status] ?? 9) - (STATUS_ORDER[b.Status] ?? 9)
        if (d !== 0) return d
        return String(a.ContactPerson || '').localeCompare(String(b.ContactPerson || ''))
      })
  }, [clients, tab, query, type])

  return (
    <section>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {TABS.map(t => {
          const active = tab === t
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                active
                  ? 'bg-[#FF2B66] text-white'
                  : 'bg-white dark:bg-[#121217] border border-gray-200 dark:border-[#2A2A36] text-gray-500 dark:text-[#9CA3AF] hover:text-gray-900 dark:hover:text-white'
              }`}>
              {t} <span className={active ? 'opacity-80' : 'text-gray-400 dark:text-[#6B7280]'}>{counts[t] ?? 0}</span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex flex-1 min-w-[220px] max-w-sm items-center gap-2.5 rounded-xl bg-white dark:bg-[#121217] border border-gray-200 dark:border-[#2A2A36] px-3.5 py-2.5 focus-within:border-[#FF2B66]/50 transition-colors">
          <Search size={16} className="text-gray-400 dark:text-[#6B7280]" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search clients..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-[#6B7280] text-gray-900 dark:text-white"
          />
        </div>

        <div className="relative h-10">
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="h-10 appearance-none rounded-xl bg-white dark:bg-[#121217] border border-gray-200 dark:border-[#2A2A36] pl-3.5 pr-9 text-sm font-medium text-gray-600 dark:text-[#9CA3AF] focus:outline-none cursor-pointer">
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        <button onClick={onAddClient}
          className="inline-flex items-center gap-1.5 bg-[#FF2B66] hover:bg-[#E0245A] text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors">
          <Plus size={16} /> Add Client
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] px-6 py-14 text-center text-sm text-gray-500 dark:text-[#9CA3AF]">
          No clients found.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(c => (
            <button key={c.Id} onClick={() => onSelect(c)}
              className="text-left rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5 hover:border-[#FF2B66]/50 hover:shadow-lg hover:shadow-[#FF2B66]/5 transition-all group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 shrink-0 rounded-full bg-[#FF2B66]/10 text-[#FF2B66] font-bold text-sm flex items-center justify-center">
                    {initials(c.ContactPerson)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{c.ContactPerson}</p>
                    <p className="text-xs text-gray-500 dark:text-[#9CA3AF] truncate">{c.CompanyName}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300 dark:text-[#2A2A36] group-hover:text-[#FF2B66] group-hover:translate-x-0.5 transition-all mt-1.5 shrink-0" />
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-[#2A2A36]/60 flex items-center gap-4 text-xs text-gray-500 dark:text-[#9CA3AF]">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#FF2B66]" /> {c.Events} Event{c.Events === 1 ? '' : 's'}
                </span>
                <span>Budget {formatCurrency(c.Budget)}</span>
                {c.ClientType && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-[#6B7280]">
                    {c.ClientType}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}