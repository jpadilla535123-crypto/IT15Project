import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin, Users, Star, X, Wifi, Car, Coffee, Music, Mic, Monitor,
  UtensilsCrossed, Sparkles, ArrowRight, Search, Menu, CalendarCheck, Check,
} from 'lucide-react'
import './landingFx.css'

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Services', to: '/#services' },
  { label: 'Events', to: '/#events' },
  { label: 'Venues', to: '/venues' },
  { label: 'Contact Us', to: '/contact-us' },
]

const VENUES = [
  {
    id: 1, name: 'The Grand Sphere Ballroom', city: 'Manila', type: 'Ballroom',
    capacity: 800, price: 4500, rating: 4.9, reviews: 132,
    img: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=500&fit=crop',
    desc: 'Our flagship ballroom with crystal chandeliers, a 12m LED wall, and a dedicated bridal suite. Perfect for galas and weddings.',
    amenities: ['Wi-Fi', 'Parking', 'Catering', 'Stage & AV'],
  },
  {
    id: 2, name: 'Skyline Rooftop Deck', city: 'Singapore', type: 'Outdoor',
    capacity: 250, price: 3200, rating: 4.8, reviews: 96,
    img: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&h=500&fit=crop',
    desc: 'Panoramic city views, sunset cocktails, and a weather-proof canopy system. The city\'s favorite rooftop for launches.',
    amenities: ['Wi-Fi', 'Sound System', 'Catering', 'Live Music'],
  },
  {
    id: 3, name: 'Innovate Convention Hall A', city: 'Tokyo', type: 'Conference',
    capacity: 1200, price: 7800, rating: 4.7, reviews: 210,
    img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop',
    desc: 'Purpose-built for tech conferences: simultaneous translation booths, fiber backbone, and 30 breakout rooms.',
    amenities: ['Wi-Fi', 'AV Equipment', 'Interpreter Booths', 'Catering'],
  },
  {
    id: 4, name: 'The Loft Creative Space', city: 'Manila', type: 'Studio',
    capacity: 80, price: 900, rating: 4.9, reviews: 78,
    img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=500&fit=crop',
    desc: 'An intimate, light-filled loft for workshops, photoshoots, and team offsites. Includes whiteboards, props, and a kitchenette.',
    amenities: ['Wi-Fi', 'Kitchenette', 'Whiteboards', 'Projector'],
  },
  {
    id: 5, name: 'Harbourview Expo Pavilion', city: 'Singapore', type: 'Exhibition',
    capacity: 2000, price: 12000, rating: 4.6, reviews: 154,
    img: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&h=500&fit=crop',
    desc: 'Column-free exhibition floor with drive-in loading bays, modular booths, and 3-phase power on every grid.',
    amenities: ['Parking', 'Loading Bays', 'Power Grids', 'Wi-Fi'],
  },
  {
    id: 6, name: 'The Garden Conservatory', city: 'Cebu', type: 'Outdoor',
    capacity: 400, price: 2800, rating: 4.8, reviews: 88,
    img: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&h=500&fit=crop',
    desc: 'A glasshouse surrounded by tropical gardens — golden-hour ceremonies and candlelit receptions under one roof.',
    amenities: ['Catering', 'Live Music', 'Garden Access', 'Parking'],
  },
]

const CITIES = ['All', 'Manila', 'Singapore', 'Tokyo', 'Cebu']
const TYPES = ['All', 'Ballroom', 'Conference', 'Outdoor', 'Studio', 'Exhibition']

const AMENITY_ICONS = {
  'Wi-Fi': Wifi, 'Parking': Car, 'Catering': UtensilsCrossed, 'Sound System': Music,
  'Stage & AV': Mic, 'AV Equipment': Monitor, 'Live Music': Music, 'Projector': Monitor,
  'Kitchenette': Coffee, 'Whiteboards': Mic, 'Interpreter Booths': Mic, 'Loading Bays': Car,
  'Power Grids': Mic, 'Garden Access': Sparkles,
}

function Reveal({ children, className = '', as: Tag = 'div', ...rest }) {
  const [el, setEl] = useState(null)
  const [seen, setSeen] = useState(false)
  const obs = useMemo(() => {
    if (typeof IntersectionObserver === 'undefined') return null
    return new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setSeen(true); }
    }, { threshold: 0.12 })
  }, [])
  useMemo(() => { if (el && obs && !seen) obs.observe(el); }, [el])
  return <Tag ref={setEl} className={`fx-reveal ${seen ? 'fx-in' : ''} ${className}`} {...rest}>{children}</Tag>
}

function VenueCard({ venue, onSelect, index }) {
  return (
    <Reveal className="fx-lift card-dark overflow-hidden group cursor-pointer" onClick={() => onSelect(venue)}>
      <div className="relative overflow-hidden">
        <img src={venue.img} alt={venue.name}
          className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500" />
        <span className="absolute top-4 left-4 bg-[#FF2B66]/90 text-white text-xs font-semibold px-3 py-1 rounded-full">
          {venue.type}
        </span>
        <span className="absolute bottom-4 right-4 bg-[#0B0B0E]/80 backdrop-blur text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <Star size={12} className="text-[#FF2B66]" fill="#FF2B66" /> {venue.rating}
          <span className="text-[#9CA3AF] font-normal">({venue.reviews})</span>
        </span>
      </div>
      <div className="p-6 space-y-4">
        <h3 className="text-white font-semibold text-lg leading-snug">{venue.name}</h3>
        <div className="flex flex-wrap gap-4 text-sm text-[#9CA3AF]">
          <span className="flex items-center gap-1.5"><MapPin size={14} className="text-gray-500" /> {venue.city}</span>
          <span className="flex items-center gap-1.5"><Users size={14} className="text-gray-500" /> up to {venue.capacity.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-[#2A2A36]">
          <span className="text-white font-bold text-lg">${venue.price.toLocaleString()}<span className="text-[#6B7280] text-xs font-normal"> / day</span></span>
          <span className="inline-flex items-center gap-1 text-[#FF2B66] text-sm font-medium group-hover:gap-2 transition-all">
            View details <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </Reveal>
  )
}

function VenueModal({ venue, onClose, onContact }) {
  if (!venue) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-[#121217] border border-[#2A2A36] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto no-scrollbar fx-entrance"
        onClick={e => e.stopPropagation()}>
        <div className="relative">
          <img src={venue.img} alt={venue.name} className="w-full h-64 object-cover" />
          <button onClick={onClose} aria-label="Close"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#0B0B0E]/80 text-white flex items-center justify-center hover:bg-[#FF2B66] transition-colors">
            <X size={18} />
          </button>
          <span className="absolute top-4 left-4 bg-[#FF2B66]/90 text-white text-xs font-semibold px-3 py-1 rounded-full">{venue.type}</span>
        </div>
        <div className="p-6 lg:p-8 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-2xl font-bold text-white">{venue.name}</h3>
              <div className="flex flex-wrap gap-4 text-sm text-[#9CA3AF] mt-2">
                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-[#FF2B66]" /> {venue.city}</span>
                <span className="flex items-center gap-1.5"><Users size={14} className="text-[#FF2B66]" /> up to {venue.capacity.toLocaleString()} guests</span>
                <span className="flex items-center gap-1.5"><Star size={14} className="text-[#FF2B66]" fill="#FF2B66" /> {venue.rating} ({venue.reviews} reviews)</span>
              </div>
            </div>
            <span className="text-2xl font-extrabold text-white">${venue.price.toLocaleString()}<span className="text-[#6B7280] text-xs font-normal"> / day</span></span>
          </div>
          <p className="text-[#9CA3AF] text-sm leading-relaxed">{venue.desc}</p>
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">Amenities</h4>
            <div className="flex flex-wrap gap-2">
              {venue.amenities.map(a => {
                const Icon = AMENITY_ICONS[a] || Check
                return (
                  <span key={a} className="inline-flex items-center gap-2 bg-[#181820] border border-[#2A2A36] rounded-full px-3 py-1.5 text-xs text-[#D1D5DB]">
                    <Icon size={13} className="text-[#FF2B66]" /> {a}
                  </span>
                )
              })}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {onContact
              ? <button onClick={() => { onClose(); onContact() }} className="btn-primary flex-1 text-center flex items-center justify-center gap-2">
                  <CalendarCheck size={16} /> Check availability
                </button>
              : <Link to="/contact-us" className="btn-primary flex-1 text-center flex items-center justify-center gap-2">
                  <CalendarCheck size={16} /> Check availability
                </Link>}
            <button onClick={onClose} className="btn-ghost flex-1">Keep browsing</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function VenuesSection({ onContact }) {
  const [city, setCity] = useState('All')
  const [type, setType] = useState('All')
  const [capacity, setCapacity] = useState(2000)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [sort, setSort] = useState('featured')

  const filtered = useMemo(() => {
    let list = VENUES.filter(v =>
      (city === 'All' || v.city === city) &&
      (type === 'All' || v.type === type) &&
      v.capacity <= capacity &&
      v.name.toLowerCase().includes(query.toLowerCase())
    )
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    if (sort === 'capacity') list = [...list].sort((a, b) => b.capacity - a.capacity)
    return list
  }, [city, type, capacity, query, sort])

  return (
    <div>
      {/* ─── HERO ─── */}
      <section className="pt-32 pb-12 px-6 relative overflow-hidden">
        <div className="fx-orb fx-orb-a" />
        <div className="max-w-7xl mx-auto relative">
          <div className="section-tag fx-entrance">Our Venues</div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight fx-entrance fx-d1">
            Find your perfect<br />venue, in seconds.
          </h1>
          <p className="text-[#9CA3AF] text-lg max-w-xl leading-relaxed mt-6 fx-entrance fx-d2">
            Filter by city, capacity, and style — then check availability in one click.
            Every EventSphere venue comes with on-site coordination included.
          </p>
        </div>
      </section>

      {/* ─── EXPLORER ─── */}
      <section className="pb-20 px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <Reveal className="card-dark p-6 lg:p-8 space-y-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                <input value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Search venues by name..."
                  className="w-full bg-[#121216] border border-[#2A2A36] text-white rounded-full pl-11 pr-5 py-2.5 text-sm placeholder:text-[#6B7280] focus:outline-none focus:border-[#FF2B66]/50" />
              </div>
              <select value={sort} onChange={e => setSort(e.target.value)}
                className="bg-[#121216] border border-[#2A2A36] text-white rounded-full px-5 py-2.5 text-sm focus:outline-none focus:border-[#FF2B66]/50 cursor-pointer">
                <option value="featured">Sort: Featured</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="capacity">Largest capacity</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              {CITIES.map(c => (
                <button key={c} onClick={() => setCity(c)}
                  className={`text-sm rounded-full px-4 py-1.5 border transition-all ${city === c
                    ? 'bg-[#FF2B66] border-[#FF2B66] text-white font-semibold'
                    : 'bg-[#181820] border-[#2A2A36] text-[#9CA3AF] hover:text-white hover:border-[#FF2B66]/40'}`}>
                  {c}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {TYPES.map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`text-xs rounded-full px-3.5 py-1.5 border transition-all ${type === t
                    ? 'bg-[#FF2B66]/15 border-[#FF2B66]/50 text-[#FF2B66] font-semibold'
                    : 'bg-[#181820] border-[#2A2A36] text-[#9CA3AF] hover:text-white hover:border-[#FF2B66]/40'}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <label className="text-sm text-[#9CA3AF] whitespace-nowrap">
                Max capacity: <span className="text-white font-semibold">{capacity.toLocaleString()} guests</span>
              </label>
              <input type="range" min="50" max="2000" step="50" value={capacity}
                onChange={e => setCapacity(+e.target.value)}
                className="flex-1 h-1.5 cursor-pointer"
                style={{ accentColor: '#FF2B66' }} />
            </div>
          </Reveal>

          <p className="text-sm text-[#6B7280]">
            Showing <span className="text-white font-semibold">{filtered.length}</span> of {VENUES.length} venues
          </p>

          {filtered.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((v, i) => <VenueCard key={v.id} venue={v} index={i} onSelect={setSelected} />)}
            </div>
          ) : (
            <div className="card-dark p-14 text-center space-y-3">
              <Search size={32} className="text-[#FF2B66] mx-auto" />
              <h3 className="text-white font-semibold text-lg">No venues match your filters</h3>
              <p className="text-[#9CA3AF] text-sm">Try widening the capacity range or clearing the search box.</p>
              <button onClick={() => { setCity('All'); setType('All'); setCapacity(2000); setQuery('') }}
                className="btn-primary text-sm !px-6 mt-2 inline-block">Reset filters</button>
            </div>
          )}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="pb-24 px-6">
        <Reveal className="max-w-7xl mx-auto card-dark p-10 lg:p-14 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl font-bold text-white">Can't find the right fit?</h2>
            <p className="text-[#9CA3AF] mt-2 max-w-lg text-sm leading-relaxed">
              Tell us what you need — we scout and negotiate venues worldwide that aren't listed here.
            </p>
          </div>
          {onContact
            ? <button onClick={onContact} className="btn-primary flex items-center gap-2 shrink-0">
                Talk to our team <ArrowRight size={16} />
              </button>
            : <Link to="/contact-us" className="btn-primary flex items-center gap-2 shrink-0">
                Talk to our team <ArrowRight size={16} />
              </Link>}
        </Reveal>
      </section>

      <VenueModal venue={selected} onClose={() => setSelected(null)} onContact={onContact} />
    </div>
  )
}

export default function Venues({ user }) {
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
                className={`text-sm transition-colors ${l.label === 'Venues' ? 'text-white font-semibold' : 'text-[#9CA3AF] hover:text-white'}`}>
                {l.label}
              </Link>
            ))}
          </div>
          <div className="hidden md:block">
            {user
              ? <Link to="/dashboard" className="btn-primary text-sm !px-5 !py-2.5">Dashboard</Link>
              : <Link to="/" className="btn-primary text-sm !px-5 !py-2.5">Book a venue</Link>}
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

      <VenuesSection />

      <footer className="border-t border-[#2A2A36] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#6B7280]">
          <span>&copy; 2026 EventSphere Inc. All rights reserved.</span>
          <Link to="/" className="hover:text-white transition-colors">Back to home</Link>
        </div>
      </footer>
    </div>
  )
}
