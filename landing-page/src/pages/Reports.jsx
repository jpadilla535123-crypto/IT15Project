import { useEffect, useState, useCallback } from 'react'
import {
  BarChart3, FileText, Loader2, Send, ExternalLink, CalendarRange, Activity,
  TrendingUp, TrendingDown, Banknote, AlertTriangle, Users, FileDown, RefreshCw, ShieldCheck,
} from 'lucide-react'
import AppLayout from './AppLayout'
import { PageHeader, Kpi, StatValue, Chip } from '../components/dashboard/Shared'
import { formatCurrency, toDate } from '../components/dashboard/format'
import { api } from '../api/client'

/* ─────────────────────────────────────────────────────────────────────────
   Reports — role-aware
   • Finance  : builds the monthly report in-app, then "publishes" it as a
                PDF (to be done every month regardless of requests).
   • Admin/Manager : check the published monthly PDFs, or request an
                immediate PDF of the current covered days (mid-month check).
   ───────────────────────────────────────────────────────────────────────── */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const NOW = new Date()

function periodLabel(year, month) {
  return `${MONTHS[month]}, ${year}`
}

export default function Reports({ user }) {
  const isFinance = user?.role === 'Finance'
  const [year, setYear] = useState(NOW.getFullYear())
  const [month, setMonth] = useState(NOW.getMonth())

  const [fin, setFin] = useState(null)
  const [finLoading, setFinLoading] = useState(false)

  const [documents, setDocuments] = useState([])
  const [docsLoading, setDocsLoading] = useState(true)

  const [publishing, setPublishing] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [msg, setMsg] = useState(null)

  const loadDocuments = useCallback(async () => {
    setDocsLoading(true)
    try {
      const d = await api.get('/api/reports/documents')
      setDocuments(d || [])
    } catch {
      setDocuments([])
    } finally {
      setDocsLoading(false)
    }
  }, [])

  useEffect(() => { loadDocuments() }, [loadDocuments])

  const loadFinance = useCallback(async (m, y) => {
    setFinLoading(true)
    setFin(null)
    setMsg(null)
    try {
      const f = await api.get('/api/reports/finance', { month: m + 1, year: y })
      setFin(f)
    } catch (err) {
      setMsg({ ok: false, text: err.message })
    } finally {
      setFinLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isFinance) loadFinance(month, year)
  }, [isFinance, month, year, loadFinance])

  async function publishReport() {
    setPublishing(true)
    setMsg(null)
    try {
      const p = await api.post(`/api/reports/publish?month=${month + 1}&year=${year}`)
      setMsg({ ok: true, text: `Published report-${year}-${String(month + 1).padStart(2, '0')}.pdf — it is now available below.` })
      if (p?.url) window.open(p.url, '_blank')
      await loadDocuments()
    } catch (err) {
      setMsg({ ok: false, text: err.message })
    } finally {
      setPublishing(false)
    }
  }

  async function requestReport() {
    setRequesting(true)
    setMsg(null)
    try {
      const p = await api.post('/api/reports/request')
      setMsg({ ok: true, text: `Report ready — it covers ${p.from && p.to ? `${p.from} to ${p.to}` : 'the current month'} (days so far). Opening it for you.` })
      if (p?.url) window.open(p.url, '_blank')
      await loadDocuments()
    } catch (err) {
      setMsg({ ok: false, text: err.message })
    } finally {
      setRequesting(false)
    }
  }

  const docsForPeriod = documents.filter(d => d.year === year && d.month === month + 1)

  return (
    <AppLayout user={user}>
      <PageHeader section="Finance" icon={BarChart3} title="Reports"
        actions={
          <>
            <select value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-gray-50 dark:bg-[#0B0B0E] px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white outline-none">
              {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={month}
              onChange={e => setMonth(Number(e.target.value))}
              className="rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-gray-50 dark:bg-[#0B0B0E] px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white outline-none capitalize">
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          </>
        }>
        <p className="text-sm text-gray-500 dark:text-[#9CA3AF]">
          {isFinance
            ? 'Build the monthly report, review income vs expenses, and publish it as a PDF every month — even without a request.'
            : 'Check the month-end reports published by Finance, or request an immediate PDF covering the current days so far.'}
        </p>
      </PageHeader>

      {finLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin text-[#FF2B66]" />
          <span className="ml-2 text-sm text-gray-400 dark:text-[#6B7280]">Building report for {periodLabel(year, month)}…</span>
        </div>
      )}

      {!finLoading && isFinance && fin && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
            <Kpi icon={TrendingUp} label="Income / gained" tone="text-emerald-500" bg="bg-emerald-500/10"><StatValue value={fin.summary.income} prefix="₱" /></Kpi>
            <Kpi icon={TrendingDown} label="Expenses" tone="text-red-500" bg="bg-red-500/10"><StatValue value={fin.summary.expenses} prefix="₱" /></Kpi>
            <Kpi icon={Banknote} label="Net income" tone={fin.summary.net >= 0 ? 'text-emerald-500' : 'text-red-500'} bg={fin.summary.net >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}><StatValue value={fin.summary.net} prefix="₱" /></Kpi>
            <Kpi icon={Activity} label="Budget spent" tone="text-amber-500" bg="bg-amber-500/10"><StatValue value={fin.summary.budgetSpent} prefix="₱" /></Kpi>
            <Kpi icon={AlertTriangle} label="Outstanding" tone="text-amber-500" bg="bg-amber-500/10"><StatValue value={fin.summary.outstanding} prefix="₱" /></Kpi>
          </div>

          <Panel icon={CalendarRange} title={`Events · ${periodLabel(year, month)}`} sub="Revenues received vs budget spent per event this period, with per-event profit.">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-[#6B7280]">
                    <th className="py-2 pr-4 font-bold">Event</th>
                    <th className="py-2 pr-4 font-bold">Status</th>
                    <th className="py-2 pr-4 font-bold text-right">Received</th>
                    <th className="py-2 pr-4 font-bold text-right">Budget spent</th>
                    <th className="py-2 font-bold text-right">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#2A2A36]">
                  {fin.events.length === 0 ? (
                    <tr><td colSpan={5} className="py-6 text-center text-sm text-gray-400 dark:text-[#6B7280]">No events in this period.</td></tr>
                  ) : fin.events.map(e => (
                    <tr key={e.id} className="text-sm">
                      <td className="py-3 pr-4 font-bold text-gray-900 dark:text-white">{e.name}</td>
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${e.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : e.status === 'Ongoing' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>{e.status}</span>
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-gray-600 dark:text-gray-300">{formatCurrency(e.received)}</td>
                      <td className="py-3 pr-4 text-right tabular-nums text-gray-600 dark:text-gray-300">{formatCurrency(e.budgetUsed)}</td>
                      <td className={`py-3 text-right font-bold tabular-nums ${e.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#FF2B66]'}`}>{formatCurrency(e.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel icon={Users} title={`Staff payroll & attendance · ${periodLabel(year, month)}`} sub="Gross pay, deductions and net pay per active employee for this period.">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-[#6B7280]">
                    <th className="py-2 pr-4 font-bold">Staff</th>
                    <th className="py-2 pr-4 font-bold">Duties</th>
                    <th className="py-2 pr-4 font-bold text-right">Hrs</th>
                    <th className="py-2 pr-4 font-bold text-right">Gross</th>
                    <th className="py-2 pr-4 font-bold text-right">Deductions</th>
                    <th className="py-2 font-bold text-right">Net pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#2A2A36]">
                  {fin.staff.length === 0 ? (
                    <tr><td colSpan={6} className="py-6 text-center text-sm text-gray-400 dark:text-[#6B7280]">No staff records for this period.</td></tr>
                  ) : fin.staff.map(s => (
                    <tr key={s.employeeId} className="text-sm">
                      <td className="py-3 pr-4">
                        <p className="font-bold text-gray-900 dark:text-white">{s.name}</p>
                        <p className="text-[11px] text-gray-400">{s.role}</p>
                      </td>
                      <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">{s.worked} &nbsp;<span className="text-gray-400 dark:text-[#6B7280]">({s.absents}A · {s.lates}L · {s.leaves}V)</span></td>
                      <td className="py-3 pr-4 text-right tabular-nums text-gray-600 dark:text-gray-300">{s.hours?.toFixed?.(1) ?? s.hours ?? 0}</td>
                      <td className="py-3 pr-4 text-right tabular-nums text-gray-600 dark:text-gray-300">{formatCurrency(s.payslip?.grossPay ?? 0)}</td>
                      <td className="py-3 pr-4 text-right tabular-nums text-gray-600 dark:text-gray-300">{formatCurrency(s.payslip?.deductions ?? 0)}</td>
                      <td className="py-3 text-right font-bold tabular-nums text-gray-900 dark:text-white">{formatCurrency(s.payslip?.netPay ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF2B66]/10 text-[#FF2B66]"><FileDown size={18} /></span>
              <div>
                <p className="font-bold text-sm text-gray-900 dark:text-white">Monthly report for {periodLabel(year, month)}</p>
                <p className="text-xs text-gray-400 dark:text-[#6B7280]">{docsForPeriod.length > 0 ? 'Already published — generating again updates it.' : 'Not published yet — generate and publish it now.'}</p>
              </div>
            </div>
            <button onClick={publishReport} disabled={publishing}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF2B66] hover:bg-[#E0245A] text-white text-xs font-bold py-2.5 px-4 transition-all active:scale-95 disabled:opacity-60">
              {publishing ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
              {publishing ? 'Generating…' : 'Generate & publish monthly PDF'}
            </button>
          </div>
        </>
      )}

      {!isFinance && (
        <div className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF2B66]/10 text-[#FF2B66]"><ShieldCheck size={18} /></span>
              <div>
                <p className="font-bold text-sm text-gray-900 dark:text-white">Request an immediate report</p>
                <p className="text-xs text-gray-400 dark:text-[#6B7280]">
                  Needed a mid-month check? Finance publishes the full report every month — use this to request a PDF covering {periodLabel(NOW.getFullYear(), NOW.getMonth())} so far (only the days already covered).
                </p>
              </div>
            </div>
            <button onClick={requestReport} disabled={requesting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF2B66] hover:bg-[#E0245A] text-white text-xs font-bold py-2.5 px-4 transition-all active:scale-95 disabled:opacity-60">
              {requesting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              {requesting ? 'Generating…' : 'Request report now'}
            </button>
          </div>
        </div>
      )}

      {msg && (
        <p className={`text-xs font-bold rounded-xl px-4 py-3 ${msg.ok ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'bg-red-500/10 text-red-500'}`}>
          {msg.text}
        </p>
      )}

      <Panel icon={FileText} title="Published reports (PDF library)" sub="Month-end reports uploaded by Finance every month — available at any time.">
        {docsLoading ? (
          <div className="flex items-center gap-2 justify-center py-8 text-sm text-gray-400 dark:text-[#6B7280]">
            <Loader2 size={15} className="animate-spin" /> Loading documents…
          </div>
        ) : documents.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400 dark:text-[#6B7280]">
            No published PDFs yet. {isFinance ? 'Generate the first report above.' : 'Published monthly reports will appear here.'}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-[#2A2A36]">
            {documents.map(d => (
              <li key={d.fileName} className="flex flex-wrap items-center gap-3 py-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF2B66]/10 text-[#FF2B66]"><FileText size={15} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{(() => { const m = MONTHS[(d.month || 1) - 1]; return `${m}, ${d.year}` })()}</p>
                  <p className="text-[11px] text-gray-400 dark:text-[#6B7280]">Generated {d.generatedAt ? toDate(d.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'} · {(d.size / 1024).toFixed(1)} KB</p>
                </div>
                <Chip active><Activity size={11} /> Report</Chip>
                <button onClick={() => window.open(d.url, '_blank')}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-[#2A2A36] px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-200 hover:border-[#FF2B66]/60 hover:text-[#FF2B66] transition-colors">
                  <ExternalLink size={12} /> View PDF
                </button>
              </li>
            ))}
          </ul>
        )}
        <button onClick={loadDocuments} className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 dark:text-[#6B7280] hover:text-[#FF2B66] transition-colors">
          <RefreshCw size={11} /> Refresh library
        </button>
      </Panel>
    </AppLayout>
  )
}

function Panel({ icon: Icon, title, sub, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5">
      <h3 className="flex items-center gap-2 font-bold text-sm text-gray-900 dark:text-white">
        {Icon && <Icon size={15} className="text-[#FF2B66]" />} {title}
      </h3>
      {sub && <p className="text-xs text-gray-500 dark:text-[#9CA3AF] mt-1 mb-4">{sub}</p>}
      {!sub && <div className="h-3" />}
      {children}
    </section>
  )
}