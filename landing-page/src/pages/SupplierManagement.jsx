import { useMemo, useState } from 'react'
import {
  Truck, Star, Clock, PackageCheck, Phone, Mail, Search, ArrowRight, CircleCheck, PackageSearch,
  Plus, X, CheckCircle2, Loader2, ArrowLeft,
} from 'lucide-react'
import AppLayout from './AppLayout'
import { LiveTabs } from './EmployeeAssignments'
import { StatValue, Kpi, PageHeader, SearchBar, Chip } from '../components/dashboard/Shared'
import { formatCurrency } from '../components/dashboard/format'
import { useData } from '../api/data'
import './landingFx.css'

const AVATAR_BG = ['bg-[#FF2B66]/15 text-[#FF2B66]', 'bg-emerald-500/15 text-emerald-500', 'bg-blue-500/15 text-blue-500', 'bg-amber-500/15 text-amber-500', 'bg-purple-500/15 text-purple-400', 'bg-teal-500/15 text-teal-500']

const STATUS_PILL = {
  Active: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
  Review: 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300',
  Inactive: 'bg-gray-100 dark:bg-white/5 text-gray-400',
}
const PO_STATUS = {
  Ordered: { next: 'Shipped', cls: 'bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300' },
  Shipped: { next: 'Delivered', cls: 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300' },
  Delivered: { next: null, cls: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' },
}

/* ─── add supplier wizard ─── */
const DEFAULT_CATEGORIES = ['Audio/Visual', 'Catering', 'Florals & Decor', 'Lighting', 'Photography', 'Furniture', 'Entertainment', 'Transport']

function initials(name) {
  return String(name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function SupplierModal({ categories, onSave, onClose }) {
  const [form, setForm] = useState({
    Name: '',
    Category: '',
    ContactPerson: '',
    Email: '',
    Phone: '',
    City: '',
    LeadTimeDays: 3,
    Rating: 4.5,
    OnTimeRate: 95,
  })
  const [errors, setErrors] = useState({})
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const catOptions = useMemo(() => [...new Set([...categories.filter(Boolean), ...DEFAULT_CATEGORIES])], [categories])

  function inputClass(k) {
    return `w-full bg-gray-50 dark:bg-[#0B0B0E] border rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none transition-all ${
      errors[k] ? 'border-red-500' : 'border-gray-200 dark:border-[#2A2A36] focus:border-[#FF2B66]/60 focus:shadow-[0_0_0_3px_rgba(255,43,102,0.1)]'
    }`
  }

  function validate() {
    const errs = {}
    if (!form.Name.trim()) errs.Name = 'Supplier name is required'
    if (!form.ContactPerson.trim()) errs.ContactPerson = 'Contact person is required'
    if (!/^\S+@\S+\.\S+$/.test(form.Email)) errs.Email = 'Enter a valid email'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function confirm() {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setDone(true)
      setTimeout(() => onSave({ ...form, Status: 'Active' }), 750)
    }, 650)
  }

  return (
    <div className="fx-modal-backdrop fx-open" onClick={onClose}>
      <div className="fx-modal-panel !max-w-2xl w-full max-h-[92vh] overflow-y-auto no-scrollbar bg-white dark:bg-[#121217] border border-gray-200 dark:border-[#2A2A36] rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* gradient header */}
        <div className="relative bg-gradient-to-r from-[#FF2B66] to-[#FF5C8A] px-6 pt-5 pb-6">
          <button onClick={onClose} aria-label="Close"
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all hover:rotate-90 duration-300">
            <X size={15} />
          </button>
          <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white mb-3">
            <PackageCheck size={20} />
          </div>
          <h3 className="font-bold text-lg text-white">Add a supplier</h3>
          <p className="text-white/80 text-xs mt-0.5">
            {step === 1 ? 'Who will you be working with?' : 'Almost there — review the supplier.'}
          </p>
          <div className="mt-4 flex items-center gap-2">
            {[1, 2].map(s => (
              <button key={s} onClick={() => { if (s === 1 || validate()) setStep(s) }}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold transition-all ${
                  step === s ? 'bg-white text-[#FF2B66]' : step > s ? 'bg-white/30 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}>
                {s === 2 && step === 2 ? <CheckCircle2 size={10} /> : null}
                {s === 1 ? 'Details' : 'Review'}
              </button>
            ))}
            <div className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden ml-1">
              <div className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: step === 1 ? '50%' : '100%' }} />
            </div>
          </div>
        </div>

        {done ? (
          <div className="py-14 flex flex-col items-center text-center gap-3 fx-mode-swap">
            <div className="fx-success-pop w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle2 size={30} className="text-emerald-500" />
            </div>
            <p className="font-bold text-gray-900 dark:text-white">Supplier added!</p>
            <p className="text-xs text-gray-500 dark:text-[#9CA3AF]">
              {form.Name} is now part of your directory.
            </p>
          </div>
        ) : step === 1 ? (
          <form key="step1" onSubmit={e => { e.preventDefault(); if (validate()) setStep(2) }}
            className="p-6 space-y-4 fx-mode-swap">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">Supplier name</label>
                <input type="text" value={form.Name} onChange={e => set('Name', e.target.value)}
                  placeholder="e.g. Manila AV Solutions"
                  className={inputClass('Name')} />
                {errors.Name && <p className="text-red-500 text-xs mt-1">{errors.Name}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">Category</label>
                <select value={form.Category} onChange={e => set('Category', e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#0B0B0E] border border-gray-200 dark:border-[#2A2A36] rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#FF2B66]/60 cursor-pointer">
                  <option value="">Select…</option>
                  {catOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">Contact person</label>
                <input type="text" value={form.ContactPerson} onChange={e => set('ContactPerson', e.target.value)}
                  placeholder="Full name"
                  className={inputClass('ContactPerson')} />
                {errors.ContactPerson && <p className="text-red-500 text-xs mt-1">{errors.ContactPerson}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">City</label>
                <input type="text" value={form.City} onChange={e => set('City', e.target.value)}
                  placeholder="e.g. Makati"
                  className={inputClass('City')} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">Email</label>
                <input type="email" value={form.Email} onChange={e => set('Email', e.target.value)}
                  placeholder="name@supplier.ph"
                  className={inputClass('Email')} />
                {errors.Email && <p className="text-red-500 text-xs mt-1">{errors.Email}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">Phone</label>
                <input type="text" value={form.Phone} onChange={e => set('Phone', e.target.value)}
                  placeholder="+63 917 123 4567"
                  className={inputClass('Phone')} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">Lead time (days)</label>
                <input type="number" min="1" value={form.LeadTimeDays}
                  onChange={e => set('LeadTimeDays', Number(e.target.value))}
                  className={inputClass('LeadTimeDays')} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">Rating</label>
                <input type="number" min="0" max="5" step="0.1" value={form.Rating}
                  onChange={e => set('Rating', Number(e.target.value))}
                  className={inputClass('Rating')} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">On-time %</label>
                <input type="number" min="0" max="100" value={form.OnTimeRate}
                  onChange={e => set('OnTimeRate', Number(e.target.value))}
                  className={inputClass('OnTimeRate')} />
              </div>
            </div>
            <button type="submit"
              className="w-full bg-[#FF2B66] hover:bg-[#E0245A] text-white font-semibold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-rose-500/20">
              Review supplier <ArrowRight size={15} />
            </button>
          </form>
        ) : (
          <div key="step2" className="p-6 fx-mode-swap">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#6B7280] mb-3">
              Live preview — how they'll appear in the directory
            </p>
            <div className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] p-5 bg-gray-50 dark:bg-white/5">
              <div className="flex items-start gap-3">
                <div className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm ${AVATAR_BG[0]}`}>
                  {initials(form.Name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 dark:text-white truncate">{form.Name || '—'}</p>
                  <p className="text-xs text-gray-500 dark:text-[#9CA3AF]">{form.Category || 'Category'} · {form.City || 'City'}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs">
                    {[0, 1, 2, 3, 4].map(n => (
                      <Star key={n} size={11} fill={n < Math.round(form.Rating) ? '#FF2B66' : 'none'}
                        className={n < Math.round(form.Rating) ? 'text-[#FF2B66]' : 'text-gray-300 dark:text-[#4B5563]'} />
                    ))}
                    <span className="font-bold text-gray-700 dark:text-gray-200 ml-1">{form.Rating}</span>
                  </div>
                </div>
                <span className="ml-auto shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">Active</span>
              </div>
              <div className="mt-4 space-y-1.5 text-xs text-gray-500 dark:text-[#9CA3AF]">
                <p className="flex items-center gap-1.5 truncate"><Mail size={11} className="shrink-0 text-[#FF2B66]" /> {form.Email || '—'}</p>
                <p className="flex items-center gap-1.5"><Phone size={11} className="shrink-0 text-[#FF2B66]" /> {form.Phone || '—'} · {form.LeadTimeDays}-day lead</p>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#6B7280] mb-1">
                  <span>On-time delivery</span><span className={form.OnTimeRate >= 90 ? 'text-emerald-500' : 'text-amber-500'}>{form.OnTimeRate}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                  <div className={`h-full rounded-full ${form.OnTimeRate >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${form.OnTimeRate}%` }} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setStep(1)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-[#2A2A36] px-4 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:border-[#FF2B66]/50 hover:text-[#FF2B66] transition-colors">
                <ArrowLeft size={14} /> Edit
              </button>
              <button onClick={confirm} disabled={saving}
                className="flex-1 bg-[#FF2B66] hover:bg-[#E0245A] text-white font-semibold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-rose-500/20 disabled:opacity-60">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Add to directory'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SupplierManagement({ user }) {
  const { data } = useData()
  const { suppliers: seed, purchaseOrders, events } = data
  const [tab, setTab] = useState('directory')
  const [suppliers, setSuppliers] = useState(seed)
  const [orders, setOrders] = useState(purchaseOrders)
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('All')
  const [showAddSupplier, setShowAddSupplier] = useState(false)

  const cats = useMemo(() => ['All', ...new Set(suppliers.map(s => s.Category))], [suppliers])
  const supById = useMemo(() => new Map(suppliers.map(s => [s.Id, s])), [suppliers])
  const filtered = suppliers.filter(s =>
    (cat === 'All' || s.Category === cat) &&
    `${s.Name} ${s.City} ${s.ContactPerson} ${s.Category}`.toLowerCase().includes(query.toLowerCase())
  )

  const active = suppliers.filter(s => s.Status === 'Active').length
  const openOrders = orders.filter(o => o.Status !== 'Delivered').length
  const committed = orders.reduce((sum, o) => sum + o.Amount, 0)
  const avgLead = suppliers.length ? Math.round(suppliers.reduce((s, x) => s + x.LeadTimeDays, 0) / suppliers.length) : 0

  function cycleStatus(id) {
    setSuppliers(list => list.map(s => s.Id === id
      ? { ...s, Status: s.Status === 'Active' ? 'Review' : s.Status === 'Review' ? 'Inactive' : 'Active' }
      : s))
  }
  function advancePO(id) {
    setOrders(list => list.map(o => o.Id === id && PO_STATUS[o.Status].next
      ? { ...o, Status: PO_STATUS[o.Status].next } : o))
  }
  function addSupplier(s) {
    const id = Math.max(0, ...suppliers.map(x => x.Id)) + 1
    setSuppliers(list => [...list, { Id: id, Status: 'Active', ...s }])
  }

  const TABS = [
    { key: 'directory', label: 'Supplier Directory', icon: Truck },
    { key: 'orders', label: 'Purchase Orders', icon: PackageCheck },
  ]

  return (
    <AppLayout user={user} badgeCount={data.leads.length}>
      <PageHeader section="Resources" icon={Truck} title="Supplier Management"
        actions={
          <div className="flex flex-col items-start md:items-end gap-3">
            <LiveTabs tabs={TABS} tab={tab} setTab={setTab} />
            <button onClick={() => setShowAddSupplier(true)}
              className="inline-flex items-center gap-1.5 bg-[#FF2B66] hover:bg-[#E0245A] text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-all hover:shadow-lg hover:shadow-rose-500/20 active:scale-95">
              <Plus size={15} /> Add Supplier
            </button>
          </div>
        }>
        <span className="font-bold text-gray-900 dark:text-white"><StatValue value={suppliers.length} /></span> suppliers across{' '}
        <span className="font-bold text-[#FF2B66]">{cats.length - 1}</span> categories ·{' '}
        <span className="font-bold text-gray-900 dark:text-white"><StatValue value={openOrders} /></span> open orders
      </PageHeader>

      {tab === 'directory' ? (
        <div key="directory" className="fx-tab-panel space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi icon={Truck} label="Suppliers"><StatValue value={suppliers.length} /></Kpi>
            <Kpi icon={CircleCheck} label="Active" tone="text-emerald-500" bg="bg-emerald-500/10" delay={80}><StatValue value={active} /></Kpi>
            <Kpi icon={Clock} label="Avg. Lead Time" delay={160}><StatValue value={avgLead} suffix=" days" /></Kpi>
            <Kpi icon={PackageCheck} label="PO Value" tone="text-blue-500" bg="bg-blue-500/10" delay={240}>
              ₱<StatValue value={committed} />
            </Kpi>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-4 flex flex-col lg:flex-row gap-3">
            <SearchBar value={query} onChange={setQuery} placeholder="Search suppliers by name, contact, city..." />
            <div className="flex flex-wrap gap-1.5">
              {cats.map(c => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-14 text-center space-y-2">
              <Search size={30} className="text-[#FF2B66] mx-auto" />
              <h3 className="font-bold text-gray-900 dark:text-white">No suppliers found</h3>
              <p className="text-sm text-gray-500 dark:text-[#9CA3AF]">Try a different search or category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((s, i) => (
                <section key={s.Id}
                  style={{ transitionDelay: `${i * 60}ms` }}
                  className="fx-reveal fx-in rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[#FF2B66]/40">
                  <div className="flex items-start gap-3">
                    <div className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm ${AVATAR_BG[i % AVATAR_BG.length]}`}>
                      {s.Name.split(/\s+/).map(w => w[0]).slice(0, 2).join('')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">{s.Name}</h3>
                      <p className="text-xs text-gray-500 dark:text-[#9CA3AF]">{s.Category} · {s.City}</p>
                    </div>
                    <button onClick={() => cycleStatus(s.Id)} title="Click to change status"
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold transition-all active:scale-95 ${STATUS_PILL[s.Status]}`}>
                      {s.Status}
                    </button>
                  </div>

                  <div className="mt-4 flex items-center gap-3 text-xs text-gray-500 dark:text-[#9CA3AF]">
                    <span className="flex items-center gap-1">
                      {[0, 1, 2, 3, 4].map(n => (
                        <Star key={n} size={12} fill={n < Math.round(s.Rating) ? '#FF2B66' : 'none'}
                          className={n < Math.round(s.Rating) ? 'text-[#FF2B66]' : 'text-gray-300 dark:text-[#4B5563]'} />
                      ))}
                      <span className="font-bold text-gray-700 dark:text-gray-200 ml-1">{s.Rating}</span>
                    </span>
                    <span className="ml-auto flex items-center gap-1"><Clock size={11} /> {s.LeadTimeDays}-day lead</span>
                  </div>

                  {/* on-time delivery bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#6B7280] mb-1">
                      <span>On-time delivery</span><span className={s.OnTimeRate >= 90 ? 'text-emerald-500' : 'text-amber-500'}>{s.OnTimeRate}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${s.OnTimeRate >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${s.OnTimeRate}%` }} />
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-gray-500 dark:text-[#9CA3AF] truncate">
                    Contact: <span className="font-semibold text-gray-700 dark:text-gray-200">{s.ContactPerson}</span>
                  </p>
                  <div className="mt-3 flex gap-2 pt-3 border-t border-gray-200 dark:border-[#2A2A36]/60">
                    <a href={`mailto:${s.Email}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-[#2A2A36] py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:border-[#FF2B66]/50 hover:text-[#FF2B66] transition-colors">
                      <Mail size={12} /> Email
                    </a>
                    <a href={`tel:${s.Phone.replace(/\s/g, '')}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-[#2A2A36] py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:border-[#FF2B66]/50 hover:text-[#FF2B66] transition-colors">
                      <Phone size={12} /> Call
                    </a>
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div key="orders" className="fx-tab-panel space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi icon={PackageCheck} label="Total POs"><StatValue value={orders.length} /></Kpi>
            <Kpi icon={PackageSearch} label="In Transit" tone="text-amber-500" bg="bg-amber-500/10" delay={80}>
              <StatValue value={orders.filter(o => o.Status === 'Shipped').length} />
            </Kpi>
            <Kpi icon={CircleCheck} label="Delivered" tone="text-emerald-500" bg="bg-emerald-500/10" delay={160}>
              <StatValue value={orders.filter(o => o.Status === 'Delivered').length} />
            </Kpi>
            <Kpi icon={Truck} label="Committed Spend" tone="text-blue-500" bg="bg-blue-500/10" delay={240}>
              ₱<StatValue value={committed} />
            </Kpi>
          </div>

          <section className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#2A2A36]">
                  {['PO #', 'Supplier', 'Event', 'Item', 'Amount', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#2A2A36]/60">
                {orders.map(o => {
                  const meta = PO_STATUS[o.Status]
                  return (
                    <tr key={o.Id} className="transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-[#FF2B66]">{o.Id}</td>
                      <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-white">{supById.get(o.SupplierId)?.Name || '—'}</td>
                      <td className="px-4 py-3.5 text-gray-500 dark:text-[#9CA3AF] max-w-[140px] truncate">{events.find(e => e.Id === o.EventId)?.Name || '—'}</td>
                      <td className="px-4 py-3.5 text-gray-600 dark:text-gray-300 max-w-[200px] truncate">{o.Item}</td>
                      <td className="px-4 py-3.5 font-semibold text-gray-900 dark:text-white whitespace-nowrap">{formatCurrency(o.Amount)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${meta.cls}`}>{o.Status}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {meta.next ? (
                          <button onClick={() => advancePO(o.Id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#FF2B66]/40 bg-[#FF2B66]/10 px-3 py-1.5 text-xs font-bold text-[#FF2B66] hover:bg-[#FF2B66]/20 transition-all active:scale-95">
                            Mark {meta.next} <ArrowRight size={12} />
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-500 font-bold flex items-center justify-end gap-1"><CircleCheck size={13} /> Done</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          </section>
        </div>
      )}

      {showAddSupplier && (
        <SupplierModal
          categories={suppliers.map(s => s.Category)}
          onSave={addSupplier}
          onClose={() => setShowAddSupplier(false)}
        />
      )}
    </AppLayout>
  )
}
