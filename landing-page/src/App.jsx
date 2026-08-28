import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import Clients from './pages/Clients'
import EventCalendar from './pages/EventCalendar'
import EventManagement from './pages/EventManagement'
import { Loader2 } from 'lucide-react'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, u => {
      setUser(u)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0E] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#FF2B66]" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Landing user={user} />} />
      <Route
        path="/dashboard"
        element={user ? <Dashboard user={user} /> : <Navigate to="/" replace />}
      />
      <Route
        path="/leads"
        element={user ? <Leads user={user} /> : <Navigate to="/" replace />}
      />
      <Route
        path="/clients"
        element={user ? <Clients user={user} /> : <Navigate to="/" replace />}
      />
      <Route
        path="/calendar"
        element={user ? <EventCalendar user={user} /> : <Navigate to="/" replace />}
      />
      <Route
        path="/events"
        element={user ? <EventManagement user={user} /> : <Navigate to="/" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}