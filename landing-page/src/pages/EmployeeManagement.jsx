import { useEffect, useMemo, useState } from 'react'
import {
  UserCog, Search, Mail, Phone, CalendarCheck, Users, UserMinus, Activity, CircleAlert,
  KeyRound, UserPlus, CheckCircle2,
} from 'lucide-react'
import AppLayout from './AppLayout'
import { LiveTabs } from './EmployeeAssignments'
import { StatValue, Kpi, PageHeader, SearchBar, Chip } from '../components/dashboard/Shared'
import { useData } from '../api/data'
import { api } from '../api/client'
import { useSystem } from '../components/dashboard/SystemState'
import EmployeeTeamModal from './EmployeeTeamModal'
import './landingFx.css'

const AVATAR_BG = ['bg-[#FF2B66]/10 text-[#FF2B66]', 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', 'bg-blue-500/10 text-blue-600 dark:text-blue-400', 'bg-amber-500/10 text-amber-600 dark:text-amber-400', 'bg-purple-500/10 text-purple-500 dark:text-purple-400']

function initials(f, l) { return `${(f || '?')[0]}${(l || '')[0] || ''}`.toUpperCase() }

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const ATT = {
  P: { cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300', label: 'Present' },
  A: { cls: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300', label: 'Absent' },
  L: { cls: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300', label: 'On Leave' },
  O: { cls: 'bg-gray-100 dark:bg-white/10 text-gray-400', label: 'Day off' },
}
const ATT_CYCLE = ['P', 'P', 'P', 'L', 'A', 'O', 'P', 'P'] // click cycles through a sensible pattern

export default function EmployeeManagement({ user }) {
  const { data } = useData()
  const { employees, empStatus, setEmpStatus, addEmployee } = useSystem()
  const [tab, setTab] = useState('team')
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('All')
  const [attendance, setAttendance] = useState({})
  const [tooltip, setTooltip] = useState(null)
  const [users, setUsers] = useState([])
  const [modal, setModal] = useState(null)

  const refreshUsers = () =>
    api.get('/api/users')
      .then(res => setUsers(res.items || []))
      .catch(() => setUsers([]))

  useEffect(() => { refreshUsers() }, [])

  const accountOf = emp => users.find(u => String(u.email).toLowerCase() === String(emp.Email || '').toLowerCase())

  function onEmployeeCreated(emp) {
    addEmployee({
      FirstName: emp.firstName, LastName: emp.lastName,
      FullName: emp.fullName || `${emp.firstName} ${emp.lastName}`,
      Role: emp.role, Email: emp.email, Phone: emp.phone || '',
      Salary: Number(emp.salary) || 0,
      HireDate: emp.hireDate ? new Date(emp.hireDate) : new Date(),
      Status: emp.status || 'Active',
    }, emp.id)
  }

  /* seed the weekly grid once per employee when the live roster arrives */
  useEffect(() => {
    setAttendance(prev => {
      let changed = false
      const next = { ...prev }
      employees.forEach(e => {
        if (!next[e.Id]) {
          next[e.Id] = Array.from({ length: 7 }, (_, i) => (i === 5 || i === 6) ? 'O' : ATT_CYCLE[(e.Id + i) % ATT_CYCLE.length])
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [employees])

  const statusOf = e => empStatus[e.Id] || e.Status || 'Active'

  const roles = useMemo(() => ['All', ...new Set(employees.map(e => e.Role))], [employees])
  const filtered = employees.filter(e =>
    (role === 'All' || e.Role === role) &&
    `${e.FirstName} ${e.LastName} ${e.Role} ${e.Email}`.toLowerCase().includes(query.toLowerCase())
  )

  const active = employees.filter(e => statusOf(e) === 'Active').length
  const onLeave = employees.filter(e => statusOf(e) === 'On Leave').length
  const counts = Object.values(attendance).flat()
  const presentRate = Math.round((counts.filter(c => c === 'P').length / counts.length) * 100)

  function cycleEmpStatus(id) {
    const cur = empStatus[id] || 'Active'
    const next = cur === 'Active' ? 'On Leave' : cur === 'On Leave' ? 'Inactive' : 'Active'
    const emp = employees.find(e => e.Id === id)
    setEmpStatus(s => ({ ...s, [id]: next }))
    if (!emp) return
    api.put(`/api/employees/${id}`, {
      firstName: emp.FirstName,
      lastName: emp.LastName,
      role: emp.Role,
      email: emp.Email,
      phone: emp.Phone,
      salary: Number(emp.Salary) || 0,
      hireDate: emp.HireDate ? new Date(emp.HireDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      status: next,
    }).catch(err => console.error('Status update failed:', err))
  }
  function mark(empId, day, code) {
    setAttendance(a => ({
      ...a,
      [empId]: (a[empId] || Array.from({ length: 7 }, () => 'O')).map((c, i) => (i === day ? code : c)),
    }))
  }
  function cycleCell(empId, day) {
    const order = ['P', 'L', 'A', 'O']
    const current = (attendance[empId] || Array.from({ length: 7 }, () => 'O'))[day]
    mark(empId, day, order[(order.indexOf(current) + 1) % order.length])
  }

  const TABS = [
    { key: 'team', label: 'Team Directory', icon: Users },
    { key: 'attendance', label: 'Attendance', icon: CalendarCheck },
  ]

  return (
    <AppLayout user={user} badgeCount={data.leads.length}>
      <PageHeader section="Resources" icon={UserCog} title="Employee Management"
        actions={
          <div className="flex flex-col items-end gap-3">
            <LiveTabs tabs={TABS} tab={tab} setTab={setTab} />
            <button onClick={() => setModal({ mode: 'employee' })}
              className="inline-flex items-center gap-1.5 bg-[#FF2B66] hover:bg-[#E0245A] text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors">
              <UserPlus size={16} /> Add Employee
            </button>
          </div>
        }>
        <span className="font-bold text-gray-900 dark:text-white"><StatValue value={employees.length} /></span> team members ·{' '}
        <span className="font-bold text-emerald-500">{active}</span> active ·{' '}
        <span className="font-bold text-amber-500">{onLeave}</span> on leave
      </PageHeader>

      {tab === 'team' ? (
        <div key="team" className="fx-tab-panel space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi icon={Users} label="Headcount"><StatValue value={employees.length} /></Kpi>
            <Kpi icon={Activity} label="Active" tone="text-emerald-500" bg="bg-emerald-500/10" delay={80}><StatValue value={active} /></Kpi>
            <Kpi icon={UserMinus} label="On Leave" tone="text-amber-500" bg="bg-amber-500/10" delay={160}><StatValue value={onLeave} /></Kpi>
            <Kpi icon={CalendarCheck} label="Attendance Rate" delay={240}><StatValue value={presentRate} suffix="%" /></Kpi>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-4 flex flex-col lg:flex-row gap-3">
            <SearchBar value={query} onChange={setQuery} placeholder="Search team by name, role, email..." />
            <div className="flex flex-wrap gap-1.5">
              {roles.map(r => <Chip key={r} active={role === r} onClick={() => setRole(r)}>{r}</Chip>)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((e, i) => (
              <section key={e.Id}
                style={{ transitionDelay: `${i * 60}ms` }}
                className="fx-reveal fx-in rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[#FF2B66]/40">
                <div className="flex items-start gap-3">
                  <div className={`h-12 w-12 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${AVATAR_BG[i % AVATAR_BG.length]}`}>
                    {initials(e.FirstName, e.LastName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{e.FirstName} {e.LastName}</h3>
                    <p className="text-xs text-gray-500 dark:text-[#9CA3AF]">{e.Role}</p>
                  </div>
                  <button onClick={() => cycleEmpStatus(e.Id)} title="Click to change status"
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold transition-all active:scale-95 ${
                      statusOf(e) === 'Active' ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                        : statusOf(e) === 'On Leave' ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                    }`}>
                    {statusOf(e)}
                  </button>
                </div>
                <div className="mt-4 space-y-1.5 text-xs text-gray-500 dark:text-[#9CA3AF]">
                  <p className="flex items-center gap-1.5 truncate"><Mail size={12} className="shrink-0 text-[#FF2B66]" /> {e.Email}</p>
                  <p className="flex items-center gap-1.5">
                    <Phone size={12} className="shrink-0 text-[#FF2B66]" />
                    +63 9{String(17 + e.Id).padStart(2, '0')} 555 0{String(200 + e.Id * 3)}
                  </p>
                </div>
                <div className="mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#6B7280] mb-1.5">Login access</p>
                  {accountOf(e) ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 px-2.5 py-1 text-[10px] font-bold">
                      <CheckCircle2 size={11} /> Account ready · {accountOf(e).role}
                    </span>
                  ) : (
                    <button onClick={() => setModal({ mode: 'account', emp: e })}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#FF2B66]/10 text-[#FF2B66] px-2.5 py-1 text-[10px] font-bold hover:bg-[#FF2B66]/20 transition-colors">
                      <KeyRound size={11} /> Create account
                    </button>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-[#2A2A36]/60">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#6B7280] mb-1.5">This week</p>
                  <div className="flex gap-1.5">
                    {(attendance[e.Id] || Array.from({ length: 7 }, () => 'O')).map((c, d) => (
                      <span key={d} title={`${DAY_LETTERS[d]} — ${ATT[c].label}`}
                        className={`h-7 flex-1 rounded-lg flex items-center justify-center text-[10px] font-bold ${ATT[c].cls}`}>
                        {DAY_LETTERS[d]}
                      </span>
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : (
        <div key="attendance" className="fx-tab-panel space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi icon={CalendarCheck} label="Present (this week)"><StatValue value={counts.filter(c => c === 'P').length} suffix=" shifts" /></Kpi>
            <Kpi icon={CircleAlert} label="Absences" tone="text-red-500" bg="bg-red-500/10" delay={80}>
              <StatValue value={counts.filter(c => c === 'A').length} />
            </Kpi>
            <Kpi icon={UserMinus} label="Leave Days" tone="text-amber-500" bg="bg-amber-500/10" delay={160}>
              <StatValue value={counts.filter(c => c === 'L').length} />
            </Kpi>
            <Kpi icon={Activity} label="Attendance Rate" tone="text-emerald-500" bg="bg-emerald-500/10" delay={240}>
              <StatValue value={presentRate} suffix="%" />
            </Kpi>
          </div>

          <section className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Weekly Attendance Grid</h3>
                <p className="text-xs text-gray-500 dark:text-[#9CA3AF] mt-0.5">
                  Click any cell to cycle: <span className="text-emerald-500 font-bold">Present</span> →{' '}
                  <span className="text-amber-500 font-bold">Leave</span> →{' '}
                  <span className="text-red-500 font-bold">Absent</span> → Day off
                </p>
              </div>
              <div className="flex gap-2 text-[10px] font-bold">
                {Object.entries(ATT).map(([k, v]) => (
                  <span key={k} className={`rounded-full px-2.5 py-1 ${v.cls}`}>{v.label}</span>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280] pb-2">Employee</th>
                    {DAY_LETTERS.map((d, i) => <th key={i} className="pb-2 text-[10px] font-bold text-gray-400 dark:text-[#6B7280]">DAY {i + 1}</th>)}
                    <th className="pb-2 text-[10px] font-bold text-gray-400 dark:text-[#6B7280] text-right">RATE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#2A2A36]/60">
                  {employees.map(e => {
                    const cells = attendance[e.Id] || Array.from({ length: 7 }, () => 'O')
                    const rate = Math.round((cells.filter(c => c === 'P').length / cells.length) * 100)
                    return (
                      <tr key={e.Id} className="transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${AVATAR_BG[e.Id % AVATAR_BG.length]}`}>
                              {initials(e.FirstName, e.LastName)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{e.FirstName} {e.LastName}</p>
                              <p className="truncate text-[11px] text-gray-400 dark:text-[#6B7280]">{e.Role}</p>
                            </div>
                          </div>
                        </td>
                        {cells.map((c, d) => (
                          <td key={d} className="py-2.5 px-1">
                            <button onClick={() => cycleCell(e.Id, d)}
                              onMouseEnter={() => setTooltip({ emp: e.FirstName, day: d + 1, code: c })}
                              onMouseLeave={() => setTooltip(null)}
                              className={`h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all hover:scale-110 active:scale-90 ${ATT[c].cls}`}>
                              {c}
                            </button>
                          </td>
                        ))}
                        <td className="py-2.5 text-right">
                          <span className={`text-sm font-extrabold ${rate >= 80 ? 'text-emerald-500' : rate >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                            {rate}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {tooltip && (
              <p className="mt-3 text-xs text-gray-500 dark:text-[#9CA3AF] text-center">
                {tooltip.emp} — Day {tooltip.day}: <span className="font-bold">{ATT[tooltip.code].label}</span>
              </p>
            )}
          </section>
        </div>
      )}

      {modal && (
        <EmployeeTeamModal
          mode={modal.mode}
          employee={modal.emp}
          onAddEmployee={modal.mode === 'employee' ? onEmployeeCreated : undefined}
          onClose={() => setModal(null)}
          onSaved={() => { refreshUsers(); setModal(null) }}
        />
      )}
    </AppLayout>
  )
}
