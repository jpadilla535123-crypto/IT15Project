import { useMemo, useState } from 'react'
import {
  Building2, MapPin, Users, Wallet, Plus, Pencil, Trash2, Search,
  Wrench, CheckCircle2, TrendingUp, X, ArrowRight, ArrowLeft, Loader2,
} from 'lucide-react'
import AppLayout from './AppLayout'
import { useData } from '../api/data'
import { api } from '../api/client'
import { useSystem } from '../components/dashboard/SystemState'
import { useCountUp } from '../components/dashboard/useFx'
import './landingFx.css'

function StatValue({ value, prefix = '', suffix = '' }) {
  const [ref, v] = useCountUp(value)
  return <span ref={ref}>{prefix}{v.toLocaleString()}{suffix}</span>
}

function VenueModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || { Name: '', City: '', Address: '', Capacity: '', PricePerDay: '', ContactPerson: '' })
  const [errors, setErrors] = useState({})
  const [step, setStep] = useState(1) // 1 details → 2 review
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const isEdit = !!initial

  function validate() {
    const errs = {}
    if (!form.Name.trim()) errs.Name = 'Venue name is required'
    if (!form.City.trim()) errs.City = 'City is required'
    if (!form.Capacity || +form.Capacity < 1) errs.Capacity = 'Enter a valid capacity'
    if (!form.PricePerDay || +form.PricePerDay < 0) errs.PricePerDay = 'Enter a valid price'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function confirm() {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setDone(true)
      setTimeout(() => onSave({ ...form, Capacity: +form.Capacity, PricePerDay: +form.PricePerDay }), 750)
    }, 650)
  }

  return (
    <div className="fx-modal-backdrop fx-open" onClick={onClose}>
      <div className="fx-modal-panel !max-w-md w-full max-h-[92vh] overflow-y-auto bg-white dark:bg-[#121217] border border-gray-200 dark:border-[#2A2A36] rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* gradient header */}
        <div className="relative bg-gradient-to-r from-[#FF2B66] to-[#FF5C8A] px-6 pt-5 pb-6">
          <button onClick={onClose} aria-label="Close"
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all hover:rotate-90 duration-300">
            <X size={15} />
          </button>
          <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white mb-3">
            <Building2 size={20} />
          </div>
          <h3 className="font-bold text-lg text-white">{isEdit ? 'Edit venue' : 'Add a new venue'}</h3>
          <p className="text-white/80 text-xs mt-0.5">
            {step === 1 ? 'Tell us about the space.' : 'Almost there — review the details.'}
          </p>
          {/* step progress */}
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
            <p className="font-bold text-gray-900 dark:text-white">{isEdit ? 'Venue updated!' : 'Venue added!'}</p>
            <p className="text-xs text-gray-500 dark:text-[#9CA3AF]">{form.Name} is ready to book.</p>
          </div>
        ) : step === 1 ? (
          /* ─── STEP 1: DETAILS ─── */
          <form key="step1" onSubmit={e => { e.preventDefault(); if (validate()) setStep(2) }}
            className="p-6 space-y-4 fx-mode-swap">
            <div className="grid grid-cols-2 gap-3">
              {[['Name', 'Venue name', 'text', 'col-span-2'], ['Address', 'Address (optional)', 'text', 'col-span-2'],
                ['City', 'City', 'text', ''], ['Capacity', 'Capacity', 'number', ''],
                ['PricePerDay', 'Price / day (₱)', 'number', ''], ['ContactPerson', 'Contact person', 'text', '']]
                .map(([key, label, type, span]) => (
                  <div key={key} className={span}>
                    <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">{label}</label>
                    <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
                      className={`w-full bg-gray-50 dark:bg-[#0B0B0E] border rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none transition-all ${errors[key] ? 'border-red-500' : 'border-gray-200 dark:border-[#2A2A36] focus:border-[#FF2B66]/60 focus:shadow-[0_0_0_3px_rgba(255,43,102,0.1)]'}`} />
                    {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
                  </div>
                ))}
            </div>
            <button type="submit"
              className="w-full bg-[#FF2B66] hover:bg-[#E0245A] text-white font-semibold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-rose-500/20">
              Review venue <ArrowRight size={15} />
            </button>
          </form>
        ) : (
          /* ─── STEP 2: LIVE PREVIEW + CONFIRM ─── */
          <div key="step2" className="p-6 fx-mode-swap">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#6B7280] mb-3">
              Live preview — this is how clients will see it
            </p>
            <div className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] p-5 bg-gray-50 dark:bg-white/5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-bold text-gray-900 dark:text-white truncate">{form.Name || 'Untitled venue'}</h4>
                  <p className="text-xs text-gray-500 dark:text-[#9CA3AF] mt-0.5 flex items-center gap-1 truncate">
                    <MapPin size={12} className="shrink-0" /> {form.Address ? `${form.Address}, ` : ''}{form.City || '—'}
                  </p>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                  <CheckCircle2 size={11} /> Available
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="min-w-0 rounded-xl bg-white dark:bg-[#121217] border border-gray-200 dark:border-[#2A2A36] p-2.5">
                  <p className="text-xs font-extrabold text-gray-900 dark:text-white break-words">{form.Capacity ? (+form.Capacity).toLocaleString() : '—'}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">Capacity</p>
                </div>
                <div className="min-w-0 rounded-xl bg-white dark:bg-[#121217] border border-gray-200 dark:border-[#2A2A36] p-2.5">
                  <p className="text-xs font-extrabold text-gray-900 dark:text-white break-words">{form.PricePerDay ? `₱${(+form.PricePerDay).toLocaleString()}` : '—'}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">Per Day</p>
                </div>
                <div className="rounded-xl bg-white dark:bg-[#121217] border border-gray-200 dark:border-[#2A2A36] p-2.5">
                  <p className="text-sm font-extrabold text-[#FF2B66]">0</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">Bookings</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-[#9CA3AF] truncate">
                Contact: <span className="font-semibold text-gray-700 dark:text-gray-200">{form.ContactPerson || '—'}</span>
              </p>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setStep(1)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-[#2A2A36] px-4 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:border-[#FF2B66]/50 hover:text-[#FF2B66] transition-colors">
                <ArrowLeft size={14} /> Edit
              </button>
              <button onClick={confirm} disabled={saving}
                className="flex-1 bg-[#FF2B66] hover:bg-[#E0245A] text-white font-semibold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-rose-500/20 disabled:opacity-60">
                {saving
                  ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
                  : isEdit ? 'Save changes' : 'Add venue'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function VenueManagement({ user }) {
  const { data } = useData()
  const { venues: seedVenues, events } = data
  const { venueStatus, setVenueStatus } = useSystem()
  const [venues, setVenues] = useState(seedVenues)
  const status = venueStatus
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('All')
  const [modal, setModal] = useState(null)   // null | 'new' | venue object
  const [confirmDelete, setConfirmDelete] = useState(null)

  const cities = useMemo(() => ['All', ...new Set(venues.map(v => v.City))], [venues])

  const bookingsByVenue = useMemo(() => {
    const m = new Map()
    events.filter(e => e.Status !== 'Cancelled').forEach(e => {
      m.set(e.VenueId, (m.get(e.VenueId) || 0) + 1)
    })
    return m
  }, [events])

  const filtered = venues.filter(v =>
    (city === 'All' || v.City === city) &&
    `${v.Name} ${v.Address} ${v.City}`.toLowerCase().includes(query.toLowerCase())
  )

  const totalCapacity = venues.reduce((s, v) => s + v.Capacity, 0)
  const avgPrice = venues.length ? Math.round(venues.reduce((s, v) => s + v.PricePerDay, 0) / venues.length) : 0
  const topVenue = [...venues].sort((a, b) => (bookingsByVenue.get(b.Id) || 0) - (bookingsByVenue.get(a.Id) || 0))[0]

  function saveVenue(data) {
    const body = {
      name: data.Name, address: data.Address || '', city: data.City || '',
      capacity: Number(data.Capacity) || 0, pricePerDay: Number(data.PricePerDay) || 0,
      contactPerson: data.ContactPerson, phone: data.Phone || '', email: data.Email || '',
      status: 'Available',
    }
    if (modal === 'new') {
      api.post('/api/venues', body).then(v => {
        const newId = v.id
        setVenues(vs => [...vs, { Id: newId, Status: 'Available', Phone: '', Email: '', Description: '', ...data }])
        setVenueStatus(s => ({ ...s, [newId]: 'Available' }))
      }).catch(err => console.error('Add venue failed:', err))
    } else {
      const v = venues.find(x => x.Id === modal.Id)
      api.put(`/api/venues/${modal.Id}`, { ...body, status: status[modal.Id] || v?.Status || 'Available' }).then(() => {
        setVenues(vs => vs.map(v => (v.Id === modal.Id ? { ...v, ...data } : v)))
      }).catch(err => console.error('Update venue failed:', err))
    }
    setModal(null)
  }

  function toggleStatus(id) {
    const STATUS_CYCLE = ['Available', 'Under Maintenance', 'Occupied']
    const current = status[id] || 'Available'
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length]
    const v = venues.find(x => x.Id === id)
    setVenueStatus(s => ({ ...s, [id]: next }))
    if (v) {
      api.put(`/api/venues/${id}`, {
        name: v.Name, address: v.Address || '', city: v.City,
        capacity: v.Capacity, pricePerDay: v.PricePerDay,
        contactPerson: v.ContactPerson, phone: v.Phone || '', email: v.Email || '',
        status: next,
      }).catch(err => console.error('Status update failed:', err))
    }
  }

  function removeVenue(id) {
    if (confirmDelete !== id) { setConfirmDelete(id); return }
    api.delete(`/api/venues/${id}`).then(() => {
      setVenues(vs => vs.filter(v => v.Id !== id))
    }).catch(err => console.error('Delete failed:', err))
    setConfirmDelete(null)
  }

  return (
    <AppLayout user={user} badgeCount={data.leads.length}>
      {/* header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#6B7280]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF2B66]" /> Resources
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 size={22} className="text-[#FF2B66]" /> Venue Management
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-[#9CA3AF]">
            <span className="font-bold text-gray-900 dark:text-white"><StatValue value={venues.length} /></span> venues ·{' '}
            <span className="font-bold text-[#FF2B66]"><StatValue value={totalCapacity} /></span> total capacity
          </p>
        </div>
        <button onClick={() => setModal('new')}
          className="inline-flex items-center gap-1.5 bg-[#FF2B66] hover:bg-[#E0245A] text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-all hover:shadow-lg hover:shadow-rose-500/20 active:scale-95 self-start md:self-end">
          <Plus size={16} /> Add Venue
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Building2, label: 'Venues', node: <StatValue value={venues.length} /> },
          { icon: Users, label: 'Total Capacity', node: <StatValue value={totalCapacity} suffix=" guests" /> },
          { icon: Wallet, label: 'Avg. Price / Day', node: <StatValue value={avgPrice} prefix="₱" /> },
          { icon: TrendingUp, label: 'Most Booked', node: <span className="text-sm">{topVenue?.Name || '—'}</span> },
        ].map((k, i) => (
          <div key={k.label}
            style={{ transitionDelay: `${i * 80}ms` }}
            className="fx-stat-cell rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-lg font-extrabold text-gray-900 dark:text-white truncate">{k.node}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">{k.label}</p>
            </div>
            <div className="h-10 w-10 shrink-0 rounded-xl bg-[#FF2B66]/10 flex items-center justify-center text-[#FF2B66]">
              <k.icon size={18} />
            </div>
          </div>
        ))}
      </div>

      {/* toolbar */}
      <div className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-4 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search venues by name, address, city..."
            className="w-full bg-gray-50 dark:bg-[#0B0B0E] border border-gray-200 dark:border-[#2A2A36] text-gray-900 dark:text-white rounded-full pl-10 pr-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#FF2B66]/50" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {cities.map(c => (
            <button key={c} onClick={() => setCity(c)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${city === c
                ? 'bg-[#FF2B66] text-white'
                : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-[#9CA3AF] hover:text-[#FF2B66]'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* venue grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-14 text-center space-y-3">
          <Search size={30} className="text-[#FF2B66] mx-auto" />
          <h3 className="font-bold text-gray-900 dark:text-white">No venues found</h3>
          <p className="text-sm text-gray-500 dark:text-[#9CA3AF]">Try a different search or clear the city filter.</p>
          <button onClick={() => { setQuery(''); setCity('All') }}
            className="inline-block rounded-xl border border-[#FF2B66] text-[#FF2B66] text-sm font-semibold px-5 py-2 hover:bg-[#FF2B66]/5 transition-colors">
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((v, i) => {
            const st = status[v.Id] || 'Available'
            const bookingCount = bookingsByVenue.get(v.Id) || 0
            return (
              <section key={v.Id}
                style={{ transitionDelay: `${i * 60}ms` }}
                className={`fx-reveal fx-in rounded-2xl border bg-white dark:bg-[#121217] p-5 transition-all hover:-translate-y-1 hover:shadow-lg ${
                  st !== 'Available'
                    ? 'border-amber-500/40 dark:border-amber-500/30'
                    : 'border-gray-200 dark:border-[#2A2A36] hover:border-[#FF2B66]/40'
                }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{v.Name}</h3>
                    <p className="text-xs text-gray-500 dark:text-[#9CA3AF] mt-0.5 flex items-center gap-1 truncate">
                      <MapPin size={12} className="shrink-0" /> {v.Address ? `${v.Address}, ` : ''}{v.City}
                    </p>
                  </div>
                  <button onClick={() => toggleStatus(v.Id)} title={`Status: ${st} — click to change`}
                    className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition-all active:scale-95 ${
                      st === 'Available'
                        ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-200'
                        : st === 'Occupied'
                          ? 'bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-300 hover:bg-red-200'
                          : 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 hover:bg-amber-200'
                    }`}>
                    {st === 'Available' ? <CheckCircle2 size={11} /> : <Wrench size={11} />}
                    {st}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-2.5">
                    <p className="text-sm font-extrabold text-gray-900 dark:text-white">{v.Capacity.toLocaleString()}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">Capacity</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-2.5">
                    <p className="text-sm font-extrabold text-gray-900 dark:text-white">₱{v.PricePerDay.toLocaleString()}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">Per Day</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-2.5">
                    <p className="text-sm font-extrabold text-[#FF2B66]">{bookingCount}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">Bookings</p>
                  </div>
                </div>

                <p className="mt-3 text-xs text-gray-500 dark:text-[#9CA3AF] truncate">
                  Contact: <span className="font-semibold text-gray-700 dark:text-gray-200">{v.ContactPerson || '—'}</span>
                </p>

                <div className="mt-4 flex gap-2 pt-3 border-t border-gray-200 dark:border-[#2A2A36]/60">
                  <button onClick={() => setModal(v)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-[#2A2A36] py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:border-[#FF2B66]/50 hover:text-[#FF2B66] transition-colors active:scale-95">
                    <Pencil size={13} /> Edit
                  </button>
                  <button onClick={() => removeVenue(v.Id)} title={confirmDelete === v.Id ? 'Click again to confirm' : 'Delete'}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all active:scale-95 ${
                      confirmDelete === v.Id
                        ? 'bg-red-500 text-white'
                        : 'border border-gray-200 dark:border-[#2A2A36] text-gray-500 dark:text-[#9CA3AF] hover:border-red-500/50 hover:text-red-500'
                    }`}>
                    <Trash2 size={13} /> {confirmDelete === v.Id ? 'Confirm?' : ''}
                  </button>
                </div>
              </section>
            )
          })}
        </div>
      )}

      {modal && (
        <VenueModal
          initial={modal === 'new' ? null : venues.find(v => v.Id === modal.Id)}
          onSave={saveVenue}
          onClose={() => setModal(null)} />
      )}
    </AppLayout>
  )
}
