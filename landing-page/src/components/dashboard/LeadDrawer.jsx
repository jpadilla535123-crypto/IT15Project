import { useState } from 'react'
import {
  X, Phone, Mail, Copy, Check, CalendarDays, Inbox, Wallet, Building2,
} from 'lucide-react'
import { formatFullDate } from './format'

const PIPELINE = ['Pending', 'Contacted', 'Confirmed Appointment', 'Lost']

const STATUS_TONES = {
  Pending: 'bg-[#FF2B66]/10 text-[#FF2B66] dark:bg-[#FF2B66]/15 dark:text-[#FF7A9F]',
  Contacted: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  'Confirmed Appointment': 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  Cancelled: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300',
  Lost: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300',
}

function initials(name) {
  return String(name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function LeadDrawer({ lead, onClose, onStatus }) {
  const [copied, setCopied] = useState(null)

  if (!lead) return null

  async function copy(text, key) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1400)
    } catch { /* clipboard unavailable */ }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-white dark:bg-[#121217] border-l border-gray-200 dark:border-[#2A2A36] shadow-2xl">
        <div className="p-5 pb-3 border-b border-gray-100 dark:border-[#2A2A36]/60">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-12 w-12 shrink-0 rounded-full bg-[#FF2B66]/10 text-[#FF2B66] font-bold flex items-center justify-center">
                {initials(lead.ContactName)}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{lead.ContactName}</h3>
                <p className="text-xs text-gray-400 dark:text-[#6B7280] truncate">{lead.EventType || 'General inquiry'}</p>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close"
              className="h-9 w-9 shrink-0 rounded-xl border border-gray-200 dark:border-[#2A2A36] text-gray-500 dark:text-[#9CA3AF] hover:text-[#FF2B66] hover:border-[#FF2B66]/50 flex items-center justify-center transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_TONES[lead.Status] || STATUS_TONES.Pending}`}>
              {lead.Status}
            </span>
            <span className="text-[11px] text-gray-400 dark:text-[#6B7280]">via {lead.Source || 'Website'}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5">
          {/* Status pipeline */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#6B7280] mb-2">Mark status</p>
            <div className="flex flex-wrap gap-1.5">
              {PIPELINE.map(s => {
                const active = lead.Status === s
                const tone = STATUS_TONES[s] || STATUS_TONES.Pending
                const done = PIPELINE.indexOf(s) < (lead.Status === 'Cancelled' ? -1 : PIPELINE.indexOf(lead.Status))
                return (
                  <button key={s} onClick={() => onStatus(lead.Id, s)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border transition-all active:scale-95 ${
                      active
                        ? `${tone} border-transparent`
                        : 'border-gray-200 dark:border-[#2A2A36] text-gray-500 dark:text-[#9CA3AF] hover:border-[#FF2B66]/50 hover:text-[#FF2B66]'
                    }`}>
                    {done && !active ? <Check size={12} /> : null}
                    {s}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Phone section */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#6B7280] mb-2">Contact</p>
            <div className="rounded-xl border border-gray-200 dark:border-[#2A2A36] divide-y divide-gray-100 dark:divide-[#2A2A36]/60">
              <ContactRow
                icon={Phone}
                label="Phone"
                value={lead.Phone || '—'}
                copied={copied}
                action={lead.Phone ? (
                  <a href={`tel:${lead.Phone}`} title="Call"
                    className="h-8 w-8 rounded-lg hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-500 flex items-center justify-center transition-colors">
                    <Phone size={15} />
                  </a>
                ) : null}
                onCopy={lead.Phone ? () => copy(lead.Phone, 'Phone') : null}
              />
              <ContactRow
                icon={Mail}
                label="E-mail"
                value={lead.Email || '—'}
                copied={copied}
                action={lead.Email ? (
                  <a href={`mailto:${lead.Email}`} title="Send email"
                    className="h-8 w-8 rounded-lg hover:bg-[#FF2B66]/10 text-gray-400 hover:text-[#FF2B66] flex items-center justify-center transition-colors">
                    <Mail size={15} />
                  </a>
                ) : null}
                onCopy={lead.Email ? () => copy(lead.Email, 'E-mail') : null}
              />
            </div>
          </section>

          {/* Details */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#6B7280] mb-2">Details</p>
            <dl className="rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-gray-50 dark:bg-[#0B0B0E] divide-y divide-gray-100 dark:divide-[#2A2A36]/60 text-sm">
              <DetailRow icon={Building2} label="Event type" value={lead.EventType || 'General inquiry'} />
              <DetailRow icon={Inbox} label="Source" value={lead.Source || 'Website'} />
              {lead.EstimatedBudget > 0 && (
                <DetailRow icon={Wallet} label="Budget" value={`₱${Number(lead.EstimatedBudget).toLocaleString('en-US')}`} />
              )}
              <DetailRow icon={CalendarDays} label="Received" value={lead.CreatedDate ? formatFullDate(lead.CreatedDate) : '—'} />
            </dl>
          </section>

          {lead.Notes && (
            <section>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#6B7280] mb-2">Notes</p>
              <p className="rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-gray-50 dark:bg-[#0B0B0E] px-4 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">
                {lead.Notes}
              </p>
            </section>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-[#2A2A36]/60">
          <button onClick={onClose}
            className="w-full rounded-xl border border-gray-200 dark:border-[#2A2A36] text-gray-600 dark:text-[#9CA3AF] hover:border-[#FF2B66]/50 hover:text-[#FF2B66] text-sm font-semibold py-2.5 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function ContactRow({ icon: Icon, label, value, action, onCopy, copied }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="h-8 w-8 shrink-0 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 dark:text-[#6B7280]">
        <Icon size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#6B7280]">{label}</p>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{value}</p>
      </div>
      {onCopy && (
        <button onClick={onCopy} title="Copy"
          className="h-8 w-8 shrink-0 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-colors">
          {copied === label ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </button>
      )}
      {action}
    </div>
  )
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <dt className="flex items-center gap-2 text-gray-500 dark:text-[#9CA3AF]">
        <Icon size={14} className="text-gray-400 dark:text-[#6B7280]" />
        {label}
      </dt>
      <dd className="text-right font-semibold text-gray-800 dark:text-gray-200 break-words">{value}</dd>
    </div>
  )
}