import { createContext, useContext, useEffect, useState } from 'react'
import { login as apiLogin, logout as apiLogout } from '../api/auth'
import { getUser } from '../api/client'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getUser())

  useEffect(() => {
    function onUnauthorized() {
      setUser(null)
    }
    window.addEventListener('eventsphere:unauthorized', onUnauthorized)
    return () => window.removeEventListener('eventsphere:unauthorized', onUnauthorized)
  }, [])

  async function login(email, password) {
    const u = await apiLogin(email, password)
    setUser(u)
    return u
  }

  function logout() {
    apiLogout()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}