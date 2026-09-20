import { useMemo, useState } from 'react'
import {
  Receipt, Wallet, TrendingDown, Clock, FileText, X, Ban, Printer,
  Smartphone, CreditCard,
} from 'lucide-react'
import AppLayout from './AppLayout'
import { StatValue, Kpi, PageHeader, SearchBar, Chip } from '../components/dashboard/Shared'
import { formatCurrency, formatFullDate } from '../components/dashboard/format'
import { useData } from '../api/data'
import { API_URL } from '../api/client'
import InvoicePaymentForm from '../components/dashboard/InvoicePaymentForm'
import './landingFx.css'

const STATUS_PILL = {
  Paid: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
  Partial: 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300',
  Unpaid: 'bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-300',
  Void: 'bg-gray-100 dark:bg-white/5 text-gray-400',
}
const FILTERS = ['All', 'Unpaid', 'Partial', 'Paid', 'Void']

export default function Billing({ user }) {
  const { data, reload } = useData()
  const { events, venues, clients, payments: allPayments } = data
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [openId, setOpenId] = useState(null)

  const venueById = useMemo(() => new Map(venues.map(v => [v.Id, v])), [venues])
  const clientById = useMemo(() => new Map(clients.map(c => [c.Id, c])), [clients])

  /* real invoices from the backend win; otherwise fall back to a derived one */
  const invoices = useMemo(() => events.map(e => {
    const client = clientById.get(e.ClientId)
    const venue = venueById.get(e.VenueId)
    const fee = venue?.PricePerDay || 0
    const real = (data.invoices || []).find(i => i.eventId === e.Id)
    if (real) {
      const totalFee = Number(real.amount) || fee || 0
      const paid = Math.min(totalFee, Number(real.paidAmount) || 0)
      const status = paid > 0 && totalFee > 0 && paid >= totalFee
        ? 'Paid'
        : paid > 0 ? 'Partial'
        : real.status === 'Cancelled' || real.status === 'Void' ? 'Void'
        : 'Unpaid'
      return {
        id: real.invoiceNumber || `INV-2026-${String(e.Id).padStart(3, '0')}`,
        realId: real.id,
        real: true,
        event: e, client, venue,
        fee: totalFee, paid, balance: Math.max(0, totalFee - paid), status,
        date: e.StartDate,
      }
    }
    let status
    let paid = 0
    if (e.Status === 'Completed') { paid = fee; status = 'Paid' }
    else if (e.Status === 'Booked') { paid = Math.round(fee * 0.3); status = 'Partial' }
    else if (e.Status === 'Cancelled') { paid = 0; status = 'Void' }
    else { paid = 0; status = 'Unpaid' }
    return {
      id: `INV-2026-${String(e.Id).padStart(3, '0')}`,
      realId: null,
      real: false,
      event: e, client, venue,
      fee, paid: Math.min(fee, paid), balance: Math.max(0, fee - paid), status,
      date: e.StartDate,
    }
  }), [events, data.invoices, clientById, venueById])

  const paymentsByInvoice = useMemo(() => {
    const m = {}
    ;(allPayments || []).forEach(p => {
      (m[p.InvoiceId] = m[p.InvoiceId] || []).push(p)
    })
    return m
  }, [allPayments])

  const filtered = invoices.filter(inv =>
    (filter === 'All' || inv.status === filter) &&
    `${inv.id} ${inv.event.Name} ${inv.client?.CompanyName || ''}`.toLowerCase().includes(query.toLowerCase())
  )

  const totalBilled = invoices.filter(i => i.status !== 'Void').reduce((s, i) => s + i.fee, 0)
  const collected = invoices.reduce((s, i) => s + i.paid, 0)
  const outstanding = totalBilled - collected

  const open = invoices.find(i => i.event.Id === openId)
  const invoicePayments = open?.realId ? (paymentsByInvoice[open.realId] || []) : []

  return (
    <AppLayout user={user} badgeCount={data.leads.length}>
      <PageHeader section="Finance" icon={Receipt} title="Billing"
        actions={
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map(f => <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{f}</Chip>)}
          </div>
        }>
        <span className="font-bold text-gray-900 dark:text-white"><StatValue value={invoices.length} /></span> invoices ·{' '}
        <span className="font-bold text-emerald-500">₱<StatValue value={collected} /></span> collected ·{' '}
        <span className="font-bold text-[#FF2B66]">₱<StatValue value={outstanding} /></span> outstanding
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={Receipt} label="Total Billed">₱<StatValue value={totalBilled} /></Kpi>
        <Kpi icon={Wallet} label="Collected" tone="text-emerald-500" bg="bg-emerald-500/10" delay={80}>₱<StatValue value={collected} /></Kpi>
        <Kpi icon={TrendingDown} label="Outstanding" tone="text-[#FF2B66]" bg="bg-[#FF2B66]/10" delay={160}>₱<StatValue value={outstanding} /></Kpi>
        <Kpi icon={Clock} label="Awaiting Payment" tone="text-amber-500" bg="bg-amber-500/10" delay={240}>
          <StatValue value={invoices.filter(i => i.status === 'Unpaid' || i.status === 'Partial').length} /> invoices
        </Kpi>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-4">
        <SearchBar value={query} onChange={setQuery} placeholder="Search by invoice #, event, or client..." />
      </div>

      <section className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-[#2A2A36]">
              {['Invoice', 'Client / Event', 'Date', 'Venue', 'Amount', 'Paid', 'Balance', 'Status'].map(h => (
                <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280] ${['Amount', 'Paid', 'Balance'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#2A2A36]/60">
            {filtered.map(inv => (
              <tr key={inv.id} onClick={() => setOpenId(inv.event.Id)}
                className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                <td className="px-4 py-3.5 font-mono text-xs font-bold text-[#FF2B66]">{inv.id}</td>
                <td className="px-4 py-3.5 max-w-[220px]">
                  <p className="truncate font-semibold text-gray-900 dark:text-white">{inv.client?.CompanyName || inv.event.Name || '—'}</p>
                  <p className="truncate text-xs text-gray-400 dark:text-[#6B7280]">{inv.event.Name}</p>
                </td>
                <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-[#9CA3AF] whitespace-nowrap">{formatFullDate(inv.date)}</td>
                <td className="px-4 py-3.5 text-gray-500 dark:text-[#9CA3AF] max-w-[150px] truncate">{inv.venue?.Name || '—'}</td>
                <td className="px-4 py-3.5 text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap">{formatCurrency(inv.fee)}</td>
                <td className="px-4 py-3.5 text-right text-emerald-500 font-medium whitespace-nowrap">{formatCurrency(inv.paid)}</td>
                <td className="px-4 py-3.5 text-right font-bold text-[#FF2B66] whitespace-nowrap">{formatCurrency(inv.balance)}</td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_PILL[inv.status]}`}>{inv.status}</span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-[#9CA3AF]">No invoices match.</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </section>

      {/* ─── INVOICE MODAL ─── */}
      {open && (
        <div className="fx-modal-backdrop fx-open" onClick={() => setOpenId(null)}>
          <div className="fx-modal-panel !max-w-lg w-full max-h-[92vh] overflow-y-auto bg-white dark:bg-[#121217] border border-gray-200 dark:border-[#2A2A36] rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="relative bg-gradient-to-r from-[#FF2B66] to-[#FF5C8A] px-6 pt-5 pb-6">
              <button onClick={() => setOpenId(null)} aria-label="Close"
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all hover:rotate-90 duration-300">
                <X size={15} />
              </button>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white font-mono">{open.id}</h3>
                  <p className="text-white/80 text-xs">{formatFullDate(open.date)} · {open.venue?.Name || '—'}</p>
                </div>
                <span className={`ml-auto rounded-full px-3 py-1 text-xs font-bold ${open.status === 'Paid' ? 'bg-white text-emerald-600' : 'bg-white/25 text-white'}`}>
                  {open.status}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#6B7280] mb-1">Billed to</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{open.client?.CompanyName || '—'}</p>
                  <p className="text-xs text-gray-500 dark:text-[#9CA3AF]">{open.client?.ContactPerson}</p>
                  <p className="text-xs text-gray-500 dark:text-[#9CA3AF] break-all">{open.client?.Phone || '—'}</p>
                  <p className="text-xs text-gray-500 dark:text-[#9CA3AF] break-all">{open.client?.Email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#6B7280] mb-1">Event</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{open.event.Name || '—'}</p>
                  <p className="text-xs text-gray-500 dark:text-[#9CA3AF]">{open.event.EventType} · {open.event.Guests?.toLocaleString()} guests</p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-[#2A2A36] divide-y divide-gray-100 dark:divide-[#2A2A36]/60">
                <div className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-gray-500 dark:text-[#9CA3AF]">Venue fee — {open.venue?.Name}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(open.fee)}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-gray-500 dark:text-[#9CA3AF]">Paid to date</span>
                  <span className="font-medium text-emerald-500">{formatCurrency(open.paid)}</span>
                </div>
                <div className="flex justify-between px-4 py-3">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Balance due</span>
                  <span className="text-sm font-extrabold text-[#FF2B66]">{formatCurrency(open.balance)}</span>
                </div>
              </div>

              {/* payment progress */}
              <div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#6B7280] mb-1">
                  <span>Payment progress</span>
                  <span>{open.fee ? Math.round((open.paid / open.fee) * 100) : 0}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${open.fee ? (open.paid / open.fee) * 100 : 0}%` }} />
                </div>
              </div>

              {open.status !== 'Paid' && open.status !== 'Void' && (
                <>
                  {/* Make a payment */}
                  <div className="rounded-xl border border-gray-200 dark:border-[#2A2A36] p-4 space-y-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                      <Wallet size={15} className="text-[#FF2B66]" /> Make a payment
                    </p>
                    <InvoicePaymentForm
                      eventId={open.event.Id}
                      clientId={open.client?.Id}
                      onDone={reload} />
                  </div>

                  <button className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-[#2A2A36] px-3 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:border-[#FF2B66]/50 hover:text-[#FF2B66] transition-colors">
                    <Printer size={13} /> Print
                  </button>
                </>
              )}
              {open.status === 'Void' && (
                <p className="flex items-center gap-2 text-xs text-gray-400 dark:text-[#6B7280] bg-gray-50 dark:bg-white/5 rounded-xl p-3">
                  <Ban size={14} /> This booking was cancelled — the invoice is voided.
                </p>
              )}

              {/* payment history / evidence */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#6B7280] mb-2">
                  Payment history & evidence
                </p>
                {invoicePayments.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-[#6B7280] bg-gray-50 dark:bg-white/5 rounded-xl p-3">
                    No recorded payments yet for this invoice.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {invoicePayments.map(p => (
                      <div key={p.Id} className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-[#2A2A36] p-2">
                        <img src={p.EvidencePath ? `${API_URL}${p.EvidencePath}` : ''}
                          alt="Payment evidence"
                          className="h-12 w-12 rounded object-cover shrink-0 bg-gray-100 dark:bg-[#181820]" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">
                            {p.Method} · {formatCurrency(p.Amount)}
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-[#6B7280] truncate">
                            {p.PaymentDate ? formatFullDate(p.PaymentDate) : ''}{p.Reference ? ` · ${p.Reference}` : ''}
                          </p>
                        </div>
                        <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                          <Smartphone size={11} className={p.Method === 'GCash' ? '' : 'hidden'} />
                          <CreditCard size={11} className={p.Method === 'Card' ? '' : 'hidden'} />
                          Recorded
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}