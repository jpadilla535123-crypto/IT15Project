import { useMemo, useState } from 'react'
import {
  ShieldAlert, Clock, CheckCircle2, XCircle, AlertTriangle, Image as ImageIcon,
  ExternalLink, Loader2, Receipt, ChevronRight, Ticket,
} from 'lucide-react'
import AppLayout from './AppLayout'
import { StatValue, Kpi, PageHeader, SearchBar, Chip } from '../components/dashboard/Shared'
import { formatCurrency, formatFullDate } from '../components/dashboard/format'
import { useData } from '../api/data'
import { api, API_URL } from '../api/client'
import InvoicePaymentForm from '../components/dashboard/InvoicePaymentForm'
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
const EV_FILTERS = ['All', 'Pending', 'Partial', 'Paid']

export default function PaymentReview({ user }) {
  const { data, reload } = useData()
  const registrations = data.registrations

  /* ── registrations tab ─────────────────────────────── */
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

  /* ── event-payments tab ────────────────────────────── */
  const [tab, setTab] = useState('reg')
  const [evQuery, setEvQuery] = useState('')
  const [evFilter, setEvFilter] = useState('All')
  const [openEventId, setOpenEventId] = useState(null)

  const eventPayments = useMemo(() => {
    const invByEvent = new Map()
    ;(data.invoices || []).forEach(i => invByEvent.set(i.eventId, i))
    const payByInv = {}
    ;(data.payments || []).forEach(p => { (payByInv[p.InvoiceId] = payByInv[p.InvoiceId] || []).push(p) })
    return (data.events || [])
      .filter(e => e.Status === 'Completed' || e.Status === 'Pending')
      .map(e => {
        const inv = invByEvent.get(e.Id)
        const amount = Number(inv?.amount) || 0
        const paid = inv ? Math.min(amount, Number(inv.paidAmount) || 0) : 0
        const payStatus = inv ? (amount > 0 && paid >= amount ? 'Paid' : paid > 0 ? 'Partial' : 'Pending') : 'Pending'
        return {
          event: e,
          invId: inv?.id || null,
          invoiceNo: inv?.invoiceNumber || `INV-2026-${String(e.Id).padStart(3, '0')}`,
          amount, paid, balance: Math.max(0, amount - paid),
          status: payStatus,
          payments: inv ? (payByInv[inv.id] || []) : [],
        }
      })
      .sort((a, b) => (a.event.StartDate?.getTime?.() ?? 0) - (b.event.StartDate?.getTime?.() ?? 0))
  }, [data.events, data.invoices, data.payments])

  const evFiltered = useMemo(() => {
    const q = evQuery.trim().toLowerCase()
    return eventPayments.filter(x => {
      if (evFilter !== 'All' && x.status !== evFilter) return false
      if (!q) return true
      return `${x.event.Name} ${x.invoiceNo} ${x.event.ClientId ?? ''}`.toLowerCase().includes(q)
    })
  }, [eventPayments, evFilter, evQuery])

  const openEvent = eventPayments.find(x => x.event.Id === openEventId) || null
  const evTotals = useMemo(() => ({
    outstanding: eventPayments.reduce((s, x) => s + x.balance, 0),
    partial: eventPayments.filter(x => x.status === 'Partial').length,
    paid: eventPayments.filter(x => x.status === 'Paid').length,
    unpaid: eventPayments.filter(x => x.status === 'Pending').length,
  }), [eventPayments])

  const statusPill = s => s === 'Paid' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    : s === 'Partial' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    : 'bg-sky-500/10 text-sky-600 dark:text-sky-400'

  return (
    <AppLayout user={user} badgeCount={data.leads.length}>
      <PageHeader section="Finance" icon={ShieldAlert} title="Payment Review"
        actions={
          <div className="flex gap-1.5">
            <Chip active={tab === 'reg'} onClick={() => setTab('reg')}>
              <Ticket size={11} className="inline mr-1" /> Registrations
            </Chip>
            <Chip active={tab === 'evt'} onClick={() => setTab('evt')}>
              <Receipt size={11} className="inline mr-1" /> Event payments
            </Chip>
          </div>
        }>
        {tab === 'reg'
          ? <><span className="font-bold text-amber-500"><StatValue value={pending.length} /></span> awaiting review ·{' '}<span className="font-bold text-[#FF2B66]"><StatValue value={flagged.length} /></span> flagged</>
          : <>Track how Completed and Pending events are being paid — check partial/full payments, proofs, and record balances until fully paid.</>}
      </PageHeader>

      {tab === 'reg' ? (
        <>
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
                      <td className="px-4 py-3.5 max-w-[220px]">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{r.FullName}</p>
                        <p className="text-xs text-gray-400 dark:text-[#6B7280] truncate">{r.EventName || `Event #${r.EventId}`}</p>
                        <p className="text-[11px] text-gray-400 dark:text-[#6B7280] mt-0.5">{r.VenueName ? `${r.VenueName} · ` : ''}{r.EventStartDate ? formatFullDate(r.EventStartDate) : ''}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-mono text-xs font-bold text-[#FF2B66]">{r.TicketReference}</p>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white mt-1">{formatCurrency(r.Amount)}</p>
                        {r.ExpectedAmount > 0 && (
                          <p className={`text-[11px] ${Math.abs(r.Amount - r.ExpectedAmount) > 1 ? 'text-[#FF2B66]' : 'text-gray-400 dark:text-[#6B7280]'}`}>
                            expected {formatCurrency(r.ExpectedAmount)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-gray-500 dark:text-[#9CA3AF]">{r.PaymentMethod || '—'}</p>
                        <p className="text-[11px] font-mono text-gray-400 dark:text-[#6B7280] mt-1">{r.ReferenceNumber || '—'}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-gray-700 dark:text-gray-300">{r.PayerName || '—'}</p>
                        <p className="text-[11px] text-gray-400 dark:text-[#6B7280] mt-0.5">{r.Email || r.Phone || ''}</p>
                      </td>
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
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi icon={Receipt} label="Under Check (Completed/Pending)" tone="text-sky-500" bg="bg-sky-500/10">
              <StatValue value={eventPayments.length} />
            </Kpi>
            <Kpi icon={Clock} label="Unpaid invoices" tone="text-amber-500" bg="bg-amber-500/10" delay={80}>
              <StatValue value={evTotals.unpaid} />
            </Kpi>
            <Kpi icon={AlertTriangle} label="Partial payments" tone="text-[#FF2B66]" bg="bg-[#FF2B66]/10" delay={160}>
              <StatValue value={evTotals.partial} />
            </Kpi>
            <Kpi icon={CheckCircle2} label="Fully paid" tone="text-emerald-500" bg="bg-emerald-500/10" delay={240}>
              <StatValue value={evTotals.paid} />
            </Kpi>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-4 flex flex-col sm:flex-row gap-3 justify-between">
            <SearchBar value={evQuery} onChange={setEvQuery} placeholder="Search event or invoice #..." />
            <div className="flex gap-1.5 flex-wrap">
              {EV_FILTERS.map(f => <Chip key={f} active={evFilter === f} onClick={() => setEvFilter(f)}>{f}</Chip>)}
            </div>
          </div>

          <section className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-[#2A2A36]">
                    {['Event', 'Invoice', 'Billed', 'Paid', 'Balance', 'Payment status', ''].map(h => (
                      <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280] ${h === 'Payment status' || h === '' ? 'text-center' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#2A2A36]/60">
                  {evFiltered.map(x => (
                    <tr key={x.event.Id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-gray-900 dark:text-white max-w-[260px] truncate">{x.event.Name}</p>
                        <p className="text-[11px] text-gray-400 dark:text-[#6B7280]">{x.event.Status} · {x.event.StartDate ? formatFullDate(x.event.StartDate) : '—'}</p>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-[#FF2B66]">{x.invoiceNo}</td>
                      <td className="px-4 py-3.5 font-semibold text-gray-900 dark:text-white">{formatCurrency(x.amount)}</td>
                      <td className="px-4 py-3.5 text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(x.paid)}</td>
                      <td className="px-4 py-3.5 text-gray-500 dark:text-[#9CA3AF] tabular-nums">{formatCurrency(x.balance)}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusPill(x.status)}`}>{x.status}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button onClick={() => setOpenEventId(x.event.Id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-[#2A2A36] px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-200 hover:border-[#FF2B66]/60 hover:text-[#FF2B66] transition-colors">
                          Review <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {evFiltered.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-[#9CA3AF]">
                      No events match these filters.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {openEvent && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={() => setOpenEventId(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative mt-auto sm:mt-0 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-gray-100 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5 sm:p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h4 className="font-bold text-lg text-gray-900 dark:text-white">{openEvent.event.Name}</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {openEvent.invoiceNo} · <span className={`font-bold ${statusPill(openEvent.status).split(' ')[0]} ${statusPill(openEvent.status).split(' ')[2]}`}>{openEvent.status}</span>
                </p>
              </div>
              <button onClick={() => setOpenEventId(null)} className="h-8 w-8 rounded-lg border border-gray-200 dark:border-[#2A2A36] text-gray-500 hover:text-[#FF2B66] flex items-center justify-center">✕</button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <MiniStat label="Billed" value={formatCurrency(openEvent.amount)} />
              <MiniStat label="Paid" value={formatCurrency(openEvent.paid)} cls="text-emerald-600 dark:text-emerald-400" />
              <MiniStat label="Balance" value={formatCurrency(openEvent.balance)} cls="text-[#FF2B66]" />
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-[#2A2A36] overflow-hidden">
                <div className="h-full rounded-full bg-[#FF2B66]"
                  style={{ width: `${openEvent.amount > 0 ? Math.min(100, (openEvent.paid / openEvent.amount) * 100) : 0}%` }} />
              </div>
              <span className="text-[10px] font-bold text-gray-500 dark:text-[#9CA3AF]">
                {openEvent.amount > 0 ? Math.round((openEvent.paid / openEvent.amount) * 100) : 0}% paid
              </span>
            </div>

            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#6B7280] mb-1.5">Payment history & proofs</p>
              <ul className="space-y-1.5">
                {openEvent.payments.length === 0 ? (
                  <li className="text-xs text-gray-400 dark:text-[#6B7280] p-2 bg-gray-50 dark:bg-white/[0.02] rounded-lg">No payments recorded for this invoice yet.</li>
                ) : openEvent.payments.map(p => (
                  <li key={p.Id} className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-[#2A2A36] p-2.5">
                    {p.EvidencePath ? (
                      <button onClick={() => window.open(`${API_URL}${p.EvidencePath}`, '_blank')} className="block shrink-0 overflow-hidden rounded-lg">
                        <img src={`${API_URL}${p.EvidencePath}`} alt="proof" className="h-11 w-11 object-cover hover:scale-105 transition-transform" />
                      </button>
                    ) : <div className="h-11 w-11 rounded-lg bg-gray-100 dark:bg-[#2A2A36] flex items-center justify-center"><ImageIcon size={14} className="text-gray-400" /></div>}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{p.Method} · {formatCurrency(p.Amount)}</p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {p.PaymentDate ? formatFullDate(p.PaymentDate) : '—'}{p.Reference ? ` · ${p.Reference}` : ''}{p.Notes ? ` · ${p.Notes}` : ''}
                      </p>
                    </div>
                    <ExternalLink size={13} className="shrink-0 text-gray-300 dark:text-[#6B7280]" />
                  </li>
                ))}
              </ul>
            </div>

            <InvoicePaymentForm
              eventId={openEvent.event.Id}
              clientId={openEvent.event.ClientId}
              onDone={reload} />
            <p className="mt-3 text-[10px] text-gray-400 text-center">Record a partial payment now, and keep recording until the invoice is fully paid.</p>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

function MiniStat({ label, value, cls = 'text-gray-900 dark:text-white' }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-[#2A2A36] p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">{label}</p>
      <p className={`mt-0.5 text-sm font-bold ${cls}`}>{value}</p>
    </div>
  )
}