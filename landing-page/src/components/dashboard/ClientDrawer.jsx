import { X, Calendar, Wallet, Pencil, PlusCircle } from 'lucide-react'
import { formatCurrency, formatFullDate } from './format'
import clientStatusBadge from './clientBadge'

function initials(name) {
  return String(name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function ClientDrawer({ client, onClose }) {
  if (!client) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-[#0B0B0E] border-l border-gray-200 dark:border-[#2A2A36] shadow-2xl flex flex-col animate-slide-in-right">
        <div className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-gray-200 dark:border-[#2A2A36]">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">Client Details</h3>
          <button onClick={onClose}
            className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-[#181820] flex items-center justify-center text-gray-500 dark:text-[#9CA3AF] hover:text-[#FF2B66] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="h-16 w-16 rounded-full bg-[#FF2B66]/10 text-[#FF2B66] font-bold text-xl flex items-center justify-center">
              {initials(client.ContactPerson)}
            </div>
            <div>
              <p className="font-bold text-xl text-gray-900 dark:text-white">{client.ContactPerson}</p>
              <p className="text-sm text-gray-500 dark:text-[#9CA3AF]">{client.CompanyName}</p>
            </div>
          </div>

          <dl className="space-y-4">
            <div className="flex flex-col items-start">
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280] mb-1">Email</dt>
              <dd className="text-sm text-gray-700 dark:text-gray-300">{client.Email || '—'}</dd>
            </div>
            <div className="flex flex-col items-start">
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280] mb-1">Phone</dt>
              <dd className="text-sm text-gray-700 dark:text-gray-300">{client.Phone || '—'}</dd>
            </div>
            <div className="flex flex-col items-start">
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280] mb-1">Date of Inquiry</dt>
              <dd className="text-sm text-gray-700 dark:text-gray-300">{formatFullDate(client.DateOfInquiry)}</dd>
            </div>
            <div className="flex flex-col items-start">
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280] mb-1">Status</dt>
              <dd>{clientStatusBadge(client.Status)}</dd>
            </div>
          </dl>

          <div className="border-t border-gray-200 dark:border-[#2A2A36] pt-5 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-gray-50 dark:bg-[#181820] border border-gray-200 dark:border-[#2A2A36] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-2">
                <Calendar size={14} className="text-[#FF2B66]" /> Events
              </div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{client.Events}</p>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-[#181820] border border-gray-200 dark:border-[#2A2A36] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-2">
                <Wallet size={14} className="text-[#FF2B66]" /> Total Budget
              </div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{formatCurrency(client.Budget)}</p>
            </div>
          </div>
        </div>

        <div className="shrink-0 p-6 border-t border-gray-200 dark:border-[#2A2A36] flex gap-3">
          <button className="flex-1 h-11 rounded-xl border border-gray-300 dark:border-[#2A2A36] hover:border-[#FF2B66]/50 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-[#FF2B66] transition-colors flex items-center justify-center gap-1.5">
            <Pencil size={15} /> Edit Client
          </button>
          <button className="flex-1 h-11 rounded-xl bg-[#FF2B66] hover:bg-[#E0245A] text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1.5">
            <PlusCircle size={15} /> Create Event
          </button>
        </div>
      </aside>
    </>
  )
}