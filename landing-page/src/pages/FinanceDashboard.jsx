import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet, TrendingUp, TrendingDown, Banknote, AlertTriangle,
  FileText, CalendarRange, Ticket, ShieldAlert, Landmark,
  Receipt, ChevronRight, FileDown,
} from 'lucide-react'
import { useData } from '../api/data'
import AppLayout from './AppLayout'
import { PageHeader, Kpi, StatValue, Chip } from '../components/dashboard/Shared'
import InvoicePaymentForm from '../components/dashboard/InvoicePaymentForm'
import { formatCurrency, toDate } from '../components/dashboard/format'

function monthKeyOf(date) {
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
const monthLabel = (y, m) => `${(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'])[m]}, ${y}`

export default function FinanceDashboard({ user }) {
  const { data, reload } = useData()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())
  const [open, setOpen] = useState(null)

  const key = monthKeyOf(new Date(year, month, 1))

  const monthIncome = useMemo(() =>
    (data.payments || []).filter(p => monthKeyOf(p.PaymentDate) === key)
      .reduce((s, p) => s + (p.Amount || 0), 0), [data.payments, key])

  const monthExpense = useMemo(() =>
    (data.supplierPayments || []).filter(sp => monthKeyOf(sp.PaymentDate) === key)
      .reduce((s, sp) => s + (sp.Amount || 0), 0), [data.supplierPayments, key])

  const salaryExpense = useMemo(() =>
    (data.employees || []).filter(e => e.Status === 'Active')
      .reduce((s, e) => s + (Number(e.Salary) || 0), 0), [data.employees])

  const invoices = useMemo(() => {
    const invByEvent = new Map()
    ;(data.invoices || []).forEach(i => invByEvent.set(i.eventId, i))
    const payByInv = {}
    ;(data.payments || []).forEach(p => { (payByInv[p.InvoiceId] = payByInv[p.InvoiceId] || []).push(p) })
    return (data.events || []).map(e => {
      const inv = invByEvent.get(e.Id)
      const amount = Number(inv?.amount) || 0
      const paid = inv ? Math.min(amount, Number(inv.paidAmount) || 0) : 0
      const status = inv ? (amount > 0 && paid >= amount ? 'Paid' : paid > 0 ? 'Partial' : 'Pending') : (e.Status === 'Completed' ? 'Paid' : 'Pending')
      return {
        event: e,
        invId: inv?.id || null,
        invoiceNo: inv?.invoiceNumber || `INV-2026-${String(e.Id).padStart(3, '0')}`,
        amount, paid, balance: Math.max(0, amount - paid), status,
        payments: inv ? (payByInv[inv.id] || []) : [],
      }
    })
  }, [data.events, data.invoices, data.payments])

  const partials = invoices.filter(i => i.status === 'Partial').sort((a, b) => b.balance - a.balance)
  const outstanding = invoices.reduce((s, i) => s + i.balance, 0)
  const recentPays = useMemo(() =>
    (data.payments || []).slice().sort((a, b) => (b.PaymentDate?.getTime?.() ?? 0) - (a.PaymentDate?.getTime?.() ?? 0)).slice(0, 7),
    [data.payments])

  const payByInvoice = useMemo(() => {
    const m = {}
    ;(data.payments || []).forEach(p => { (m[p.InvoiceId] = m[p.InvoiceId] || []).push(p) })
    return m
  }, [data.payments])

  return (
    <AppLayout user={user} badgeCount={outstanding > 0 ? Math.ceil(outstanding / 1000) : null}>
      <PageHeader section="Finance" icon={Wallet} title="Finance Dashboard"
        actions={
          <Chip active><Landmark size={12} /> {monthLabel(year, month)}</Chip>
        }>
        <p className="text-sm text-gray-500 dark:text-[#9CA3AF]">
          Budget gained and used for the selected month, waiting balances that need collection, and the latest recorded payments.
        </p>
      </PageHeader>

      <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
        <Kpi icon={TrendingUp} label="Gained this month" tone="text-emerald-500" bg="bg-emerald-500/10"><StatValue value={monthIncome} prefix="₱" /></Kpi>
        <Kpi icon={TrendingDown} label="Used this month" tone="text-red-500" bg="bg-red-500/10"><StatValue value={monthExpense + salaryExpense} prefix="₱" /></Kpi>
        <Kpi icon={Wallet} label="Net this month" tone={(monthIncome - monthExpense - salaryExpense) >= 0 ? 'text-emerald-500' : 'text-red-500'} bg={(monthIncome - monthExpense - salaryExpense) >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}><StatValue value={monthIncome - monthExpense - salaryExpense} prefix="₱" /></Kpi>
        <Kpi icon={AlertTriangle} label="Still owed" tone="text-amber-500" bg="bg-amber-500/10"><StatValue value={outstanding} prefix="₱" /></Kpi>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <StatusChip active={key === monthKeyOf(new Date())}>This month</StatusChip>
        {[-1, -2].map(off => {
          const d = new Date(year, month + off, 1)
          return (
            <StatusChip key={off} active={key === monthKeyOf(d)}>
              {(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'])[d.getMonth()]} {d.getFullYear()}
            </StatusChip>
          )
        })}
        <span className="mx-1 text-gray-300 dark:text-[#2A2A36]">|</span>
        <Link to="/reports" className="text-[11px] font-bold text-[#FF2B66] hover:underline">View monthly reports →</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-[#9CA3AF]">
              <AlertTriangle size={13} className="text-amber-500" /> Waiting balances · partially paid billing
            </h3>
          </div>
          <div className="space-y-3">
            {partials.length === 0 ? (
              <EmptyCard icon={CheckCircle} title="Nothing waiting" note="All recorded billing is fully paid for now." />
            ) : partials.map(i => (
              <div key={i.event.Id} className="rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-[#FFF8F8] dark:bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{i.event.Name}</p>
                    <p className="text-[11px] text-gray-400 dark:text-[#6B7280]">{i.invoiceNo} · {i.event.StartDate ? toDate(i.event.StartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 text-[10px] font-bold">PARTIAL</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="text-gray-400 dark:text-[#6B7280]">Billed</p>
                    <p className="font-bold text-gray-700 dark:text-gray-200">{formatCurrency(i.amount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 dark:text-[#6B7280]">Paid</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(i.paid)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-[#2A2A36] overflow-hidden">
                    <div className="h-full rounded-full bg-[#FF2B66]"
                      style={{ width: `${i.amount > 0 ? Math.min(100, (i.paid / i.amount) * 100) : 0}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-[#9CA3AF]">{formatCurrency(i.balance)} left</span>
                </div>
                <button onClick={() => setOpen(i)} disabled={!i.invId}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FF2B66] hover:bg-[#E0245A] text-white text-xs font-bold py-2 px-3 transition-all active:scale-95 disabled:opacity-50">
                  <Banknote size={13} /> Collect balance
                </button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-[#9CA3AF] mb-3">
            <Receipt size={13} className="text-[#FF2B66]" /> Latest payments recorded
          </h3>
          <div className="rounded-xl border border-gray-200 dark:border-[#2A2A36] dark:bg-white/[0.02]">
            {recentPays.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-[#6B7280] p-6 text-center">No payments recorded yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-[#2A2A36]">
                {recentPays.map(p => {
                  const inv = (data.invoices || []).find(i => i.id === p.InvoiceId)
                  const ev = inv ? (data.events || []).find(e => e.Id === inv.eventId) : null
                  return (
                    <li key={p.Id} className="flex items-center gap-3 p-3.5">
                      {p.EvidencePath ? (
                        <button onClick={() => window.open(p.EvidencePath, '_blank')} className="block shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-[#2A2A36]">
                          <img src={p.EvidencePath} alt="proof" className="h-12 w-12 object-cover hover:scale-105 transition-transform" />
                        </button>
                      ) : <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-[#2A2A36] flex items-center justify-center"><FileDown size={16} className="text-gray-400" /></div>}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{p.Method} · {formatCurrency(p.Amount)}</p>
                        <p className="text-[11px] text-gray-400 dark:text-[#6B7280] truncate">{ev?.Name || 'Event'} · {p.PaymentDate ? toDate(p.PaymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</p>
                      </div>
                      <span className="shrink-0 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">RECEIVED</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      </div>

      <section>
        <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-[#9CA3AF] mb-3">
          <Landmark size={13} className="text-[#FF2B66]" /> Quick access
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickLink to="/budget" icon={CalendarRange} title="Budget Management" note="Per-month budget, event logistics and profits" />
          <QuickLink to="/billing" icon={Ticket} title="Billing" note="Invoices, payments and proof attachments" />
          <QuickLink to="/payment-review" icon={ShieldAlert} title="Payment Review" note="Registrations and event payment status" />
          <QuickLink to="/reports" icon={FileText} title="Reports" note="Publish and check monthly reports" />
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
          onClick={() => setOpen(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative mt-auto sm:mt-0 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-gray-100 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5 sm:p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-lg text-gray-900 dark:text-white">{open.event.Name}</h4>
                <p className="text-[11px] text-gray-400">
                  {open.invoiceNo} · <span className="text-[#FF2B66]">{formatCurrency(open.balance)}</span> still owed
                </p>
              </div>
              <button onClick={() => setOpen(null)} className="h-8 w-8 rounded-lg border border-gray-200 dark:border-[#2A2A36] text-gray-500 hover:text-[#FF2B66]">✕</button>
            </div>
            <div className="space-y-4">
              <InvoiceFragment inv={open} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#6B7280] mb-1.5">Payment history</p>
                <ul className="space-y-1.5">
                  {(payByInvoice[open.invId] || []).map(p => (
                    <li key={p.Id} className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-[#2A2A36] p-2.5">
                      {p.EvidencePath ? <img src={p.EvidencePath} alt="proof" className="h-10 w-10 rounded object-cover" /> : <div className="h-10 w-10 rounded bg-gray-100 dark:bg-[#2A2A36]" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{p.Method} · {formatCurrency(p.Amount)}</p>
                        <p className="text-[10px] text-gray-400 truncate">{p.PaymentDate ? toDate(p.PaymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}{p.Reference ? ` · ${p.Reference}` : ''}</p>
                      </div>
                    </li>
                  ))}
                  {(payByInvoice[open.invId] || []).length === 0 && (
                    <li className="text-xs text-gray-400 dark:text-[#6B7280] p-2">No payments recorded for this invoice yet.</li>
                  )}
                </ul>
              </div>
              <InvoicePaymentForm eventId={open.event.Id} clientId={open.event.ClientId} onDone={reload} />
            </div>
            <p className="mt-3 text-[10px] text-gray-400 text-center">Recording a payment updates the invoice and this dashboard automatically.</p>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

function StatusChip({ children, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`rounded-full px-3 py-1 text-[11px] font-bold transition-colors ${active ? 'bg-[#FF2B66] text-white' : 'bg-gray-100 dark:bg-[#2A2A36] text-gray-500 dark:text-[#9CA3AF] hover:text-[#FF2B66]'}`}>
      {children}
    </button>
  )
}

function CheckCircle({ size, className }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function EmptyCard({ icon: Icon, title, note }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-[#2A2A36] p-6 text-center">
      <Icon size={18} className="mx-auto mb-2 text-emerald-500" />
      <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{title}</p>
      <p className="text-xs text-gray-400 mt-0.5">{note}</p>
    </div>
  )
}

function QuickLink({ to, icon: Icon, title, note }) {
  return (
    <Link to={to}
      className="rounded-xl border border-gray-200 dark:border-[#2A2A36] p-4 space-y-2 hover:border-[#FF2B66]/50 hover:shadow-sm transition-all group">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF2B66]/10 text-[#FF2B66]">
        <Icon size={16} />
      </span>
      <div className="flex items-center gap-1">
        <p className="text-[13px] font-bold text-gray-900 dark:text-white group-hover:text-[#FF2B66] transition-colors">{title}</p>
        <ChevronRight size={13} className="text-gray-400" />
      </div>
      <p className="text-[11px] leading-snug text-gray-400 dark:text-[#6B7280]">{note}</p>
    </Link>
  )
}

function InvoiceFragment({ inv }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <MiniStat label="Billed" value={formatCurrency(inv.amount)} />
      <MiniStat label="Paid" value={formatCurrency(inv.paid)} cls="text-emerald-600 dark:text-emerald-400" />
      <MiniStat label="Balance" value={formatCurrency(inv.balance)} cls="text-[#FF2B66]" />
    </div>
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