import { useMemo, useState } from 'react'
import {
  Wallet, TrendingUp, TrendingDown, Activity, ArrowUpCircle, ArrowDownCircle,
  Plus, X, Loader2, ImagePlus, Trash2, Building2, CalendarDays, PackageCheck, Calculator, PieChart, History,
} from 'lucide-react'
import AppLayout from './AppLayout'
import { StatValue, Kpi, PageHeader } from '../components/dashboard/Shared'
import { formatCurrency } from '../components/dashboard/format'
import { useData } from '../api/data'
import { api, API_URL } from '../api/client'
import './landingFx.css'

const CATS = [
  { key: 'venue', label: 'Venue & Rentals', icon: Building2 },
  { key: 'catering', label: 'Catering', icon: PackageCheck },
  { key: 'av', label: 'AV & Production', icon: Calculator },
  { key: 'decor', label: 'Decor & Florals', icon: PackageCheck },
  { key: 'contingency', label: 'Contingency', icon: Wallet },
]

const PO_TO_CAT = {
  'Catering': 'catering',
  'Audio/Visual': 'av',
  'Lighting': 'av',
  'Florals & Decor': 'decor',
  'Photography': 'av',
  'Furniture': 'venue',
}

const DEFAULT_ALLOC = { venue: 400000, catering: 250000, av: 220000, decor: 120000, contingency: 90000 }

const PAY_METHODS = ['Bank Transfer', 'GCash', 'Cash', 'Check']

const CAT_COLORS = ['#FF2B66', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6']

function monthKey(d) {
  const date = d instanceof Date && !isNaN(d) ? d : new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export default function BudgetManagement({ user }) {
  const { data, reload } = useData()
  const { events, venues, suppliers, purchaseOrders, payments, supplierPayments } = data
  const [alloc, setAlloc] = useState(DEFAULT_ALLOC)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [delId, setDelId] = useState(null)
  const [form, setForm] = useState({ supplierId: '', eventId: '', description: '', amount: '', method: 'Bank Transfer', reference: '', date: '' })
  const [file, setFile] = useState({ value: null, preview: null })

  const supById = useMemo(() => new Map(suppliers.map(s => [s.Id, s])), [suppliers])
  const venueById = useMemo(() => new Map(venues.map(v => [v.Id, v])), [venues])

  const thisMonth = monthKey(new Date())
  const incomeTotal = payments.reduce((s, p) => s + p.Amount, 0)
  const expenseTotal = supplierPayments.reduce((s, x) => s + x.Amount, 0)
  const monthlyIncome = payments.filter(p => p.PaymentDate && monthKey(p.PaymentDate) === thisMonth).reduce((s, p) => s + p.Amount, 0)
  const monthlyExpenses = supplierPayments.filter(x => x.PaymentDate && monthKey(x.PaymentDate) === thisMonth).reduce((s, x) => s + x.Amount, 0)
  const cashFlow = monthlyIncome - monthlyExpenses

  /* combined recent transactions (client income + supplier expenses) */
  const transactions = useMemo(() => {
    const inc = payments.map(p => ({
      key: `in-${p.Id}`, kind: 'income', label: 'Client payment', sub: p.Reference || 'Reference not recorded',
      amount: p.Amount, method: p.Method, reference: p.Reference, date: p.PaymentDate, evidence: p.EvidencePath,
    }))
    const exp = supplierPayments.map(x => ({
      key: `out-${x.Id}`, kind: 'expense', label: x.Description || 'Supplier payment', sub: x.SupplierName || `Supplier #${x.SupplierId}`,
      amount: x.Amount, method: x.PaymentMethod, reference: x.ReferenceNumber, date: x.PaymentDate,
      evidence: x.EvidencePath, spId: x.Id,
    }))
    return [...inc, ...exp]
      .filter(t => t.date)
      .sort((a, b) => b.date - a.date)
      .slice(0, 8)
  }, [payments, supplierPayments])

  /* spending by supplier category, from evidence-backed payments */
  const byCategory = useMemo(() => {
    const m = new Map()
    supplierPayments.forEach(x => {
      const cat = supById.get(x.SupplierId)?.Category || 'Others'
      m.set(cat, (m.get(cat) || 0) + x.Amount)
    })
    return [...m.entries()].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount)
  }, [supplierPayments, supById])
  const maxCat = Math.max(1, ...byCategory.map(c => c.amount))

  /* actual committed spend (venue fees + POs), for the allocation overview */
  const spent = useMemo(() => {
    const out = { venue: 0, catering: 0, av: 0, decor: 0, contingency: 0 }
    events.filter(e => e.Status !== 'Cancelled').forEach(e => {
      out.venue += venueById.get(e.VenueId)?.PricePerDay || 0
    })
    purchaseOrders.forEach(po => {
      const cat = PO_TO_CAT[supById.get(po.SupplierId)?.Category]
      if (cat) out[cat] += po.Amount
    })
    return out
  }, [events, venueById, purchaseOrders, supById])

  const totalAlloc = Object.values(alloc).reduce((a, b) => a + b, 0)
  const totalSpent = Object.values(spent).reduce((a, b) => a + b, 0)
  const remaining = totalAlloc - totalSpent
  const overBudget = CATS.filter(c => spent[c.key] > alloc[c.key])

  const eventCosts = useMemo(() => events
    .filter(e => e.Status !== 'Cancelled')
    .map(e => {
      const pos = purchaseOrders.filter(po => po.EventId === e.Id)
      const venueFee = venueById.get(e.VenueId)?.PricePerDay || 0
      return { e, venueFee, poTotal: pos.reduce((s, p) => s + p.Amount, 0), pos }
    })
    .sort((a, b) => (b.venueFee + b.poTotal) - (a.venueFee + a.poTotal)), [events, purchaseOrders, venueById])
  const maxCost = Math.max(1, ...eventCosts.map(c => c.venueFee + c.poTotal))

  function setCat(key, val) {
    setAlloc(a => ({ ...a, [key]: Math.round(val / 5000) * 5000 }))
  }

  function pickFile(f) {
    if (!f) return
    setFile({ value: f, preview: URL.createObjectURL(f) })
  }

  async function submitExpense() {
    if (!form.supplierId) { alert('Select a supplier first.'); return }
    if (!(Number(form.amount) > 0)) { alert('Enter a valid amount.'); return }
    if (!file.value) { alert('Attach the payment proof screenshot — expenses are recorded only with evidence.'); return }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('supplierId', form.supplierId)
      if (form.eventId) fd.append('eventId', form.eventId)
      fd.append('description', form.description.trim() || 'Supplier payment')
      fd.append('amount', String(Number(form.amount)))
      fd.append('paymentMethod', form.method)
      fd.append('referenceNumber', form.reference || '')
      fd.append('paymentDate', form.date || new Date().toISOString().slice(0, 10))
      fd.append('evidence', file.value)
      await api.post('/api/supplierpayments/with-evidence', fd)
      setForm({ supplierId: '', eventId: '', description: '', amount: '', method: 'Bank Transfer', reference: '', date: '' })
      setFile({ value: null, preview: null })
      setShowForm(false)
      await reload()
    } catch (err) {
      alert(err.message || 'Could not record the expense.')
    } finally {
      setSaving(false)
    }
  }

  async function removeExpense(id) {
    if (!confirm('Delete this supplier payment and its evidence?')) return
    setDelId(id)
    try {
      await api.delete(`/api/supplierpayments/${id}`)
      await reload()
    } catch (err) {
      alert(err.message || 'Could not delete the expense.')
    } finally {
      setDelId(null)
    }
  }

  return (
    <AppLayout user={user} badgeCount={data.leads.length}>
      <PageHeader section="Finance" icon={Wallet} title="Budget Management">
        ₱<span className="font-bold text-gray-900 dark:text-white"><StatValue value={incomeTotal} /></span> earnings ·{' '}
        <span className="font-bold text-[#FF2B66]">₱<StatValue value={expenseTotal} /></span> expenses ·{' '}
        <span className={`font-bold ${cashFlow >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>₱<StatValue value={Math.abs(cashFlow)} /></span>{' '}
        {cashFlow >= 0 ? 'net cash this month' : 'cash deficit this month'}
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={TrendingUp} label="Total Earnings"><StatValue value={incomeTotal} /></Kpi>
        <Kpi icon={ArrowUpCircle} label="Monthly Income" tone="text-emerald-500" bg="bg-emerald-500/10" delay={80}>
          <StatValue value={monthlyIncome} />
        </Kpi>
        <Kpi icon={ArrowDownCircle} label="Monthly Expenses" tone="text-[#FF2B66]" bg="bg-[#FF2B66]/10" delay={160}>
          <StatValue value={monthlyExpenses} />
        </Kpi>
        <Kpi icon={Activity} label="Cash Flow"
          tone={cashFlow >= 0 ? 'text-emerald-500' : 'text-red-500'} bg={cashFlow >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'} delay={240}>
          ₱<StatValue value={Math.abs(cashFlow)} /> {cashFlow >= 0 ? 'in' : 'out'}
        </Kpi>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* recent transactions */}
        <section className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg bg-[#FF2B66]/10 text-[#FF2B66] flex items-center justify-center"><History size={15} /></span>
              Recent Transactions
            </h3>
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 bg-[#FF2B66] hover:bg-[#E0245A] text-white text-xs font-semibold rounded-lg px-3 py-2 transition-colors">
              <Plus size={14} /> Record expense
            </button>
          </div>
          {transactions.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-[#6B7280] text-center py-10 border border-dashed border-gray-200 dark:border-[#2A2A36] rounded-xl">
              No transactions yet — record a supplier payment with a proof screenshot to start tracking expenses.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-[#2A2A36]/60">
              {transactions.map(t => (
                <li key={t.key} className="flex items-center gap-3 py-2.5">
                  <span className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center ${t.kind === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[#FF2B66]/10 text-[#FF2B66]'}`}>
                    {t.kind === 'income' ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{t.label}</p>
                    <p className="text-[11px] text-gray-400 dark:text-[#6B7280] truncate">
                      {t.sub} · {t.method}{t.reference ? ` · ${t.reference}` : ''}
                    </p>
                  </div>
                  {t.evidence && (
                    <a href={`${API_URL}${t.evidence}`} target="_blank" rel="noopener noreferrer" title="View proof"
                      className="h-8 w-8 shrink-0 rounded-lg border border-gray-200 dark:border-[#2A2A36] overflow-hidden hover:border-[#FF2B66]/50 transition-colors">
                      <img src={`${API_URL}${t.evidence}`} alt="proof" className="h-full w-full object-cover" onError={e => { e.target.style.display = 'none' }} />
                    </a>
                  )}
                  <div className="shrink-0 text-right">
                    <p className={`text-xs font-extrabold whitespace-nowrap ${t.kind === 'income' ? 'text-emerald-500' : 'text-[#FF2B66]'}`}>
                      {t.kind === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </p>
                    {t.spId && (
                      <button onClick={() => removeExpense(t.spId)} disabled={delId === t.spId} title="Delete expense" aria-label="Delete"
                        className="mt-0.5 text-gray-300 dark:text-[#4B5563] hover:text-red-500 transition-colors disabled:opacity-40">
                        {delId === t.spId ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* spending by category */}
        <section className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <span className="h-8 w-8 rounded-lg bg-[#FF2B66]/10 text-[#FF2B66] flex items-center justify-center"><PieChart size={15} /></span>
            Spending by Category
          </h3>
          {byCategory.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-[#6B7280] text-center py-10 border border-dashed border-gray-200 dark:border-[#2A2A36] rounded-xl">
              No expenses recorded yet — evidence-backed supplier payments appear here by supplier category.
            </p>
          ) : (
            <div className="space-y-4">
              {byCategory.map((c, i) => (
                <div key={c.name} className="group">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{c.name}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(c.amount)}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700 group-hover:brightness-110"
                      style={{ width: `${(c.amount / maxCat) * 100}%`, backgroundColor: CAT_COLORS[i % CAT_COLORS.length], transitionDelay: `${i * 80}ms` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* budget overview */}
      <section className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
          <span className="h-8 w-8 rounded-lg bg-[#FF2B66]/10 text-[#FF2B66] flex items-center justify-center"><Wallet size={15} /></span>
          Budget Overview
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {CATS.map((c, i) => {
            const a = alloc[c.key]
            const s = spent[c.key]
            const pct = Math.min(100, Math.round((s / Math.max(a, 1)) * 100))
            const over = s > a
            return (
              <div key={c.key} className={`rounded-2xl border bg-white dark:bg-[#121217] p-5 transition-all hover:shadow-lg ${over ? 'border-red-500/40' : 'border-gray-200 dark:border-[#2A2A36] hover:border-[#FF2B66]/40'}`}>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="h-8 w-8 rounded-lg bg-[#FF2B66]/10 text-[#FF2B66] flex items-center justify-center"><c.icon size={15} /></span>
                    {c.label}
                  </h4>
                  {over && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-500/15 px-2.5 py-1 text-[10px] font-bold text-red-500">
                      OVER BY {formatCurrency(s - a)}
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-500 dark:text-[#9CA3AF]">Committed <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(s)}</span></span>
                    <span className="text-gray-500 dark:text-[#9CA3AF]">of <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(a)}</span></span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-[#FF2B66]'}`}
                      style={{ width: `${Math.max(pct, 3)}%` }} />
                  </div>
                  <p className={`text-[11px] font-bold mt-1 ${pct > 80 ? 'text-amber-500' : 'text-gray-400 dark:text-[#6B7280]'}`}>{pct}% utilized</p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#2A2A36]/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">Adjust allocation</span>
                    <span className="text-xs font-extrabold text-[#FF2B66]">{formatCurrency(a)}</span>
                  </div>
                  <input type="range" min="0" max="600000" step="5000" value={a}
                    onChange={e => setCat(c.key, +e.target.value)}
                    className="w-full cursor-pointer" style={{ accentColor: '#FF2B66' }} />
                  <div className="flex justify-between text-[10px] text-gray-400 dark:text-[#6B7280]">
                    <span>₱0</span><span>₱600K</span>
                  </div>
                </div>
              </div>
            )
          })}

          {/* cost per event (right column, two-row span) */}
          <div className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5 lg:row-span-2">
            <h4 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg bg-[#FF2B66]/10 text-[#FF2B66] flex items-center justify-center"><CalendarDays size={15} /></span>
              Cost per Event
            </h4>
            <p className="text-xs text-gray-500 dark:text-[#9CA3AF] mb-5">Venue fees + supplier purchase orders, ranked by total cost.</p>
            <div className="space-y-3">
              {eventCosts.map(({ e, venueFee, poTotal, pos }, i) => {
                const total = venueFee + poTotal
                const venueShare = Math.round((venueFee / Math.max(total, 1)) * 100)
                return (
                  <div key={e.Id} className="group">
                    <div className="flex items-center justify-between gap-3 text-sm mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white truncate">
                        <span className="text-gray-300 dark:text-[#4B5563] font-mono text-xs mr-2">{String(i + 1).padStart(2, '0')}</span>
                        {e.Name || 'Untitled event'}
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white whitespace-nowrap">{formatCurrency(total)}</span>
                    </div>
                    <div className="flex h-3.5 rounded-full overflow-hidden bg-gray-100 dark:bg-white/10 cursor-help"
                      title={`${e.Name}: Venue ${formatCurrency(venueFee)} (${pos.length} PO${pos.length === 1 ? '' : 's'}: ${formatCurrency(poTotal)}) · ${venueShare}% is venue cost`}>
                      <div className="bg-[#FF2B66] transition-all duration-700" style={{ width: `${(venueFee / maxCost) * 100}%` }} />
                      <div className="bg-[#FF5C8A]/70 transition-all duration-700" style={{ width: `${(poTotal / maxCost) * 100}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-[#6B7280] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      Venue {formatCurrency(venueFee)} · Suppliers {formatCurrency(poTotal)} across {pos.length} PO{pos.length === 1 ? '' : 's'}
                    </p>
                  </div>
                )
              })}
            </div>
            <div className="mt-5 flex items-center gap-5 text-[11px] font-semibold text-gray-500 dark:text-[#9CA3AF]">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#FF2B66]" /> Venue fees</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#FF5C8A]/70" /> Supplier POs</span>
            </div>
          </div>
        </div>
      </section>

      {/* add supplier payment modal */}
      {showForm && (
        <div className="fx-modal-backdrop fx-open" onClick={() => !saving && setShowForm(false)}>
          <div className="fx-modal-panel !max-w-lg w-full max-h-[92vh] overflow-y-auto bg-white dark:bg-[#121217] border border-gray-200 dark:border-[#2A2A36] rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="relative bg-gradient-to-r from-[#FF2B66] to-[#FF5C8A] px-6 pt-5 pb-6">
              <button onClick={() => setShowForm(false)} disabled={saving} aria-label="Close"
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all hover:rotate-90 duration-300 disabled:opacity-40">
                <X size={15} />
              </button>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white">
                  <Wallet size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Record Supplier Payment</h3>
                  <p className="text-white/80 text-xs">Expenses are counted only with a proof screenshot.</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">Supplier</label>
                  <select value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 dark:border-[#2A2A36] bg-white dark:bg-[#0B0B0E] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#FF2B66]/50">
                    <option value="">Select supplier…</option>
                    {suppliers.map(s => <option key={s.Id} value={s.Id}>{s.Name} · {s.Category}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">Event <span className="font-normal">(optional)</span></label>
                  <select value={form.eventId} onChange={e => setForm(f => ({ ...f, eventId: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 dark:border-[#2A2A36] bg-white dark:bg-[#0B0B0E] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#FF2B66]/50">
                    <option value="">No event / general expense</option>
                    {events.filter(e => e.Status !== 'Cancelled').map(e => <option key={e.Id} value={e.Id}>{e.Name}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">Description</label>
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="e.g. Catering downpayment — 200 pax"
                    className="w-full rounded-xl border border-gray-300 dark:border-[#2A2A36] bg-white dark:bg-[#0B0B0E] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#FF2B66]/50" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">Amount (PHP)</label>
                  <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00" className="w-full rounded-xl border border-gray-300 dark:border-[#2A2A36] bg-white dark:bg-[#0B0B0E] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#FF2B66]/50" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">Payment date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 dark:border-[#2A2A36] bg-white dark:bg-[#0B0B0E] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#FF2B66]/50" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">Payment method</label>
                  <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 dark:border-[#2A2A36] bg-white dark:bg-[#0B0B0E] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#FF2B66]/50">
                    {PAY_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">Reference number</label>
                  <input value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                    placeholder="Bank / GCash ref. no."
                    className="w-full rounded-xl border border-gray-300 dark:border-[#2A2A36] bg-white dark:bg-[#0B0B0E] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#FF2B66]/50" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">
                  Payment proof <span className="font-normal">(required — screenshot of the transfer)</span>
                </label>
                {file.preview ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-[#2A2A36]">
                    <img src={file.preview} alt="Payment proof" className="w-full max-h-48 object-contain bg-black/30" />
                    <button type="button" onClick={() => setFile({ value: null, preview: null })}
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/70 hover:bg-red-500 text-white flex items-center justify-center transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 dark:border-[#2A2A36] cursor-pointer transition-all p-6 text-center hover:border-[#FF2B66]/50">
                    <ImagePlus size={20} className="text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-[#9CA3AF]">Click to upload screenshot</span>
                    <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden"
                      onChange={e => pickFile(e.target.files?.[0])} />
                  </label>
                )}
              </div>

              <button onClick={submitExpense} disabled={saving}
                className="w-full bg-[#FF2B66] hover:bg-[#E0245A] text-white text-sm font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                {saving ? <><Loader2 size={15} className="animate-spin" /> Recording…</> : <><Plus size={15} /> Record payment</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}