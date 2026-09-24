import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Mail, Phone, MapPin, Clock, Send, Check, X, Menu, ChevronDown,
  Loader2, PartyPopper, Building, Ticket, Users, Sparkles,
} from 'lucide-react'
import './landingFx.css'
import { api } from '../api/client'

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Services', to: '/#services' },
  { label: 'Events', to: '/#events' },
  { label: 'Venues', to: '/venues' },
  { label: 'Contact Us', to: '/contact-us' },
]

const EVENT_TYPES = [
  { label: 'Conference', icon: Users }, { label: 'Wedding', icon: Sparkles },
  { label: 'Corporate', icon: Building }, { label: 'Concert', icon: Ticket },
  { label: 'Private Party', icon: PartyPopper },
]

const FAQS = [
  { q: 'How far in advance should I book?', a: 'For conferences and weddings we recommend 3–6 months ahead. Smaller events can often be arranged within 2–3 weeks — just ask and we\'ll confirm availability the same day.' },
  { q: 'Do you handle catering and decoration?', a: 'Yes. Every package includes vetted catering partners, staging, florals, and branding. You get one coordinator and one invoice — we handle the rest.' },
  { q: 'What is your cancellation policy?', a: 'Full refund up to 60 days before the event, 50% up to 30 days. Within 30 days we\'ll work with you to reschedule at no extra cost.' },
  { q: 'Can you run hybrid or streamed events?', a: 'Absolutely. Our studios include broadcast-grade cameras, encoders, and a live production crew for audiences of any size.' },
  { q: 'Do you offer services outside your listed cities?', a: 'Yes — we manage events in 80+ countries. Tell us where, and a local coordinator will reach out within one business day.' },
]

const CONTACT_CARDS = [
  { icon: Mail, label: 'Email us', value: 'hello@eventsphere.com', sub: 'We reply within 24 hours' },
  { icon: Phone, label: 'Call us', value: '+63 (2) 8123 4567', sub: 'Mon–Sat, 9am–7pm PHT' },
  { icon: MapPin, label: 'Visit us', value: 'Ortigas Center, Manila', sub: 'Level 12, Sphere Tower' },
  { icon: Clock, label: 'Live chat', value: 'Average wait: 2 min', sub: 'Fastest way to reach us' },
]

function Reveal({ children, className = '', as: Tag = 'div', ...rest }) {
  const [el, setEl] = useState(null)
  const [seen, setSeen] = useState(false)
  const obs = useMemo(() => {
    if (typeof IntersectionObserver === 'undefined') return null
    return new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setSeen(true) }, { threshold: 0.12 })
  }, [])
  useMemo(() => { if (el && obs && !seen) obs.observe(el); }, [el])
  return <Tag ref={setEl} className={`fx-reveal ${seen ? 'fx-in' : ''} ${className}`} {...rest}>{children}</Tag>
}

function FaqItem({ faq, open, onToggle }) {
  return (
    <div className="border border-[#2A2A36] rounded-2xl bg-[#121216] overflow-hidden transition-colors hover:border-[#FF2B66]/30">
      <button onClick={onToggle} className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left">
        <span className="text-white font-semibold text-sm">{faq.q}</span>
        <ChevronDown size={18}
          className={`text-[#FF2B66] shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-[#9CA3AF] text-sm leading-relaxed">{faq.a}</p>
        </div>
      </div>
    </div>
  )
}

export function ContactUsSection({ onBrowseVenues }) {
  const [openFaq, setOpenFaq] = useState(0)
  const [eventType, setEventType] = useState('Conference')
  const [form, setForm] = useState({ name: '', email: '', phone: '', date: '', guests: '', message: '' })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | sent

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Please tell us your name'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address'
    if (!form.message.trim() || form.message.trim().length < 10) e.message = 'Tell us a bit more (at least 10 characters)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(ev) {
    ev.preventDefault()
    if (!validate()) return
    setStatus('sending')

    api.post('/api/eventrequests/public', {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      source: 'Website',
      eventType,
      message: form.message.trim(),
      targetDate: form.date || null,
      guests: form.guests ? Number(form.guests) : null,
    })
      .then(() => setStatus('sent'))
      .catch(err => { setStatus('idle'); setErrors({ general: err.message }) })
  }

  return (
    <div>
      {/* ─── HERO ─── */}
      <section className="pt-32 pb-12 px-6 relative overflow-hidden">
        <div className="fx-orb fx-orb-b" />
        <div className="max-w-7xl mx-auto relative">
          <div className="section-tag fx-entrance">Contact Us</div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight fx-entrance fx-d1">
            Let's plan something<br />
            <span className="text-[#FF2B66] italic">unforgettable.</span>
          </h1>
          <p className="text-[#9CA3AF] text-lg max-w-xl leading-relaxed mt-6 fx-entrance fx-d2">
            Tell us about your event and a dedicated coordinator will get back to you
            within one business day — with ideas, availability, and honest pricing.
          </p>
        </div>
      </section>

      {/* ─── CONTACT CARDS ─── */}
      <section className="pb-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CONTACT_CARDS.map((c, i) => (
            <Reveal key={c.label} className="fx-lift card-dark p-6 space-y-3">
              <div className="w-11 h-11 rounded-xl bg-[#FF2B66]/10 flex items-center justify-center">
                <c.icon size={20} className="text-[#FF2B66]" />
              </div>
              <div>
                <p className="text-[#6B7280] text-xs uppercase tracking-wider font-semibold">{c.label}</p>
                <p className="text-white font-semibold mt-1">{c.value}</p>
                <p className="text-[#9CA3AF] text-xs mt-0.5">{c.sub}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── FORM + FAQ ─── */}
      <section className="pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-start">
          <Reveal className="card-dark p-8 lg:p-10">
            {status === 'sent' ? (
              <div className="text-center py-14 space-y-4 fx-entrance">
                <div className="w-16 h-16 rounded-full bg-[#FF2B66]/15 flex items-center justify-center mx-auto">
                  <Check size={30} className="text-[#FF2B66]" />
                </div>
                <h3 className="text-2xl font-bold text-white">Message sent!</h3>
                <p className="text-[#9CA3AF] text-sm max-w-sm mx-auto leading-relaxed">
                  Thanks, {form.name.split(' ')[0] || 'friend'} — a coordinator will email you at{' '}
                  <span className="text-white">{form.email}</span> within one business day.
                </p>
                <button onClick={() => { setStatus('idle'); setForm({ name: '', email: '', phone: '', date: '', guests: '', message: '' }) }}
                  className="btn-ghost text-sm mt-2">Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <h2 className="text-2xl font-bold text-white">Request a proposal</h2>

                <div>
                  <p className="text-sm text-[#9CA3AF] mb-2.5">What kind of event?</p>
                  <div className="flex flex-wrap gap-2">
                    {EVENT_TYPES.map(t => (
                      <button type="button" key={t.label} onClick={() => setEventType(t.label)}
                        className={`inline-flex items-center gap-2 text-sm rounded-full px-4 py-2 border transition-all ${eventType === t.label
                          ? 'bg-[#FF2B66] border-[#FF2B66] text-white font-semibold'
                          : 'bg-[#181820] border-[#2A2A36] text-[#9CA3AF] hover:text-white hover:border-[#FF2B66]/40'}`}>
                        <t.icon size={15} /> {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name"
                      className={`w-full bg-[#121216] border text-white rounded-xl px-4 py-3 text-sm placeholder:text-[#6B7280] focus:outline-none transition-colors ${errors.name ? 'border-[#FF2B66]' : 'border-[#2A2A36] focus:border-[#FF2B66]/50'}`} />
                    {errors.name && <p className="text-[#FF2B66] text-xs mt-1.5">{errors.name}</p>}
                  </div>
                  <div>
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="Email address"
                      className={`w-full bg-[#121216] border text-white rounded-xl px-4 py-3 text-sm placeholder:text-[#6B7280] focus:outline-none transition-colors ${errors.email ? 'border-[#FF2B66]' : 'border-[#2A2A36] focus:border-[#FF2B66]/50'}`} />
                    {errors.email && <p className="text-[#FF2B66] text-xs mt-1.5">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                      className="w-full bg-[#121216] border border-[#2A2A36] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF2B66]/50 [color-scheme:dark]" />
                  </div>
                  <input type="number" min="1" value={form.guests} onChange={e => set('guests', e.target.value)}
                    placeholder="Estimated guests" style={{ accentColor: '#FF2B66' }}
                    className="w-full bg-[#121216] border border-[#2A2A36] text-white rounded-xl px-4 py-3 text-sm placeholder:text-[#6B7280] focus:outline-none focus:border-[#FF2B66]/50" />
                </div>

                <div>
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                    placeholder="Phone number (optional)"
                    className="w-full bg-[#121216] border border-[#2A2A36] text-white rounded-xl px-4 py-3 text-sm placeholder:text-[#6B7280] focus:outline-none focus:border-[#FF2B66]/50" />
                </div>

                <div>
                  <textarea rows="4" value={form.message} onChange={e => set('message', e.target.value)}
                    placeholder={`Tell us about your ${eventType.toLowerCase()} — vision, venue preference, budget range...`}
                    className={`w-full bg-[#121216] border text-white rounded-xl px-4 py-3 text-sm placeholder:text-[#6B7280] focus:outline-none resize-none transition-colors ${errors.message ? 'border-[#FF2B66]' : 'border-[#2A2A36] focus:border-[#FF2B66]/50'}`} />
                  {errors.message && <p className="text-[#FF2B66] text-xs mt-1.5">{errors.message}</p>}
                </div>

                <button type="submit" disabled={status === 'sending'}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-70">
                  {status === 'sending'
                    ? <><Loader2 size={16} className="animate-spin" /> Sending...</>
                    : <>Send request <Send size={15} /></>}
                </button>
                {errors.general && <p className="text-[#FF2B66] text-xs text-center">{errors.general}</p>}
                <p className="text-[#6B7280] text-xs text-center">
                  No spam, ever. We only use your details to plan your event.
                </p>
              </form>
            )}
          </Reveal>

          <div className="space-y-4">
            <Reveal>
              <h2 className="text-2xl font-bold text-white">Frequently asked questions</h2>
              <p className="text-[#9CA3AF] text-sm mt-2">Quick answers before you hit send.</p>
            </Reveal>
            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <Reveal key={faq.q}>
                  <FaqItem faq={faq} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? -1 : i)} />
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#2A2A36] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#6B7280]">
          <span>&copy; 2026 EventSphere Inc. All rights reserved.</span>
          <Link to="/" className="hover:text-white transition-colors">Back to home</Link>
        </div>
      </footer>
    </div>
  )
}

export default function ContactUs({ user }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <div className="min-h-screen bg-[#0B0B0E]">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0B0B0E]/80 backdrop-blur-xl border-b border-[#2A2A36]/50">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#FF2B66]/15 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-[#FF2B66]" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">EventSphere</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <Link key={l.label} to={l.to}
                className={`text-sm transition-colors ${l.label === 'Contact Us' ? 'text-white font-semibold' : 'text-[#9CA3AF] hover:text-white'}`}>
                {l.label}
              </Link>
            ))}
          </div>
          <div className="hidden md:block">
            {user
              ? <Link to="/dashboard" className="btn-primary text-sm !px-5 !py-2.5">Dashboard</Link>
              : <Link to="/venues" className="btn-primary text-sm !px-5 !py-2.5">Browse venues</Link>}
          </div>
          <button className="md:hidden text-[#9CA3AF]" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
        {mobileOpen && (
          <div className="md:hidden bg-[#121217] border-t border-[#2A2A36]/50 px-6 py-4 space-y-1">
            {NAV_LINKS.map(l => (
              <Link key={l.label} to={l.to} onClick={() => setMobileOpen(false)}
                className="block text-[#9CA3AF] hover:text-white py-2">{l.label}</Link>
            ))}
          </div>
        )}
      </header>

      <ContactUsSection onBrowseVenues={null} />

      <footer className="border-t border-[#2A2A36] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#6B7280]">
          <span>&copy; 2026 EventSphere Inc. All rights reserved.</span>
          <Link to="/" className="hover:text-white transition-colors">Back to home</Link>
        </div>
      </footer>
    </div>
  )
}
