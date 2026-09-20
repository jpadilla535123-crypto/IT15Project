import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, CalendarDays, PlusCircle, BellOff, Users } from 'lucide-react'
import { useData } from '../../api/data'
import { usePanels } from './PanelsContext'
import { isToday } from './format'
import { toDate } from './format'
import { addDays } from './format'

const ICONS = { lead: Mail, event: CalendarDays, booking: PlusCircle, client: Users }

function timeAgo(date) {
  const diff = Math.max(0, Math.round((Date.now() - toDate(date).getTime()) / 86400000))
  if (diff === 0) return 'today'
  if (diff === 1) return 'yesterday'
  return `${diff} days ago`
}

export default function NotificationPanel() {
  const { data } = useData()
  const { notifOpen, setNotifOpen, setNotifSeen } = usePanels()
  const navigate = useNavigate()

  const items = useMemo(() => {
    const list = []
    data.leads.filter(l => l.Status === 'New').forEach(l => {
      list.push({ id: `lead-${l.Id}`, icon: ICONS.lead, title: 'New lead', text: `${l.CompanyName} — ${l.EventType || 'inquiry'}`, time: timeAgo(l.CreatedDate), path: '/leads', tone: 'bg-blue-500/10 text-blue-500' })
    })
    data.events.filter(e => isToday(e.StartDate)).slice(0, 3).forEach(e => {
      list.push({ id: `today-${e.Id}`, icon: ICONS.event, title: e.Name, text: `Event today · ${e.Status === 'Booked' ? 'confirmed' : e.Status}`, time: 'today', path: '/events', tone: 'bg-emerald-500/10 text-emerald-500' })
    })
    data.events
      .filter(e => ['New', 'Pending'].includes(e.Status))
      .slice(0, 4)
      .forEach(e => {
        const d = toDate(e.StartDate)
        if (d >= new Date() && d <= addDays(new Date(), 7)) {
          list.push({ id: `soon-${e.Id}`, icon: ICONS.booking, title: 'Upcoming booking', text: `${e.Name} starts in ${Math.max(0, Math.round((d - new Date()) / 86400000)) + 1} day(s)`, time: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), path: '/events', tone: 'bg-[#FF2B66]/10 text-[#FF2B66]' })
        }
      })
    data.clients.filter(c => c.Status === 'New').slice(0, 2).forEach(c => {
      list.push({ id: `client-${c.Id}`, icon: ICONS.client, title: 'New client', text: c.CompanyName, time: timeAgo(c.DateOfInquiry), path: '/clients', tone: 'bg-amber-500/10 text-amber-500' })
    })
    return list.slice(0, 6)
  }, [data])

  if (!notifOpen) return null

  return (
    <div className="fixed inset-0 z-[75]" onClick={() => { setNotifOpen(false); setNotifSeen(true) }}>
      <div onClick={e => e.stopPropagation()}
        className="absolute right-4 top-[68px] w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 h-12 border-b border-gray-200 dark:border-[#2A2A36]">
          <p className="font-bold text-gray-900 dark:text-white text-sm">Notifications</p>
          <span className="rounded-full bg-[#FF2B66]/10 text-[#FF2B66] text-[10px] font-bold px-2 py-0.5">{items.length}</span>
        </div>
        <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
          {items.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400 dark:text-[#6B7280]">
              <BellOff size={20} className="mx-auto mb-2" /> You're all caught up.
            </div>
          ) : items.map(item => {
            const Icon = item.icon
            return (
              <button key={item.id}
                onClick={() => { setNotifOpen(false); setNotifSeen(true); if (item.path) navigate(item.path) }}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors text-left">
                <div className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center ${item.tone}`}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">{item.title}</p>
                  <p className="text-xs text-gray-500 dark:text-[#9CA3AF] truncate">{item.text}</p>
                </div>
                <span className="shrink-0 text-[10px] font-semibold text-gray-400 mt-0.5">{item.time}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}