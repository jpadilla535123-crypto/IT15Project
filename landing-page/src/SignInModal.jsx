import { useEffect, useRef, useState } from 'react'
import { X, Sparkles, Check, Eye, EyeOff, Loader2, CalendarCheck, Users, Star, ShieldCheck, BarChart3 } from 'lucide-react'
import { useAuth } from './contexts/AuthContext'
import './pages/landingFx.css'

const SLIDES = [
  { icon: CalendarCheck, stat: '1,200+', text: 'events managed end-to-end by our coordinators' },
  { icon: Users, stat: '15K+', text: 'attendees served across 80+ countries' },
  { icon: Star, stat: '98%', text: 'client satisfaction — and we keep the receipts' },
]

export default function SignInModal({ open, onClose, onSuccess }) {
  const { login } = useAuth()
  const [render, setRender] = useState(open)      // keep mounted during exit animation
  const [shown, setShown] = useState(false)       // triggers the open transition
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [shaking, setShaking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [slide, setSlide] = useState(0)
  const emailRef = useRef(null)

  /* mount → next frame add .fx-open (plays entrance), unmount after exit */
  useEffect(() => {
    if (open) {
      setRender(true)
      const raf = requestAnimationFrame(() => setShown(true))
      return () => cancelAnimationFrame(raf)
    }
    setShown(false)
    const t = setTimeout(() => setRender(false), 320)
    return () => clearTimeout(t)
  }, [open])

  /* rotating showcase slides */
  useEffect(() => {
    if (!open) return
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 3500)
    return () => clearInterval(t)
  }, [open])

  /* Escape to close, focus email on open */
  useEffect(() => {
    if (!render) return
    const onKey = e => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    const t = setTimeout(() => emailRef.current?.focus(), 380)
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(t) }
  }, [render])

  /* lock page scroll while open */
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function resetForm() {
    setEmail('')
    setPassword('')
    setRemember(false)
    setError('')
    setShowPassword(false)
  }

  function handleClose() {
    if (loading) return
    resetForm()
    onClose()
  }

  function showError(msg) {
    setError(msg)
    setShaking(true)
    setTimeout(() => setShaking(false), 500)
  }

  function finishSuccess() {
    setSuccess(true)
    setTimeout(() => {
      resetForm()
      setSuccess(false)
      onClose()
      onSuccess?.()
    }, 900)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      finishSuccess()
    } catch (err) {
      showError(err.message || 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  if (!render) return null

  return (
    <div className={`fx-modal-backdrop ${shown ? 'fx-open' : ''}`} onClick={handleClose}>
      <div
        className={`fx-modal-panel !max-w-[880px] flex bg-[#121215] border border-neutral-800/80 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] ${shaking ? 'fx-error' : ''}`}
        onClick={e => e.stopPropagation()}>

        {/* ─── LEFT: SHOWCASE PANEL (desktop only) ─── */}
        <div className="hidden md:flex flex-col justify-between w-[44%] shrink-0 relative overflow-hidden">
          <img src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=700&h=900&fit=crop"
            alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF2D55]/85 via-[#FF2D55]/55 to-[#0B0B0E]/90" />

          {/* brand */}
          <div className="relative flex items-center gap-2.5 p-7">
            <div className="bg-white/15 backdrop-blur h-9 w-9 rounded-lg flex items-center justify-center text-white">
              <Sparkles size={17} />
            </div>
            <span className="text-white text-lg font-bold tracking-tight">EventSphere</span>
          </div>

          {/* rotating slides */}
          <div className="relative px-7 pb-4">
            <div key={slide} className="fx-mode-swap">
              <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center mb-5">
                {(() => { const Icon = SLIDES[slide].icon; return <Icon size={20} className="text-white" /> })()}
              </div>
              <p className="text-4xl font-extrabold text-white tracking-tight">{SLIDES[slide].stat}</p>
              <p className="text-white/85 text-sm leading-relaxed mt-2 max-w-[240px]">{SLIDES[slide].text}</p>
            </div>
          </div>

          {/* quote + dots */}
          <div className="relative px-7 pb-7">
            <p className="text-white/80 text-xs italic leading-relaxed mb-4">
              "They turned our launch into the event of the year. Zero hiccups, 4,000 guests."
              <span className="block not-italic mt-1 font-semibold text-white">— Marco Pellegrini, CEO</span>
            </p>
            <div className="flex gap-2">
              {SLIDES.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-400 ${i === slide ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* ─── RIGHT: FORM ─── */}
        <div className="flex-1 min-w-0 p-7 lg:p-9 overflow-y-auto">
          {success ? (
            /* ─── SUCCESS STATE ─── */
            <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center gap-4 fx-mode-swap">
              <div className="fx-success-pop w-16 h-16 rounded-full bg-[#FF2D55]/15 flex items-center justify-center">
                <Check size={32} className="text-[#FF2D55]" />
              </div>
              <h2 className="text-xl font-bold text-white">Welcome back!</h2>
              <p className="text-xs text-neutral-400">Taking you to your dashboard…</p>
            </div>
          ) : (
            <>
              {/* Header Row */}
              <div className="flex items-center justify-between mb-7">
                <div className="flex items-center gap-2.5 md:hidden">
                  <div className="bg-[#FF2D55] h-8 w-8 rounded-lg flex items-center justify-center text-white">
                    <Sparkles size={15} />
                  </div>
                  <span className="text-white text-base font-bold">EventSphere</span>
                </div>
                <button onClick={handleClose} aria-label="Close"
                  className="ml-auto h-8 w-8 rounded-full bg-neutral-800/70 hover:bg-neutral-800 hover:rotate-90 text-neutral-400 hover:text-white flex items-center justify-center transition-all duration-300">
                  <X size={16} />
                </button>
              </div>

              {/* Title & Subtitle */}
              <div className="fx-mode-swap flex flex-col items-start text-left mb-6">
                <h2 className="text-2xl font-bold text-white tracking-tight mb-1">Welcome back</h2>
                <p className="text-xs text-neutral-400">Sign in to manage your events and team.</p>
              </div>

              {/* Internal access note */}
              <div className="mb-6 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-neutral-400 text-[11px] leading-relaxed flex items-start gap-2.5">
                <ShieldCheck size={15} className="text-[#FF2D55] shrink-0 mt-0.5" />
                <span>
                  Internal portal — access is limited to EventSphere staff accounts
                  <br />with assigned roles (Admin, Manager, Finance, Staff).
                </span>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs fx-mode-swap">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="fx-mode-swap">

                  {/* Email Input */}
                  <div className="flex flex-col items-start text-left mb-4 w-full">
                    <label className="text-xs font-semibold text-neutral-300 mb-2">Email address</label>
                    <input ref={emailRef} type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@eventsphere.ph" required
                      className="w-full bg-[#0B0B0E] border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#FF2D55] focus:shadow-[0_0_0_3px_rgba(255,45,85,0.12)] transition" />
                  </div>

                  {/* Password Input */}
                  <div className="w-full">
                    <div className="flex justify-between items-center w-full mb-2">
                      <label className="text-xs font-semibold text-neutral-300">Password</label>
                    </div>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter your password" required
                        className="w-full bg-[#0B0B0E] border border-neutral-800 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#FF2D55] focus:shadow-[0_0_0_3px_rgba(255,45,85,0.12)] transition" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                </div>

                {/* Submit Button */}
                <button type="submit" disabled={loading}
                  className="w-full bg-[#FF2D55] hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-500/25 hover:-translate-y-0.5 text-white font-semibold py-3 rounded-xl transition-all text-sm shadow-md shadow-rose-950/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:hover:shadow-md mt-8">
                  {loading
                    ? <span className="flex items-center justify-center gap-2">
                        <Loader2 size={15} className="animate-spin" /> Signing in...
                      </span>
                    : 'Sign In'}
                </button>
              </form>

              <p className="text-center text-xs text-neutral-500 mt-6 flex items-center justify-center gap-1.5">
                <BarChart3 size={13} /> Secure, role-based access
              </p>
            </>
          )}
        </div>

      </div>
    </div>
  )
}