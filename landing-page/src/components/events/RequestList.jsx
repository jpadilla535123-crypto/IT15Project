import { useState } from 'react'
import {
  Inbox, MessageSquare, Phone, Loader2, Check, X, ArrowLeft,
  Send, Building2, Mail,
} from 'lucide-react'
import { api } from '../../api/client'
import { useData } from '../../api/data'
import { formatFullDate } from '../dashboard/format'

const REQ_TONES = {
  New: 'bg-[#FF2B66]/10 text-[#FF2B66] dark:bg-[#FF2B66]/15 dark:text-[#FF7A9F]',
  Contacted: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  'Confirmed Appointment': 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  Cancelled: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300',
  Lost: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300',
}

function initials(name) {
  return String(name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function sourceLabel(source) {
  if (source === 'Newsletter') return 'Newsletter signup'
  if (source === 'Website') return 'Website request'
  return source || 'Website'
}

/* Floating "Requests" tray used inside Event Management (Admin/Manager POV).
   Stacked requests come from the landing page (services + contact us) and
   arrive as leads via POST /api/leads/public. From here staff can confirm,
   message (email), call or cancel each request. */
export default function RequestList() {
  const { data, reload } = useData()
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [compose, setCompose] = useState(false)
  const [sending, setSending] = useState(false)
  const [actionMsg, setActionMsg] = useState(null)
  const [cancelNote, setCancelNote] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)

  const requests = (data.leads || []).slice().sort((a, b) =>
    (b.CreatedDate?.getTime?.() ?? 0) - (a.CreatedDate?.getTime?.() ?? 0))
  const openCount = requests.filter(r => r.Status === 'New' || r.Status === 'Contacted').length
  const selected = requests.find(r => r.Id === selectedId) || null

  function closeAll() {
    setOpen(false)
    setSelectedId(null)
    setCompose(false)
    setActionMsg(null)
    setConfirmCancel(false)
    setCancelNote('')
  }

  async function runAction(fn) {
    setActionMsg(null)
    try {
      await fn()
      await reload()
    } catch (err) {
      setActionMsg({ ok: false, text: err.message })
    }
  }

  function confirmRequest() {
    runAction(() => api.post(`/api/leads/${selectedId}/confirm`))
      .then(() => setActionMsg({ ok: true, text: 'Request confirmed. Status updated to Confirmed Appointment.' }))
  }

  function cancelRequest() {
    runAction(() => api.post(`/api/leads/${selectedId}/cancel`, { note: cancelNote || null }))
      .then(() => setActionMsg({ ok: true, text: 'Request cancelled.' }))
  }

  async function sendMessage(e, subject, body) {
    e.preventDefault()
    setSending(true)
    setActionMsg(null)
    try {
      const res = await api.post(`/api/leads/${selectedId}/message`, { subject, body })
      if (res.sent) {
        setCompose(false)
        setActionMsg({ ok: true, text: `Email sent to ${res.to}.` })
      } else if (res.mailto) {
        window.location.href = res.mailto
        setCompose(false)
        setActionMsg({ ok: false, text: 'Server email is not configured — your mail app has opened instead.' })
      } else {
        setActionMsg({ ok: false, text: res.reason || 'Could not send the email.' })
      }
    } catch (err) {
      setActionMsg({ ok: false, text: err.message })
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-3 rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] px-4 py-3 shadow-xl hover:border-[#FF2B66]/60 hover:shadow-2xl transition-all group">
          <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF2B66]/10 text-[#FF2B66]">
            <Inbox size={18} />
            {openCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 rounded-full bg-[#FF2B66] text-white text-[10px] font-bold flex items-center justify-center px-1">
                {openCount}
              </span>
            )}
          </span>
          <span className="text-left">
            <span className="block text-[13px] font-bold text-gray-900 dark:text-white group-hover:text-[#FF2B66] transition-colors">Requests</span>
            <span className="block text-[11px] text-gray-400 dark:text-[#6B7280]">{requests.length} from the landing page</span>
          </span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={closeAll} />
          <div className="relative flex h-full w-full max-w-md flex-col bg-white dark:bg-[#121217] border-l border-gray-200 dark:border-[#2A2A36] shadow-2xl">
            <div className="flex items-start justify-between gap-3 p-5 pb-3 border-b border-gray-100 dark:border-[#2A2A36]/60">
              <div className="flex items-center gap-3">
                {selected && (
                  <button onClick={() => { setSelectedId(null); setCompose(false); setActionMsg(null) }}
                    className="h-9 w-9 rounded-xl border border-gray-200 dark:border-[#2A2A36] text-gray-500 dark:text-[#9CA3AF] hover:text-[#FF2B66] hover:border-[#FF2B66]/50 flex items-center justify-center transition-colors"
                    title="Back to list">
                    <ArrowLeft size={16} />
                  </button>
                )}
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    {selected ? (selected.ContactName || selected.CompanyName) : 'Client requests'}
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-[#6B7280] mt-0.5">
                    {selected
                      ? `Request from ${formatFullDate(selected.CreatedDate)}`
                      : `${requests.length} request(s) received from the landing page`}
                  </p>
                </div>
              </div>
              <button onClick={closeAll} aria-label="Close"
                className="h-9 w-9 rounded-xl border border-gray-200 dark:border-[#2A2A36] text-gray-500 dark:text-[#9CA3AF] hover:text-[#FF2B66] hover:border-[#FF2B66]/50 flex items-center justify-center transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {!selected && requests.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-[#6B7280] text-center py-12">
                  No requests yet. Requests from "Contact Us" and the services pages of your site will appear here.
                </p>
              )}

              {!selected && requests.map(r => (
                <button key={r.Id} onClick={() => setSelectedId(r.Id)}
                  className="w-full text-left rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-gray-50 dark:bg-white/[0.02] p-4 hover:border-[#FF2B66]/50 hover:bg-white dark:hover:bg-white/[0.05] transition-all flex items-start gap-3">
                  <span className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${REQ_TONES[r.Status] || REQ_TONES.New}`}>
                    {initials(r.ContactName || r.CompanyName)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-bold text-sm text-gray-900 dark:text-white truncate">{r.ContactName || r.CompanyName}</span>
                      <span className="shrink-0 text-[10px] text-gray-400 dark:text-[#6B7280] tabular-nums">
                        {r.CreatedDate ? r.CreatedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                      </span>
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-[#9CA3AF] truncate mt-0.5">
                      {r.EventType || 'General inquiry'} · {sourceLabel(r.Source)}
                    </span>
                    {r.Notes && <span className="block text-[11px] text-gray-400 dark:text-[#6B7280] truncate mt-1">{r.Notes}</span>}
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold mt-2 ${REQ_TONES[r.Status] || REQ_TONES.New}`}>
                      {r.Status}
                    </span>
                  </span>
                </button>
              ))}

              {selected && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-gray-50 dark:bg-[#0B0B0E] p-4">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${REQ_TONES[selected.Status] || REQ_TONES.New}`}>
                        {selected.Status}
                      </span>
                      {selected.Source === 'Newsletter' && <span className="rounded-full bg-gray-100 dark:bg-white/10 px-2.5 py-1 text-[10px] font-bold text-gray-500">Newsletter</span>}
                    </div>
                    <dl className="space-y-2 text-xs">
                      <Row label="Contact" value={`${selected.ContactName || '—'}${selected.CompanyName ? ` · ${selected.CompanyName}` : ''}`} />
                      <Row label="Event type" value={selected.EventType || 'General inquiry'} />
                      <Row label="Source" value={sourceLabel(selected.Source)} />
                      <Row label="Received" value={formatFullDate(selected.CreatedDate)} />
                      {selected.EstimatedBudget > 0 &&
                        <Row label="Budget" value={`₱${selected.EstimatedBudget.toLocaleString('en-US')}`} />}
                      <Row label="Phone" value={selected.Phone || '—'} />
                      <Row label="Email" value={selected.Email || '—'} />
                    </dl>
                  </div>

                  {selected.Notes && (
                    <div className="rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-gray-50 dark:bg-[#0B0B0E] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#6B7280] mb-1.5">Request details</p>
                      <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{selected.Notes}</p>
                    </div>
                  )}

                  {actionMsg && (
                    <p className={`text-xs font-bold rounded-xl px-4 py-3 ${actionMsg.ok ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'bg-red-500/10 text-red-500'}`}>
                      {actionMsg.text}
                    </p>
                  )}

                  <div className="rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={confirmRequest} disabled={selected.Status === 'Confirmed Appointment'}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FF2B66] hover:bg-[#E0245A] text-white text-xs font-bold py-2.5 px-3 transition-all active:scale-95 disabled:opacity-40">
                        <Check size={13} /> Confirm
                      </button>
                      <button onClick={() => setCompose(c => !c)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-[#2A2A36] text-gray-700 dark:text-gray-200 hover:border-[#FF2B66]/60 hover:text-[#FF2B66] text-xs font-bold py-2.5 px-3 transition-all">
                        <MessageSquare size={13} /> Message
                      </button>
                      {selected.Phone && (
                        <a href={`tel:${selected.Phone}`}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-[#2A2A36] text-gray-700 dark:text-gray-200 hover:border-emerald-500/60 hover:text-emerald-500 text-xs font-bold py-2.5 px-3 transition-all">
                          <Phone size={13} /> Call
                        </a>
                      )}
                      <button onClick={() => setConfirmCancel(c => !c)} disabled={selected.Status === 'Cancelled' || selected.Status === 'Lost'}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 dark:border-red-500/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs font-bold py-2.5 px-3 transition-all disabled:opacity-40">
                        <X size={13} /> Cancel
                      </button>
                    </div>

                    {selected.Phone && !selected.Email && (
                      <p className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-[#6B7280] px-1">
                        <Phone size={11} /> No email on file — call to reach this client.
                      </p>
                    )}
                    {selected.Email && (
                      <a className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-[#6B7280] px-1 hover:text-[#FF2B66] transition-colors"
                        href={`mailto:${selected.Email}`}>
                        <Mail size={11} /> Or {selected.Email} directly
                      </a>
                    )}

                    {confirmCancel && (
                      <div className="space-y-2 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5 p-3">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-red-500">Reason for cancelling (optional)</label>
                        <textarea rows={2} value={cancelNote} onChange={e => setCancelNote(e.target.value)}
                          placeholder="Why is this request being closed?"
                          className="w-full resize-none rounded-lg border border-red-200 dark:border-red-500/30 bg-white dark:bg-[#0B0B0E] px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-red-400 placeholder:text-gray-400" />
                        <button onClick={cancelRequest}
                          className="w-full rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 transition-colors">
                          Cancel this request
                        </button>
                      </div>
                    )}
                  </div>

                  {compose && selected.Email && (
                    <ComposeForm selected={selected} sending={sending} onSubmit={sendMessage} />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-gray-400 dark:text-[#6B7280]">{label}</dt>
      <dd className="text-right font-semibold text-gray-700 dark:text-gray-200 break-words">{value}</dd>
    </div>
  )
}

function ComposeForm({ selected, sending, onSubmit }) {
  const [subject, setSubject] = useState(`Re: your event inquiry — EventSphere`)
  const [body, setBody] = useState(
    `Hi ${selected.ContactName || 'there'},\n\nThanks for reaching out to EventSphere about your ${selected.EventType || 'event'}. We received your request and would love to discuss the details.\n\nBest regards,\nEventSphere Team`)
  return (
    <form onSubmit={e => onSubmit(e, subject, body)}
      className="rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-4 space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF2B66]/10 text-[#FF2B66]"><MessageSquare size={14} /></span>
        <p className="text-sm font-bold text-gray-900 dark:text-white">Compose message</p>
      </div>
      <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject"
        className="w-full rounded-lg border border-gray-200 dark:border-[#2A2A36] bg-gray-50 dark:bg-[#0B0B0E] px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-[#FF2B66]/60" />
      <textarea rows={5} value={body} onChange={e => setBody(e.target.value)} placeholder="Message"
        className="w-full resize-none rounded-lg border border-gray-200 dark:border-[#2A2A36] bg-gray-50 dark:bg-[#0B0B0E] px-3 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-[#FF2B66]/60 placeholder:text-gray-400" />
      <div className="flex items-center gap-2">
        <button type="submit" disabled={sending}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#FF2B66] hover:bg-[#E0245A] text-white text-xs font-bold py-2 px-3 transition-colors disabled:opacity-60">
          {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Send email
        </button>
        <a href={`mailto:${selected.Email}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-[#2A2A36] text-gray-600 dark:text-gray-300 hover:border-[#FF2B66]/50 text-xs font-bold py-2 px-3 transition-colors">
          <Mail size={12} /> Open in mail app
        </a>
      </div>
      <p className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-[#6B7280]">
        <Building2 size={11} /> Sends to {selected.Email} {selected.Phone ? `· tel ${selected.Phone}` : ''}
      </p>
    </form>
  )
}