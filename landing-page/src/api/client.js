const ENV_API_URL = import.meta.env.VITE_API_URL

/* Same-origin by default: the dev server proxies /api and /uploads to the
   backend (see vite.config.js), so the app works from any device on the LAN
   without hardcoding an IP or configuring CORS. Set VITE_API_URL only when
   the frontend is deployed separately from the API. */
export const API_URL = ENV_API_URL || ''

const TOKEN_KEY = 'eventsphere_token'
const USER_KEY = 'eventsphere_user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export async function request(path, { method = 'GET', body, params } = {}) {
  const base = API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5199')
  const url = new URL(path, base)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value)
      }
    })
  }

  const headers = { Accept: 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'

  let res
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? (isForm ? body : JSON.stringify(body)) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the backend running?')
  }

  if (res.status === 401) {
    clearSession()
    window.dispatchEvent(new Event('eventsphere:unauthorized'))
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const data = await res.json()
      message = data.message || data.title || message
    } catch { /* ignore body parse */ }
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  get: (path, params) => request(path, { params }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: path => request(path, { method: 'DELETE' }),
}