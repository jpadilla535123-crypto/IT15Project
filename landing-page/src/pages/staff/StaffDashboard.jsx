import { useCallback, useEffect, useState } from 'react'
import {
  Loader2, CalendarDays, BriefcaseBusiness, CalendarX2, Umbrella,
  Clock, MapPin, ReceiptText, TrendingUp,
} from 'lucide-react'
import AppLayout from '../AppLayout'
import { api } from '../../api/client'
import { toDate, formatFullDate } from '../../components/dashboard/format'
import { statusMeta } from '../../components/calendar/calendarUtils'

const ATTENDANCE_META = {
  Present: { label: 'Present', cls: 'bg-emerald-500', text: 'text-emerald-500' },
  Late: { label: 'Late', cls: 'bg-amber-400', text: 'text-amber-400' },
  Absent: { label: 'Absent', cls: 'bg-red-500', text: 'text-red-500' },
  Leave: { label: 'Leave', cls: 'bg-sky-400', text: 'text-sky-400' },
  RestDay: { label: 'Rest day', cls: 'bg-gray-400', text: 'text-gray-400' },
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function dateTag() {
  const d = new Date()
  return `${d.toLocaleDateString('en-US', { weekday: 'long' })} ${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getFullYear()}`.toUpperCase()
}

function money(amount) {
  return `₱${Number(amount || 0).toLocaleString('en-US')}`
}

function monthLabel(p) {
  return new Date(p.year, p.month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function Card({ children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-4 ${className}`}>
      {children}
    </section>
  )
}

function CardTitle({ icon: Icon, title, sub }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="h-8 w-8 rounded-lg bg-[#FF2B66]/10 flex items-center justify-center text-[#FF2B66]">
        <Icon size={16} />
      </div>
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{title}</h3>
        {sub && <p className="text-[11px] text-gray-400 dark:text-[#6B7280]">{sub}</p>}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, tone }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-4 flex items-start gap-3.5">
      <div className={`h-10 w-10 rounded-xl ${tone || 'bg-[#FF2B66]/10'} flex items-center justify-center ${tone ? 'text-white' : 'text-[#FF2B66]'}`}>
        <Icon size={19} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#6B7280]">{label}</p>
        <p className="mt-0.5 text-2xl font-extrabold tabular-nums text-gray-900 dark:text-white">{value}</p>
        {sub && <p className="text-[11px] text-gray-400 dark:text-[#6B7280]">{sub}</p>}
      </div>
    </div>
  )
}

function Empty({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center gap-1">
      <p className="text-gray-400 dark:text-[#6B7280] text-sm">{message}</p>
    </div>
  )
}

export default function StaffDashboard({ user }) {
  const [state, setState] = useState({ loading: true, error: null, data: null })

  const load = useCallback(async () => {
    setState({ loading: true, error: null, data: null })
    try {
      const data = await api.get('/api/staff/dashboard')
      setState({ loading: false, error: null, data })
    } catch (err) {
      setState({ loading: false, error: err.message, data: null })
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (state.loading) {
    return (
      <AppLayout user={user} badgeCount={0}>
        <div className="flex items-center justify-center py-32">
          <Loader2 size={32} className="animate-spin text-[#FF2B66]" />
        </div>
      </AppLayout>
    )
  }

  if (state.error || !state.data) {
    return (
      <AppLayout user={user} badgeCount={0}>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center space-y-3">
          <p className="text-sm text-red-500 font-semibold">{state.error || 'Could not load your workspace.'}</p>
          <button onClick={load}
            className="rounded-xl bg-[#FF2B66] hover:bg-[#E0245A] text-white text-sm font-semibold px-5 py-2.5 transition-colors">
            Retry
          </button>
        </div>
      </AppLayout>
    )
  }

  const d = state.data
  const emp = d.employee
  const stats = d.stats
  const first = (emp.firstName || user?.fullName || 'S')[0].toUpperCase()
  const leave = stats.leaveBalance || { totalDays: 0, usedDays: 0, availableDays: 0 }
  const latest = d.payslips?.[0]
  const worked = d.worked || []
  const attendance = d.attendance || []

  return (
    <AppLayout user={user} badgeCount={0}>
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#6B7280]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF2B66]" />
            {dateTag()}
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            {greeting()}, {emp.firstName}.
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500 dark:text-[#9CA3AF]">
            <span className="h-9 w-9 rounded-full bg-[#FF2B66] text-white font-bold text-sm flex items-center justify-center">{first}</span>
            {emp.fullName} · <span className="font-bold text-[#FF2B66]">{emp.role}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarDays} label="Work days" value={stats.workDays} sub="this month" tone="bg-[#FF2B66]/10" />
        <StatCard icon={BriefcaseBusiness} label="Events served" value={stats.monthEvents} sub={`${stats.hoursThisMonth}h of duty this month`} />
        <StatCard icon={CalendarX2} label="Absences" value={stats.absences} sub={`${stats.attendanceRate}% attendance rate`} tone="bg-red-500/10" />
        <StatCard icon={Umbrella} label="Available leaves" value={leave.availableDays} sub={`${leave.usedDays} of ${leave.totalDays} used`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <div className="lg:col-span-2 flex flex-col gap-4 min-w-0">
          <Card>
            <CardTitle icon={CalendarDays} title="My Schedule" sub="Upcoming shifts, events and duty load" />
            {d.upcoming.length === 0 ? (
              <Empty message="No upcoming shifts assigned yet." />
            ) : (
              <ul className="space-y-2.5">
                {d.upcoming.map(a => {
                  const start = toDate(a.startDate)
                  const meta = statusMeta(a.eventStatus)
                  return (
                    <li key={a.id} className={`flex items-start gap-3.5 rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-gray-50 dark:bg-[#0B0B0E] p-3.5 border-l-4 ${meta.left}`}>
                      <div className="w-12 shrink-0 text-center">
                        <p className="text-[11px] font-bold uppercase text-[#FF2B66]">{start.toLocaleDateString('en-US', { month: 'short' })}</p>
                        <p className="text-xl font-extrabold leading-none text-gray-900 dark:text-white">{start.getDate()}</p>
                        <p className="text-[10px] text-gray-400 dark:text-[#6B7280]">{start.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{a.eventName}</p>
                        <p className="text-xs text-gray-500 dark:text-[#9CA3AF] mt-0.5 flex items-center gap-1 flex-wrap">
                          {a.role} · {a.hours}h
                          {a.venueName && <span className="inline-flex items-center gap-1"><MapPin size={11} />{a.venueName}</span>}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${meta.badge}`}>{a.eventStatus}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <Card>
            <CardTitle icon={BriefcaseBusiness} title="Events I Worked" sub="Dates and events you were on duty" />
            {worked.length === 0 ? (
              <Empty message="No completed events on record yet." />
            ) : (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#6B7280] border-b border-gray-200 dark:border-[#2A2A36]">
                      <th className="pb-2 pr-3">Dates</th>
                      <th className="pb-2 pr-3">Event</th>
                      <th className="pb-2 pr-3">Role</th>
                      <th className="pb-2 pr-3">Hours</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#2A2A36]/60">
                    {worked.slice(0, 10).map(a => {
                      const meta = statusMeta(a.eventStatus)
                      const s = toDate(a.startDate)
                      const e = toDate(a.endDate)
                      const range = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        + (e.getTime() !== s.getTime() ? ` – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : '')
                      return (
                        <tr key={a.id} className="text-gray-900 dark:text-white">
                          <td className="py-2.5 pr-3 whitespace-nowrap tabular-nums text-gray-500 dark:text-[#9CA3AF]">{range}</td>
                          <td className="py-2.5 pr-3 font-semibold">
                            <span className="block max-w-[220px] truncate">{a.eventName}</span>
                            {a.venueName && <span className="text-[11px] text-gray-400 dark:text-[#6B7280]">{a.venueName}</span>}
                          </td>
                          <td className="py-2.5 pr-3 whitespace-nowrap text-gray-500 dark:text-[#9CA3AF]">{a.role || '—'}</td>
                          <td className="py-2.5 pr-3 tabular-nums">{a.hours}h</td>
                          <td className="py-2.5"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${meta.badge}`}>{a.eventStatus}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-4 min-w-0">
          <Card>
            <CardTitle icon={Clock} title="Attendance" sub="Last 45 logged days" />
            {attendance.length === 0 ? (
              <Empty message="No attendance logged yet." />
            ) : (
              <>
                <div className="grid grid-cols-10 gap-1.5">
                  {attendance.map(a => {
                    const meta = ATTENDANCE_META[a.status] || ATTENDANCE_META.RestDay
                    const dd = toDate(a.workDate)
                    return (
                      <div key={a.workDate} title={`${dd.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} — ${meta.label}${a.notes ? ` (${a.notes})` : ''}`}
                        className={`aspect-square rounded-md ${meta.cls} opacity-90`} />
                    )
                  })}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  {Object.values(ATTENDANCE_META).map(m => (
                    <span key={m.label} className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 dark:text-[#6B7280]">
                      <span className={`h-2.5 w-2.5 rounded-sm ${m.cls}`} /> {m.label}
                    </span>
                  ))}
                </div>
              </>
            )}
          </Card>

          <Card>
            <CardTitle icon={Umbrella} title="Leave Balance" sub={`Leaves for ${new Date().getFullYear()}`} />
            <div className="flex items-end justify-between mb-2">
              <p className="text-2xl font-extrabold tabular-nums text-gray-900 dark:text-white">{leave.availableDays}
                <span className="text-sm font-semibold text-gray-400 dark:text-[#6B7280]"> available</span>
              </p>
              <p className="text-[11px] text-gray-400 dark:text-[#6B7280]">{leave.usedDays} used of {leave.totalDays} days</p>
            </div>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[#FF2B66] to-[#FF5C8A]"
                style={{ width: `${Math.min(100, (leave.totalDays ? (leave.usedDays / leave.totalDays) * 100 : 0))}%` }} />
            </div>
          </Card>

          <Card>
            <CardTitle icon={ReceiptText} title="Payslips" sub="Latest compensation summary" />
            {!latest ? (
              <Empty message="No payslips yet." />
            ) : (
              <>
                <div className="rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-gray-50 dark:bg-[#0B0B0E] p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-gray-900 dark:text-white">{monthLabel(latest)}</p>
                    <span className="rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5">Generated</span>
                  </div>
                  <dl className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><dt className="text-gray-500 dark:text-[#9CA3AF]">Days worked</dt><dd className="tabular-nums">{latest.daysWorked}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500 dark:text-[#9CA3AF]">Daily rate</dt><dd className="tabular-nums">{money(latest.dailyRate)}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500 dark:text-[#9CA3AF]">Gross pay</dt><dd className="tabular-nums">{money(latest.grossPay)}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500 dark:text-[#9CA3AF]">Deductions</dt><dd className="tabular-nums text-red-500">−{money(latest.deductions)}</dd></div>
                  </dl>
                  <div className="flex items-center justify-between border-t border-gray-200 dark:border-[#2A2A36] pt-2.5">
                    <dt className="text-xs font-bold text-gray-500 dark:text-[#9CA3AF]">Net pay</dt>
                    <dd className="text-lg font-extrabold tabular-nums text-[#FF2B66]">{money(latest.netPay)}</dd>
                  </div>
                </div>

                {d.payslips.length > 1 && (
                  <ul className="mt-3 space-y-1.5">
                    {d.payslips.slice(1).map(p => (
                      <li key={p.id} className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs hover:bg-gray-50 dark:hover:bg-white/5">
                        <span className="font-semibold text-gray-700 dark:text-gray-200">{monthLabel(p)}</span>
                        <span className="text-gray-400 dark:text-[#6B7280]">{p.daysWorked} days · <span className="tabular-nums text-gray-900 dark:text-white">{money(p.netPay)}</span></span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </Card>

          <Card className="hidden lg:block">
            <CardTitle icon={TrendingUp} title="At a glance" sub="This month" />
            <ul className="space-y-2 text-xs">
              <li className="flex justify-between"><span className="text-gray-500 dark:text-[#9CA3AF]">Attendance rate</span><span className="font-bold tabular-nums">{stats.attendanceRate}%</span></li>
              <li className="flex justify-between"><span className="text-gray-500 dark:text-[#9CA3AF]">Duty hours logged</span><span className="font-bold tabular-nums">{stats.hoursThisMonth}h</span></li>
              <li className="flex justify-between"><span className="text-gray-500 dark:text-[#9CA3AF]">Events completed this month</span><span className="font-bold tabular-nums">{stats.monthEvents}</span></li>
              <li className="flex justify-between"><span className="text-gray-500 dark:text-[#9CA3AF]">Hired</span><span className="font-bold tabular-nums">{formatFullDate(emp.hireDate)}</span></li>
            </ul>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}