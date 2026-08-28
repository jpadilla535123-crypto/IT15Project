import AppLayout from './AppLayout'
import LeadsTable from '../components/dashboard/LeadsTable'
import { dashboardData } from '../components/dashboard/sampleData'

export default function Leads({ user }) {
  return (
    <AppLayout user={user} badgeCount={dashboardData.leads.length}>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Leads</h1>
        <p className="text-sm text-gray-500 dark:text-[#9CA3AF] mt-1">
          Manage and track potential EventSphere clients.
        </p>
      </div>

      <LeadsTable data={dashboardData.leads} />
    </AppLayout>
  )
}