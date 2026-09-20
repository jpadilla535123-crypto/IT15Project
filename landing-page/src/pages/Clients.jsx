import { useState } from 'react'
import AppLayout from './AppLayout'
import ClientsPanel from '../components/dashboard/ClientsPanel'
import ClientOverview from '../components/dashboard/ClientOverview'
import ClientDrawer from '../components/dashboard/ClientDrawer'
import TicketModal from '../components/landing/TicketModal'
import RegisterModal from '../components/landing/RegisterModal'
import { useData } from '../api/data'

export default function Clients({ user }) {
  const { data, reload } = useData()
  const [selected, setSelected] = useState(null)
  const [ticketOpen, setTicketOpen] = useState(false)
  const [registerEvent, setRegisterEvent] = useState(null)

  return (
    <AppLayout user={user} badgeCount={data.leads.length}>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Manage Clients</h1>
        <p className="text-sm text-gray-500 dark:text-[#9CA3AF] mt-1">
          Clients register from open events on the site — their payment details and proof
          appear here after submission.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          <ClientsPanel
            clients={data.clients}
            onSelect={setSelected}
            onAddClient={() => setTicketOpen(true)}
          />
        </div>
        <div className="xl:col-span-1">
          <ClientOverview clients={data.clients} />
        </div>
      </div>

      <ClientDrawer client={selected} onClose={() => setSelected(null)} />

      <TicketModal
        open={ticketOpen}
        onClose={() => setTicketOpen(false)}
        onRegister={ev => {
          setTicketOpen(false)
          setRegisterEvent(ev)
        }}
      />
      <RegisterModal
        event={registerEvent}
        onClose={() => setRegisterEvent(null)}
        onSuccess={() => reload()}
      />
    </AppLayout>
  )
}