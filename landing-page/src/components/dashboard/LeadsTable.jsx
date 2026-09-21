import { useMemo, useState } from 'react'
import {
  Search, Plus, List, LayoutGrid, ChevronDown, ChevronLeft, ChevronRight,
  Phone, Pencil, Check, X, Loader2,
} from 'lucide-react'
import { api } from '../../api/client'
import { useData } from '../../api/data'

const PAGE_SIZE = 10

const EDIT_OPTIONS = ['Contacted', 'Confirmed Appointment', 'Lost']

const STATUS_TONES = {
  New: 'bg-[#FF2B66]/10 text-[#FF2B66] dark:bg-[#FF2B66]/15 dark:text-[#FF7A9F]',
  Contacted: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  'Confirmed Appointment': 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  Cancelled: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300',
  Lost: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300',
}

const STATUS_ORDER = {
  New: 0,
  Contacted: 1,
  'Confirmed Appointment': 2,
  Cancelled: 3,
  Lost: 4,
}

const FILTER_OPTIONS = ['All Leads', 'New', 'Contacted', 'Confirmed Appointment', 'Lost']
const EVENT_TYPES = ['Conference', 'Wedding', 'Corporate', 'Concert', 'Private Party', 'Others']
const SOURCES = ['Website', 'Referral', 'Phone', 'Walk-in', 'Email Campaign']

function statusBadge(status) {
  const tone = STATUS_TONES[status] || STATUS_TONES.New
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {status}
    </span>
  )
}

function initials(name) {
  return String(name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

const inputCls = 'w-full bg-gray-100 dark:bg-[#181820] border border-transparent focus:border-[#FF2B66]/60 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#6B7280] focus:outline-none transition-colors'

function AddLeadModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', source: 'Website',
    eventType: 'Conference', budget: '', notes: '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [general, setGeneral] = useState('')

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Please enter a contact name'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit() {
    if (!validate()) return
    setSaving(true)
    setGeneral('')
    try {
      const lead = await api.post('/api/leads', {
        companyName: form.company.trim() || form.name.trim(),
        contactName: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        source: form.source,
        eventType: form.eventType,
        estimatedBudget: Number(form.budget) || 0,
        status: 'New',
        notes: form.notes.trim(),
        createdDate: new Date().toISOString().slice(0, 10),
      })
      onCreated(lead)
      onClose()
    } catch (err) {
      setGeneral(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget && !saving) onClose() }}>
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#2A2A36]">
          <h3 className="font-bold text-gray-900 dark:text-white">Add Lead</h3>
          <button onClick={onClose} disabled={saving} className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 disabled:opacity-40">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">Contact name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Juan Dela Cruz"
                className={`${inputCls} ${errors.name ? '!border-[#FF2B66]' : ''}`} />
              {errors.name && <p className="text-[#FF2B66] text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">Email *</label>
              <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@email.com"
                className={`${inputCls} ${errors.email ? '!border-[#FF2B66]' : ''}`} />
              {errors.email && <p className="text-[#FF2B66] text-xs mt-1">{errors.email}</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+63 900 000 0000"
                className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">Company</label>
              <input value={form.company} onChange={e => set('company', e.target.value)} placeholder="Company / brand"
                className={inputCls} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">Source</label>
              <select value={form.source} onChange={e => set('source', e.target.value)} className={`${inputCls} cursor-pointer`}>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">Event type</label>
              <select value={form.eventType} onChange={e => set('eventType', e.target.value)} className={`${inputCls} cursor-pointer`}>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">Estimated budget (PHP)</label>
            <input type="number" min="0" value={form.budget} onChange={e => set('budget', e.target.value)} placeholder="e.g. 150000"
              className={inputCls} />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">Notes</label>
            <textarea rows="3" value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Event details, requirements, expectations..."
              className={`${inputCls} resize-none`} />
          </div>

          {general && <p className="text-[#FF2B66] text-xs">{general}</p>}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} disabled={saving}
              className="border border-gray-200 dark:border-[#2A2A36] rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-[#9CA3AF] hover:border-[#FF2B66]/40 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button onClick={submit} disabled={saving}
              className="flex-1 bg-[#FF2B66] hover:bg-[#E0245A] text-white rounded-xl py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Plus size={15} /> Add lead</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LeadsTable({ data }) {
  const { reload } = useData()
  const [leads, setLeads] = useState(data)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All Leads')
  const [view, setView] = useState('list')
  const [page, setPage] = useState(1)
  const [menuId, setMenuId] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = leads.filter(l => {
      if (filter !== 'All Leads' && l.Status !== filter) return false
      if (!q) return true
      return [l.ContactName, l.CompanyName, l.Email].some(v => String(v || '').toLowerCase().includes(q))
    })
    return [...rows].sort((a, b) => {
      const statusDiff = (STATUS_ORDER[a.Status] ?? 9) - (STATUS_ORDER[b.Status] ?? 9)
      if (statusDiff !== 0) return statusDiff
      return String(a.ContactName || '').localeCompare(String(b.ContactName || ''))
    })
  }, [leads, query, filter])

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const from = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const to = Math.min(safePage * PAGE_SIZE, total)

  function updateStatus(id, status) {
    const lead = leads.find(l => l.Id === id)
    if (!lead) return
    setLeads(list => list.map(l => (l.Id === id ? { ...l, Status: status } : l)))
    setMenuId(null)
    api.put(`/api/leads/${id}`, {
      companyName: lead.CompanyName,
      contactName: lead.ContactName,
      email: lead.Email,
      phone: lead.Phone,
      source: lead.Source,
      eventType: lead.EventType,
      estimatedBudget: Number(lead.EstimatedBudget) || 0,
      status,
      notes: lead.Notes,
      createdDate: lead.CreatedDate ? new Date(lead.CreatedDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    }).catch(err => console.error('Status update failed:', err))
  }

  function onCreated(lead) {
    const mapped = {
      Id: lead.id,
      ContactName: lead.contactName,
      CompanyName: lead.companyName,
      Email: lead.email,
      Phone: lead.phone,
      Source: lead.source,
      EventType: lead.eventType,
      EstimatedBudget: lead.estimatedBudget,
      Status: lead.status,
      Notes: lead.notes,
      CreatedDate: lead.createdDate,
    }
    setLeads(list => [mapped, ...list])
    reload()
  }

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217]">
      <div className="p-5 flex flex-col md:flex-row md:items-center gap-3 border-b border-gray-200 dark:border-[#2A2A36]">
        <div className="flex flex-1 max-w-sm items-center gap-2.5 rounded-xl bg-gray-100 dark:bg-[#181820] px-3.5 py-2.5 border border-transparent focus-within:border-[#FF2B66]/50 transition-colors">
          <Search size={16} className="text-gray-400 dark:text-[#6B7280]" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1) }}
            placeholder="Search leads..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-[#6B7280] text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 md:ml-auto">
          <div className="flex h-10 items-center rounded-xl bg-gray-100 dark:bg-[#181820] p-1">
            <button onClick={() => { setView('list'); setPage(1) }}
              className={`h-8 px-3 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${view === 'list' ? 'bg-white dark:bg-[#2A2A36] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-[#9CA3AF]'}`}>
              <List size={15} /> List
            </button>
            <button onClick={() => { setView('cards'); setPage(1) }}
              className={`h-8 px-3 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${view === 'cards' ? 'bg-white dark:bg-[#2A2A36] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-[#9CA3AF]'}`}>
              <LayoutGrid size={15} /> Cards
            </button>
          </div>

          <div className="relative h-10">
            <select
              value={filter}
              onChange={e => { setFilter(e.target.value); setPage(1) }}
              className="h-10 appearance-none rounded-xl bg-gray-100 dark:bg-[#181820] pl-3.5 pr-9 text-sm font-medium text-gray-600 dark:text-[#9CA3AF] focus:outline-none cursor-pointer">
              {FILTER_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <button onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 bg-[#FF2B66] hover:bg-[#E0245A] text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors">
            <Plus size={16} /> Add Lead
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#2A2A36]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">E-mail</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">Company</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2A2A36]/60">
              {rows.map(lead => (
                <tr key={lead.Id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 shrink-0 rounded-full bg-[#FF2B66]/10 text-[#FF2B66] font-bold text-xs flex items-center justify-center">
                        {initials(lead.ContactName)}
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">{lead.ContactName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 dark:text-[#9CA3AF] whitespace-nowrap">{lead.Email}</td>
                  <td className="px-4 py-3.5 text-gray-600 dark:text-gray-300 whitespace-nowrap">{lead.CompanyName}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap">{statusBadge(lead.Status)}</td>
                  <td className="px-4 py-3.5">
                    <div className="relative flex items-center justify-end gap-1">
                      <a href={`tel:${lead.Phone || ''}`}
                        className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 dark:text-[#6B7280] hover:text-[#FF2B66] transition-colors"
                        title="Call lead">
                        <Phone size={16} />
                      </a>
                      {!isCallOnly(lead) && (
                        <>
                          <button onClick={() => setMenuId(menuId === lead.Id ? null : lead.Id)}
                            className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 dark:text-[#6B7280] hover:text-[#FF2B66] transition-colors"
                            title="Edit status">
                            <Pencil size={16} />
                          </button>
                          {menuId === lead.Id && (
                            <div
                              className="absolute right-0 top-full mt-1 z-20 w-48 rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#181820] shadow-lg py-1"
                              onClick={e => e.stopPropagation()}>
                              <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">
                                Set status
                              </p>
                              {EDIT_OPTIONS.map(opt => (
                                <button key={opt} onClick={() => updateStatus(lead.Id, opt)}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-600 dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors">
                                  <span className="flex-1">{opt}</span>
                                  {lead.Status === opt && <Check size={14} className="text-[#FF2B66]" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-gray-500 dark:text-[#9CA3AF]">No leads found.</p>
          )}
        </div>
      ) : (
        <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map(lead => (
            <div key={lead.Id} className="rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-gray-50 dark:bg-[#181820] p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-[#FF2B66]/10 text-[#FF2B66] font-bold text-sm flex items-center justify-center">
                    {initials(lead.ContactName)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{lead.ContactName}</p>
                    <p className="text-xs text-gray-400 dark:text-[#6B7280]">{lead.CompanyName}</p>
                  </div>
                </div>
                {statusBadge(lead.Status)}
              </div>
              <div className="space-y-1 text-[13px] text-gray-500 dark:text-[#9CA3AF]">
                <p>{lead.Email}</p>
                {lead.Phone && <p>{lead.Phone}</p>}
                {(lead.EventType || lead.EstimatedBudget > 0) && (
                  <p>{[lead.EventType, lead.EstimatedBudget > 0 ? `Budget ₱${Number(lead.EstimatedBudget).toLocaleString()}` : null].filter(Boolean).join(' · ')}</p>
                )}
              </div>
              <div className="flex items-center gap-1 pt-1 border-t border-gray-200 dark:border-[#2A2A36]">
                <a href={`tel:${lead.Phone || ''}`}
                  className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 dark:text-[#6B7280] hover:text-[#FF2B66] transition-colors"
                  title="Call lead">
                  <Phone size={15} />
                </a>
                {!isCallOnly(lead) && (
                  <div className="relative">
                    <button onClick={() => setMenuId(menuId === lead.Id ? null : lead.Id)}
                      className="h-8 px-2 rounded-lg text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-white/10 flex items-center gap-1 transition-colors"
                      title="Edit status">
                      <Pencil size={14} /> Status
                    </button>
                    {menuId === lead.Id && (
                      <div
                        className="absolute left-0 top-full mt-1 z-20 w-48 rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#181820] shadow-lg py-1"
                        onClick={e => e.stopPropagation()}>
                        {EDIT_OPTIONS.map(opt => (
                          <button key={opt} onClick={() => updateStatus(lead.Id, opt)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-600 dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <span className="flex-1">{opt}</span>
                            {lead.Status === opt && <Check size={14} className="text-[#FF2B66]" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-gray-500 dark:text-[#9CA3AF]">No leads found.</p>
          )}
        </div>
      )}

      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-200 dark:border-[#2A2A36]">
        <p className="text-sm text-gray-500 dark:text-[#9CA3AF]">
          Showing {from}–{to} of {total} leads
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage <= 1}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-40 transition-colors">
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map(n => (
            <button key={n} onClick={() => setPage(n)}
              className={`h-8 w-8 rounded-lg text-sm font-semibold transition-colors ${n === safePage ? 'bg-[#FF2B66] text-white' : 'text-gray-500 dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-white/10'}`}>
              {n}
            </button>
          ))}
          <button onClick={() => setPage(Math.min(pageCount, safePage + 1))} disabled={safePage >= pageCount}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-40 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} onCreated={onCreated} />}
    </section>
  )
}

function isCallOnly(lead) {
  return lead.Status === 'Confirmed Appointment' || lead.Status === 'Lost' || lead.Status === 'Cancelled'
}