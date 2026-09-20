import { useEffect, useState } from 'react'
import '../../pages/landingFx.css'

export default function ModalShell({ open, onClose, wide, children }) {
  const [render, setRender] = useState(open)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (open) {
      setRender(true)
      const raf = requestAnimationFrame(() => setShown(true))
      return () => cancelAnimationFrame(raf)
    }
    setShown(false)
    const t = setTimeout(() => setRender(false), 320)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!render) return
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [render, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!render) return null

  return (
    <div className={`fx-modal-backdrop ${shown ? 'fx-open' : ''}`} onClick={onClose}>
      <div
        className={`fx-modal-panel ${wide ? '!max-w-[960px]' : ''} bg-[#121215] border border-neutral-800/80 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}