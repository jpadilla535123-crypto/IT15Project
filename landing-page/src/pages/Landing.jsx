import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import SignInModal from '../SignInModal'
import {
  Play, MapPin, Calendar, ChevronRight, Star, Quote,
  Menu, X, ArrowRight, Users, Globe, CalendarCheck,
  ClipboardList, Building, Palette, SatelliteDish, Ticket, Handshake,
  Sparkles, Twitter, Linkedin, Instagram, ArrowUp, Check,
} from 'lucide-react'
import './landingFx.css'
import { VenuesSection } from './Venues'
import { ContactUsSection } from './ContactUs'
import TicketModal from '../components/landing/TicketModal'
import RegisterModal from '../components/landing/RegisterModal'
import NewsletterModal from '../components/landing/NewsletterModal'

const NAV_LINKS = [
  { label: 'Home', view: 'home', anchor: '#home' },
  { label: 'Services', view: 'home', anchor: '#services' },
  { label: 'Events', view: 'home', anchor: '#events' },
  { label: 'Venues', view: 'venues' },
  { label: 'Contact Us', view: 'contact' },
]

const TRUSTED_BY = ['NovaTech', 'Pellegrini Group', 'Andrade Studio', 'Globex', 'InnovatePH', 'Skyline Events', 'Vertex Labs', 'ManilaCon']

const METRICS = [
  { value: '1,200+', label: 'Events Managed', icon: CalendarCheck },
  { value: '98%', label: 'Client Satisfaction', icon: Star },
  { value: '80+', label: 'Countries Reached', icon: Globe },
  { value: '15K+', label: 'Attendees Served', icon: Users },
]

const SERVICES = [
  { icon: ClipboardList, title: 'Event Strategy & Planning', desc: 'End-to-end event blueprints tailored to your goals — from concept to debrief. We handle timelines, stakeholders, and every moving part.' },
  { icon: Building, title: 'Venue Booking & Management', desc: 'Access our curated network of premium venues worldwide. We negotiate contracts, manage logistics, and ensure flawless on-site execution.' },
  { icon: Palette, title: 'Event Branding & Design', desc: 'Memorable visual identities, stage design, signage, and digital assets that make your event instantly recognisable.' },
  { icon: SatelliteDish, title: 'Live Streaming & Virtual Events', desc: 'Broadcast-quality production for hybrid and virtual formats. Reach global audiences with zero compromise on engagement.' },
  { icon: Ticket, title: 'Ticketing & Registration', desc: 'Seamless attendee registration, custom ticketing pages, check-in tools, and real-time analytics — all in one platform.' },
  { icon: Handshake, title: 'Sponsorship Management', desc: 'We match your event with the right partners, structure sponsorship tiers, and deliver post-event ROI reports to keep sponsors coming back.' },
]

const EVENTS = [
  { title: 'Tech Innovation Summit 2026', category: 'Conference', date: 'Mar 15, 2026', location: 'Manila, Philippines', price: '$149', img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop' },
  { title: 'Creative Industry Gala Night', category: 'Gala Dinner', date: 'Apr 22, 2026', location: 'Singapore', price: '$249', img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop' },
  { title: 'Global Startup Showcase', category: 'Exhibition', date: 'May 8, 2026', location: 'Tokyo, Japan', price: '$99', img: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&h=400&fit=crop' },
]

const TESTIMONIALS = [
  { quote: 'EventSphere transformed our annual summit from a stressful scramble into a seamless experience. The team\'s attention to detail is unmatched — every attendee noticed the difference.', initials: 'PC', name: 'Losiento Jason', role: 'Head of Growth, NovaTech' },
  { quote: 'From venue scouting to day-of coordination, EventSphere handled everything professionally. Our product launch reached 4,000 attendees with zero hiccups.', initials: 'MP', name: 'Jeeeeaaar Bahoens', role: 'CEO, Pellegrini Group' },
  { quote: 'The branding work EventSphere produced for our conference was stunning. It felt like they truly understood our brand. We\'ve already booked them for next year.', initials: 'SA', name: 'Jhasser Switsanigga', role: 'Creative Director, Andrade Studio' },
]

/* ── scroll progress bar ── */
function ScrollProgress() {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setWidth(max > 0 ? (window.scrollY / max) * 100 : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return <div className="fx-progress" style={{ width: `${width}%` }} />
}

/* ── fade/slide in on scroll ── */
function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.classList.add('fx-in')
        obs.disconnect()
      }
    }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

function Reveal({ children, className = '', as: Tag = 'div', ...rest }) {
  const ref = useReveal()
  return <Tag ref={ref} className={`fx-reveal ${className}`} {...rest}>{children}</Tag>
}

/* ── animated counter for metrics ── */
function CountUp({ value, duration = 1600 }) {
  const ref = useRef(null)
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const match = value.match(/^([\d,]+)(.*)$/)
    if (!match) { setDisplay(value); return }
    const target = parseInt(match[1].replace(/,/g, ''), 10)
    const rest = match[2]
    let raf
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      obs.disconnect()
      const start = performance.now()
      const tick = now => {
        const p = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        setDisplay(Math.round(target * eased).toLocaleString() + rest)
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, { threshold: 0.4 })
    obs.observe(el)
    return () => { obs.disconnect(); cancelAnimationFrame(raf) }
  }, [value, duration])

  return <span ref={ref}>{display}</span>
}

/* ── back to top ── */
function BackToTop() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <button aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fx-totop w-11 h-11 rounded-full bg-[#FF2B66] text-white flex items-center justify-center shadow-lg shadow-[#FF2B66]/30 hover:opacity-90 ${show ? 'fx-show' : ''}`}>
      <ArrowUp size={20} />
    </button>
  )
}

export default function Landing({ user }) {
  const { logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [showSignIn, setShowSignIn] = useState(false)
  const [view, setView] = useState('home')
  const [activeNav, setActiveNav] = useState('Home')
  const [ticketOpen, setTicketOpen] = useState(false)
  const [registerEvent, setRegisterEvent] = useState(null)
  const [newsletterOpen, setNewsletterOpen] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [newsError, setNewsError] = useState('')
  const navigate = useNavigate()

  function handleNav(item) {
    setMobileOpen(false)
    setActiveNav(item.label)
    if (view !== item.view) setView(item.view)
    if (item.anchor) {
      requestAnimationFrame(() => {
        document.querySelector(item.anchor)?.scrollIntoView({ behavior: 'smooth' })
      })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function goContact() {
    setMobileOpen(false)
    setActiveNav('Contact Us')
    setView('contact')
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  }

  function openTickets() {
    setMobileOpen(false)
    setTicketOpen(true)
  }

  function handleSubscribe() {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setNewsError('Enter a valid email address')
      return
    }
    setNewsError('')
    setNewsletterOpen(true)
  }

  function handleSubscribed() {
    setSubscribed(true)
    setEmail('')
    setTimeout(() => setSubscribed(false), 4000)
  }

  async function handleSignOut() {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#0B0B0E]">
      <ScrollProgress />

      {/* ─── HEADER ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0B0B0E]/80 backdrop-blur-xl border-b border-[#2A2A36]/50">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#FF2B66]/15 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-[#FF2B66]" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">EventSphere</span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(item => (
              <button key={item.label} onClick={() => handleNav(item)}
                className={`text-sm transition-colors ${activeNav === item.label
                  ? 'text-white font-semibold'
                  : 'text-[#9CA3AF] hover:text-white'}`}>
                {item.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-[#9CA3AF]">{user.fullName || user.email}</span>
                <button onClick={() => navigate('/dashboard')} className="btn-primary text-sm !px-5 !py-2.5">Dashboard</button>
                <button onClick={handleSignOut} className="btn-ghost text-sm">Sign Out</button>
              </>
            ) : (
              <>
                <button onClick={() => setShowSignIn(true)} className="btn-ghost text-sm">Sign In</button>
                <button onClick={openTickets} className="btn-primary text-sm !px-5 !py-2.5">Get A Ticket</button>
              </>
            )}
          </div>

          <button className="md:hidden text-[#9CA3AF]" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {mobileOpen && (
          <div className="md:hidden bg-[#121217] border-t border-[#2A2A36]/50 px-6 py-6 space-y-4">
            {NAV_LINKS.map(item => (
              <button key={item.label} onClick={() => handleNav(item)}
                className={`block py-2 text-left transition-colors ${activeNav === item.label
                  ? 'text-white font-semibold'
                  : 'text-[#9CA3AF] hover:text-white'}`}>
                {item.label}
              </button>
            ))}
            <div className="pt-4 border-t border-[#2A2A36]/50 flex flex-col gap-3">
              {user ? (
                <>
                  <span className="text-sm text-[#9CA3AF] text-center">{user.fullName || user.email}</span>
                  <button onClick={() => { setMobileOpen(false); navigate('/dashboard') }} className="btn-primary text-center">Dashboard</button>
                  <button onClick={handleSignOut} className="btn-ghost text-center">Sign Out</button>
                </>
              ) : (
                <>
                  <button onClick={() => { setShowSignIn(true); setMobileOpen(false) }} className="btn-ghost text-center">Sign In</button>
                  <button onClick={openTickets} className="btn-primary text-center block">Get A Ticket</button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {view === 'home' ? (<>
      {/* ─── HERO ─── */}
      <section id="home" className="relative overflow-hidden pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-7">
            <div className="section-tag fx-entrance">Event Management Platform</div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight fx-entrance fx-d1">
              Event Management<br />Made Simple
            </h1>
            <p className="text-[#9CA3AF] text-lg max-w-lg leading-relaxed fx-entrance fx-d2">
              Plan, manage, and deliver extraordinary events from a single powerful platform.
              From intimate gatherings to global conferences, EventSphere brings your vision to life.
            </p>
            <div className="flex flex-wrap gap-4 fx-entrance fx-d3">
              <button onClick={goContact} className="btn-primary flex items-center gap-2">
                Plan your event <ArrowRight size={18} />
              </button>
            </div>
            <div className="flex flex-wrap gap-3 pt-1 fx-entrance fx-d4">
              <span className="inline-flex items-center gap-2 bg-[#181820] border border-[#2A2A36] rounded-full px-4 py-2 text-sm text-[#9CA3AF]">
                <MapPin size={14} className="text-[#FF2B66]" /> Manila, Philippines
              </span>
              <span className="inline-flex items-center gap-2 bg-[#181820] border border-[#2A2A36] rounded-full px-4 py-2 text-sm text-[#9CA3AF]">
                <Calendar size={14} className="text-[#FF2B66]" /> March 2026
              </span>
            </div>
          </div>

          <div className="relative fx-entrance fx-d2">
            <div className="fx-orb fx-orb-a" />
            <div className="fx-orb fx-orb-b" />
            <div className="relative rounded-2xl overflow-hidden border border-[#2A2A36]">
              <img src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=700&h=500&fit=crop"
                alt="Live event" className="w-full h-80 lg:h-96 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0E]/80 to-transparent" />
              <button className="absolute inset-0 flex items-center justify-center group" aria-label="Play video">
                <div className="relative w-16 h-16 rounded-full bg-[#FF2B66]/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-[#FF2B66]/30 fx-pulse">
                  <Play size={24} className="text-white ml-1" fill="white" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── METRICS BAR ─── */}
      <Reveal className="py-12 px-6">
        <div className="max-w-7xl mx-auto card-dark p-8 lg:p-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {METRICS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#FF2B66]/10 flex items-center justify-center mx-auto">
                  <Icon size={22} className="text-[#FF2B66]" />
                </div>
                <div className="text-3xl lg:text-4xl font-extrabold text-white"><CountUp value={value} /></div>
                <div className="text-sm text-[#9CA3AF]">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ─── TRUSTED BY MARQUEE ─── */}
      <Reveal as="section" className="pb-12 px-6">
        <p className="text-center text-[#6B7280] text-xs font-semibold tracking-widest uppercase mb-6">
          Trusted by teams and organizers worldwide
        </p>
        <div className="fx-marquee max-w-7xl mx-auto">
          <div className="fx-marquee-track gap-14 pr-14">
            {[...TRUSTED_BY, ...TRUSTED_BY].map((name, i) => (
              <span key={`${name}-${i}`}
                className="text-[#9CA3AF]/70 hover:text-white transition-colors text-lg font-semibold whitespace-nowrap flex items-center gap-2">
                <Sparkles size={14} className="text-[#FF2B66]/60" /> {name}
              </span>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ─── ABOUT ─── */}
      <section id="about" className="py-16 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <div className="space-y-5">
            <div className="section-tag">About EventSphere</div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              Your event, our expertise.
            </h2>
            <p className="text-[#9CA3AF] text-lg leading-relaxed">
              Founded in 2020, EventSphere has grown from a small event consultancy into a
              global event management platform trusted by Fortune 500 companies and independent
              organizers alike. We combine cutting-edge technology with deep industry expertise
              to deliver events that resonate.
            </p>
            <a href="#" className="inline-flex items-center gap-2 text-[#FF2B66] font-semibold hover:gap-3 transition-all">
              Learn our story <ChevronRight size={18} />
            </a>
          </div>
          <div className="relative">
            <div className="rounded-2xl overflow-hidden border border-[#2A2A36]">
              <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=450&fit=crop"
                alt="Team collaboration" className="w-full h-80 lg:h-96 object-cover" />
            </div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-[#FF2B66]/10 rounded-2xl -z-10" />
          </div>
        </div>
      </section>

      {/* ─── SERVICES ─── */}
      <section id="services" className="py-16 px-6">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-left space-y-3">
            <p className="text-[#FF2B66] text-sm font-semibold tracking-wider uppercase">What We Offer</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Our Services</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3">
            {SERVICES.map(({ icon: Icon, title, desc }, i) => {
              const isLastRow = i >= 3
              const isLastCol = (i % 3) === 2
              return (
                <div key={title}
                  className={`fx-lift flex flex-col items-start text-left p-8 lg:p-10
                    ${!isLastRow ? 'border-b' : ''} ${!isLastCol ? 'md:border-r' : ''}
                    border-[#2A2A36] group`}>
                  <div className="fx-icon-wrap w-11 h-11 rounded-xl bg-[#FF2B66]/10 flex items-center justify-center">
                    <Icon size={24} className="text-[#FF2B66]" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mt-6">{title}</h3>
                  <p className="text-[#9CA3AF] text-sm leading-relaxed mt-4 max-w-sm">{desc}</p>
                  <Link to="/services" className="inline-flex items-center gap-1 text-[#FF2B66] text-sm font-medium mt-6 hover:gap-2 transition-all">
                    Learn more <ChevronRight size={14} />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── UPCOMING EVENTS ─── */}
      <section id="events" className="py-16 px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-3">
              <div className="section-tag">Upcoming Events</div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Don't miss out</h2>
            </div>
            <button onClick={openTickets} className="inline-flex items-center gap-2 text-[#FF2B66] font-semibold hover:gap-3 transition-all text-sm">
              View all events <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {EVENTS.map(e => (
              <div key={e.title} className="fx-lift card-dark overflow-hidden group">
                <div className="relative overflow-hidden">
                  <img src={e.img} alt={e.title}
                    className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className="absolute top-4 left-4 bg-[#FF2B66]/90 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {e.category}
                  </span>
                </div>
                <div className="p-6 space-y-4">
                  <h3 className="text-white font-semibold text-lg leading-snug">{e.title}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-[#9CA3AF]">
                    <span className="flex items-center gap-1.5"><Calendar size={14} className="text-gray-500" /> {e.date}</span>
                    <span className="flex items-center gap-1.5"><MapPin size={14} className="text-gray-500" /> {e.location}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#2A2A36]">
                    <span className="text-white font-bold text-lg">{e.price}</span>
                    <button onClick={openTickets} className="btn-primary !px-5 !py-2 text-sm">Register</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto relative rounded-3xl overflow-hidden bg-[#0B0B0E]">
          <img src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=500&fit=crop"
            alt="Concert crowd" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          <div className="relative flex flex-col md:flex-row justify-between items-center gap-8 px-8 py-16 md:px-16">
            <div className="flex flex-col items-start text-left max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                <span className="text-white">Ready to create something </span>
                <span className="text-[#FF2B66] italic">unforgettable?</span>
              </h2>
              <p className="text-[#9CA3AF] text-sm md:text-base mt-3 max-w-lg">
                Join 1,200+ events managed by EventSphere — from intimate workshops to 10,000-person festivals.
              </p>
            </div>
            <div className="flex items-center gap-3 mt-6 md:mt-0 shrink-0">
              <button onClick={goContact} className="bg-[#FF2B66] hover:opacity-90 text-white text-sm font-semibold rounded-full px-6 py-2.5 transition">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-16 px-6 bg-[#08080A]">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col items-start text-left">
            <p className="text-[#FF2B66] text-sm font-semibold tracking-wider uppercase">Client Voices</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">What our clients say</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="fx-lift bg-[#121216] border border-[#2A2A36] rounded-2xl p-6 lg:p-8 flex flex-col">
                <p className="text-[#D1D5DB] text-sm leading-relaxed text-left flex-1">"{t.quote}"</p>
                <div className="border-t border-[#2A2A36] mt-6 pt-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FF2B66] text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {t.initials}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-white font-semibold text-sm">{t.name}</span>
                    <span className="text-[#6B7280] text-xs">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NEWSLETTER + FOOTER ─── */}
      <footer className="bg-[#08080A]">
        <div className="max-w-7xl mx-auto px-8 py-12">

          {/* Newsletter Row */}
          <div id="contact" className="flex flex-col md:flex-row justify-between items-center gap-6 pb-12 border-b border-[#2A2A36]">
            <div className="flex flex-col items-start text-left">
              <h4 className="text-white text-2xl font-bold">Stay in the loop</h4>
              <p className="text-[#9CA3AF] text-sm mt-1">Get event announcements, planning tips, and industry news — weekly.</p>
            </div>
            <div className="flex flex-col items-start md:items-end gap-1.5 w-full md:w-auto">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <input type="email" value={email}
                  onChange={e => { setEmail(e.target.value); if (newsError) setNewsError('') }}
                  onKeyDown={e => { if (e.key === 'Enter') handleSubscribe() }}
                  placeholder="Enter your email"
                  className={`bg-[#121216] border ${newsError ? 'border-[#FF2B66]' : 'border-[#2A2A36]'} text-white rounded-full px-5 py-2.5 text-sm placeholder:text-[#6B7280] focus:outline-none focus:border-[#FF2B66]/50 w-full sm:w-72 min-w-0`} />
                <button onClick={handleSubscribe} className="bg-[#FF2B66] hover:opacity-90 text-white text-sm font-semibold rounded-full px-6 py-2.5 transition whitespace-nowrap shrink-0">
                  Subscribe
                </button>
              </div>
              {subscribed ? (
                <p className="flex items-center gap-1.5 text-emerald-400 text-xs"><Check size={13} /> You're on the list — see you at the next event!</p>
              ) : newsError ? (
                <p className="text-[#FF2B66] text-xs">{newsError}</p>
              ) : null}
            </div>
          </div>

          {/* Links Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-12">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-[#FF2B66] p-1.5 rounded-md text-white">
                  <Sparkles size={16} />
                </div>
                <span className="text-white font-bold text-base">EventSphere</span>
              </div>
              <p className="text-[#6B7280] text-xs max-w-xs leading-relaxed">
                End-to-end event management for teams that care about every detail.
              </p>
            </div>

            {/* Platform */}
            <div className="flex flex-col text-left">
              <h4 className="text-[#9CA3AF] text-xs font-semibold tracking-wider mb-4 uppercase">Platform</h4>
              <div className="flex flex-col space-y-3 text-sm text-[#D1D5DB]">
                <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                {['Events', 'Schedules', 'Tickets', 'Analytics'].map(l => (
                  <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
                ))}
              </div>
            </div>

            {/* Services */}
            <div className="flex flex-col text-left">
              <h4 className="text-[#9CA3AF] text-xs font-semibold tracking-wider mb-4 uppercase">Services</h4>
              <div className="flex flex-col space-y-3 text-sm text-[#D1D5DB]">
                {['Strategy & Planning', 'Venue Booking', 'Branding & Design', 'Live Streaming', 'Sponsorship'].map(l => (
                  <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
                ))}
              </div>
            </div>

            {/* Company */}
            <div className="flex flex-col text-left">
              <h4 className="text-[#9CA3AF] text-xs font-semibold tracking-wider mb-4 uppercase">Company</h4>
              <div className="flex flex-col space-y-3 text-sm text-[#D1D5DB]">
                {['About Us', 'Careers', 'Press', 'Contact', 'Privacy Policy'].map(l => (
                  <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
                ))}
              </div>
            </div>
          </div>

          {/* Copyright Row */}
          <div className="pt-8 border-t border-[#2A2A36] flex flex-col md:flex-row justify-between items-center text-xs text-[#6B7280] gap-4">
            <span>&copy; 2026 EventSphere Inc. All rights reserved.</span>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-[#D1D5DB] transition-colors">Twitter</a>
              <a href="#" className="hover:text-[#D1D5DB] transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-[#D1D5DB] transition-colors">Instagram</a>
            </div>
          </div>

        </div>
      </footer>
      </>) : (
        <div key={view} className="fx-entrance">
          {view === 'venues'
            ? <VenuesSection onContact={() => setView('contact')} />
            : <ContactUsSection />}
        </div>
      )}

      <SignInModal open={showSignIn} onClose={() => setShowSignIn(false)}
        onSuccess={() => navigate('/dashboard')} />

      <TicketModal open={ticketOpen} onClose={() => setTicketOpen(false)}
        onRegister={e => { setTicketOpen(false); setRegisterEvent(e) }} />

      <RegisterModal event={registerEvent} onClose={() => setRegisterEvent(null)} />

      <NewsletterModal open={newsletterOpen} email={email}
        onClose={() => setNewsletterOpen(false)} onConfirmed={handleSubscribed} />

      <BackToTop />

    </div>
  )
}