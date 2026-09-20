import { useCallback, useEffect, useState } from 'react'
import {
  Loader2, CalendarDays, ChevronLeft, ChevronRight,
  Clock, MapPin, X,
} from 'lucide-react'
import AppLayout from '../AppLayout'
import { api } from '../../api/client'
import { dateKey } from '../../components/calendar/calendarUtils'
import { statusMeta } from '../../components/calendar/calendarUtils'

const ATT_META = {
  Present: { label: 'Present', cls: 'bg-emerald-500' },
  Late: { label: 'Late', cls: 'bg-amber-400' },
  Absent: { label: 'Absent', cls: 'bg-red-500' },
  Leave: { label: 'Leave', cls: 'bg-sky-400' },
  RestDay: { label: 'Rest day', cls: 'bg-gray-400' },
}

const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function padMonth(value) {
  const first = new Date(value.getFullYear(), value.getMonth(), 1)
  const lead = (first.getDay() + 6) % 7
  const daysInMonth = new Date(value.getFullYear(), value.getMonth() + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(value.getFullYear(), value.getMonth(), day))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function StaffCalendar({ user }) {
  const [viewDate, setViewDate] = useState(() => new Date())
  const [state, setState] = useState({ loading: false, error: null, data: null })
  const [selectedKey, setSelectedKey] = useState(null)

  const load = useCallback(async (d) => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const data = await api.get('/api/staff/calendar', { month: d.getMonth() + 1, year: d.getFullYear() })
      const keys = new Set(data.days.map(r => String(r.date).slice(0, 10)))
      setSelectedKey(prev => (prev && keys.has(prev) ? prev : null))
      setState({ loading: false, error: null, data })
    } catch (err) {
      setState({ loading: false, error: err.message, data: null })
    }
  }, [])

  useEffect(() => { load(viewDate) }, [load, viewDate])

  function navigate(dir) {
    const d = new Date(viewDate)
    d.setMonth(d.getMonth() + dir)
    setViewDate(d)
  }

  function goToday() {
    setSelectedKey(null)
    setViewDate(new Date())
  }

  const rows = state.data?.days || []
  const byDate = new Map(rows.map(r => [String(r.date).slice(0, 10), r]))

  const selected = selectedKey ? byDate.get(selectedKey) : null
  const cells = padMonth(viewDate)
  const todayKey = dateKey(new Date())

  return (
    <AppLayout user={user} badgeCount={0}>
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#6B7280]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF2B66]" />
            My work calendar
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Calendar</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-[#9CA3AF]">
            Shift days, event duty and your attendance record.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button onClick={goToday}
            className="rounded-xl bg-[#FF2B66] hover:bg-[#E0245A] text-white text-sm font-semibold px-4 py-2 transition-colors">
            Today
          </button>
          <div className="flex items-center gap-1 rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-1">
            <button onClick={() => navigate(-1)} title="Previous month"
              className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center text-gray-500 dark:text-[#9CA3AF]">
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 text-sm font-bold text-gray-900 dark:text-white min-w-[130px] text-center">
              {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => navigate(1)} title="Next month"
              className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center text-gray-500 dark:text-[#9CA3AF]">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {state.error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-center space-y-3">
          <p className="text-sm text-red-500 font-semibold">{state.error}</p>
          <button onClick={() => load(viewDate)}
            className="rounded-xl bg-[#FF2B66] hover:bg-[#E0245A] text-white text-sm font-semibold px-5 py-2.5 transition-colors">
            Retry
          </button>
        </div>
      )}

      {state.loading && !state.data ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={32} className="animate-spin text-[#FF2B66]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 items-start">
          <section className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#FF2B66]/10 flex items-center justify-center text-[#FF2B66]">
                  <CalendarDays size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                  <p className="text-[11px] text-gray-400 dark:text-[#6B7280]">Click a day to see shifts in a side panel</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 justify-end">
                {Object.entries(ATT_META).map(([k, m]) => (
                  <span key={k} className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 dark:text-[#6B7280]">
                    <span className={`h-2.5 w-2.5 rounded-sm ${m.cls}`} /> {m.label}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 dark:text-[#6B7280]">
                  <span className="h-2.5 w-2.5 rounded-sm bg-slate-400/50" /> Holiday / off
                </span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-[3px] mb-[3px]">
              {WEEK_LABELS.map(l => (
                <span key={l} className="text-center text-[9px] font-bold text-gray-400 dark:text-[#6B7280]">{l}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-[3px]">
              {cells.map((d, i) => {
                if (!d) return <div key={`pad-${i}`} />
                const k = dateKey(d)
                const row = byDate.get(k)
                const att = row?.attendance
                const hasDuty = row?.assignments?.length > 0
                const attMeta = att ? ATT_META[att.status] : null
                const isToday = k === todayKey
                const isSelected = k === selectedKey
                return (
                  <button key={k} onClick={() => setSelectedKey(k)}
                    className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-[11px] font-bold transition-all hover:scale-[1.04] hover:z-10 ${
                      attMeta
                        ? `${attMeta.cls} text-white`
                        : hasDuty
                          ? 'bg-[#FF2B66]/15 text-[#FF2B66]'
                          : 'bg-gray-100 dark:bg-white/[0.03] text-gray-600 dark:text-gray-300'
                    } ${isToday ? 'ring-2 ring-[#FF2B66]' : ''} ${isSelected ? 'ring-2 ring-gray-400 dark:ring-white/40' : ''}`}>
                    {d.getDate()}
                    {hasDuty && (
                      <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {row.assignments.map(a => (
                          <span key={a.id} className="h-1 w-1 rounded-full bg-current opacity-80" />
                        ))}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedKey(null)} />
          <div className="relative flex h-full w-full max-w-md flex-col bg-white dark:bg-[#121217] border-l border-gray-200 dark:border-[#2A2A36] shadow-2xl">
            <div className="flex items-start justify-between gap-3 p-5 pb-3 border-b border-gray-100 dark:border-[#2A2A36]/60">
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  {new Date(selected.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <p className="text-xs text-gray-400 dark:text-[#6B7280] mt-0.5">Shifts and attendance for this day.</p>
              </div>
              <button onClick={() => setSelectedKey(null)} aria-label="Close"
                className="h-9 w-9 rounded-xl border border-gray-200 dark:border-[#2A2A36] text-gray-500 dark:text-[#9CA3AF] hover:text-[#FF2B66] hover:border-[#FF2B66]/50 flex items-center justify-center transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {selected.attendance && (
                <div className="rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-gray-50 dark:bg-[#0B0B0E] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#6B7280] mb-1">Attendance</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${(ATT_META[selected.attendance.status]?.cls) || 'bg-gray-400'}`} />
                    {ATT_META[selected.attendance.status]?.label || selected.attendance.status}
                  </p>
                  {selected.attendance.notes && <p className="text-xs text-gray-500 dark:text-[#9CA3AF] mt-1.5">{selected.attendance.notes}</p>}
                </div>
              )}

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#6B7280] mb-2">Shifts / Events</p>
                {selected.assignments.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-[#9CA3AF] bg-gray-50 dark:bg-white/5 rounded-xl p-4">No shifts scheduled for this day.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {selected.assignments.map(a => {
                      const meta = statusMeta(a.eventStatus)
                      return (
                        <li key={a.id} className={`rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-gray-50 dark:bg-[#0B0B0E] p-4 border-l-4 ${meta.left}`}>
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{a.eventName}</p>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.badge}`}>{a.eventStatus}</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-[#9CA3AF] mt-1.5 flex items-center gap-1 flex-wrap">
                            <span className="font-semibold text-gray-700 dark:text-gray-200">{a.role || 'Staff'}</span>
                            <span className="inline-flex items-center gap-1"><Clock size={11} />{a.hours}h</span>
                            {a.venueName && <span className="inline-flex items-center gap-1"><MapPin size={11} />{a.venueName}</span>}
                          </p>
                          {a.clientName && <p className="text-[11px] text-gray-400 dark:text-[#6B7280] mt-1">Client: {a.clientName}</p>}
                        </li>
                      )
                    })}
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