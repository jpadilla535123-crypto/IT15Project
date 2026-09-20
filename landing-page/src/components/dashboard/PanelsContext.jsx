import { createContext, useState, useContext } from 'react'

const Ctx = createContext(null)

export function PanelsProvider({ children }) {
  const [chatOpen, setChatOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifSeen, setNotifSeen] = useState(false)

  return (
    <Ctx.Provider value={{ chatOpen, setChatOpen, notifOpen, setNotifOpen, notifSeen, setNotifSeen }}>
      {children}
    </Ctx.Provider>
  )
}

export function usePanels() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('usePanels must be used inside <PanelsProvider>')
  return ctx
}