import { useState } from 'react'
import AppLayout from './AppLayout'
import ClientsPanel from '../components/dashboard/ClientsPanel'
import ClientOverview from '../components/dashboard/ClientOverview'
import ClientDrawer from '../components/dashboard/ClientDrawer'
import { dashboardData } from '../components/dashboard/sampleData'

export default function Clients({ user }) {
  const [selected, setSelected] = useState(null)

  return (
    <AppLayout user={user} badgeCount={dashboardData.leads.length}>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Manage Clients</h1>
        <p className="text-sm text-gray-500 dark:text-[#9CA3AF] mt-1">
          Manage and track your clients.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          <ClientsPanel clients={dashboardData.clients} onSelect={setSelected} />
        </div>
        <div className="xl:col-span-1">
          <ClientOverview clients={dashboardData.clients} />
        </div>
      </div>

      <ClientDrawer client={selected} onClose={() => setSelected(null)} />
    </AppLayout>
  )
}