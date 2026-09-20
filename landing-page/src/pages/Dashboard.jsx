import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import AppLayout from './AppLayout'
import DashStats from '../components/dashboard/DashStats'
import TodaysScheduleCard from '../components/dashboard/TodaysScheduleCard'
import AllBookingsCard from '../components/dashboard/AllBookingsCard'
import StatusOverviewCard from '../components/dashboard/StatusOverviewCard'
import WeekStrip from '../components/dashboard/WeekStrip'
import QuickActions from '../components/dashboard/QuickActions'
import { isToday } from '../components/dashboard/format'
import { useData } from '../api/data'

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

function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-[#121217] border border-gray-200 dark:border-[#2A2A36] px-3 py-1.5 text-[11px] font-bold tabular-nums text-gray-600 dark:text-[#9CA3AF]">
      <Clock size={12} className="text-[#FF2B66]" />
      {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
    </span>
  )
}

export default function Dashboard({ user }) {
  const { data } = useData()
  const name = user?.fullName || 'Administrator'
  const todayCount = data.events.filter(e => isToday(e.StartDate)).length
  const pending = data.leads.filter(l => l.Status === 'New').length

  return (
    <AppLayout user={user} badgeCount={data.leads.length}>
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
          <LiveClock />
        </div>
      </div>

      <DashStats data={data} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch w-full">
        <div className="flex flex-col gap-4 h-full min-w-0">
          <TodaysScheduleCard data={data} />
          <WeekStrip data={data} />
        </div>
        <AllBookingsCard data={data} />
        <div className="flex flex-col gap-4 h-full min-w-0">
          <StatusOverviewCard data={data} />
          <QuickActions />
        </div>
      </div>
    </AppLayout>
  )
}