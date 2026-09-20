import { useEffect, useState } from 'react'
import { X, Calendar, MapPin, Loader2, Ticket, RefreshCw } from 'lucide-react'
import ModalShell from './ModalShell'
import { api } from '../../api/client'
import { formatCurrency, formatFullDate } from '../dashboard/format'
import '../../pages/landingFx.css'

const ART = [
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&h=400&fit=crop',
]

export default function TicketModal({ open, onClose, onRegister }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await api.get('/api/events/public')
      const list = Array.isArray(res) ? res : []
      setEvents(list.map(e => ({
        id: e.id,
        title: e.name,
        category: e.eventType || 'Event',
        date: e.startDate ? formatFullDate(e.startDate) : 'Date TBA',
        location: [e.venueAddress, e.venueCity].filter(Boolean).join(', ') || 'Location TBA',
        price: Number(e.price) || 0,
        priceRaw: e.price || 0,
        venueName: e.venueName,
        img: ART[(e.venueId || e.id) % ART.length],
      })))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) load()
  }, [open])

  return (
    <ModalShell open={open} onClose={onClose} wide>
      <div className="flex items-center justify-between border-b border-neutral-800/80 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FF2B66]/15 flex items-center justify-center">
            <Ticket size={17} className="text-[#FF2B66]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-none">Get a Ticket</h2>
            <p className="text-xs text-neutral-400 mt-1">Open events you can join today</p>
          </div>
        </div>
        <button onClick={onClose} aria-label="Close"
          className="h-8 w-8 rounded-full bg-neutral-800/70 hover:bg-neutral-800 hover:rotate-90 text-neutral-400 hover:text-white flex items-center justify-center transition-all duration-300">
          <X size={16} />
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-neutral-400">
            <Loader2 size={20} className="animate-spin text-[#FF2B66]" /> Loading events...
          </div>
        ) : error ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-sm text-neutral-400">Could not load open events.</p>
            <button onClick={load}
              className="inline-flex items-center gap-2 bg-[#FF2B66] hover:bg-[#E0245A] text-white text-sm font-semibold rounded-full px-5 py-2.5 transition-colors">
              <RefreshCw size={15} /> Retry
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 text-neutral-400 text-sm">
            No open events right now — check back soon.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map(e => (
              <div key={e.id} className="card-dark overflow-hidden group flex flex-col">
                <div className="relative overflow-hidden">
                  <img src={e.img} alt={e.title}
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className="absolute top-3 left-3 bg-[#FF2B66]/90 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {e.category}
                  </span>
                </div>
                <div className="p-5 space-y-3 flex flex-col flex-1">
                  <h3 className="text-white font-semibold leading-snug text-[15px]">{e.title}</h3>
                  <div className="space-y-1.5 text-[13px] text-[#9CA3AF]">
                    <span className="flex items-center gap-1.5"><Calendar size={13} className="text-gray-500" /> {e.date}</span>
                    <span className="flex items-center gap-1.5 line-clamp-2"><MapPin size={13} className="text-gray-500" /> {e.location}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-[#2A2A36] mt-auto">
                    <span className="text-white font-bold">{formatCurrency(e.price)}</span>
                    <button onClick={() => onRegister(e)} className="bg-[#FF2B66] hover:bg-[#E0245A] text-white text-[13px] font-semibold rounded-full px-4 py-2 transition-colors">
                      Register
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ModalShell>
  )
}