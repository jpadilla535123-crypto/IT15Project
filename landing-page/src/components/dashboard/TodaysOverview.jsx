import { CalendarCheck, ChevronRight } from 'lucide-react'
import { startOfToday, toDate } from './format'

export default function TodaysOverview({ data }) {
  const today = startOfToday()
  const eventsToday = data.events.filter(e => toDate(e.StartDate) >= today && toDate(e.StartDate) < new Date(today.getTime() + 86400000)).length
  const employees = data.employees.length
  const inquiries = data.leads.length

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-[#FF2B66]/10 flex items-center justify-center text-[#FF2B66]">
          <CalendarCheck size={18} />
        </div>
        <p className="text-sm text-gray-600 dark:text-[#9CA3AF]">
          <span className="font-semibold text-gray-900 dark:text-white">
            {eventsToday} Event{eventsToday === 1 ? '' : 's'} Today
          </span>
          <span className="mx-1.5">•</span>
          <span className="font-semibold text-gray-900 dark:text-white">{employees}</span> Employees
          <span className="mx-1.5">•</span>
          <span className="font-semibold text-gray-900 dark:text-white">{inquiries}</span> Inquiries
        </p>
      </div>
      <a href="#manage-events"
        className="inline-flex items-center gap-1 text-sm font-semibold text-[#FF2B66] hover:gap-1.5 transition-all shrink-0">
        View Calendar <ChevronRight size={15} />
      </a>
    </section>
  )
}