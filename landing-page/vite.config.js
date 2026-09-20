import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND = process.env.VITE_BACKEND_URL || 'http://localhost:5199'

/* Proxy API + uploaded files to the .NET backend during dev. This lets any
   device on the same network (phones/tablets) use the app by visiting the
   Vite server's LAN address — no backend CORS changes or hardcoded IP needed.
   Run the backend so it listens on the same host/port as BACKEND above
   (default http://localhost:5199). */
const proxy = {
  '/api': { target: BACKEND, changeOrigin: true },
  '/uploads': { target: BACKEND, changeOrigin: true },
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy,
  },
  preview: {
    host: true,
    proxy,
  },
})
