import { useMemo, useState } from 'react'
import {
  ShieldAlert, Clock, CheckCircle2, XCircle, AlertTriangle, Image as ImageIcon,
  ExternalLink, Loader2,
} from 'lucide-react'
import AppLayout from './AppLayout'
import { StatValue, Kpi, PageHeader, SearchBar, Chip } from '../components/dashboard/Shared'
import { formatCurrency, formatFullDate } from '../components/dashboard/format'
import { useData } from '../api/data'
import { api, API_URL } from '../api/client'
import './landingFx.css'

const FLAG_LABELS = {
  duplicateReference: 'Duplicate ref. #',
  reusedEvidence: 'Reused screenshot',
  amountMismatch: 'Amount mismatch',
  payerMismatch: 'Payer name mismatch',
}

const STATUS_TONES = {
  Pending: 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300',
  Confirmed: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
  Rejected: 'bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-300',
}

const FILTERS = ['All', 'Pending', 'Flagged', 'Confirmed', 'Rejected']

export default function PaymentReview({ user }) {
  const { data, reload } = useData()
  const registrations = data.registrations
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [busyId, setBusyId] = useState(null)

  const pending = registrations.filter(r => r.Status === 'Pending')
  const flagged = registrations.filter(r => r.RiskScore > 0 && r.Status !== 'Rejected')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return registrations
      .filter(r => {
        if (filter === 'Pending' && r.Status !== 'Pending') return false
        if (filter === 'Confirmed' && r.Status !== 'Confirmed') return false
        if (filter === 'Rejected' && r.Status !== 'Rejected') return false
        if (filter === 'Flagged' && r.RiskScore === 0) return false
        if (!q) return true
        return `${r.FullName} ${r.EventName || ''} ${r.TicketReference} ${r.ReferenceNumber || ''} ${r.PayerName || ''}`
          .toLowerCase().includes(q)
      })
      .sort((a, b) => {
        if (b.RiskScore !== a.RiskScore) return b.RiskScore - a.RiskScore
        if (a.Status === 'Pending' && b.Status !== 'Pending') return -1
        if (b.Status === 'Pending' && a.Status !== 'Pending') return 1
        return String(b.CreatedAt || '').localeCompare(String(a.CreatedAt || ''))
      })
  }, [registrations, filter, query])

  async function setStatus(r, status) {
    setBusyId(r.Id)
    try {
      await api.put(`/api/tickets/${r.Id}/status`, { status })
      await reload()
    } catch (err) {
      alert(err.message || 'Could not update the registration status.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AppLayout user={user} badgeCount={data.leads.length}>
      <PageHeader section="Finance" icon={ShieldAlert} title="Payment Review"
        actions={
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map(f => <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{f}</Chip>)}
          </div>
        }>
        <span className="font-bold text-amber-500"><StatValue value={pending.length} /></span> awaiting review ·{' '}
        <span className="font-bold text-[#FF2B66]"><StatValue value={flagged.length} /></span> flagged
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={Clock} label="Awaiting Review" tone="text-amber-500" bg="bg-amber-500/10">
          <StatValue value={pending.length} />
        </Kpi>
        <Kpi icon={AlertTriangle} label="Flagged for Check" tone="text-[#FF2B66]" bg="bg-[#FF2B66]/10" delay={80}>
          <StatValue value={flagged.length} />
        </Kpi>
        <Kpi icon={CheckCircle2} label="Confirmed" tone="text-emerald-500" bg="bg-emerald-500/10" delay={160}>
          <StatValue value={registrations.filter(r => r.Status === 'Confirmed').length} />
        </Kpi>
        <Kpi icon={XCircle} label="Rejected" tone="text-red-500" bg="bg-red-500/10" delay={240}>
          <StatValue value={registrations.filter(r => r.Status === 'Rejected').length} />
        </Kpi>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-4">
        <SearchBar value={query} onChange={setQuery} placeholder="Search by attendee, ticket, reference #, or payer..." />
      </div>

      <section className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-[#2A2A36]">
              {['Attendee / Event', 'Ticket', 'Payment', 'Payer', 'Evidence', 'Flags', 'Status', ''].map(h => (
                <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280] ${h === 'Status' || h === '' ? 'text-center' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#2A2A36]/60">
            {filtered.map(r => (
              <tr key={r.Id} className="align-top hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                {/* attendee + event */}
                <td className="px-4 py-3.5 max-w-[220px]">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{r.FullName}</p>
                  <p className="text-xs text-gray-400 dark:text-[#6B7280] truncate">{r.EventName || `Event #${r.EventId}`}</p>
                  <p className="text-[11px] text-gray-400 dark:text-[#6B7280] mt-0.5">{r.VenueName ? `${r.VenueName} · ` : ''}{r.EventStartDate ? formatFullDate(r.EventStartDate) : ''}</p>
                </td>

                {/* ticket + amount */}
                <td className="px-4 py-3.5">
                  <p className="font-mono text-xs font-bold text-[#FF2B66]">{r.TicketReference}</p>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white mt-1">{formatCurrency(r.Amount)}</p>
                  {r.ExpectedAmount > 0 && (
                    <p className={`text-[11px] ${Math.abs(r.Amount - r.ExpectedAmount) > 1 ? 'text-[#FF2B66]' : 'text-gray-400 dark:text-[#6B7280]'}`}>
                      expected {formatCurrency(r.ExpectedAmount)}
                    </p>
                  )}
                </td>

                {/* method + reference */}
                <td className="px-4 py-3.5">
                  <p className="text-xs text-gray-500 dark:text-[#9CA3AF]">{r.PaymentMethod || '—'}</p>
                  <p className="text-[11px] font-mono text-gray-400 dark:text-[#6B7280] mt-1">{r.ReferenceNumber || '—'}</p>
                </td>

                {/* payer */}
                <td className="px-4 py-3.5">
                  <p className="text-xs text-gray-700 dark:text-gray-300">{r.PayerName || '—'}</p>
                  <p className="text-[11px] text-gray-400 dark:text-[#6B7280] mt-0.5">{r.Email || r.Phone || ''}</p>
                </td>

                {/* evidence thumb */}
                <td className="px-4 py-3.5">
                  {r.EvidencePath ? (
                    <a href={`${API_URL}${r.EvidencePath}`} target="_blank" rel="noopener noreferrer"
                      className="group relative block h-12 w-12 rounded-lg overflow-hidden border border-gray-200 dark:border-[#2A2A36] hover:border-[#FF2B66]/50 transition-colors">
                      <img src={`${API_URL}${r.EvidencePath}`} alt="Evidence" className="h-full w-full object-cover"
                        onError={e => { e.target.style.display = 'none' }} />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors opacity-0 group-hover:opacity-100">
                        <ExternalLink size={14} className="text-white" />
                      </span>
                    </a>
                  ) : (
                    <span className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-[#181820] flex items-center justify-center text-gray-400">
                      <ImageIcon size={16} />
                    </span>
                  )}
                </td>

                {/* flags */}
                <td className="px-4 py-3.5">
                  {r.Flags.length === 0 ? (
                    <span className="text-[11px] text-gray-400 dark:text-[#6B7280]">—</span>
                  ) : (
                    <div className="space-y-1.5 max-w-[160px]">
                      {r.Flags.map(f => (
                        <span key={f} className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-[#FF2B66]/15 text-red-600 dark:text-[#FF6B94] px-2 py-0.5 text-[10px] font-semibold">
                          <AlertTriangle size={10} /> {FLAG_LABELS[f] || f}
                        </span>
                      ))}
                    </div>
                  )}
                </td>

                {/* status + actions */}
                <td className="px-4 py-3.5 text-center">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_TONES[r.Status] || STATUS_TONES.Pending}`}>
                    {r.Status}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  {r.Status === 'Pending' ? (
                    <div className="inline-flex gap-1.5">
                      <button onClick={() => setStatus(r, 'Confirmed')} disabled={busyId === r.Id}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 transition-colors disabled:opacity-50">
                        {busyId === r.Id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Confirm
                      </button>
                      <button onClick={() => setStatus(r, 'Rejected')} disabled={busyId === r.Id}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-300 dark:border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs font-semibold px-3 py-1.5 transition-colors disabled:opacity-50">
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-gray-400 dark:text-[#6B7280]">
                      {r.Status === 'Confirmed' ? 'Verified' : 'Declined'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-[#9CA3AF]">
                No registrations match — all caught up!
              </td></tr>
            )}
          </tbody>
        </table>
        </div>
      </section>
    </AppLayout>
  )
}