import { useMemo, useState } from 'react'
import {
  UserCheck, CalendarDays, Plus, X, BarChart3,
  ChevronRight, CircleAlert, UserPlus, ArrowRight, ArrowLeft, CheckCircle2, Loader2, Mail,
} from 'lucide-react'
import AppLayout from './AppLayout'
import { useData } from '../api/data'
import { api } from '../api/client'
import { useSystem, employeeUnavailableReason } from '../components/dashboard/SystemState'
import { toDate } from '../components/dashboard/format'
import { formatTime12 } from '../components/calendar/calendarUtils'
import { useCountUp } from '../components/dashboard/useFx'
import './landingFx.css'

const AVATAR_BG = [
  'bg-[#FF2B66]/15 text-[#FF2B66]',
  'bg-emerald-500/15 text-emerald-500',
  'bg-blue-500/15 text-blue-500',
  'bg-amber-500/15 text-amber-500',
  'bg-purple-500/15 text-purple-400',
]

function initials(name) {
  return String(name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

/* suggested crew size: 1 staff per 50 guests, min 2 */
function crewNeeded(e) {
  return Math.max(2, Math.ceil((e.Guests || 0) / 50))
}

function StatValue({ value }) {
  const [ref, v] = useCountUp(value)
  return <span ref={ref}>{v}</span>
}

/* assignments (eventId → [employeeId]) now come live from SystemState */

const ROLE_OPTIONS = ['Event Manager', 'Event Coordinator', 'AV Technician', 'Designer', 'Operations Staff', 'Photographer', 'Catering Lead']

function EmployeeModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || { FirstName: '', LastName: '', Role: ROLE_OPTIONS[0], Email: '' })
  const [errors, setErrors] = useState({})
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function validate() {
    const errs = {}
    if (!form.FirstName.trim()) errs.FirstName = 'First name is required'
    if (!form.LastName.trim()) errs.LastName = 'Last name is required'
    if (!/^\S+@\S+\.\S+$/.test(form.Email)) errs.Email = 'Enter a valid work email'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function confirm() {
    setSaving(true)
    api.post('/api/employees', {
      firstName: form.FirstName.trim(),
      lastName: form.LastName.trim(),
      role: form.Role,
      email: form.Email.trim(),
      status: 'Active',
    }).then(emp => {
      setSaving(false)
      setDone(true)
      setTimeout(() => onSave({ ...form, Status: 'Active', Id: emp.id }), 750)
    }).catch(err => {
      setSaving(false)
      setErrors({ general: err.message })
    })
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
            <UserPlus size={20} />
          </div>
          <h3 className="font-bold text-lg text-white">Add a team member</h3>
          <p className="text-white/80 text-xs mt-0.5">
            {step === 1 ? 'Who is joining the crew?' : 'Almost there — review the profile.'}
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
            <p className="font-bold text-gray-900 dark:text-white">Team member added!</p>
            <p className="text-xs text-gray-500 dark:text-[#9CA3AF]">
              {form.FirstName} is ready to be assigned to events.
            </p>
          </div>
        ) : step === 1 ? (
          <form key="step1" onSubmit={e => { e.preventDefault(); if (validate()) setStep(2) }}
            className="p-6 space-y-4 fx-mode-swap">
            <div className="grid grid-cols-2 gap-3">
              {[['FirstName', 'First name', 'text'], ['LastName', 'Last name', 'text']].map(([key, label, type]) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">{label}</label>
                  <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
                    className={`w-full bg-gray-50 dark:bg-[#0B0B0E] border rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none transition-all ${errors[key] ? 'border-red-500' : 'border-gray-200 dark:border-[#2A2A36] focus:border-[#FF2B66]/60 focus:shadow-[0_0_0_3px_rgba(255,43,102,0.1)]'}`} />
                  {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">Role</label>
              <select value={form.Role} onChange={e => set('Role', e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#0B0B0E] border border-gray-200 dark:border-[#2A2A36] rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#FF2B66]/60 cursor-pointer">
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">Work email</label>
              <input type="email" value={form.Email} onChange={e => set('Email', e.target.value)}
                placeholder="name@eventsphere.ph"
                className={`w-full bg-gray-50 dark:bg-[#0B0B0E] border rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none transition-all ${errors.Email ? 'border-red-500' : 'border-gray-200 dark:border-[#2A2A36] focus:border-[#FF2B66]/60 focus:shadow-[0_0_0_3px_rgba(255,43,102,0.1)]'}`} />
              {errors.Email && <p className="text-red-500 text-xs mt-1">{errors.Email}</p>}
            </div>
            <button type="submit"
              className="w-full bg-[#FF2B66] hover:bg-[#E0245A] text-white font-semibold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-rose-500/20">
              Review profile <ArrowRight size={15} />
            </button>
          </form>
        ) : (
          <div key="step2" className="p-6 fx-mode-swap">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#6B7280] mb-3">
              Live preview — how they'll appear on the team
            </p>
            <div className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] p-5 bg-gray-50 dark:bg-white/5 flex items-center gap-4">
              <div className="h-14 w-14 shrink-0 rounded-full bg-[#FF2B66]/15 text-[#FF2B66] flex items-center justify-center text-base font-bold">
                {initials(`${form.FirstName} ${form.LastName}`)}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 dark:text-white truncate">{form.FirstName} {form.LastName}</p>
                <p className="text-xs text-gray-500 dark:text-[#9CA3AF]">{form.Role}</p>
                <p className="text-xs text-gray-400 dark:text-[#6B7280] flex items-center gap-1 mt-1 truncate">
                  <Mail size={11} /> {form.Email}
                </p>
              </div>
              <span className="ml-auto shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                Active
              </span>
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
                  : 'Add to team'}
              </button>
            </div>
            {errors.general && (
              <p className="mt-3 text-xs text-red-500">{errors.general}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function EmployeeAssignments({ user }) {
  const { data } = useData()
  const { events, venues, clients } = data
  const { employees, addEmployee, assignments, setAssignments } = useSystem()
  const [tab, setTab] = useState('events')
  const [selectedId, setSelectedId] = useState(null)
  const [roleFilter, setRoleFilter] = useState('All')
  const [showAddEmployee, setShowAddEmployee] = useState(false)

  const venueById = useMemo(() => new Map(venues.map(v => [v.Id, v])), [venues])
  const clientById = useMemo(() => new Map(clients.map(c => [c.Id, c])), [clients])
  const empById = useMemo(() => new Map(employees.map(e => [e.Id, e])), [employees])

  const upcoming = events
    .filter(e => e.Status !== 'Completed' && e.Status !== 'Cancelled')
    .sort((a, b) => toDate(a.StartDate) - toDate(b.StartDate))

  const selected = upcoming.find(e => e.Id === selectedId) || upcoming[0]
  const assignedFor = selected ? (assignments[selected.Id] || []) : []

  const roles = useMemo(() => ['All', ...new Set(employees.map(e => e.Role))], [employees])
  const { empStatus } = useSystem()
  const candidates = employees
    .filter(e => !assignedFor.includes(e.Id))
    .filter(e => roleFilter === 'All' || e.Role === roleFilter)
    .map(e => ({
      emp: e,
      reason: selected ? employeeUnavailableReason(e, selected, data.events, assignments, empStatus) : null,
    }))
  const availableEmployees = candidates.filter(c => !c.reason)
  const unavailableEmployees = candidates.filter(c => c.reason)

  function assign(empId) {
    if (!selected) return
    const emp = empById.get(empId)
    api.post('/api/employeeAssignments', {
      eventId: selected.Id,
      employeeId: empId,
      role: emp?.Role || 'Staff',
      assignedDate: toDate(selected.StartDate),
      status: 'Assigned',
    }).then(() => {
      setAssignments(a => ({ ...a, [selected.Id]: [...(a[selected.Id] || []), empId] }))
    }).catch(err => console.error('Assign failed:', err))
  }

  function unassign(empId) {
    if (!selected) return
    const row = data.assignmentRows.find(r => r.EventId === selected.Id && r.EmployeeId === empId)
    const doLocal = () => setAssignments(a => ({ ...a, [selected.Id]: (a[selected.Id] || []).filter(id => id !== empId) }))
    if (row) {
      api.delete(`/api/employeeAssignments/${row.Id}`)
        .then(doLocal)
        .catch(err => console.error('Unassign failed:', err))
    } else {
      doLocal()
    }
  }

  const workload = useMemo(() => employees.map(emp => {
    const evts = Object.entries(assignments)
      .filter(([, ids]) => ids.includes(emp.Id))
      .map(([eid]) => events.find(e => e.Id === +eid))
      .filter(Boolean)
    return { emp, evts }
  }), [assignments, employees, events])

  const maxLoad = Math.max(1, ...workload.map(w => w.evts.length))
  const totalAssigned = Object.values(assignments).reduce((s, ids) => s + ids.length, 0)
  const understaffed = upcoming.filter(e => (assignments[e.Id] || []).length < crewNeeded(e)).length

  function addEmployeeAndClose(emp) {
    addEmployee(emp)
    setShowAddEmployee(false)
  }

  const TABS = [
    { key: 'events', label: 'Assign by Event', icon: CalendarDays },
    { key: 'team', label: 'Team Workload', icon: BarChart3 },
  ]

  return (
    <AppLayout user={user} badgeCount={data.leads.length}>
      {/* header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#6B7280]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF2B66]" /> Operations
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <UserCheck size={22} className="text-[#FF2B66]" /> Employee Assignments
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-[#9CA3AF]">
            <span className="font-bold text-gray-900 dark:text-white"><StatValue value={totalAssigned} /></span> staff assigned ·{' '}
            <span className={`font-bold ${understaffed ? 'text-[#FF2B66]' : 'text-emerald-500'}`}>{understaffed}</span> events short-handed
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-3">
          <LiveTabs tabs={TABS} tab={tab} setTab={setTab} />
          <button onClick={() => setShowAddEmployee(true)}
            className="inline-flex items-center gap-1.5 bg-[#FF2B66] hover:bg-[#E0245A] text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-all hover:shadow-lg hover:shadow-rose-500/20 active:scale-95">
            <UserPlus size={15} /> Add Employee
          </button>
        </div>
      </div>

      {tab === 'events' ? (
        <div key="events" className="fx-tab-panel grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
          {/* event selector */}
          <section className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-4">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
              <CalendarDays size={15} className="text-[#FF2B66]" /> Upcoming Events
            </h3>
            <div className="space-y-2 max-h-[560px] overflow-y-auto no-scrollbar pr-1">
              {upcoming.map(e => {
                const assigned = assignments[e.Id] || []
                const need = crewNeeded(e)
                const short = assigned.length < need
                const isSel = selected?.Id === e.Id
                return (
                  <button key={e.Id} onClick={() => setSelectedId(e.Id)}
                    className={`w-full text-left rounded-xl border p-3 transition-all duration-200 ${
                      isSel
                        ? 'border-[#FF2B66]/60 bg-[#FF2B66]/5 shadow-sm'
                        : 'border-gray-200 dark:border-[#2A2A36] hover:border-[#FF2B66]/40'
                    }`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{e.Name}</p>
                      <ChevronRight size={14}
                        className={`shrink-0 text-gray-400 transition-transform ${isSel ? 'rotate-90 text-[#FF2B66]' : ''}`} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-[#9CA3AF] mt-0.5 truncate">
                      {toDate(e.StartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ·{' '}
                      {formatTime12(e.StartTime)} · {venueById.get(e.VenueId)?.Name || '—'}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      {/* staffing meter */}
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${short ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, (assigned.length / need) * 100)}%` }} />
                      </div>
                      <span className={`text-[10px] font-bold ${short ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {assigned.length}/{need} crew
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* assignment panel */}
          {selected && (
            <section key={selected.Id} className="lg:col-span-3 rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5 fx-mode-swap">
              <h3 className="font-bold text-gray-900 dark:text-white">{selected.Name}</h3>
              <p className="text-xs text-gray-500 dark:text-[#9CA3AF] mt-0.5">
                {clientById.get(selected.ClientId)?.CompanyName || '—'} · {selected.Guests?.toLocaleString()} guests ·{' '}
                suggested crew: <span className="font-bold text-[#FF2B66]">{crewNeeded(selected)}</span>
              </p>

              {/* assigned staff */}
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#6B7280] mt-5 mb-2">
                Assigned staff ({assignedFor.length})
              </h4>
              {assignedFor.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-[#6B7280] py-4 text-center border border-dashed border-gray-200 dark:border-[#2A2A36] rounded-xl">
                  No staff assigned yet — pick from the list below.
                </p>
              ) : (
                <ul className="space-y-2">
                  {assignedFor.map((id, i) => {
                    const emp = empById.get(id)
                    if (!emp) return null
                    return (
                      <li key={id}
                        className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-gray-50 dark:bg-white/5 p-2.5 transition-all hover:border-[#FF2B66]/40">
                        <div className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${AVATAR_BG[i % AVATAR_BG.length]}`}>
                          {initials(`${emp.FirstName} ${emp.LastName}`)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {emp.FirstName} {emp.LastName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-[#9CA3AF]">{emp.Role}</p>
                        </div>
                        <button onClick={() => unassign(id)} title="Remove"
                          className="h-7 w-7 shrink-0 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-500 transition-colors">
                          <X size={14} />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}

              {/* add staff */}
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#6B7280] mt-5 mb-2">
                Add staff
              </h4>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {roles.map(r => (
                  <button key={r} onClick={() => setRoleFilter(r)}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-all ${roleFilter === r
                      ? 'bg-[#FF2B66] text-white'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-[#9CA3AF] hover:text-[#FF2B66]'}`}>
                    {r}
                  </button>
                ))}
              </div>
              {availableEmployees.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-[#6B7280] py-3 text-center">
                  No one matching this role is available on this date.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableEmployees.map(({ emp }) => (
                    <button key={emp.Id} onClick={() => assign(emp.Id)}
                      className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-[#2A2A36] pl-1.5 pr-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-all hover:border-[#FF2B66] hover:bg-[#FF2B66]/5 hover:-translate-y-0.5 active:scale-95">
                      <span className="h-6 w-6 rounded-full bg-[#FF2B66]/15 text-[#FF2B66] flex items-center justify-center text-[10px] font-bold">
                        {initials(`${emp.FirstName} ${emp.LastName}`)}
                      </span>
                      {emp.FirstName} {emp.LastName}
                      <span className="text-gray-400 dark:text-[#6B7280] font-normal">· {emp.Role}</span>
                      <Plus size={12} className="text-[#FF2B66]" />
                    </button>
                  ))}
                </div>
              )}

              {unavailableEmployees.length > 0 && (
                <div className="mt-4 pt-3 border-t border-dashed border-gray-200 dark:border-[#2A2A36]/60">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#6B7280] mb-2">
                    Unavailable on this date
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {unavailableEmployees.map(({ emp, reason }) => (
                      <span key={emp.Id} title={reason}
                        className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-[#2A2A36] pl-1.5 pr-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-[#6B7280] cursor-not-allowed opacity-70">
                        <span className="h-6 w-6 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-bold">
                          {initials(`${emp.FirstName} ${emp.LastName}`)}
                        </span>
                        {emp.FirstName} {emp.LastName}
                        <span className="font-normal">· {reason}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      ) : (
        /* ─── TEAM WORKLOAD TAB ─── */
        <div key="team" className="fx-tab-panel grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {workload.map(({ emp, evts }, i) => {
            const load = evts.length
            const pct = Math.round((load / maxLoad) * 100)
            return (
              <section key={emp.Id}
                style={{ transitionDelay: `${i * 60}ms` }}
                className="fx-reveal fx-in rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5 transition-all hover:border-[#FF2B66]/40 hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <div className={`h-11 w-11 shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${AVATAR_BG[i % AVATAR_BG.length]}`}>
                    {initials(`${emp.FirstName} ${emp.LastName}`)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 dark:text-white truncate">{emp.FirstName} {emp.LastName}</p>
                    <p className="text-xs text-gray-500 dark:text-[#9CA3AF]">{emp.Role}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    load === 0 ? 'bg-gray-100 dark:bg-white/5 text-gray-400'
                      : pct >= 80 ? 'bg-red-100 dark:bg-red-500/15 text-red-500'
                      : 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-500'
                  }`}>
                    {load} event{load === 1 ? '' : 's'}
                  </span>
                </div>

                {/* utilization bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#6B7280] mb-1">
                    <span>Workload</span><span>{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${pct >= 80 ? 'bg-red-500' : pct === 0 ? 'bg-gray-300' : 'bg-[#FF2B66]'}`}
                      style={{ width: `${Math.max(pct, 4)}%` }} />
                  </div>
                </div>

                <div className="mt-4 space-y-1.5">
                  {evts.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-[#6B7280] flex items-center gap-1.5">
                      <CircleAlert size={13} /> Free — available to assign.
                    </p>
                  ) : (
                    evts.map(e => (
                      <p key={e.Id} className="text-xs text-gray-600 dark:text-gray-300 truncate flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#FF2B66] shrink-0" />
                        {e.Name}
                      </p>
                    ))
                  )}
                </div>
              </section>
          )
        })}
        </div>
      )}

      {showAddEmployee && (
        <EmployeeModal onSave={addEmployeeAndClose} onClose={() => setShowAddEmployee(false)} />
      )}
    </AppLayout>
  )
}

/* shared tab switcher */
export function LiveTabs({ tabs, tab, setTab }) {
  return (
    <div className="inline-flex max-w-full overflow-x-auto no-scrollbar rounded-xl bg-white dark:bg-[#121217] border border-gray-200 dark:border-[#2A2A36] p-1">
      {tabs.map(t => (
        <button key={t.key} onClick={() => setTab(t.key)}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all ${
            tab === t.key ? 'bg-[#FF2B66] text-white shadow-sm' : 'text-gray-500 dark:text-[#9CA3AF] hover:text-gray-900 dark:hover:text-white'
          }`}>
          <t.icon size={13} /> {t.label}
        </button>
      ))}
    </div>
  )
}
