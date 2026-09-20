import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Sparkles, LayoutDashboard, Mail, Users,
  CalendarDays, CalendarRange, UserCheck,
  Building2, Truck, UserCog,
  Wallet, Receipt, BarChart3, ShieldAlert,
  Settings, CircleHelp, Moon, Sun,
} from 'lucide-react'
import { ROLE_PERMISSIONS } from '../../api/permissions'

const NAV_SECTIONS = [
  { title: null, items: [{ label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' }] },
  { title: 'Lead Management', items: [{ label: 'Lead Management', icon: Mail, path: '/leads' }, { label: 'Client Management', icon: Users, path: '/clients' }] },
  { title: 'Operations', items: [{ label: 'Event Management', icon: CalendarDays, path: '/events' }, { label: 'Event Calendar', icon: CalendarRange, path: '/calendar' }, { label: 'Employee Assignments', icon: UserCheck, path: '/assignments' }] },
  { title: 'Resources', items: [{ label: 'Venue Management', icon: Building2, path: '/venues-mgmt' }, { label: 'Supplier Management', icon: Truck, path: '/suppliers-mgmt' }, { label: 'Employee Management', icon: UserCog, path: '/employees-mgmt' }] },
  { title: 'Finance', items: [{ label: 'Budget Management', icon: Wallet, path: '/budget' }, { label: 'Billing', icon: Receipt, path: '/billing' }, { label: 'Payment Review', icon: ShieldAlert, path: '/payment-review' }] },
  { title: 'Insights', items: [{ label: 'Reports', icon: BarChart3, path: '/reports' }] },
]

const ROUTE_LABELS = {
  '/dashboard': 'Dashboard',
  '/leads': 'Lead Management',
  '/clients': 'Client Management',
  '/events': 'Event Management',
  '/calendar': 'Event Calendar',
  '/assignments': 'Employee Assignments',
  '/venues-mgmt': 'Venue Management',
  '/suppliers-mgmt': 'Supplier Management',
  '/employees-mgmt': 'Employee Management',
  '/budget': 'Budget Management',
  '/billing': 'Billing',
  '/payment-review': 'Payment Review',
  '/reports': 'Reports',
}

const NAV_CLASS = 'w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] whitespace-nowrap font-medium transition-colors'

export function SidebarNav({ role, theme, onToggleTheme, onNavigateAfter }) {
  const [activeLocal, setActiveLocal] = useState('Dashboard')
  const navigate = useNavigate()
  const location = useLocation()
  const active = ROUTE_LABELS[location.pathname] || activeLocal

  const allowed = ROLE_PERMISSIONS[role] || []
  const visibleSections = NAV_SECTIONS
    .map(section => ({
      ...section,
      items: section.items.filter(item => allowed.includes(item.path)),
    }))
    .filter(section => section.items.length > 0)

  function handleClick(item) {
    if (item.path) navigate(item.path)
    else setActiveLocal(item.label)
    onNavigateAfter?.()
  }

  return (
    <>
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {visibleSections.map(section => (
          <div key={section.title || 'top'}>
            {section.title && (
              <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-[#6B7280]">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(item => {
                const Icon = item.icon
                const isActive = active === item.label
                return (
                  <button key={item.label} onClick={() => handleClick(item)}
                    className={`${NAV_CLASS} ${
                      isActive
                        ? 'bg-[#FF2B66] text-white'
                        : 'text-gray-500 dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                    }`}>
                    <Icon size={17} />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-200 dark:border-[#2A2A36]/60 px-4 py-3 space-y-0.5">
        <button className={`${NAV_CLASS} text-gray-500 dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white`}>
          <Settings size={17} /> Settings
        </button>
        <button className={`${NAV_CLASS} text-gray-500 dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white`}>
          <CircleHelp size={17} /> Help
        </button>
        <button onClick={onToggleTheme}
          className={`${NAV_CLASS} text-gray-500 dark:text-[#9CA3AF] hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white`}>
          {theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />} Dark Mode
          <span className={`ml-auto h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors ${theme === 'dark' ? 'bg-[#FF2B66]' : 'bg-gray-300'}`}>
            <span className={`block h-4 w-4 rounded-full bg-white shadow transition-transform ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`} />
          </span>
        </button>
      </div>
    </>
  )
}

export default function Sidebar({ role, theme, onToggleTheme }) {
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-gray-200 dark:border-[#2A2A36]/60 bg-white dark:bg-[#0B0B0E]">
      <div className="h-16 flex items-center gap-2.5 px-6 border-b border-gray-200 dark:border-[#2A2A36]/60">
        <div className="w-8 h-8 rounded-xl bg-[#FF2B66]/15 flex items-center justify-center">
          <Sparkles size={16} className="text-[#FF2B66]" />
        </div>
        <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">EventSphere</span>
      </div>
      <SidebarNav role={role} theme={theme} onToggleTheme={onToggleTheme} />
    </aside>
  )
}