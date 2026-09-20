import { useEffect, useMemo, useRef, useState } from 'react'
import { X, Search, ChevronLeft, Send, MessageCircle, MoreVertical } from 'lucide-react'
import { useData } from '../../api/data'
import { usePanels } from './PanelsContext'

const AVATAR_BG = [
  'bg-[#FF2B66]/15 text-[#FF2B66]',
  'bg-emerald-500/15 text-emerald-500',
  'bg-blue-500/15 text-blue-500',
  'bg-amber-500/15 text-amber-500',
  'bg-purple-500/15 text-purple-400',
]

const GREETINGS = [
  'Hi there! I\'d love to talk about our upcoming event.',
  'Hi! Could you send me the venue options for our event?',
  'Hi! When is the best time to schedule a planning call?',
  'Hello! Quick question about pricing for 200 guests.',
  'Hi! We\'re interested in a full-service package.',
]

function initials(name) {
  return String(name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function timeNow() {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function ChatPanel() {
  const { data } = useData()
  const { chatOpen, setChatOpen } = usePanels()
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState({})
  const [draft, setDraft] = useState('')
  const scrollRef = useRef(null)

  const conversations = useMemo(() => {
    const people = [
      ...data.clients.map(c => ({ id: `c${c.Id}`, name: c.ContactPerson || c.CompanyName, subtitle: c.CompanyName, email: c.Email, online: c.Status === 'Booked' })),
      ...data.leads.map(l => ({ id: `l${l.Id}`, name: l.ContactName || l.CompanyName, subtitle: l.CompanyName, email: l.Email, online: false })),
    ]
    const searched = people.filter(p => `${p.name} ${p.subtitle}`.toLowerCase().includes(query.toLowerCase()))
    /* people we've actually chatted with (have a thread) are pinned first */
    return searched.sort((a, b) => Number(!!messages[b.id]) - Number(!!messages[a.id])).slice(0, 10)
  }, [data, query, messages])

  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, activeId, chatOpen])

  const active = conversations.find(c => c.id === activeId)
  const thread = messages[activeId] || []

  /* pre-warm a greeting per conversation the first time it's opened */
  function openThread(id) {
    setActiveId(id)
    setMessages(m => {
      if (m[id]) return m
      const conv = conversations.find(c => c.id === id)
      return { ...m, [id]: [{ from: 'them', text: GREETINGS[(Math.abs(conv.id.length * 31) % GREETINGS.length)], time: timeNow() }] }
    })
  }

  function send() {
    const text = draft.trim()
    if (!text || !activeId) return
    const id = activeId
    setMessages(m => ({ ...m, [id]: [...(m[id] || []), { from: 'me', text, time: timeNow() }] }))
    setDraft('')
    setTimeout(() => {
      setMessages(m => ({
        ...m,
        [id]: [...(m[id] || []), { from: 'them', text: 'Got it — our event team will confirm details shortly.', time: timeNow() }],
      }))
    }, 900)
  }

  if (!chatOpen) return null

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setChatOpen(false)} />
      <aside className="relative h-full w-[400px] max-w-full flex flex-col bg-white dark:bg-[#121217] border-l border-gray-200 dark:border-[#2A2A36] shadow-2xl">
        {/* header */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-gray-200 dark:border-[#2A2A36] shrink-0">
          {activeId ? (
            <button onClick={() => setActiveId(null)} className="text-gray-500 hover:text-[#FF2B66] transition-colors" aria-label="Back to conversations">
              <ChevronLeft size={19} />
            </button>
          ) : (
            <div className="h-8 w-8 rounded-xl bg-[#FF2B66]/10 flex items-center justify-center">
              <MessageCircle size={16} className="text-[#FF2B66]" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">
              {activeId ? active?.name || 'Chat' : `Messages (${conversations.length})`}
            </h2>
            <p className="text-[11px] text-gray-400 dark:text-[#6B7280] truncate">
              {activeId ? (active?.online ? 'Online now' : active.email) : 'Start a conversation'}
            </p>
          </div>
          <MoreVertical size={16} className="text-gray-400" />
          <button onClick={() => setChatOpen(false)} className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-500 dark:text-[#9CA3AF] transition-colors" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {activeId && active ? (
          <>
            {/* thread */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-2.5">
              {thread.map((m, i) => (
                <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
                    m.from === 'me'
                      ? 'bg-[#FF2B66] text-white rounded-br-sm'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-100 rounded-bl-sm'
                  }`}>
                    {m.text}
                    <span className={`mt-1 block text-[10px] ${m.from === 'me' ? 'text-white/70 text-right' : 'text-gray-400 text-right'}`}>{m.time}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* composer */}
            <div className="p-3 border-t border-gray-200 dark:border-[#2A2A36] shrink-0 flex items-center gap-2">
              <input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') send() }}
                placeholder={`Message ${active.name.split(' ')[0]}...`}
                className="flex-1 rounded-full bg-gray-100 dark:bg-white/5 border border-transparent focus:border-[#FF2B66]/50 px-4 py-2.5 text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#6B7280] transition-colors"
              />
              <button onClick={send}
                className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${draft.trim() ? 'bg-[#FF2B66] text-white hover:bg-[#E0245A] active:scale-95' : 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed'}`}>
                <Send size={16} />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* conversation list */}
            <div className="p-3 border-b border-gray-200 dark:border-[#2A2A36] shrink-0">
              <div className="flex items-center gap-2 rounded-xl bg-gray-100 dark:bg-white/5 px-3 py-2">
                <Search size={14} className="text-gray-400" />
                <input value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#6B7280]" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {conversations.length === 0 ? (
                <p className="py-12 text-center text-sm text-gray-400 dark:text-[#6B7280]">No conversations found.</p>
              ) : conversations.map((c, i) => {
                const preview = (messages[c.id] || [])[0]?.text || GREETINGS[i % GREETINGS.length]
                return (
                  <button key={c.id} onClick={() => openThread(c.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors text-left">
                    <div className="relative shrink-0">
                      <div className={`h-11 w-11 rounded-full flex items-center justify-center text-xs font-bold ${AVATAR_BG[i % AVATAR_BG.length]}`}>
                        {initials(c.name)}
                      </div>
                      {c.online && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#121217]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{c.name}</p>
                        <span className="shrink-0 text-[10px] font-semibold text-gray-400">{messages[c.id] ? '' : 'now'}</span>
                      </div>
                      <p className="truncate text-xs text-gray-500 dark:text-[#9CA3AF]">{preview}</p>
                    </div>
                    {!messages[c.id] && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#FF2B66]" />}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </aside>
    </div>
  )
}