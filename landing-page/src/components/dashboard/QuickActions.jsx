import { Zap, CalendarPlus, Receipt, Users, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import '../../pages/landingFx.css'
import { usePanels } from './PanelsContext'

const TILES = [
  { label: 'New Event', icon: CalendarPlus, iconCls: 'text-[#FF2B66]', bg: 'bg-[#FF2B66]/10', to: '/events?new=1' },
  { label: 'Bookings', icon: Receipt, iconCls: 'text-emerald-500', bg: 'bg-emerald-500/10', to: '/events' },
  { label: 'Clients', icon: Users, iconCls: 'text-blue-500', bg: 'bg-blue-500/10', to: '/clients' },
  { label: 'Messages', icon: MessageCircle, iconCls: 'text-amber-500', bg: 'bg-amber-500/10', chat: true },
]

export default function QuickActions() {
  const navigate = useNavigate()
  const { setChatOpen } = usePanels()

  function handleAction(t) {
    if (t.chat) setChatOpen(true)
    else navigate(t.to)
  }

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-[#FF2B66]/10 flex items-center justify-center text-[#FF2B66]">
          <Zap size={16} />
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white">Quick Actions</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {TILES.map(t => (
          <button key={t.label} onClick={() => handleAction(t)}
            className="fx-action flex flex-col items-start gap-2.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-transparent p-4 hover:border-[#FF2B66]/40 hover:bg-gray-50 dark:hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-200 text-left">
            <div className={`fx-action-icon h-9 w-9 rounded-lg flex items-center justify-center ${t.bg}`}>
              <t.icon size={16} className={t.iconCls} />
            </div>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{t.label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}