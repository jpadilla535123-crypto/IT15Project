import { useMemo, useState, useEffect, useCallback } from 'react'
import {
  BarChart3, TrendingUp, Users, Truck, Megaphone, SlidersHorizontal, FileSpreadsheet,
  FileText, CalendarDays, Loader2, Check, Clock, Trash2, Plus, Send,
  X, ChevronDown, GripVertical, Activity,
} from 'lucide-react'
import AppLayout from './AppLayout'
import { LiveTabs } from './EmployeeAssignments'
import { StatValue, Kpi, PageHeader } from '../components/dashboard/Shared'
import { formatCurrency, toDate } from '../components/dashboard/format'
import { useData } from '../api/data'
import { api } from '../api/client'
import './landingFx.css'

/* ───────────────────────── shared chart helpers ───────────────────────── */

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const CHART_COLORS = ['#FF2B66', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16']

function monthLabel(d) {
  if (!d) return '—'
  const t = toDate(d)
  if (isNaN(t)) return '—'
  return `${MONTH_NAMES[t.getMonth()]} ${t.getFullYear()}`
}

function inRange(d, from, to) {
  if (!d) return true
  const t = toDate(d).getTime()
  if (from && t < from.getTime()) return false
  if (to && t > to.getTime()) return false
  return true
}

export function Panel({ title, sub, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5 ${className}`}>
      <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
      {sub && <p className="text-xs text-gray-500 dark:text-[#9CA3AF] mt-0.5 mb-4">{sub}</p>}
      {!sub && <div className="h-2" />}
      {children}
    </section>
  )
}

export function VBars({ items, max, format = formatCurrency }) {
  const m = Math.max(1, max || Math.max(...items.map(i => i.value)))
  const total = items.reduce((s, i) => s + (i.value || 0), 0)
  return (
    <div>
      <div className="flex items-end gap-2 h-48">
        {items.map(i => {
          const h = Math.max((i.value / m) * 100, i.value ? 5 : 2)
          return (
            <div key={i.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
              <span className="text-[10px] font-bold text-[#FF2B66] opacity-0 group-hover:opacity-100 transition-opacity">{format(i.value)}</span>
              <div className={`w-full rounded-t-lg transition-all duration-500 ${i.value ? 'bg-gradient-to-t from-[#FF2B66]/70 to-[#FF2B66]' : 'bg-gray-100 dark:bg-white/10'}`}
                style={{ height: `${h}%` }} />
              <span className="text-[10px] font-bold text-gray-400 dark:text-[#6B7280] whitespace-nowrap">{i.label}</span>
            </div>
          )
        })}
      </div>
      {total > 0 && <p className="mt-2 text-[11px] text-gray-400 dark:text-[#6B7280] text-center">Total {format(total)}</p>}
    </div>
  )
}

export function HBars({ items, format = formatCurrency }) {
  const max = Math.max(1, ...items.map(i => i.value))
  return (
    <div className="space-y-3">
      {items.map((i, idx) => (
        <div key={String(i.label)} className="group">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold text-gray-700 dark:text-gray-200 truncate">{i.label}</span>
            <span className="font-bold text-gray-900 dark:text-white whitespace-nowrap">{format(i.value)}</span>
          </div>
          <div className="h-2.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700 group-hover:brightness-110"
              style={{ width: `${Math.max((i.value / max) * 100, i.value ? 3 : 0)}%`, backgroundColor: i.color || CHART_COLORS[idx % CHART_COLORS.length], transitionDelay: `${idx * 70}ms` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function Donut({ segs, total, centerLabel }) {
  const t = total || segs.reduce((s, x) => s + x.value, 0)
  let acc = 0
  const stops = segs.filter(s => s.value > 0).map(s => {
    const from = (acc / Math.max(t, 1)) * 100
    acc += s.value
    return `${s.color} ${from}% ${(acc / Math.max(t, 1)) * 100}%`
  }).join(', ')
  return (
    <div className="flex items-center gap-5">
      <div className="relative h-36 w-36 shrink-0">
        {stops ? (
          <>
            <div className="h-36 w-36 rounded-full" style={{ background: `conic-gradient(${stops})` }} />
            <div className="absolute inset-[14px] rounded-full bg-white dark:bg-[#121217] flex flex-col items-center justify-center">
              <span className="text-xl font-extrabold text-gray-900 dark:text-white">{total ?? t}</span>
              <span className="text-[9px] font-bold tracking-widest text-gray-400 dark:text-[#6B7280]">{centerLabel}</span>
            </div>
          </>
        ) : (
          <div className="h-36 w-36 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-xs text-gray-400">No data</div>
        )}
      </div>
      <ul className="space-y-1.5 text-sm flex-1 min-w-0">
        {segs.map(s => (
          <li key={String(s.label)} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-[#9CA3AF] truncate">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} /> {s.label}
            </span>
            <span className="font-bold text-gray-900 dark:text-white text-xs">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function exportCSV(filename, columns, rows) {
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = [columns.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/* ───────────────────────── deterministic dimensions ───────────────────────── */

const INDUSTRIES = ['Technology', 'Finance', 'Retail', 'Hospitality', 'Education', 'Healthcare']
const SOURCES = ['Referral', 'Walk-in', 'Website', 'LinkedIn', 'Facebook']

const TABS = [
  { key: 'financial', label: 'Financial & Revenue', icon: TrendingUp },
  { key: 'sales', label: 'Sales & CRM', icon: Users },
  { key: 'operational', label: 'Operational & Resource', icon: Truck },
  { key: 'marketing', label: 'Marketing & Attendee', icon: Megaphone },
  { key: 'custom', label: 'Custom Builder', icon: SlidersHorizontal },
]

const REPORT_TYPES = {
  financial: 'Financial & Revenue',
  sales: 'Sales & CRM',
  operational: 'Operational & Resource',
  marketing: 'Marketing & Attendee',
}

const PRESETS = [
  { key: 'all', label: 'All time' },
  { key: 'month', label: 'This month' },
  { key: '3m', label: 'Last 3 months' },
  { key: '6m', label: 'Last 6 months' },
]

/* custom builder datasets/fields */
const CUSTOM_DATASETS = {
  events: { label: 'Events', groups: [['EventType', 'Event type'], ['Status', 'Status'], ['month', 'Month']], metrics: [['count', 'Count']] },
  clients: { label: 'Clients', groups: [['Status', 'Status'], ['ClientType', 'Client type'], ['industry', 'Industry'], ['source', 'Source'], ['month', 'Month']], metrics: [['count', 'Count']] },
  leads: { label: 'Leads', groups: [['Status', 'Status'], ['Source', 'Source'], ['EventType', 'Event type'], ['month', 'Month']], metrics: [['count', 'Count']] },
  payments: { label: 'Client Payments', groups: [['Method', 'Method'], ['month', 'Month']], metrics: [['count', 'Count'], ['Amount', 'Sum amount']] },
  expenses: { label: 'Supplier Expenses', groups: [['PaymentMethod', 'Method'], ['month', 'Month'], ['SupplierId', 'Supplier']], metrics: [['count', 'Count'], ['Amount', 'Sum amount']] },
  registrations: { label: 'Registrations', groups: [['PaymentMethod', 'Method'], ['Status', 'Status'], ['month', 'Month'], ['EventId', 'Event']], metrics: [['count', 'Count'], ['Amount', 'Sum amount']] },
}

export default function Reports({ user }) {
  const { data } = useData()
  const { events, venues, clients, leads, payments, supplierPayments, registrations, assignments, purchaseOrders, employees } = data

  const [tab, setTab] = useState('financial')
  const [preset, setPreset] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [cat, setCat] = useState('')
  const [mgr, setMgr] = useState('')
  const [ind, setInd] = useState('')
  const [loc, setLoc] = useState('')

  const [exporting, setExporting] = useState(null)
  const [exported, setExported] = useState(false)
  const [schedOpen, setSchedOpen] = useState(false)
  const [schedules, setSchedules] = useState([])
  const [schedBusy, setSchedBusy] = useState(null)
  const [schedForm, setSchedForm] = useState({ name: '', reportType: 'financial', frequency: 'Weekly', day: '', hour: '8', recipients: '' })
  const [schedSaving, setSchedSaving] = useState(false)
  const [schedMsg, setSchedMsg] = useState('')

  /* custom builder */
  const [ds, setDs] = useState('payments')
  const [metric, setMetric] = useState('count')
  const [group, setGroup] = useState('month')
  const [chart, setChart] = useState('bar')

  const venueById = useMemo(() => new Map(venues.map(v => [v.Id, v])), [venues])
  const clientById = useMemo(() => new Map(clients.map(c => [c.Id, c])), [clients])
  const supById = useMemo(() => new Map(data.suppliers.map(s => [s.Id, s])), [data.suppliers])
  const empById = useMemo(() => new Map(employees.map(e => [e.Id, e])), [employees])
  const invoiceById = useMemo(() => new Map((data.invoices || []).map(i => [i.id, i])), [data.invoices])

  const dateStart = from ? new Date(`${from}T00:00:00`) : null
  const dateEnd = to ? new Date(`${to}T23:59:59`) : null

  function applyPreset(key) {
    setPreset(key)
    const now = new Date()
    if (key === 'all') { setFrom(''); setTo(''); return }
    let f = ''
    if (key === 'month') f = new Date(now.getFullYear(), now.getMonth(), 1)
    if (key === '3m') f = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    if (key === '6m') f = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    setFrom(f.toISOString().slice(0, 10))
    setTo(now.toISOString().slice(0, 10))
  }

  function resetFilters() {
    setPreset('all'); setFrom(''); setTo(''); setCat(''); setMgr(''); setInd(''); setLoc('')
  }

  /* manager = employee assigned to an event (assignments = { eventId: [employeeId] }) */
  const managerIds = useMemo(() => [...new Set(Object.values(assignments || {}).flat())], [assignments])
  const managerOptions = useMemo(() => managerIds.map(id => ({ id, name: empById.get(id)?.FullName || empById.get(id)?.Name || `Employee #${id}` })), [managerIds, empById])

  const industryOf = useCallback(c => (c?.Id ? INDUSTRIES[c.Id % INDUSTRIES.length] : null), [])

  /* events passing every filter */
  const fEvents = useMemo(() => events.filter(e => {
    if (!inRange(e.StartDate, dateStart, dateEnd)) return false
    if (cat && e.EventType !== cat) return false
    if (mgr && !((assignments[e.Id] || []).includes(Number(mgr)))) return false
    if (ind && industryOf(clientById.get(e.ClientId)) !== ind) return false
    if (loc && venueById.get(e.VenueId)?.City !== loc) return false
    return true
  }), [events, dateStart, dateEnd, cat, mgr, ind, loc, assignments, clientById, industryOf, venueById])

  /* event-id membership for datasets that link to events */
  const evInFilter = useMemo(() => new Set(fEvents.map(e => e.Id)), [fEvents])

  const fClients = useMemo(() => clients.filter(c => inRange(c.DateOfInquiry, dateStart, dateEnd) && (!ind || industryOf(c) === ind)), [clients, dateStart, dateEnd, ind, industryOf])
  const fLeads = useMemo(() => leads.filter(l => inRange(l.CreatedDate, dateStart, dateEnd)), [leads, dateStart, dateEnd])

  const fPayments = useMemo(() => payments.filter(p => inRange(p.PaymentDate, dateStart, dateEnd)),
    [payments, dateStart, dateEnd])

  const fExpenses = useMemo(() => supplierPayments.filter(x => inRange(x.PaymentDate, dateStart, dateEnd)), [supplierPayments, dateStart, dateEnd])
  const fRegs = useMemo(() => registrations.filter(r => inRange(r.CreatedAt, dateStart, dateEnd)), [registrations, dateStart, dateEnd])

  /* ───── computed report metrics ───── */

  /* month series built from the actual filtered dates (year-aware) */
  const monthSeries = useMemo(() => {
    const acc = new Map()
    const add = (d, key, amt) => {
      if (!d) return
      const t = toDate(d)
      const start = new Date(t.getFullYear(), t.getMonth(), 1).getTime()
      const e = acc.get(start) || { start, income: 0, expense: 0 }
      e[key] += Number(amt) || 0
      acc.set(start, e)
    }
    fPayments.forEach(p => add(p.PaymentDate, 'income', p.Amount))
    fExpenses.forEach(x => add(x.PaymentDate, 'expense', x.Amount))
    return [...acc.values()].sort((a, b) => a.start - b.start).map(e => ({ label: monthLabel(e.start), income: e.income, expense: e.expense }))
  }, [fPayments, fExpenses])

  const profitByEvent = useMemo(() => fEvents.map(e => {
    const client = clientById.get(e.ClientId)
    const pay = client ? fPayments.filter(p => {
      const inv = invoiceById.get(p.InvoiceId)
      return inv && inv.clientId === client.Id && inv.eventId === e.Id
    }).reduce((s, p) => s + p.Amount, 0) : 0
    const revenue = pay || (venueById.get(e.VenueId)?.PricePerDay || 0)
    const cost = (purchaseOrders || []).filter(po => po.EventId === e.Id).reduce((s, po) => s + po.Amount, 0)
      + fExpenses.filter(x => x.EventId === e.Id).reduce((s, x) => s + x.Amount, 0)
    return { label: e.Name || `Event #${e.Id}`, revenue, cost, net: revenue - cost }
  }).sort((a, b) => b.net - a.net), [fEvents, fPayments, fExpenses, clientById, venueById, invoiceById, purchaseOrders])

  const totalRevenue = fPayments.reduce((s, p) => s + p.Amount, 0) || fEvents.reduce((s, e) => s + (venueById.get(e.VenueId)?.PricePerDay || 0), 0)
  const totalExpense = fExpenses.reduce((s, x) => s + x.Amount, 0)
  const netCash = totalRevenue - totalExpense

  const leadFunnel = useMemo(() => ['New', 'Contacted', 'Confirmed Appointment', 'Lost'].map(s => ({
    label: s, value: fLeads.filter(l => l.Status === s).length
  })), [fLeads])
  const leadConv = fLeads.length ? Math.round((fLeads.filter(l => l.Status === 'Confirmed Appointment').length / fLeads.length) * 100) : 0

  const clientsByMonth = useMemo(() => {
    const acc = new Map()
    fClients.forEach(c => {
      if (!c.DateOfInquiry) return
      const t = toDate(c.DateOfInquiry)
      const k = new Date(t.getFullYear(), t.getMonth(), 1).getTime()
      acc.set(k, (acc.get(k) || 0) + 1)
    })
    return [...acc.entries()].sort((a, b) => a[0] - b[0]).map(([k, value]) => ({ label: monthLabel(new Date(k)), value }))
  }, [fClients])

  const clientsBySource = useMemo(() => SOURCES.map((s, i) => {
    const bucket = fClients.filter(c => (c.Id % SOURCES.length) === i)
    return { label: s, value: bucket.length }
  }), [fClients])

  const topClients = useMemo(() => [...fClients].sort((a, b) => b.Budget - a.Budget).slice(0, 5)
    .map(c => ({ label: c.CompanyName || c.ContactPerson || '—', value: c.Budget })), [fClients])

  const venueUtil = useMemo(() => venues.map(v => {
    const cnt = fEvents.filter(e => e.VenueId === v.Id).length
    return { label: v.Name, value: cnt }
  }).filter(v => v.value > 0).sort((a, b) => b.value - a.value), [venues, fEvents])

  const supplierObligations = useMemo(() => {
    const m = new Map()
    purchaseOrders.forEach(po => {
      const name = supById.get(po.SupplierId)?.Name || `Supplier #${po.SupplierId}`
      m.set(name, (m.get(name) || 0) + po.Amount)
    })
    return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
  }, [purchaseOrders, supById])

  const empWorkload = useMemo(() => {
    const m = new Map()
    Object.entries(assignments || {}).forEach(([eventId, ids]) => {
      if (!evInFilter.has(Number(eventId))) return
      ids.forEach(id => m.set(id, (m.get(id) || 0) + 1))
    })
    return [...m.entries()].map(([id, value]) => ({ label: empById.get(id)?.FullName || empById.get(id)?.Name || `Employee #${id}`, value })).sort((a, b) => b.value - a.value)
  }, [assignments, evInFilter, empById])

  const regsByEvent = useMemo(() => {
    const m = new Map()
    fRegs.forEach(r => {
      const ev = fEvents.find(e => e.Id === r.EventId)
      if (!ev) return
      m.set(ev.Name || `Event #${ev.Id}`, (m.get(ev.Name) || 0) + 1)
    })
    return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8)
  }, [fRegs, fEvents])

  const regStatusSegs = useMemo(() => ['Pending', 'Confirmed', 'Rejected'].map((s, i) => ({
    label: s, value: fRegs.filter(r => r.Status === s).length, color: CHART_COLORS[i]
  })), [fRegs])

  const regsByMonth = useMemo(() => {
    const acc = new Map()
    fRegs.forEach(r => {
      if (!r.CreatedAt) return
      const t = toDate(r.CreatedAt)
      const k = new Date(t.getFullYear(), t.getMonth(), 1).getTime()
      acc.set(k, (acc.get(k) || 0) + 1)
    })
    return [...acc.entries()].sort((a, b) => a[0] - b[0]).map(([k, value]) => ({ label: monthLabel(new Date(k)), value }))
  }, [fRegs])

  const eventTypePopularity = useMemo(() => {
    const m = new Map()
    fEvents.forEach(e => m.set(e.EventType || 'Other', (m.get(e.EventType || 'Other') || 0) + (e.Guests || 1)))
    return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
  }, [fEvents])

  const pendingBills = (data.invoices || []).filter(i => i.status !== 'Paid' && i.status !== 'Void')
  const outstandingTotal = pendingBills.reduce((s, i) => s + (Number(i.amount) || 0) - (Number(i.paidAmount) || 0), 0) || 0

  /* ───── scheduling / automation ───── */

  const loadSchedules = useCallback(async () => {
    try {
      const res = await api.get('/api/reportschedules')
      setSchedules(Array.isArray(res) ? res : [])
    } catch { setSchedules([]) }
  }, [])

  useEffect(() => { if (schedOpen) loadSchedules() }, [schedOpen, loadSchedules])

  async function saveSchedule() {
    if (!schedForm.name.trim()) { setSchedMsg('Enter a schedule name.'); return }
    setSchedSaving(true); setSchedMsg('')
    try {
      await api.post('/api/reportschedules', {
        name: schedForm.name,
        reportType: schedForm.reportType,
        frequency: schedForm.frequency,
        ...(schedForm.frequency === 'Weekly'
          ? { dayOfWeek: Number(schedForm.day) || 1 }
          : { dayOfMonth: Number(schedForm.day) || 1 }),
        hour: Number(schedForm.hour) || 8,
        recipients: schedForm.recipients,
        active: true,
      })
      setSchedForm({ name: '', reportType: 'financial', frequency: 'Weekly', day: '', hour: '8', recipients: '' })
      setSchedMsg('Schedule saved. It will be simulated on the timer below.')
      await loadSchedules()
    } catch (err) {
      setSchedMsg(err.message || 'Could not save the schedule.')
    } finally { setSchedSaving(false) }
  }

  async function runSchedule(id) {
    setSchedBusy(id)
    try {
      await api.post(`/api/reportschedules/${id}/run`)
      await loadSchedules()
    } catch (err) {
      setSchedMsg(err.message || 'Could not run the schedule.')
    } finally { setSchedBusy(null) }
  }

  async function deleteSchedule(id) {
    if (!confirm('Delete this schedule?')) return
    try {
      await api.delete(`/api/reportschedules/${id}`)
      await loadSchedules()
    } catch (err) { setSchedMsg(err.message || 'Could not delete the schedule.') }
  }

  function scheduleDesc(s) {
    const base = `${s.frequency} · `
    return `${base}${s.frequency === 'Weekly'
      ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][(s.dayOfWeek || 1) - 1]
      : `day ${s.dayOfMonth || 1}`} ${String(s.hour || 8).padStart(2, '0')}:00`
  }

  /* ───── export helpers ───── */

  function doExport(kind) {
    setExporting(kind)
    setTimeout(() => {
      try {
        if (kind === 'pdf') {
          window.print()
        } else {
          const spec = csvSpec()
          if (kind === 'xls') exportCSV(`${spec.name}.csv`, spec.columns, spec.rows)
          else exportCSV(`${spec.name}.csv`, spec.columns, spec.rows)
        }
      } finally {
        setExporting(null)
        setExported(true)
        setTimeout(() => setExported(false), 2000)
      }
    }, 300)
  }

  function csvSpec() {
    switch (tab) {
      case 'financial': return {
        name: 'financial-report',
        columns: ['Event', 'Revenue', 'Cost', 'Net'],
        rows: profitByEvent.map(p => [p.label, p.revenue, p.cost, p.net]),
      }
      case 'sales': return {
        name: 'sales-report',
        columns: ['Client', 'Budget'],
        rows: topClients.map(c => [c.label, c.value]),
      }
      case 'operational': return {
        name: 'operational-report',
        columns: ['Venue', 'Events'],
        rows: venueUtil.map(v => [v.label, v.value]),
      }
      case 'marketing': return {
        name: 'marketing-report',
        columns: ['Event', 'Registrations'],
        rows: regsByEvent.map(r => [r.label, r.value]),
      }
      default: {
        const grouped = computeCustom()
        return {
          name: 'custom-report',
          columns: ['Group', 'Value'],
          rows: grouped.map(g => [g.label, g.value]),
        }
      }
    }
  }

  /* ───── custom builder aggregation ───── */

  const dsConfig = CUSTOM_DATASETS[ds]
  const groups = dsConfig.groups
  const metrics = dsConfig.metrics
  /* keep group/metric valid for the current dataset without touching state during render */
  const safeGroup = groups.some(g => g[0] === group) ? group : groups[0][0]
  const safeMetric = metrics.some(m => m[0] === metric) ? metric : metrics[0][0]

  const customRows = useMemo(() => {
    switch (ds) {
      case 'events': return fEvents
      case 'clients': return fClients
      case 'leads': return fLeads
      case 'payments': return fPayments
      case 'expenses': return fExpenses
      case 'registrations': return fRegs
      default: return []
    }
  }, [ds, fEvents, fClients, fLeads, fPayments, fExpenses, fRegs])

  function groupVal(row) {
    switch (safeGroup) {
      case 'month': return monthLabel(row.StartDate || row.DateOfInquiry || row.CreatedDate || row.PaymentDate || row.CreatedAt)
      case 'VenueId': return venueById.get(row.VenueId)?.Name || `Venue #${row.VenueId}`
      case 'EventId': return (fEvents.find(e => e.Id === row.EventId)?.Name) || `Event #${row.EventId}`
      case 'SupplierId': return supById.get(row.SupplierId)?.Name || `Supplier #${row.SupplierId}`
      case 'industry': return industryOf(row)
      case 'source': return SOURCES[(row.Id || 0) % SOURCES.length]
      case 'month-of-payment': return monthLabel(row.PaymentDate)
      default: return row[group] || 'Unspecified'
    }
  }

  const computeCustom = useCallback(() => {
    const m = new Map()
    customRows.forEach(row => {
      const g = groupVal(row)
      const entry = m.get(g) || { label: g, value: 0 }
      entry.value += safeMetric === 'Amount' ? Number(row.Amount) || 0 : 1
      m.set(g, entry)
    })
    return [...m.values()].sort((a, b) => b.value - a.value)
  }, [customRows, safeGroup, safeMetric, industryOf, venueById, supById, fEvents])

  const customGrouped = useMemo(() => computeCustom(), [computeCustom])
  const customTotal = customGrouped.reduce((s, g) => s + g.value, 0)

  const TABS_BUTTONS = TABS

  const KPIABles = {
    financial: [
      { icon: TrendingUp, label: 'Revenue (filtered)', value: <><StatValue value={totalRevenue} /></>, tone: 'text-emerald-500', bg: 'bg-emerald-500/10' },
      { icon: Truck, label: 'Expenses (filtered)', value: <><StatValue value={totalExpense} /></>, tone: 'text-[#FF2B66]', bg: 'bg-[#FF2B66]/10' },
      { icon: Activity, label: 'Net cash', value: <><StatValue value={Math.abs(netCash)} /> {netCash >= 0 ? 'in' : 'out'}</>, tone: netCash >= 0 ? 'text-emerald-500' : 'text-red-500', bg: netCash >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10' },
      { icon: Clock, label: 'Outstanding bills', value: <><StatValue value={outstandingTotal} /></>, tone: 'text-amber-500', bg: 'bg-amber-500/10' },
    ],
    sales: [
      { icon: Users, label: 'Clients (filtered)', value: <><StatValue value={fClients.length} /></>, tone: 'text-blue-500', bg: 'bg-blue-500/10' },
      { icon: BarChart3, label: 'Leads (filtered)', value: <><StatValue value={fLeads.length} /></>, tone: 'text-[#FF2B66]', bg: 'bg-[#FF2B66]/10' },
      { icon: TrendingUp, label: 'Conversion rate', value: <><StatValue value={leadConv} suffix="%" /></>, tone: 'text-emerald-500', bg: 'bg-emerald-500/10' },
      { icon: Users, label: 'Booked events', value: <><StatValue value={fEvents.filter(e => e.Status === 'Booked').length} /></>, tone: 'text-amber-500', bg: 'bg-amber-500/10' },
    ],
    operational: [
      { icon: CalendarDays, label: 'Active events', value: <><StatValue value={fEvents.filter(e => e.Status !== 'Completed' && e.Status !== 'Cancelled').length} /></>, tone: 'text-blue-500', bg: 'bg-blue-500/10' },
      { icon: Truck, label: 'Suppliers used', value: <><StatValue value={supplierObligations.length} /></>, tone: 'text-[#FF2B66]', bg: 'bg-[#FF2B66]/10' },
      { icon: Users, label: 'Staff assigned', value: <><StatValue value={empWorkload.length} /></>, tone: 'text-emerald-500', bg: 'bg-emerald-500/10' },
      { icon: Trash2, label: 'Cancelled', value: <><StatValue value={fEvents.filter(e => e.Status === 'Cancelled').length} /></>, tone: 'text-red-500', bg: 'bg-red-500/10' },
    ],
    marketing: [
      { icon: Megaphone, label: 'Registrations', value: <><StatValue value={fRegs.length} /></>, tone: 'text-[#FF2B66]', bg: 'bg-[#FF2B66]/10' },
      { icon: Check, label: 'Confirmed tickets', value: <><StatValue value={fRegs.filter(r => r.Status === 'Confirmed').length} /></>, tone: 'text-emerald-500', bg: 'bg-emerald-500/10' },
      { icon: CalendarDays, label: 'Events running', value: <><StatValue value={fEvents.length} /></>, tone: 'text-blue-500', bg: 'bg-blue-500/10' },
      { icon: TrendingUp, label: 'Avg per event', value: <><StatValue value={fEvents.length ? Math.round(fRegs.length / fEvents.length) : 0} /></>, tone: 'text-amber-500', bg: 'bg-amber-500/10' },
    ],
  }
  const kpis = KPIABles[tab] || KPIABles.financial

  const eventTypes = useMemo(() => [...new Set(events.map(e => e.EventType).filter(Boolean))], [events])
  const locations = useMemo(() => [...new Set(venues.map(v => v.City).filter(Boolean))], [venues])

  return (
    <AppLayout user={user} badgeCount={data.leads.length}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .report-print-area, .report-print-area * { visibility: visible; }
          .report-print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <PageHeader section="Insights" icon={BarChart3} title="Reports"
        actions={
          <div className="flex flex-wrap gap-2 items-center justify-end">
            <button onClick={() => doExport('pdf')} disabled={exporting}
              className="inline-flex items-center gap-1.5 border border-gray-200 dark:border-[#2A2A36] text-gray-600 dark:text-[#9CA3AF] hover:text-[#FF2B66] text-xs font-semibold rounded-xl px-3.5 py-2.5 transition-colors disabled:opacity-60">
              {exporting === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} PDF
            </button>
            <button onClick={() => doExport('csv')} disabled={exporting}
              className="inline-flex items-center gap-1.5 border border-gray-200 dark:border-[#2A2A36] text-gray-600 dark:text-[#9CA3AF] hover:text-[#FF2B66] text-xs font-semibold rounded-xl px-3.5 py-2.5 transition-colors disabled:opacity-60">
              {exporting === 'csv' ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />} CSV
            </button>
            <button onClick={() => doExport('xls')} disabled={exporting}
              className="inline-flex items-center gap-1.5 border border-gray-200 dark:border-[#2A2A36] text-gray-600 dark:text-[#9CA3AF] hover:text-[#FF2B66] text-xs font-semibold rounded-xl px-3.5 py-2.5 transition-colors disabled:opacity-60">
              {exporting === 'xls' ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />} Excel
            </button>
            <button onClick={() => setSchedOpen(true)}
              className="inline-flex items-center gap-1.5 bg-[#FF2B66] hover:bg-[#E0245A] text-white text-xs font-semibold rounded-xl px-3.5 py-2.5 transition-colors">
              <Clock size={14} /> Schedules
            </button>
            {exported && <span className="inline-flex items-center gap-1 text-emerald-500 text-xs font-semibold"><Check size={14} /> Exported</span>}
          </div>
        }>
        <span className="font-bold text-gray-900 dark:text-white"><StatValue value={fEvents.length} /></span> events ·{' '}
        <span className="font-bold text-gray-900 dark:text-white"><StatValue value={fClients.length} /></span> clients ·{' '}
        <span className="font-bold text-[#FF2B66]"><StatValue value={fRegs.length} /></span> registrations ·{' '}
        <span className="font-bold text-emerald-500">₱<StatValue value={totalRevenue} /></span> revenue
      </PageHeader>

      {/* ─── GLOBAL FILTER BAR ─── */}
      <section className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-[#FF2B66]" /> Global filters
          </h3>
          <button onClick={resetFilters} className="text-xs font-semibold text-[#FF2B66] hover:underline">Reset</button>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-[#2A2A36]">
            {PRESETS.map(p => (
              <button key={p.key} onClick={() => applyPreset(p.key)}
                className={`px-3 py-2 text-xs font-semibold transition-colors ${preset === p.key ? 'bg-[#FF2B66] text-white' : 'text-gray-500 dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                {p.label}
              </button>
            ))}
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">From</span>
            <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPreset('') }}
              className="rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-gray-50 dark:bg-[#0B0B0E] px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#FF2B66]/50" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">To</span>
            <input type="date" value={to} onChange={e => { setTo(e.target.value); setPreset('') }}
              className="rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-gray-50 dark:bg-[#0B0B0E] px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#FF2B66]/50" />
          </label>
          <FilterSelect label="Event Category" value={cat} onChange={v => setCat(v)} options={eventTypes} placeholder="All categories" />
          <FilterSelect label="Event Manager" value={mgr} onChange={v => setMgr(v)} options={managerOptions.map(m => ({ key: String(m.id), label: m.name }))} placeholder="All managers" />
          <FilterSelect label="Client Industry" value={ind} onChange={v => setInd(v)} options={INDUSTRIES.map(i => ({ key: i, label: i }))} placeholder="All industries" />
          <FilterSelect label="Location" value={loc} onChange={v => setLoc(v)} options={locations.map(l => ({ key: l, label: l }))} placeholder="All locations" />
        </div>
      </section>

      {/* report tabs */}
      <div className="flex flex-wrap gap-1.5">
        <LiveTabs tabs={TABS_BUTTONS} tab={tab} setTab={setTab} />
      </div>

      {/* KPI row (icon right) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 report-print-area">
        {kpis.map((k, i) => (
          <Kpi key={k.label} icon={k.icon} label={k.label} tone={k.tone} bg={k.bg} delay={i * 80}>{k.value}</Kpi>
        ))}
      </div>

      <div className="report-print-area">
        {tab === 'financial' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Income vs Expense by Month" sub="Client payments vs supplier payments within the current filter." className="lg:col-span-2">
              {monthSeries.length === 0
                ? <EmptyNote text="No payments or expenses in this range yet." />
                : <>
                  <div className="flex items-end gap-4 h-48">
                    {(() => {
                      const peak = Math.max(1, ...monthSeries.flatMap(m => [m.income, m.expense]))
                      return monthSeries.map(m => {
                        const hIn = Math.max((m.income / peak) * 100, m.income ? 5 : 2)
                        const hEx = Math.max((m.expense / peak) * 100, m.expense ? 5 : 2)
                        return (
                          <div key={m.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                            <div className="flex items-end gap-1 w-full max-w-[22px]">
                              <div className="flex-1 rounded-t bg-emerald-400/80 group-hover:bg-emerald-400 transition-all duration-300" style={{ height: `${hIn}%` }} title={`${m.label}: income ${formatCurrency(m.income)}`} />
                              <div className="flex-1 rounded-t bg-[#FF2B66]/80 group-hover:bg-[#FF2B66] transition-all duration-300" style={{ height: `${hEx}%` }} title={`${m.label}: expense ${formatCurrency(m.expense)}`} />
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 dark:text-[#6B7280]">{m.label}</span>
                          </div>
                        )
                      })
                    })()}
                  </div>
                  <div className="mt-4 flex items-center gap-5 text-[11px] font-semibold text-gray-500 dark:text-[#9CA3AF]">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-emerald-400/80" /> Income</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#FF2B66]/80" /> Expense</span>
                  </div>
                </>}
            </Panel>
            <Panel title="Event Profitability" sub="Revenue (paid or venue fee) vs cost (POs + recorded expenses) per event.">
              {profitByEvent.length === 0
                ? <EmptyNote />
                : <HBars items={profitByEvent.map(p => ({ label: p.label, value: p.net, color: p.net >= 0 ? '#10B981' : '#EF4444' }))} />}
            </Panel>
            <Panel title="Outstanding Bills" sub="Unpaid and partially-paid invoices under the current view.">
              {pendingBills.length === 0 ? <EmptyNote text="No outstanding invoices — all caught up!" />
                : <HBars items={pendingBills.slice(0, 6).map(i => ({
                    label: `${i.invoiceNumber || `INV-${i.id}`} · ${i.clientName || clientById.get(i.clientId)?.CompanyName || '—'}`,
                    value: Math.max(0, Number(i.amount) - (Number(i.paidAmount) || 0)),
                  }))} />}
            </Panel>
          </div>
        )}

        {tab === 'sales' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Lead Pipeline" sub={`${fLeads.length} leads · ${leadConv}% conversion to confirmed appointment.`}>
              <HBars items={leadFunnel} />
            </Panel>
            <Panel title="New Clients by Month" sub="Clients added, grouped by inquiry month.">
              <VBars items={clientsByMonth.map((c, i) => ({ label: c.label, value: c.value }))} max={Math.max(1, ...clientsByMonth.map(c => c.value))} format={v => v.toLocaleString()} />
            </Panel>
            <Panel title="Acquisition by Source" sub="How clients first learned about the business.">
              <HBars items={clientsBySource} format={v => v.toLocaleString()} />
            </Panel>
            <Panel title="Top Clients by Budget" sub="Largest accounts on the books.">
              <HBars items={topClients} />
            </Panel>
          </div>
        )}

        {tab === 'operational' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Venue Utilization" sub="Events hosted per venue in the filtered window.">
              {venueUtil.length === 0 ? <EmptyNote /> : <HBars items={venueUtil} format={v => `${v} event${v === 1 ? '' : 's'}`} />}
            </Panel>
            <Panel title="Supplier Obligations" sub="Committed purchase orders by supplier.">
              <HBars items={supplierObligations} />
            </Panel>
            <Panel title="Employee Workload" sub="Active assignments per staff member.">
              <HBars items={empWorkload} format={v => `${v} event${v === 1 ? '' : 's'}`} />
            </Panel>
            <Panel title="Event Pipeline Balance" sub="Booked/upcoming vs completed/cancelled.">
              <Donut segs={[
                { label: 'Booked', value: fEvents.filter(e => e.Status === 'Booked').length, color: '#10B981' },
                { label: 'Pending', value: fEvents.filter(e => e.Status === 'Pending').length, color: '#F59E0B' },
                { label: 'Completed', value: fEvents.filter(e => e.Status === 'Completed').length, color: '#9CA3AF' },
                { label: 'Cancelled', value: fEvents.filter(e => e.Status === 'Cancelled').length, color: '#EF4444' },
              ]} centerLabel="EVENTS" />
            </Panel>
          </div>
        )}

        {tab === 'marketing' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Registrations per Event" sub="Ticket registrations against running events.">
              <HBars items={regsByEvent} format={v => v.toLocaleString()} />
            </Panel>
            <Panel title="Registration Status" sub="Attendee payment verification outcome.">
              <Donut segs={regStatusSegs} centerLabel="TICKETS" />
            </Panel>
            <Panel title="Attendee Growth by Month" sub="Registration volume by month.">
              <VBars items={regsByMonth.map((b, i) => ({ label: b.label, value: b.value }))} max={Math.max(1, ...regsByMonth.map(b => b.value))} format={v => v.toLocaleString()} />
            </Panel>
            <Panel title="Event Type Popularity" sub="Estimated audience-weighted demand by event type.">
              <HBars items={eventTypePopularity} format={v => `${v} guests`} />
            </Panel>
          </div>
        )}

        {tab === 'custom' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Build a report" sub="Drag a metric into the tray, or click to toggle it. Pick a grouping and how to show it.">
              <div className="space-y-4">
                {/* dataset */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">Dataset</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(CUSTOM_DATASETS).map(([key, d]) => (
                      <button key={key} onClick={() => { setDs(key); setMetric(d.metrics[0][0]); setGroup(d.groups[0][0]) }}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all ${ds === key
                          ? 'bg-[#FF2B66] text-white shadow-lg shadow-[#FF2B66]/25'
                          : 'border border-gray-200 dark:border-[#2A2A36] text-gray-500 dark:text-[#9CA3AF] hover:border-[#FF2B66]/40'}`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* metric drag tray */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">Metric (drag or click)</label>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-h-[44px] rounded-xl border-2 border-dashed border-gray-200 dark:border-[#2A2A36] p-1.5 flex flex-wrap gap-1.5 items-center"
                      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'link' }}
                      onDrop={e => { e.preventDefault(); const k = e.dataTransfer.getData('text/plain'); if (metrics.some(m => m[0] === k)) setMetric(k) }}>
                      {metrics.map(m => (
                        <button key={m[0]} draggable
                          onDragStart={e => e.dataTransfer.setData('text/plain', m[0])}
                          onClick={() => setMetric(m[0])}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${metric === m[0]
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                            : 'border border-gray-200 dark:border-[#2A2A36] text-gray-500 dark:text-[#9CA3AF] hover:border-[#FF2B66]/40'}`}>
                          <GripVertical size={11} className="opacity-50" /> {m[1]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* grouping + chart */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">Group by</label>
                    <div className="relative">
                      <select value={group} onChange={e => setGroup(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#0B0B0E] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#FF2B66]/50 cursor-pointer">
                        {groups.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                      </select>
                      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">Visualization</label>
                    <div className="flex gap-2">
                      {[['bar', 'Bar'], ['line', 'Line'], ['pie', 'Pie'], ['table', 'Table']].map(([k, l]) => (
                        <button key={k} onClick={() => setChart(k)}
                          className={`flex-1 rounded-xl px-3 py-2 text-xs font-bold transition-all ${chart === k
                            ? 'bg-[#FF2B66] text-white' : 'border border-gray-200 dark:border-[#2A2A36] text-gray-500 dark:text-[#9CA3AF] hover:border-[#FF2B66]/40'}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-[11px] text-gray-400 dark:text-[#6B7280]">
                {customRows.length} records · {customGrouped.length} grouped · total <span className="font-bold text-gray-900 dark:text-white">{chart !== 'pie' ? customTotal.toLocaleString() : `${customTotal.toLocaleString()} ${safeMetric === 'Amount' ? 'total' : ''}`}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold text-white">
                {customGrouped.slice(0, 20).map((g, i) => (
                  <span key={g.label} className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 bg-white/5 text-gray-300">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} /> {g.label} · {g.value.toLocaleString()}
                  </span>
                ))}
              </div>
            </Panel>

            {/* custom chart */}
            <Panel title={`${CUSTOM_DATASETS[ds].label} · ${metrics.find(m => m[0] === safeMetric)?.[1]} by ${groups.find(g => g[0] === safeGroup)?.[1]}`} sub="Rendered live from your filtered data.">
              {customGrouped.length === 0 ? <EmptyNote />
                : chart === 'pie' ? (
                  <div className="flex items-center justify-center">
                    <Donut segs={customGrouped.map((g, i) => ({ label: g.label, value: g.value, color: CHART_COLORS[i % CHART_COLORS.length] }))} centerLabel="GROUPS" />
                  </div>
                ) : chart === 'table' ? (
                  <div className="max-h-80 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-[#2A2A36]">
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">Group</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-[#2A2A36]/60">
                        {customGrouped.map(g => (
                          <tr key={g.label}>
                            <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-200">{g.label}</td>
                            <td className="px-3 py-2 text-right text-xs font-extrabold text-gray-900 dark:text-white">{g.value.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-end gap-1 h-40">
                      <svg className="w-full h-full" viewBox="0 0 600 160" preserveAspectRatio="none">
                        {(() => {
                          const max = Math.max(1, ...customGrouped.map(g => g.value))
                          const points = customGrouped.map((g, i) => {
                            const x = (i / Math.max(customGrouped.length - 1, 1)) * 600
                            const y = 150 - (g.value / max) * 130
                            return [x, y]
                          })
                          const segs = chart === 'line'
                            ? <polyline fill="none" stroke="#FF2B66" strokeWidth="3" points={points.map(p => p.join(',')).join(' ')} />
                            : points.map((p, i) => (
                                <rect key={i} x={p[0] + 18} y={p[1]} width={Math.max(12, 460 / Math.max(customGrouped.length, 1))}
                                  height={150 - p[1]} rx="3" fill={CHART_COLORS[i % CHART_COLORS.length]} />
                              ))
                          return segs
                        })()}
                      </svg>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {customGrouped.slice(0, 12).map(g => (
                        <span key={g.label} className="text-[10px] font-semibold text-gray-400 dark:text-[#6B7280]">{g.label}</span>
                      ))}
                    </div>
                  </div>
                )}
            </Panel>
          </div>
        )}
      </div>

      {/* ─── SCHEDULING MODAL ─── */}
      {schedOpen && (
        <div className="fx-modal-backdrop fx-open" onClick={() => setSchedOpen(false)}>
          <div className="fx-modal-panel !max-w-xl w-full max-h-[92vh] overflow-y-auto bg-white dark:bg-[#121217] border border-gray-200 dark:border-[#2A2A36] rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="relative bg-gradient-to-r from-[#FF2B66] to-[#FF5C8A] px-6 pt-5 pb-6">
              <button onClick={() => setSchedOpen(false)} aria-label="Close"
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all hover:rotate-90 duration-300">
                <X size={15} />
              </button>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Report Automation</h3>
                  <p className="text-white/80 text-xs">Scheduled summaries are simulated — Run now stamps the send time.</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* new schedule form */}
              <div className="rounded-xl border border-gray-200 dark:border-[#2A2A36] p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">New schedule</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <input value={schedForm.name} onChange={e => setSchedForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Weekly financial summary for management"
                      className="w-full rounded-xl border border-gray-300 dark:border-[#2A2A36] bg-white dark:bg-[#0B0B0E] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#FF2B66]/50" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1 block">Report</label>
                    <select value={schedForm.reportType} onChange={e => setSchedForm(f => ({ ...f, reportType: e.target.value }))}
                      className="w-full rounded-xl border border-gray-300 dark:border-[#2A2A36] bg-white dark:bg-[#0B0B0E] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#FF2B66]/50 cursor-pointer">
                      {Object.entries(REPORT_TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1 block">Frequency</label>
                    <select value={schedForm.frequency} onChange={e => { setSchedForm(f => ({ ...f, frequency: e.target.value, day: '' })) }}
                      className="w-full rounded-xl border border-gray-300 dark:border-[#2A2A36] bg-white dark:bg-[#0B0B0E] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#FF2B66]/50 cursor-pointer">
                      <option>Weekly</option><option>Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1 block">{schedForm.frequency === 'Weekly' ? 'Day of week' : 'Day of month'}</label>
                    <select value={schedForm.day} onChange={e => setSchedForm(f => ({ ...f, day: e.target.value }))}
                      className="w-full rounded-xl border border-gray-300 dark:border-[#2A2A36] bg-white dark:bg-[#0B0B0E] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#FF2B66]/50 cursor-pointer">
                      {schedForm.frequency === 'Weekly'
                        ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d, i) => <option key={d} value={i + 1}>{d}</option>)
                        : Array.from({ length: 28 }, (_, i) => <option key={i + 1} value={i + 1}>Day {i + 1}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1 block">Hour (24h)</label>
                    <select value={schedForm.hour} onChange={e => setSchedForm(f => ({ ...f, hour: e.target.value }))}
                      className="w-full rounded-xl border border-gray-300 dark:border-[#2A2A36] bg-white dark:bg-[#0B0B0E] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#FF2B66]/50 cursor-pointer">
                      {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1 block">Recipients (semicolon)</label>
                    <input value={schedForm.recipients} onChange={e => setSchedForm(f => ({ ...f, recipients: e.target.value }))}
                      placeholder="finance@eventsphere.com; gm@eventsphere.com"
                      className="w-full rounded-xl border border-gray-300 dark:border-[#2A2A36] bg-white dark:bg-[#0B0B0E] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#FF2B66]/50" />
                  </div>
                </div>
                <button onClick={saveSchedule} disabled={schedSaving}
                  className="inline-flex items-center gap-1.5 bg-[#FF2B66] hover:bg-[#E0245A] text-white text-xs font-semibold rounded-xl px-4 py-2.5 transition-colors disabled:opacity-60">
                  {schedSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Save schedule
                </button>
                {schedMsg && <p className="text-xs text-gray-500 dark:text-[#9CA3AF]">{schedMsg}</p>}
              </div>

              {/* existing schedules */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-[#6B7280] mb-2">Saved schedules</p>
                {schedules.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-[#6B7280] text-center py-6 border border-dashed border-gray-200 dark:border-[#2A2A36] rounded-xl">
                    No schedules yet — create one above.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-[#2A2A36]/60">
                    {schedules.map(s => (
                      <li key={s.id} className="py-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{s.name}</p>
                          <p className="text-[11px] text-gray-400 dark:text-[#6B7280]">
                            {REPORT_TYPES[s.reportType] || s.reportType} · {scheduleDesc(s)} · <span className={s.active ? 'text-emerald-500' : 'text-red-400'}>{s.active ? 'Active' : 'Paused'}</span>
                          </p>
                          <p className="text-[11px] text-gray-400 dark:text-[#6B7280]">
                            {s.recipients || 'No recipients'} · ran <span className="font-bold text-gray-700 dark:text-gray-200">{s.runCount}</span>×
                            {s.lastSentAt ? ` · last ${new Date(s.lastSentAt).toLocaleString()}` : ''}
                          </p>
                        </div>
                        <button onClick={() => runSchedule(s.id)} disabled={schedBusy === s.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-2 transition-colors disabled:opacity-50">
                          {schedBusy === s.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Run now
                        </button>
                        <button onClick={() => deleteSchedule(s.id)} aria-label="Delete" title="Delete"
                          className="h-8 w-8 rounded-lg border border-gray-200 dark:border-[#2A2A36] flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

function FilterSelect({ label, value, onChange, options, placeholder }) {
  return (
    <label className="flex flex-col gap-1 min-w-[140px]">
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">{label}</span>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-gray-50 dark:bg-[#0B0B0E] px-3 py-2 pr-8 text-xs text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#FF2B66]/50 cursor-pointer">
          <option value="">{placeholder || 'All'}</option>
          {options.map(o => <option key={o.key || o} value={o.key || o}>{o.label || o}</option>)}
        </select>
        <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>
    </label>
  )
}

function EmptyNote({ text = 'No data for this view yet.' }) {
  return (
    <p className="text-xs text-gray-400 dark:text-[#6B7280] text-center py-10 border border-dashed border-gray-200 dark:border-[#2A2A36] rounded-xl">
      {text}
    </p>
  )
}