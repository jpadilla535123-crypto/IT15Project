import { Search, Bell, Sparkles, Plus } from 'lucide-react'
import AppLayout from './AppLayout'
import DashStats from '../components/dashboard/DashStats'
import TodaysScheduleCard from '../components/dashboard/TodaysScheduleCard'
import AllBookingsCard from '../components/dashboard/AllBookingsCard'
import StatusOverviewCard from '../components/dashboard/StatusOverviewCard'
import WeekStrip from '../components/dashboard/WeekStrip'
import QuickActions from '../components/dashboard/QuickActions'
import { isToday } from '../components/dashboard/format'
import { dashboardData } from '../components/dashboard/sampleData'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function dateTag() {
  const d = new Date()
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' })
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  return `${weekday} ${d.getDate()} ${month} ${d.getFullYear()}`.toUpperCase()
}

export default function Dashboard({ user }) {
  const name = user?.displayName || 'Administrator'
  const todayCount = dashboardData.events.filter(e => isToday(e.StartDate)).length
  const pending = dashboardData.leads.filter(l => l.Status === 'New').length

  return (
    <AppLayout user={user} badgeCount={dashboardData.leads.length}>
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#6B7280]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF2B66]" />
            {dateTag()}
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            {greeting()}, {name}.
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-[#9CA3AF]">
            <span className="font-bold text-gray-900 dark:text-white">{todayCount}</span> events today,{' '}
            <span className="font-bold text-[#FF2B66]">{pending}</span> pending requests
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            className="h-10 w-10 rounded-xl bg-white dark:bg-[#121217] border border-gray-200 dark:border-[#2A2A36] flex items-center justify-center text-gray-500 dark:text-[#9CA3AF] hover:text-[#FF2B66] transition-colors"
            title="Search">
            <Search size={17} />
          </button>
          <button
            className="relative h-10 w-10 rounded-xl bg-white dark:bg-[#121217] border border-gray-200 dark:border-[#2A2A36] flex items-center justify-center text-gray-500 dark:text-[#9CA3AF] hover:text-[#FF2B66] transition-colors"
            title="Notifications">
            <Bell size={17} />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
          </button>
          <button
            className="flex items-center gap-1.5 rounded-xl bg-[#FF2B66]/10 text-[#FF2B66] px-3.5 py-2.5 text-xs font-semibold hover:bg-[#FF2B66]/15 transition-colors">
            <Sparkles size={14} /> Chat with Eva
          </button>
          <button
            className="inline-flex items-center gap-1.5 bg-[#FF2B66] hover:bg-[#E0245A] text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors">
            <Plus size={16} /> New Booking
          </button>
        </div>
      </div>

      <DashStats data={dashboardData} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch w-full">
        <div className="flex flex-col gap-4 h-full min-w-0">
          <TodaysScheduleCard data={dashboardData} />
          <WeekStrip data={dashboardData} />
        </div>
        <AllBookingsCard data={dashboardData} />
        <div className="flex flex-col gap-4 h-full min-w-0">
          <StatusOverviewCard data={dashboardData} />
          <QuickActions />
        </div>
      </div>
    </AppLayout>
  )
}