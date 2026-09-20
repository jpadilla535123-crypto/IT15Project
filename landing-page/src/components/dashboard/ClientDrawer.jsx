import { X, Calendar, Wallet, CreditCard, FileText, ExternalLink, Image } from 'lucide-react'
import { formatCurrency, formatFullDate } from './format'
import { useData } from '../../api/data'
import { API_URL } from '../../api/client'
import clientStatusBadge from './clientBadge'

function initials(name) {
  return String(name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

const REG_STATUS_TONES = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  Confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
}

function regBadge(status) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${REG_STATUS_TONES[status] || REG_STATUS_TONES.Pending}`}>{status}</span>
}

export default function ClientDrawer({ client, onClose }) {
  const { data } = useData()
  if (!client) return null

  const registrations = data.registrations.filter(r => r.ClientId === client.Id)

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

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
          {/* client profile */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="h-16 w-16 rounded-full bg-[#FF2B66]/10 text-[#FF2B66] font-bold text-xl flex items-center justify-center">
              {initials(client.ContactPerson)}
            </div>
            <div>
              <p className="font-bold text-xl text-gray-900 dark:text-white">{client.ContactPerson}</p>
              <p className="text-sm text-gray-500 dark:text-[#9CA3AF]">{client.CompanyName}</p>
            </div>
          </div>

          {/* info */}
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

          {/* stats */}
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

          {/* registrations */}
          <div className="border-t border-gray-200 dark:border-[#2A2A36] pt-5">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText size={16} className="text-[#FF2B66]" /> Registrations
            </h4>

            {registrations.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-[#6B7280] text-center py-6 border border-dashed border-gray-200 dark:border-[#2A2A36] rounded-xl">
                No registrations yet.
              </p>
            ) : (
              <div className="space-y-4">
                {registrations.map(r => (
                  <div key={r.Id} className="rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-gray-50 dark:bg-[#181820] p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.EventName || `Event #${r.EventId}`}</p>
                        <p className="text-[11px] text-gray-400 dark:text-[#6B7280] mt-0.5">
                          {r.VenueName ? `${r.VenueName} · ` : ''}{formatFullDate(r.EventStartDate)}
                        </p>
                      </div>
                      {regBadge(r.Status)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-[#9CA3AF]">
                        <CreditCard size={12} className="text-[#FF2B66]" />
                        <span>{r.PaymentMethod || '—'}</span>
                      </div>
                      <div className="text-right font-semibold text-gray-700 dark:text-white">
                        {formatCurrency(r.Amount)}
                      </div>
                      <div className="col-span-2 text-gray-500 dark:text-[#9CA3AF]">
                        Ref: <span className="font-mono text-gray-700 dark:text-white">{r.ReferenceNumber || '—'}</span>
                      </div>
                      <div className="col-span-2 text-gray-500 dark:text-[#9CA3AF]">
                        Ticket: <span className="font-mono font-bold text-[#FF2B66]">{r.TicketReference}</span>
                      </div>
                    </div>

                    {/* evidence screenshot */}
                    {r.EvidencePath && (
                      <div>
                        <p className="text-[11px] font-semibold text-gray-400 dark:text-[#6B7280] uppercase tracking-wider mb-1.5">Payment Evidence</p>
                        <a href={`${API_URL}${r.EvidencePath}`} target="_blank" rel="noopener noreferrer"
                          className="group relative block rounded-xl overflow-hidden border border-gray-200 dark:border-[#2A2A36] hover:border-[#FF2B66]/50 transition-colors">
                          <img
                            src={`${API_URL}${r.EvidencePath}`}
                            alt="Payment evidence"
                            className="w-full max-h-48 object-contain bg-black/30"
                            onError={e => { e.target.style.display = 'none' }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors opacity-0 group-hover:opacity-100">
                            <ExternalLink size={20} className="text-white drop-shadow" />
                          </span>
                        </a>
                      </div>
                    )}
                    {!r.EvidencePath && (
                      <p className="text-[11px] text-gray-400 dark:text-[#6B7280] italic flex items-center gap-1">
                        <Image size={12} /> No evidence uploaded
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}