import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from '../components/dashboard/Sidebar'
import Header from '../components/dashboard/Header'
import { PanelsProvider } from '../components/dashboard/PanelsContext'
import './landingFx.css'

const THEME_KEY = 'es-theme'

export default function AppLayout({ user, badgeCount = 0, searchValue, onSearchChange, children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'dark')
  const { pathname } = useLocation()

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen flex bg-[#F4F6F8] dark:bg-[#0B0B0E] text-gray-900 dark:text-white transition-colors">
        <Sidebar role={user?.role} theme={theme} onToggleTheme={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))} />
        <div className="flex-1 flex flex-col min-w-0">
          <PanelsProvider>
            <Header user={user} badgeCount={badgeCount} searchValue={searchValue} onSearchChange={onSearchChange} role={user?.role} theme={theme} onToggleTheme={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))} />
            <main key={pathname} className="fx-tab-panel flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 space-y-6 min-h-0">
              {children}
            </main>
          </PanelsProvider>
        </div>
      </div>
    </div>
  )
}