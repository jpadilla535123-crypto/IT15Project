import { useState } from 'react'
import { Wallet, Loader2, ImagePlus, CheckCircle2, Info } from 'lucide-react'
import { api } from '../../api/client'
import { formatCurrency } from './format'

const PAY_METHODS = ['GCash', 'Card', 'Cash', 'Bank Transfer']

/* Shared "record an invoice payment with proof screenshot" form.
   Used by Billing, Payment Review and the Finance Dashboard so every
   payment flows through the same with-evidence endpoint. */
export default function InvoicePaymentForm({ eventId, clientId, onDone }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ amount: '', method: 'GCash', reference: '', file: null, preview: null })

  function reset() {
    if (form.preview) URL.revokeObjectURL(form.preview)
    setForm({ amount: '', method: 'GCash', reference: '', file: null, preview: null })
  }

  async function submit() {
    const amount = Number(form.amount)
    if (!(amount > 0)) { alert('Enter a valid amount first.'); return }
    if (!form.file) { alert('Attach the proof screenshot first — payments are recorded only with evidence.'); return }
    setSaving(true)
    try {
      const fd = new FormData()
      if (eventId) fd.append('eventId', String(eventId))
      if (clientId) fd.append('clientId', String(clientId))
      fd.append('amount', String(amount))
      fd.append('paymentDate', new Date().toISOString().slice(0, 10))
      fd.append('method', form.method)
      fd.append('reference', form.reference || '')
      fd.append('evidence', form.file)
      await api.post('/api/payments/with-evidence', fd)
      reset()
      if (onDone) await onDone()
    } catch (err) {
      alert(err.message || 'Could not record the payment.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-[#2A2A36] p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">Amount (₱)</label>
          <input type="number" min="0" value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 dark:border-[#2A2A36] bg-gray-50 dark:bg-[#0B0B0E] px-3 py-2 text-sm outline-none focus:border-[#FF2B66]/60 text-gray-900 dark:text-white" />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">Method</label>
          <select value={form.method}
            onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
            className="w-full appearance-none rounded-lg border border-gray-200 dark:border-[#2A2A36] bg-gray-50 dark:bg-[#0B0B0E] px-3 py-2 text-sm outline-none focus:border-[#FF2B66]/60 text-gray-900 dark:text-white">
            {PAY_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">Reference / Note (optional)</label>
        <input type="text" value={form.reference}
          onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
          className="w-full rounded-lg border border-gray-200 dark:border-[#2A2A36] bg-gray-50 dark:bg-[#0B0B0E] px-3 py-2 text-sm outline-none focus:border-[#FF2B66]/60 text-gray-900 dark:text-white" />
      </div>
      <label className="flex items-center justify-center gap-2 cursor-pointer rounded-xl border border-dashed border-gray-300 dark:border-[#2A2A36] px-4 py-3 text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] hover:border-[#FF2B66]/60 hover:text-[#FF2B66] transition-colors">
        {form.preview ? <CheckCircle2 size={15} className="text-emerald-500" /> : <ImagePlus size={15} />}
        {form.preview ? 'Proof screenshot attached' : 'Attach proof screenshot (required)'}
        <input type="file" accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (!file) return
            if (!file.type.startsWith('image/')) { alert('Proof must be an image.'); return }
            setForm(f => ({ ...f, file, preview: URL.createObjectURL(file) }))
          }} />
      </label>
      {form.preview && (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-[#2A2A36] p-2">
          <img src={form.preview} alt="Proof" className="h-16 w-16 rounded object-cover" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 dark:text-white">{form.method} · {formatCurrency(Number(form.amount) || 0)}</p>
            <p className="text-[10px] text-gray-400 truncate">{form.reference || 'No reference'}</p>
          </div>
        </div>
      )}
      <button disabled={saving}
        onClick={submit}
        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FF2B66] hover:bg-[#E0245A] text-white text-xs font-bold py-2.5 px-3 transition-all active:scale-95 disabled:opacity-60">
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Wallet size={13} />}
        Record payment
      </button>
      <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-gray-400 dark:text-[#6B7280]">
        <Info size={12} className="shrink-0 mt-0.5" />
        Each recorded payment is saved to the Payments table, linked to this invoice, and updates the invoice's Paid Amount and status.
      </p>
    </div>
  )
}