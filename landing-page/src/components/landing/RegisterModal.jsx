import { useEffect, useState } from 'react'
import {
  X, Calendar, MapPin, Check, Loader2, ArrowRight, ArrowLeft, Smartphone, Landmark, CreditCard, Wallet, ImagePlus, Lock,
  QrCode, ExternalLink, ShieldCheck, CheckCircle2,
} from 'lucide-react'
import ModalShell from './ModalShell'
import { api } from '../../api/client'
import { formatCurrency, formatFullDate } from '../dashboard/format'
import '../../pages/landingFx.css'

const STEPS = { details: 0, payment: 1, review: 2, confirm: 3 }

/* DEMO GCash number used in the QR popup.
   TODO: replace with the real organizer GCash number before going live. */
const GCASH_NUMBER = '0917 000 0000'

const PAY_METHODS = [
  { key: 'GCash', icon: Smartphone, online: true },
  { key: 'Bank Transfer', icon: Landmark },
  { key: 'Credit Card', icon: CreditCard, online: true },
  { key: 'Cash', icon: Wallet },
]

export default function RegisterModal({ event, onClose, onSuccess }) {
  const [step, setStep] = useState(STEPS.details)
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' })
  const [pay, setPay] = useState({ method: 'GCash', reference: '', payerName: '', file: null, preview: '' })
  const [errors, setErrors] = useState({})
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')
  const [reference, setReference] = useState('')
  const [result, setResult] = useState(null)
  const [payNowOpen, setPayNowOpen] = useState(false)
  const [online, setOnline] = useState({ loading: false, url: '', sessionId: '', paid: false, checking: false, error: '' })
  const [qrOpen, setQrOpen] = useState(false)

  useEffect(() => {
    if (event) {
      setStep(STEPS.details)
      setForm({ name: '', email: '', phone: '', address: '' })
      setPay({ method: 'GCash', reference: '', payerName: '', file: null, preview: '' })
      setErrors({})
      setPayError('')
      setResult(null)
      setReference(`TKT-2026-${String(Math.floor(100000 + Math.random() * 900000))}`)
      setOnline({ loading: false, url: '', sessionId: '', paid: false, checking: false, error: '' })
      setPayNowOpen(false)
      setQrOpen(false)
    }
  }, [event])

  const back = () => setStep(s => Math.max(0, s - 1))

  /* poll the PayMongo checkout session until it's marked paid */
  useEffect(() => {
    if (!online.sessionId || online.paid) return
    let cancelled = false
    const poll = async () => {
      try {
        const res = await api.get(`/api/tickets/public/paymongo-status/${online.sessionId}`)
        if (cancelled) return
        if (res?.paid) {
          setOnline(o => ({ ...o, paid: true, checking: false }))
          setPay(p => ({ ...p, reference: p.reference || `PM-${online.sessionId.slice(-6).toUpperCase()}` }))
        } else {
          setOnline(o => ({ ...o, checking: true }))
        }
      } catch {
        if (!cancelled) setOnline(o => ({ ...o, error: 'Could not check payment status. Continue with the QR option or screenshot below.' }))
      }
    }
    poll()
    const t = setInterval(poll, 5000)
    return () => { cancelled = true; clearInterval(t) }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [online.sessionId])

  if (!event) return null

  function startOnlinePayment() {
    setOnline(o => ({ ...o, loading: true, error: '' }))
    api.post('/api/tickets/public/paymongo-checkout', {
      eventId: event.id,
      amount: Number(event.priceRaw || event.price || 0),
      description: `Ticket to ${event.title}`,
    }).then(res => {
      setOnline(o => ({ ...o, loading: false, url: res.checkoutUrl || '', sessionId: res.sessionId || '' }))
      setPayNowOpen(true)
      if (res.checkoutUrl) window.open(res.checkoutUrl, '_blank', 'noopener,noreferrer')
    }).catch(err => {
      setOnline(o => ({ ...o, loading: false, error: err.message || 'Could not start an online checkout. Use the QR code option instead.' }))
    })
  }

  /* the QR payload is a demo string — a real deployment would encode the
     organizer GCash number so attendees can scan-and-pay directly. */
  const qrPayload = `PAY GCash (DEMO)\nAccount: ${GCASH_NUMBER}\nEvent: ${event.title}\nAmount: ${formatCurrency(event.priceRaw || event.price || 0)}\nRef: ${reference}`
  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=16&color=fff&bgcolor=0b0b0e&data=${encodeURIComponent(qrPayload)}`

  function validateDetails() {
    const e = {}
    if (!form.name.trim()) e.name = 'Please enter your full name'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address'
    if (!pay.reference.trim()) e.reference = 'Enter your payment reference number'
    if (!pay.payerName.trim()) e.payerName = 'Enter the name on your payment'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validatePayment() {
    const e = {}
    if (!pay.reference.trim()) e.reference = 'Enter your payment reference number'
    if (!pay.payerName.trim()) e.payerName = 'Enter the name on your payment'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateReview() {
    const e = {}
    if (!pay.file) e.file = 'Please upload your payment screenshot — this is required before you submit.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function nextFromDetails() {
    if (validateDetails()) setStep(STEPS.payment)
  }

  function nextFromPayment() {
    if (validatePayment()) setStep(STEPS.review)
  }

  function pickFile(f) {
    if (!f) return
    setPay(p => ({ ...p, file: f, preview: URL.createObjectURL(f) }))
    if (errors.file) setErrors(errs => ({ ...errs, file: null }))
  }

  async function submitRegistration() {
    if (!validateReview()) return
    setPaying(true)
    setPayError('')
    try {
      const fd = new FormData()
      fd.append('fullName', form.name.trim())
      fd.append('email', form.email.trim())
      fd.append('phone', form.phone || '')
      fd.append('eventId', String(event.id))
      fd.append('paymentMethod', pay.method)
      fd.append('referenceNumber', pay.reference.trim())
      fd.append('payerName', pay.payerName.trim())
      fd.append('amount', String(event.priceRaw || event.price || 0))
      if (pay.file) fd.append('evidence', pay.file)

      const res = await api.post('/api/tickets/public/register', fd)
      setResult(res)
      setReference(res.ticketReference || reference)
      setStep(STEPS.confirm)
      if (onSuccess) onSuccess(res)
    } catch (err) {
      setPayError(err.message || 'Registration could not be submitted. Try again.')
    } finally {
      setPaying(false)
    }
  }

  const inputCls = `w-full bg-[#0B0B0E] border rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none transition `

  const detailFields = [
    { key: 'name', label: 'Full name', ph: 'Juan Dela Cruz', cls: errors.name ? 'border-[#FF2B66]' : 'border-neutral-800 focus:border-[#FF2B66]' },
    { key: 'email', label: 'Email address', ph: 'you@email.com', cls: errors.email ? 'border-[#FF2B66]' : 'border-neutral-800 focus:border-[#FF2B66]' },
    { key: 'phone', label: 'Phone', ph: '+63 900 000 0000', cls: 'border-neutral-800 focus:border-[#FF2B66]' },
    { key: 'address', label: 'Address (optional)', ph: 'City / Province', cls: 'border-neutral-800 focus:border-[#FF2B66]' },
  ]

  return (
    <ModalShell open={!!event} onClose={paying ? () => {} : onClose}>
      {/* header */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#FF2B66]/15 flex items-center justify-center">
            <Wallet size={17} className="text-[#FF2B66]" />
          </div>
          <h2 className="text-lg font-bold text-white leading-none">Register</h2>
        </div>
        <button onClick={onClose} disabled={paying} aria-label="Close"
          className="h-8 w-8 rounded-full bg-neutral-800/70 hover:bg-neutral-800 hover:rotate-90 text-neutral-400 hover:text-white flex items-center justify-center transition-all duration-300 disabled:opacity-40">
          <X size={16} />
        </button>
      </div>

      <div className="p-6">
        {/* event summary bar */}
        <div className="mb-5 p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-2">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-white font-semibold text-[15px] leading-snug">{event.title}</h3>
            <span className="text-white font-bold shrink-0">{formatCurrency(event.priceRaw || event.price || 0)}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[#9CA3AF]">
            <span className="flex items-center gap-1.5"><Calendar size={13} className="text-gray-500" /> {event.date}</span>
            <span className="flex items-center gap-1.5"><MapPin size={13} className="text-gray-500" /> {event.location}</span>
          </div>
        </div>

        {step === STEPS.confirm && result ? (
          /* ───── CONFIRMATION / DONE ───── */
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
              <Check size={32} className="text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mt-5">You're all set!</h2>
            <p className="text-sm text-neutral-400 mt-2">A confirmation was sent to <span className="text-white">{form.email}</span>. Our team will validate your payment shortly.</p>

            <div className="mt-6 text-left card-dark p-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Ticket reference</span>
                <span className="text-[#FF2B66] font-bold text-sm">{reference}</span>
              </div>
              <div className="h-px bg-[#2A2A36]" />
              <div className="flex justify-between text-sm">
                <span className="text-[#9CA3AF]">Event</span><span className="text-white text-right max-w-[60%]">{event.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#9CA3AF]">When</span><span className="text-white">{event.date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#9CA3AF]">Attendee</span><span className="text-white">{form.name} · {form.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#9CA3AF]">Payment method</span><span className="text-white">{pay.method}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#9CA3AF]">Reference no.</span><span className="text-white">{pay.reference}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#9CA3AF]">Payer name</span><span className="text-white">{pay.payerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#9CA3AF]">Amount</span><span className="text-emerald-400 font-semibold">{formatCurrency(event.priceRaw || event.price || 0)}</span>
              </div>
            </div>

            <button onClick={onClose} className="bg-[#FF2B66] hover:bg-[#E0245A] text-white text-sm font-semibold rounded-full px-7 py-2.5 mt-6 transition-colors">
              Done
            </button>
          </div>
        ) : (
          <>
            {/* step indicator */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-2 mb-5">
              {['Your details', 'Payment', 'Review', 'Done'].map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold ${step === i ? 'bg-[#FF2B66] text-white' : i < step ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-500'}`}>
                    {i < step ? <Check size={12} /> : i + 1}
                  </div>
                  <span className={`text-xs ${step === i ? 'text-white' : 'text-neutral-500'}`}>{label}</span>
                  {i < 3 && <span className="hidden sm:block w-5 h-px bg-neutral-800" />}
                </div>
              ))}
            </div>

            {step === STEPS.details ? (
              <div className="space-y-4">
                {detailFields.map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-semibold text-neutral-300 mb-2 block">{f.label}</label>
                    <input value={form[f.key]} onChange={e => {
                      setForm(x => ({ ...x, [f.key]: e.target.value }))
                      if (errors[f.key]) setErrors(errs => ({ ...errs, [f.key]: null }))
                    }} placeholder={f.ph}
                      className={`${inputCls} ${f.cls}`} />
                    {errors[f.key] && <p className="text-[#FF2B66] text-xs mt-1.5">{errors[f.key]}</p>}
                  </div>
                ))}

                {/* payer name + reference on the details step (kept for a one-shot feel) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 mb-2 block">Payer name <span className="text-neutral-500 font-normal">(on your payment)</span></label>
                    <input value={pay.payerName} onChange={e => {
                      setPay(p => ({ ...p, payerName: e.target.value }))
                      if (errors.payerName) setErrors(errs => ({ ...errs, payerName: null }))
                    }} placeholder="e.g. JUAN DELA CRUZ"
                      className={`${inputCls} ${errors.payerName ? 'border-[#FF2B66]' : 'border-neutral-800 focus:border-[#FF2B66]'}`} />
                    {errors.payerName && <p className="text-[#FF2B66] text-xs mt-1.5">{errors.payerName}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 mb-2 block">Payment reference</label>
                    <input value={pay.reference} onChange={e => {
                      setPay(p => ({ ...p, reference: e.target.value }))
                      if (errors.reference) setErrors(errs => ({ ...errs, reference: null }))
                    }} placeholder="e.g. 8823-4109-2211"
                      className={`${inputCls} ${errors.reference ? 'border-[#FF2B66]' : 'border-neutral-800 focus:border-[#FF2B66]'}`} />
                    {errors.reference && <p className="text-[#FF2B66] text-xs mt-1.5">{errors.reference}</p>}
                  </div>
                </div>

                <button onClick={nextFromDetails} className="w-full bg-[#FF2B66] hover:bg-[#E0245A] text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
                  Continue to payment <ArrowRight size={15} />
                </button>
              </div>
            ) : step === STEPS.payment ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Pay <span className="text-white font-semibold">{formatCurrency(event.priceRaw || event.price || 0)}</span> with <span className="text-white font-semibold">{pay.method}</span> — either online via PayMongo, or by scanning the GCash QR.
                  </p>
                </div>

                {/* quick actions: pay online / scan QR */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button type="button" onClick={startOnlinePayment} disabled={online.loading}
                    className="group rounded-xl border border-[#FF2B66]/30 bg-[#FF2B66]/10 hover:bg-[#FF2B66]/20 px-4 py-3 text-left transition-colors disabled:opacity-50 flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#FF2B66]/15 flex items-center justify-center shrink-0">
                      {online.loading ? <Loader2 size={18} className="animate-spin text-[#FF2B66]" /> : <ExternalLink size={18} className="text-[#FF2B66]" />}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">Pay online</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">GCash / Card via PayMongo (opens a secure checkout)</p>
                    </div>
                  </button>

                  <button type="button" onClick={() => setQrOpen(true)}
                    className="group rounded-xl border border-neutral-800 hover:border-[#FF2B66]/50 bg-white/[0.02] hover:bg-white/[0.05] px-4 py-3 text-left transition-colors flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <QrCode size={18} className="text-neutral-200" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">Scan GCash QR</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Pay to the organizer's GCash via QR</p>
                    </div>
                  </button>
                </div>

                {online.error && <p className="text-[#FF2B66] text-xs">{online.error}</p>}
                {online.checking && !online.paid && (
                  <p className="flex items-center gap-2 text-xs text-neutral-300 bg-white/[0.03] border border-neutral-800 rounded-xl px-3 py-2.5">
                    <Loader2 size={13} className="animate-spin text-[#FF2B66]" /> Waiting for payment confirmation…
                  </p>
                )}
                {online.paid && (
                  <p className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2.5">
                    <CheckCircle2 size={13} /> Payment confirmed online. Take a screenshot of the checkout receipt and add it below.
                  </p>
                )}

                {/* payment method */}
                <div>
                  <label className="text-xs font-semibold text-neutral-300 mb-2 block">Payment method</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PAY_METHODS.map(m => (
                      <button key={m.key} type="button"
                        onClick={() => setPay(p => ({ ...p, method: m.key }))}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all ${
                          pay.method === m.key
                            ? 'bg-[#FF2B66] text-white shadow-lg shadow-[#FF2B66]/25'
                            : 'bg-white/[0.03] border border-neutral-800 text-neutral-300 hover:border-[#FF2B66]/40'
                        }`}>
                        <m.icon size={14} /> {m.key}
                      </button>
                    ))}
                  </div>
                </div>

                {/* reference number */}
                <div>
                  <label className="text-xs font-semibold text-neutral-300 mb-2 block">
                    Payment reference number <span className="text-neutral-500 font-normal">(GCash ref. no., bank ref. no., etc.)</span>
                  </label>
                  <input value={pay.reference} onChange={e => {
                    setPay(p => ({ ...p, reference: e.target.value }))
                    if (errors.reference) setErrors(errs => ({ ...errs, reference: null }))
                  }}
                    placeholder="e.g. 8823-4109-2211"
                    className={`${inputCls} ${errors.reference ? 'border-[#FF2B66]' : 'border-neutral-800 focus:border-[#FF2B66]'}`} />
                  {errors.reference && <p className="text-[#FF2B66] text-xs mt-1.5">{errors.reference}</p>}
                </div>

                <div className="flex gap-3 pt-1">
                  <button onClick={back}
                    className="border border-neutral-800 hover:bg-white/5 text-neutral-300 font-semibold py-3 rounded-xl transition-colors text-sm px-5 flex items-center gap-2">
                    <ArrowLeft size={15} /> Back
                  </button>
                  <button onClick={nextFromPayment} disabled={paying}
                    className="flex-1 bg-[#FF2B66] hover:bg-[#E0245A] text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                    Continue to review <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            ) : step === STEPS.review ? (
              <div className="space-y-4">
                {/* order summary */}
                <div className="rounded-xl border border-neutral-800 bg-white/[0.02] overflow-hidden">
                  <div className="px-4 py-3 border-b border-neutral-800/70 bg-white/[0.03] flex items-center gap-2">
                    <ShieldCheck size={14} className="text-[#FF2B66]" />
                    <span className="text-xs font-semibold text-white">Review your registration</span>
                  </div>
                  <div className="p-4 space-y-2.5 text-sm">
                    <div className="flex justify-between gap-3"><span className="text-neutral-500">Event</span><span className="text-white text-right">{event.title}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-neutral-500">Attendee</span><span className="text-white text-right">{form.name}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-neutral-500">Email</span><span className="text-white text-right">{form.email}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-neutral-500">Payment method</span><span className="text-white text-right">{pay.method}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-neutral-500">Reference</span><span className="text-white text-right">{pay.reference}</span></div>
                    <div className="flex justify-between gap-3 border-t border-neutral-800/70 pt-2.5">
                      <span className="text-neutral-400 font-semibold">Amount</span>
                      <span className="text-emerald-400 font-bold">{formatCurrency(event.priceRaw || event.price || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* screenshot — REQUIRED */}
                <div>
                  <label className="text-xs font-semibold text-neutral-300 mb-2 block">
                    Payment screenshot <span className="text-[#FF2B66]">(required)</span>
                  </label>
                  {pay.preview ? (
                    <div className="relative rounded-xl overflow-hidden border border-neutral-800">
                      <img src={pay.preview} alt="Payment proof" className="w-full max-h-56 object-contain bg-black/40" />
                      <button type="button" onClick={() => { setPay(p => ({ ...p, file: null, preview: '' })); if (errors.file) setErrors(errs => ({ ...errs, file: null })) }}
                        className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/70 hover:bg-red-500 text-white flex items-center justify-center transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed cursor-pointer transition-all p-8 text-center ${errors.file ? 'border-[#FF2B66]' : 'border-neutral-800 hover:border-[#FF2B66]/50'}`}>
                      <ImagePlus size={22} className="text-neutral-500" />
                      <span className="text-xs text-neutral-400">Click to upload your payment screenshot</span>
                      <span className="text-[11px] text-neutral-600">PNG, JPG, GIF or WEBP</span>
                      <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden"
                        onChange={e => pickFile(e.target.files?.[0])} />
                    </label>
                  )}
                  {errors.file && <p className="text-[#FF2B66] text-xs mt-1.5">{errors.file}</p>}
                </div>

                {payError && <p className="text-[#FF2B66] text-xs">{payError}</p>}

                <div className="flex gap-3 pt-1">
                  <button onClick={back} disabled={paying}
                    className="border border-neutral-800 hover:bg-white/5 text-neutral-300 font-semibold py-3 rounded-xl transition-colors text-sm px-5 flex items-center gap-2 disabled:opacity-50">
                    <ArrowLeft size={15} /> Back
                  </button>
                  <button onClick={submitRegistration} disabled={paying}
                    className="flex-1 bg-[#FF2B66] hover:bg-[#E0245A] text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                    {paying
                      ? <><Loader2 size={15} className="animate-spin" /> Submitting...</>
                      : <><Lock size={14} /> Submit registration</>}
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* ── GCash QR popup ── */}
      <ModalShell open={qrOpen} onClose={() => setQrOpen(false)}>
        <div className="flex items-center justify-between border-b border-neutral-800/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FF2B66]/15 flex items-center justify-center">
              <QrCode size={17} className="text-[#FF2B66]" />
            </div>
            <h2 className="text-lg font-bold text-white leading-none">Pay via GCash QR</h2>
          </div>
          <button onClick={() => setQrOpen(false)} aria-label="Close"
            className="h-8 w-8 rounded-full bg-neutral-800/70 hover:bg-neutral-800 hover:rotate-90 text-neutral-400 hover:text-white flex items-center justify-center transition-all duration-300">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 text-center">
          <div className="mx-auto w-fit rounded-2xl border border-neutral-800 bg-[#0B0B0E] p-3">
            <img src={qrImage} alt="GCash payment QR" className="w-56 h-56 rounded-xl" />
          </div>
          <div className="mt-5 space-y-1.5 text-center">
            <p className="text-xs text-neutral-400">Scan with your GCash app to pay <span className="text-white font-bold">{formatCurrency(event.priceRaw || event.price || 0)}</span> to</p>
            <p className="text-lg font-bold text-white tracking-wide">{GCASH_NUMBER}</p>
            <p className="text-[11px] text-neutral-500">Reference: <span className="text-neutral-300">{reference}</span> · {event.title}</p>
          </div>
          <p className="mt-4 text-[11px] text-neutral-500">Demo placeholder number — replace <span className="text-neutral-300">{GCASH_NUMBER}</span> with the real organizer GCash before going live.</p>
          <button onClick={() => setQrOpen(false)} className="mt-5 w-full bg-[#FF2B66] hover:bg-[#E0245A] text-white text-sm font-semibold rounded-xl py-3 transition-colors">
            I've paid — continue
          </button>
        </div>
      </ModalShell>
    </ModalShell>
  )
}
