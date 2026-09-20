import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Menu, X, ClipboardList, Building, Palette, SatelliteDish, Ticket, Handshake,
  ArrowRight, Check, Sparkles,
} from 'lucide-react'
import './landingFx.css'

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Services', to: '/services' },
  { label: 'Events', to: '/#events' },
  { label: 'Venues', to: '/venues' },
  { label: 'Contact Us', to: '/contact-us' },
]

const SERVICES = [
  {
    icon: ClipboardList,
    title: 'Event Strategy & Planning',
    tagline: 'From concept to debrief',
    desc: 'End-to-end event blueprints tailored to your goals — from concept to debrief. We handle timelines, stakeholders, budgets, and every moving part so your team can focus on the outcome.',
    steps: ['Discovery call to lock goals, audience, and budget', 'Full event blueprint: timeline, theme, run-of-show, and risk plan', 'Ongoing coordination with weekly check-ins until show day'],
  },
  {
    icon: Building,
    title: 'Venue Booking & Management',
    tagline: 'The perfect space, negotiated for you',
    desc: 'Access our curated network of premium venues. We negotiate contracts, manage logistics, and ensure flawless on-site execution from load-in to breakdown.',
    steps: ['Shortlist venues that fit your size, style, and budget', 'Site visits and contract negotiation on your behalf', 'On-site logistics management for load-in, show, and teardown'],
  },
  {
    icon: Palette,
    title: 'Event Branding & Design',
    tagline: 'Look unforgettable',
    desc: 'Memorable visual identities, stage design, signage, and digital assets that make your event instantly recognisable and shareable.',
    steps: ['Brand discovery and moodboarding', 'Concept design: logo lockups, palettes, and environment art', 'Production files for print, screens, and stage builds'],
  },
  {
    icon: SatelliteDish,
    title: 'Live Streaming & Virtual Events',
    tagline: 'Reach everyone, anywhere',
    desc: 'Broadcast-quality production for hybrid and virtual formats — global audiences, zero compromise on engagement.',
    steps: ['Audience and platform planning for your format', 'Full studio production: cameras, audio, encoding, and crew', 'Go-live direction with real-time monitoring and engagement tools'],
  },
  {
    icon: Ticket,
    title: 'Ticketing & Registration',
    tagline: 'Seamless from sign-up to check-in',
    desc: 'Seamless attendee registration, custom ticketing pages, check-in tools, and real-time analytics — all in one platform.',
    steps: ['Custom ticketing page with the exact event details', 'Attendee registration, payment, and ticketing confirmation', 'Day-of check-in with real-time attendance analytics'],
  },
  {
    icon: Handshake,
    title: 'Sponsorship Management',
    tagline: 'Keep partners coming back',
    desc: 'We match your event with the right partners, structure sponsorship tiers, and deliver post-event ROI reports that keep sponsors renewing.',
    steps: ['Sponsor persona mapping and prospect outreach', 'Tiered packages with deliverables and measurable KPIs', 'Post-event ROI reports that prove value and drive renewals'],
  },
]

export default function Services() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

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
                className={`text-sm transition-colors ${l.label === 'Services' ? 'text-white font-semibold' : 'text-[#9CA3AF] hover:text-white'}`}>
                {l.label}
              </Link>
            ))}
          </div>
          <div className="hidden md:block">
            <button onClick={() => navigate('/contact-us')} className="btn-primary text-sm !px-5 !py-2.5">Plan your event</button>
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

      {/* hero */}
      <section className="pt-32 pb-14 px-6 relative overflow-hidden">
        <div className="fx-orb fx-orb-b" />
        <div className="max-w-7xl mx-auto relative">
          <div className="section-tag fx-entrance">Our Services</div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight fx-entrance fx-d1">
            Everything an event needs,<br />
            <span className="text-[#FF2B66] italic">in one partner.</span>
          </h1>
          <p className="text-[#9CA3AF] text-lg max-w-xl leading-relaxed mt-6 fx-entrance fx-d2">
            Six end-to-end services that cover the full lifecycle of your event —
            pick one or let us run the whole show.
          </p>
        </div>
      </section>

      {/* services */}
      <section className="pb-20 px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {SERVICES.map(({ icon: Icon, title, tagline, desc, steps }) => (
            <div key={title} className="card-dark overflow-hidden">
              <div className="grid lg:grid-cols-5">
                <div className="lg:col-span-2 p-8 lg:p-10 bg-white/[0.02] border-b lg:border-b-0 lg:border-r border-[#2A2A36]">
                  <div className="flex items-start gap-4">
                    <div className="fx-icon-wrap w-12 h-12 rounded-xl bg-[#FF2B66]/10 flex items-center justify-center shrink-0">
                      <Icon size={24} className="text-[#FF2B66]" />
                    </div>
                    <div>
                      <p className="text-[#FF2B66] text-xs font-semibold uppercase tracking-wider">{tagline}</p>
                      <h3 className="text-white text-xl font-bold mt-1">{title}</h3>
                    </div>
                  </div>
                  <p className="text-[#9CA3AF] text-sm leading-relaxed mt-5">{desc}</p>
                </div>
                <div className="lg:col-span-3 p-8 lg:p-10">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280] mb-5">How it works</p>
                  <div className="space-y-4">
                    {steps.map((s, i) => (
                      <div key={s} className="flex items-start gap-4">
                        <div className="w-7 h-7 rounded-full bg-[#FF2B66]/10 text-[#FF2B66] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-[#D1D5DB] text-sm leading-relaxed">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20 px-6">
        <div className="max-w-7xl mx-auto card-dark p-10 lg:p-14 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-start text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Ready to start planning?</h2>
            <p className="text-[#9CA3AF] text-sm mt-2">Tell us about your event and get a proposal within one business day.</p>
          </div>
          <button onClick={() => navigate('/contact-us')}
            className="bg-[#FF2B66] hover:opacity-90 text-white text-sm font-semibold rounded-full px-7 py-3 transition flex items-center gap-2 shrink-0">
            Plan your event <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <footer className="border-t border-[#2A2A36] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#6B7280]">
          <span>&copy; 2026 EventSphere Inc. All rights reserved.</span>
          <div className="flex items-center gap-3">
            <Sparkles size={13} className="text-[#FF2B66]" />
            <Check size={13} className="text-emerald-400" />
            <Link to="/" className="hover:text-white transition-colors">Back to home</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}