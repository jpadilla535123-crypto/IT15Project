import { api, setSession, clearSession } from './client'

export async function login(email, password) {
  const res = await api.post('/api/auth/login', { email, password })
  setSession(res.token, res.user)
  return res.user
}

export function logout() {
  clearSession()
}

export function hasRole(role) {
  const user = JSON.parse(localStorage.getItem('eventsphere_user') || 'null')
  return user?.role === role
}

export const ROLE_LABELS = {
  Admin: 'System Administrator',
  Manager: 'Event Manager',
  Finance: 'Finance Officer',
  Staff: 'Event Staff',
}