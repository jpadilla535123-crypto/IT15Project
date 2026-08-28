import { useState } from 'react'
import { Search, Bell, MessageCircle, Sparkles, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase'

export default function Header({ user, badgeCount = 0, searchValue, onSearchChange }) {
  const navigate = useNavigate()
  const [localQuery, setLocalQuery] = useState('')
  const name = user?.displayName || user?.email || 'Admin'
  const initial = (name[0] || 'A').toUpperCase()

  const controlled = typeof onSearchChange === 'function'
  const query = controlled ? searchValue || '' : localQuery

  function handleSearch(e) {
    if (controlled) onSearchChange(e.target.value)
    else setLocalQuery(e.target.value)
  }

  async function handleSignOut() {
    await signOut(auth)
    navigate('/')
  }

  return (
    <header className="h-16 shrink-0 flex items-center justify-between gap-4 px-4 md:px-8 border-b border-gray-200 dark:border-[#2A2A36]/60 bg-white dark:bg-[#0B0B0E]">
      <div className="lg:hidden flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#FF2B66]/15 flex items-center justify-center">
          <Sparkles size={16} className="text-[#FF2B66]" />
        </div>
        <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">EventSphere</span>
      </div>

      <div className="hidden md:flex flex-1 max-w-xl items-center gap-2.5 rounded-xl bg-gray-100 dark:bg-[#121217] px-3.5 py-2.5 border border-transparent focus-within:border-[#FF2B66]/50 transition-colors">
        <Search size={16} className="text-gray-400 dark:text-[#6B7280]" />
        <input
          value={query}
          onChange={handleSearch}
          placeholder="Search events, clients, venues..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-[#6B7280] text-gray-900 dark:text-white"
        />
      </div>

      <div className="flex items-center gap-2.5">
        <button className="relative h-10 w-10 rounded-xl bg-gray-100 dark:bg-[#121217] flex items-center justify-center text-gray-500 dark:text-[#9CA3AF] hover:text-[#FF2B66] transition-colors" title="Messages">
          <MessageCircle size={18} />
          {badgeCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-[#FF2B66] text-[10px] font-bold text-white flex items-center justify-center px-1">
              {badgeCount}
            </span>
          )}
        </button>

        <button className="relative h-10 w-10 rounded-xl bg-gray-100 dark:bg-[#121217] flex items-center justify-center text-gray-500 dark:text-[#9CA3AF] hover:text-[#FF2B66] transition-colors" title="Notifications">
          <Bell size={18} />
          {badgeCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-[#FF2B66] text-[10px] font-bold text-white flex items-center justify-center px-1">
              {badgeCount}
            </span>
          )}
        </button>

        <div className="hidden sm:flex items-center gap-2.5 pl-1">
          <div className="h-9 w-9 rounded-full bg-[#FF2B66] text-white font-bold text-sm flex items-center justify-center">
            {initial}
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{name}</span>
            <span className="text-[11px] font-medium text-[#FF2B66]">Administrator</span>
          </div>
        </div>

        <button onClick={handleSignOut}
          className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-[#121217] flex items-center justify-center text-gray-500 dark:text-[#9CA3AF] hover:text-[#FF2B66] transition-colors"
          title="Sign out">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}