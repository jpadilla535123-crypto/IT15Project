import { useMemo, useState } from 'react'
import {
  Search, Plus, List, ChevronDown, ChevronLeft, ChevronRight,
  Phone, Pencil, Check,
} from 'lucide-react'

const PAGE_SIZE = 5

const EDIT_OPTIONS = ['Contacted', 'Confirmed Appointment', 'Lost']

const STATUS_TONES = {
  New: 'bg-[#FF2B66]/10 text-[#FF2B66] dark:bg-[#FF2B66]/15 dark:text-[#FF7A9F]',
  Contacted: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  'Confirmed Appointment': 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  Lost: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300',
}

// Grouping priority: New first, then Contacted, then Confirmed Appointment, Lost last.
const STATUS_ORDER = {
  New: 0,
  Contacted: 1,
  'Confirmed Appointment': 2,
  Lost: 3,
}

const FILTER_OPTIONS = ['All Leads', 'New', 'Contacted', 'Confirmed Appointment', 'Lost']

function statusBadge(status) {
  const tone = STATUS_TONES[status] || STATUS_TONES.New
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {status}
    </span>
  )
}

function isCallOnly(lead) {
  return lead.Status === 'Confirmed Appointment' || lead.Status === 'Lost'
}

export default function LeadsTable({ data }) {
  const [leads, setLeads] = useState(data)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All Leads')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(() => new Set())
  const [menuId, setMenuId] = useState(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = leads.filter(l => {
      if (filter !== 'All Leads' && l.Status !== filter) return false
      if (!q) return true
      return [l.ContactName, l.CompanyName, l.Email].some(v => String(v || '').toLowerCase().includes(q))
    })
    return [...rows].sort((a, b) => {
      const statusDiff = (STATUS_ORDER[a.Status] ?? 9) - (STATUS_ORDER[b.Status] ?? 9)
      if (statusDiff !== 0) return statusDiff
      return String(a.ContactName || '').localeCompare(String(b.ContactName || ''))
    })
  }, [leads, query, filter])

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const from = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const to = Math.min(safePage * PAGE_SIZE, total)

  const allSelected = rows.length > 0 && rows.every(r => selected.has(r.Id))

  function toggleAll() {
    setSelected(prev => {
      const next = new Set(prev)
      if (allSelected) rows.forEach(r => next.delete(r.Id))
      else rows.forEach(r => next.add(r.Id))
      return next
    })
  }

  function toggleOne(id) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function updateStatus(id, status) {
    setLeads(list => list.map(l => (l.Id === id ? { ...l, Status: status } : l)))
    setMenuId(null)
  }

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217]">
      <div className="p-5 flex flex-col md:flex-row md:items-center gap-3 border-b border-gray-200 dark:border-[#2A2A36]">
        <div className="flex flex-1 max-w-sm items-center gap-2.5 rounded-xl bg-gray-100 dark:bg-[#181820] px-3.5 py-2.5 border border-transparent focus-within:border-[#FF2B66]/50 transition-colors">
          <Search size={16} className="text-gray-400 dark:text-[#6B7280]" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1) }}
            placeholder="Search leads..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-[#6B7280] text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2.5 ml-auto">
          <button className="h-10 flex items-center gap-2 rounded-xl bg-gray-100 dark:bg-[#181820] px-3.5 text-sm font-medium text-gray-600 dark:text-[#9CA3AF] transition-colors">
            <List size={16} /> List View <ChevronDown size={14} />
          </button>

          <div className="relative h-10">
            <select
              value={filter}
              onChange={e => { setFilter(e.target.value); setPage(1) }}
              className="h-10 appearance-none rounded-xl bg-gray-100 dark:bg-[#181820] pl-3.5 pr-9 text-sm font-medium text-gray-600 dark:text-[#9CA3AF] focus:outline-none cursor-pointer">
              {FILTER_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <button className="inline-flex items-center gap-1.5 bg-[#FF2B66] hover:bg-[#E0245A] text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors">
            <Plus size={16} /> Add Lead
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-[#2A2A36]">
              <th className="px-4 py-3 w-10">
                <input type="checkbox" checked={allSelected} onChange={toggleAll}
                  className="h-4 w-4 rounded accent-[#FF2B66] cursor-pointer" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">E-mail</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">Company</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#2A2A36]/60">
            {rows.map(lead => (
              <tr key={lead.Id} className={`hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors ${selected.has(lead.Id) ? 'bg-[#FF2B66]/5' : ''}`}>
                <td className="px-4 py-3.5">
                  <input type="checkbox" checked={selected.has(lead.Id)} onChange={() => toggleOne(lead.Id)}
                    className="h-4 w-4 rounded accent-[#FF2B66] cursor-pointer" />
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 shrink-0 rounded-full bg-[#FF2B66]/10 text-[#FF2B66] font-bold text-xs flex items-center justify-center uppercase">
                      {String(lead.ContactName || '?').split(' ').map(w => w[0]).slice(0, 2).join('')}
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">{lead.ContactName}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-gray-500 dark:text-[#9CA3AF] whitespace-nowrap">{lead.Email}</td>
                <td className="px-4 py-3.5 text-gray-600 dark:text-gray-300 whitespace-nowrap">{lead.CompanyName}</td>
                <td className="px-4 py-3.5 whitespace-nowrap">{statusBadge(lead.Status)}</td>
                <td className="px-4 py-3.5">
                  <div className="relative flex items-center justify-end gap-1">
                    <a href={`tel:${lead.Phone || ''}`}
                      className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 dark:text-[#6B7280] hover:text-[#FF2B66] transition-colors"
                      title="Call lead">
                      <Phone size={16} />
                    </a>
                    {!isCallOnly(lead) && (
                      <>
                        <button onClick={() => setMenuId(menuId === lead.Id ? null : lead.Id)}
                          className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 dark:text-[#6B7280] hover:text-[#FF2B66] transition-colors"
                          title="Edit status">
                          <Pencil size={16} />
                        </button>
                        {menuId === lead.Id && (
                          <div
                            className="absolute right-0 top-full mt-1 z-20 w-48 rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#181820] shadow-lg py-1"
                            onClick={e => e.stopPropagation()}>
                            <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">
                              Set status
                            </p>
                            {EDIT_OPTIONS.map(opt => (
                              <button key={opt} onClick={() => updateStatus(lead.Id, opt)}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-600 dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors">
                                <span className="flex-1">{opt}</span>
                                {lead.Status === opt && <Check size={14} className="text-[#FF2B66]" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-gray-500 dark:text-[#9CA3AF]">No leads found.</p>
        )}
      </div>

      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-200 dark:border-[#2A2A36]">
        <p className="text-sm text-gray-500 dark:text-[#9CA3AF]">
          Showing {from}–{to} of {total} leads
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage <= 1}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-40 transition-colors">
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map(n => (
            <button key={n} onClick={() => setPage(n)}
              className={`h-8 w-8 rounded-lg text-sm font-semibold transition-colors ${n === safePage ? 'bg-[#FF2B66] text-white' : 'text-gray-500 dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-white/10'}`}>
              {n}
            </button>
          ))}
          <button onClick={() => setPage(Math.min(pageCount, safePage + 1))} disabled={safePage >= pageCount}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-40 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  )
}