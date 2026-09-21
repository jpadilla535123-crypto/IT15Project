import { useMemo, useState } from 'react'
import { X, Mail, Check, Loader2, Phone } from 'lucide-react'
import ModalShell from './ModalShell'
import { api } from '../../api/client'
import '../../pages/landingFx.css'

/* Mirror of the backend's EmailCheckService.SuggestName — turns the email's
   local part into a presentable name, e.g. juan.dela.cruz@… → "Juan Dela Cruz". */
function suggestName(email) {
  if (!email) return null
  const local = (email || '').split('@')[0].trim()
  if (!local || local.length > 64 || !/^[A-Za-z0-9._+-]+$/.test(local)) return null
  const words = local
    .split(/[._\-+]/)
    .map(w => {
      if (!w || !/[A-Za-z]/.test(w)) return null
      const spaced = w.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      return spaced
        .split(' ')
        .filter(Boolean)
        .map(p => p[0].toUpperCase() + p.slice(1).toLowerCase())
        .join(' ')
    })
    .filter(Boolean)
  return words.length ? words.join(' ') : null
}

export default function NewsletterModal({ open, email, onClose, onConfirmed }) {
  const [phone, setPhone] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const name = useMemo(() => suggestName(email), [email])

  async function confirmSubscribe() {
    setConfirming(true)
    setError('')
    try {
      await api.post('/api/leads/public', {
        email,
        phone: phone.trim(),
        source: 'Newsletter',
        notes: 'Subscribed via "Stay in the loop" on the landing page',
      })
      setDone(true)
      setTimeout(() => {
        setDone(false)
        onConfirmed?.()
        onClose()
      }, 1200)
    } catch (err) {
      setError(err.message || 'Could not subscribe. Please try again.')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <ModalShell open={open} onClose={confirming ? () => {} : onClose}>
      <div className="p-7 lg:p-9">
        <div className="flex items-center justify-between mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#FF2B66]/15 flex items-center justify-center">
            <Mail size={18} className="text-[#FF2B66]" />
          </div>
          <button onClick={onClose} disabled={confirming} aria-label="Close"
            className="h-8 w-8 rounded-full bg-neutral-800/70 hover:bg-neutral-800 hover:rotate-90 text-neutral-400 hover:text-white flex items-center justify-center transition-all duration-300 disabled:opacity-40">
            <X size={16} />
          </button>
        </div>

        {done ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
              <Check size={32} className="text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mt-5">You're subscribed!</h2>
            <p className="text-sm text-neutral-400 mt-2">We&apos;ll email you about our upcoming events.</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white">Confirm subscription</h2>
            <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
              We&apos;ll send event announcements, planning tips, and industry news — weekly — to
            </p>
            <p className="mt-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm font-semibold break-all">
              {email}
            </p>

            {name && (
              <p className="mt-3 text-xs text-neutral-400">
                <span className="text-neutral-500">We&apos;ll reach you as</span>{' '}
                <span className="text-white font-semibold">{name}</span> — edit your email above if that&apos;s not right.
              </p>
            )}

            <div className="mt-3 relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500">
                <Phone size={15} />
              </div>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !confirming) confirmSubscribe() }}
                type="tel"
                placeholder="Your phone number (optional)"
                className="w-full bg-white/[0.04] border border-white/10 text-white text-sm rounded-xl pl-10 pr-4 py-3 placeholder:text-neutral-500 focus:outline-none focus:border-[#FF2B66]/60 transition-colors"
              />
            </div>

            <p className="text-[11px] text-neutral-500 mt-2 leading-relaxed">
              Your number helps us reach you if your email is unreachable. You can unsubscribe any time; we never share your details.
            </p>

            {error && <p className="text-[#FF2B66] text-xs mt-3">{error}</p>}

            <div className="flex gap-3 mt-6">
              <button onClick={onClose} disabled={confirming}
                className="border border-neutral-800 hover:bg-white/5 text-neutral-300 font-semibold py-3 rounded-xl transition-colors text-sm flex-1 disabled:opacity-50">
                Cancel
              </button>
              <button onClick={confirmSubscribe} disabled={confirming}
                className="flex-1 bg-[#FF2B66] hover:bg-[#E0245A] text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {confirming ? <><Loader2 size={15} className="animate-spin" /> Subscribing...</> : 'Confirm'}
              </button>
            </div>
          </>
        )}
      </div>
    </ModalShell>
  )
}