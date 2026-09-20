import AppLayout from './AppLayout'
import LeadsTable from '../components/dashboard/LeadsTable'
import { useData } from '../api/data'

export default function Leads({ user }) {
  const { data } = useData()
  return (
    <AppLayout user={user} badgeCount={data.leads.length}>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Leads</h1>
        <p className="text-sm text-gray-500 dark:text-[#9CA3AF] mt-1">
          Manage and track potential EventSphere clients.
        </p>
      </div>

      <LeadsTable data={data.leads} />
    </AppLayout>
  )
}