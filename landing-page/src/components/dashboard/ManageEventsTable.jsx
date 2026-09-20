import { useState } from 'react'
import {
  Plus, SlidersHorizontal, ChevronDown, MoreHorizontal,
  ChevronUp, ChevronDown as SortDown, ChevronsUpDown,
} from 'lucide-react'
import { formatMonthDay } from './format'

const ACTIVE_BADGE = 'bg-[#FF2B66]/10 text-[#FF2B66] dark:bg-[#FF2B66]/15 dark:text-[#FF7A9F]'
const DONE_BADGE = 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300'

function statusBadge(status) {
  const tone = status === 'Completed' || status === 'Cancelled' ? DONE_BADGE : ACTIVE_BADGE
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {status}
    </span>
  )
}

const COLUMNS = [
  { key: 'Name', label: 'Event Name', sortable: true },
  { key: 'StartDate', label: 'Date', sortable: true },
  { key: null, label: 'Client', sortable: false },
  { key: 'EventType', label: 'Type', sortable: true },
  { key: 'Status', label: 'Status', sortable: true },
  { key: null, label: '', sortable: false },
]

export default function ManageEventsTable({ data }) {
  const [tab, setTab] = useState('active')
  const [sortKey, setSortKey] = useState('StartDate')
  const [sortDir, setSortDir] = useState('asc')

  const clientsById = Object.fromEntries(data.clients.map(c => [c.Id, c]))

  const completed = data.events.filter(e => e.Status === 'Completed')
  const active = data.events.filter(e => e.Status !== 'Completed')
  const shown = tab === 'active' ? active : completed

  const sorted = [...shown].sort((a, b) => {
    let va = a[sortKey]
    let vb = b[sortKey]
    if (sortKey === 'StartDate') {
      va = new Date(va).getTime()
      vb = new Date(vb).getTime()
    } else {
      va = String(va ?? '').toLowerCase()
      vb = String(vb ?? '').toLowerCase()
    }
    if (va < vb) return sortDir === 'asc' ? -1 : 1
    if (va > vb) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <section id="manage-events" className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217]">
      <div className="p-6 pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Manage Your Events</h2>
          <div className="flex items-center gap-1 rounded-xl bg-gray-100 dark:bg-[#181820] p-1 w-fit">
            <button onClick={() => setTab('active')}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                tab === 'active'
                  ? 'bg-[#FF2B66] text-white'
                  : 'text-gray-500 dark:text-[#9CA3AF] hover:text-gray-900 dark:hover:text-white'
              }`}>
              Active <span className={tab === 'active' ? 'opacity-80' : 'text-gray-400'}>{active.length}</span>
            </button>
            <button onClick={() => setTab('completed')}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                tab === 'completed'
                  ? 'bg-[#FF2B66] text-white'
                  : 'text-gray-500 dark:text-[#9CA3AF] hover:text-gray-900 dark:hover:text-white'
              }`}>
              Completed <span className={tab === 'completed' ? 'opacity-80' : 'text-gray-400'}>{completed.length}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-[#181820] flex items-center justify-center text-gray-500 dark:text-[#9CA3AF] hover:text-[#FF2B66] transition-colors" title="Filter">
            <SlidersHorizontal size={17} />
          </button>
          <button className="h-10 flex items-center gap-2 rounded-xl bg-gray-100 dark:bg-[#181820] px-3.5 text-sm font-medium text-gray-600 dark:text-[#9CA3AF] hover:text-gray-900 dark:hover:text-white transition-colors">
            Find Free Slot <ChevronDown size={15} />
          </button>
          <button className="inline-flex items-center gap-1.5 bg-[#FF2B66] hover:bg-[#E0245A] text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors">
            <Plus size={16} /> New Event
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-gray-200 dark:border-[#2A2A36]">
              {COLUMNS.map(col => {
                const isActiveSort = sortKey === col.key
                return (
                  <th key={col.label || 'actions'} className="px-4 py-3 text-left">
                    {col.sortable ? (
                      <button onClick={() => toggleSort(col.key)}
                        className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280] hover:text-gray-900 dark:hover:text-white transition-colors">
                        {col.label}
                        {isActiveSort ? (
                          sortDir === 'asc' ? <SortDown size={13} /> : <ChevronUp size={13} />
                        ) : (
                          <ChevronsUpDown size={13} />
                        )}
                      </button>
                    ) : (
                      col.label && <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">{col.label}</span>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#2A2A36]/60">
            {sorted.map(e => (
              <tr key={e.Id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3.5 font-semibold text-gray-900 dark:text-white whitespace-nowrap">{e.Name}</td>
                <td className="px-4 py-3.5 text-gray-500 dark:text-[#9CA3AF] whitespace-nowrap">{formatMonthDay(e.StartDate)}</td>
                <td className="px-4 py-3.5 text-gray-600 dark:text-gray-300 whitespace-nowrap">{clientsById[e.ClientId]?.CompanyName || '—'}</td>
                <td className="px-4 py-3.5 text-gray-500 dark:text-[#9CA3AF] whitespace-nowrap">{e.EventType}</td>
                <td className="px-4 py-3.5 whitespace-nowrap">{statusBadge(e.Status)}</td>
                <td className="px-4 py-3.5 text-right">
                  <button className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 dark:text-[#6B7280] hover:text-gray-900 dark:hover:text-white transition-colors" title="More actions">
                    <MoreHorizontal size={17} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-gray-500 dark:text-[#9CA3AF]">
            No {tab} events found.
          </p>
        )}
      </div>
    </section>
  )
}