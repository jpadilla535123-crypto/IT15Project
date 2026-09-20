import { useEffect, useState } from 'react'
import { X, UserPlus, KeyRound, Loader2, CheckCircle2, ArrowRight, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { api } from '../api/client'
import './landingFx.css'

const LOGIN_ROLES = ['Staff', 'Manager', 'Finance', 'Admin']

function defaultEmail(first, last) {
  const f = (first || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  const l = (last || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!f && !l) return ''
  return `${f || 'staff'}.${l || 'member'}@eventsphere.ph`
}

function generatePassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return `Ev@${out}`
}

const inputCls = 'w-full bg-gray-50 dark:bg-[#0B0B0E] border rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none transition-all ' +
  'border-gray-200 dark:border-[#2A2A36] focus:border-[#FF2B66]/60 focus:shadow-[0_0_0_3px_rgba(255,43,102,0.1)]'
const errCls = 'border-red-500 focus:border-red-500'

function Field({ label, error, hint, children, span }) {
  return (
    <div className={span || ''}>
      <label className="text-xs font-semibold text-gray-500 dark:text-[#9CA3AF] mb-1.5 block">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-gray-400 dark:text-[#6B7280] mt-1">{hint}</p>}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

function Success({ title, sub, onDone }) {
  return (
    <div className="py-14 flex flex-col items-center text-center gap-3 fx-mode-swap">
      <div className="fx-success-pop w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
        <CheckCircle2 size={30} className="text-emerald-500" />
      </div>
      <p className="font-bold text-gray-900 dark:text-white">{title}</p>
      <p className="text-xs text-gray-500 dark:text-[#9CA3AF] max-w-[260px]">{sub}</p>
      <button onClick={onDone} className="mt-2 bg-[#FF2B66] hover:bg-[#E0245A] text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all">
        Done
      </button>
    </div>
  )
}

export default function EmployeeTeamModal({ mode, employee, onClose, onSaved, onAddEmployee }) {
  const isAccount = mode === 'account'

  const [form, setForm] = useState(() => isAccount
    ? {
        Email: employee?.Email || defaultEmail(employee?.FirstName, employee?.LastName),
        FullName: employee ? `${employee.FirstName} ${employee.LastName}` : '',
        Role: 'Staff',
        Password: generatePassword(),
      }
    : {
        FirstName: '', LastName: '', Role: 'Event Staff', Email: '', Phone: '',
        Salary: '', HireDate: new Date().toISOString().slice(0, 10), Status: 'Active',
        CreateAccount: false,
        LoginRole: 'Staff', Password: generatePassword(),
      })

  const [errors, setErrors] = useState({})
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [acctEmail, setAcctEmail] = useState(isAccount ? form.Email : '')
  const [acctFullName, setAcctFullName] = useState(isAccount ? form.FullName : '')
  const [acctRole, setAcctRole] = useState(isAccount ? form.Role : 'Staff')
  const [acctPassword, setAcctPassword] = useState(isAccount ? form.Password : '')

  useEffect(() => {
    const f = form
    if (!isAccount && f.CreateAccount) {
      const e = f.Email?.trim() || defaultEmail(f.FirstName, f.LastName)
      if (!acctEmail || !f.Email?.trim()) setAcctEmail(e)
      if (!acctFullName) setAcctFullName(`${f.FirstName || ''} ${f.LastName || ''}`.trim())
    }
  }, [form, isAccount, acctEmail, acctFullName])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function validate() {
    const errs = {}
    if (!isAccount) {
      if (!form.FirstName.trim()) errs.FirstName = 'First name is required'
      if (!form.LastName.trim()) errs.LastName = 'Last name is required'
      if (form.Email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.Email.trim())) errs.Email = 'Enter a valid email address'
      if (form.Salary !== '' && Number(form.Salary) < 0) errs.Salary = 'Salary cannot be negative'
    }
    if (isAccount || form.CreateAccount) {
      const email = isAccount ? acctEmail : acctEmail
      const pw = isAccount ? acctPassword : acctPassword
      if (!email.trim()) errs.acctEmail = 'Login email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.acctEmail = 'Enter a valid email address'
      if (!pw || pw.length < 6) errs.acctPassword = 'Password must be at least 6 characters'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function confirm() {
    if (!validate()) return
    setSaving(true)
    try {
      let empId = employee?.Id
      let fullName = isAccount ? acctFullName : `${form.FirstName} ${form.LastName}`.trim()
      let email = isAccount ? acctEmail : form.Email

      if (!isAccount) {
        const emp = await api.post('/api/employees', {
          firstName: form.FirstName.trim(),
          lastName: form.LastName.trim(),
          role: form.Role.trim() || 'Staff',
          email: form.Email.trim() || null,
          phone: form.Phone.trim() || null,
          salary: Number(form.Salary) || 0,
          hireDate: form.HireDate,
          status: form.Status,
        })
        empId = emp.id
        if (!email || !email.trim()) email = defaultEmail(form.FirstName, form.LastName)
        if (!fullName) fullName = `${form.FirstName} ${form.LastName}`.trim()
        if (onAddEmployee) onAddEmployee(emp)
        if (form.CreateAccount) {
          await api.post('/api/users', {
            email: acctEmail.trim(),
            fullName: acctFullName || fullName,
            role: acctRole,
            password: acctPassword,
            employeeId: empId,
          })
        }
      } else {
        await api.post('/api/users', {
          email: acctEmail.trim(),
          fullName: acctFullName.trim(),
          role: acctRole,
          password: acctPassword,
          employeeId: employee?.Id,
        })
      }

      setSaving(false)
      setDone(true)
    } catch (err) {
      setSaving(false)
      setErrors({ general: err.message })
    }
  }

  return (
    <div className="fx-modal-backdrop fx-open" onClick={onClose}>
      <div className="fx-modal-panel !max-w-lg w-full max-h-[92vh] overflow-y-auto no-scrollbar bg-white dark:bg-[#121217] border border-gray-200 dark:border-[#2A2A36] rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}>

        <div className="relative bg-gradient-to-r from-[#FF2B66] to-[#FF5C8A] px-6 pt-5 pb-6 shrink-0">
          <button onClick={onClose} aria-label="Close"
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all hover:rotate-90 duration-300">
            <X size={15} />
          </button>
          <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white mb-3">
            {isAccount ? <KeyRound size={20} /> : <UserPlus size={20} />}
          </div>
          <h3 className="font-bold text-lg text-white">
            {isAccount ? `Login account — ${employee?.FirstName || ''} ${employee?.LastName || ''}` : 'Add a team member'}
          </h3>
          <p className="text-white/80 text-xs mt-0.5">
            {isAccount
              ? 'Create a login so this employee can access EventSphere.'
              : 'Register a new hire — optionally give them access right away.'}
          </p>
        </div>

        {done ? (
          <Success
            title={isAccount ? 'Account created!' : 'Team member added!'}
            sub={isAccount
              ? `${acctEmail} can now sign in to EventSphere.`
              : `${form.FirstName} ${form.LastName} is on the team${form.CreateAccount ? ' and can sign in with the login account.' : '.'}`}
            onDone={onSaved}
          />
        ) : (
          <div className="p-6 space-y-4">
            {errors.general && (
              <p className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs px-4 py-3">{errors.general}</p>
            )}

            {!isAccount && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="First name" error={errors.FirstName}>
                  <input className={`${inputCls} ${errors.FirstName ? errCls : ''}`} value={form.FirstName}
                    onChange={e => set('FirstName', e.target.value)} placeholder="Juan" />
                </Field>
                <Field label="Last name" error={errors.LastName}>
                  <input className={`${inputCls} ${errors.LastName ? errCls : ''}`} value={form.LastName}
                    onChange={e => set('LastName', e.target.value)} placeholder="Dela Cruz" />
                </Field>
                <Field label="Job title" span="col-span-2">
                  <input className={inputCls} value={form.Role}
                    onChange={e => set('Role', e.target.value)} placeholder="Event Coordinator / AV Technician / ..." />
                </Field>
                <Field label="Email" error={errors.Email} span="col-span-2" hint="Used to link a login account and for daily notices.">
                  <input type="email" className={`${inputCls} ${errors.Email ? errCls : ''}`} value={form.Email}
                    onChange={e => set('Email', e.target.value)} placeholder="juan.delacruz@eventsphere.ph" />
                </Field>
                <Field label="Phone">
                  <input className={inputCls} value={form.Phone}
                    onChange={e => set('Phone', e.target.value)} placeholder="+63 9XX XXX XXXX" />
                </Field>
                <Field label="Salary (₱ / mo)">
                  <input type="number" min="0" className={`${inputCls} ${errors.Salary ? errCls : ''}`} value={form.Salary}
                    onChange={e => set('Salary', e.target.value)} placeholder="25000" />
                </Field>
                <Field label="Hire date">
                  <input type="date" className={inputCls} value={form.HireDate}
                    onChange={e => set('HireDate', e.target.value)} />
                </Field>
                <Field label="Status">
                  <select className={inputCls} value={form.Status} onChange={e => set('Status', e.target.value)}>
                    <option>Active</option>
                    <option>On Leave</option>
                    <option>Inactive</option>
                  </select>
                </Field>
              </div>
            )}

            {isAccount && (
              <div className="space-y-3 rounded-2xl border border-[#FF2B66]/20 bg-[#FF2B66]/5 p-4">
                <p className="text-xs font-bold text-[#FF2B66] uppercase tracking-wider">Login details</p>
                <Field label="Email" error={errors.acctEmail}>
                  <input type="email" className={`${inputCls} ${errors.acctEmail ? errCls : ''}`} value={acctEmail}
                    onChange={e => setAcctEmail(e.target.value)} />
                </Field>
                <Field label="Full name">
                  <input className={inputCls} value={acctFullName} onChange={e => setAcctFullName(e.target.value)} />
                </Field>
                <Field label="Access level">
                  <select className={inputCls} value={acctRole} onChange={e => setAcctRole(e.target.value)}>
                    {LOGIN_ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </Field>
              </div>
            )}

            {!isAccount && (
              <div className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] p-4">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={form.CreateAccount}
                    onChange={e => set('CreateAccount', e.target.checked)}
                    className="h-4 w-4 accent-[#FF2B66]" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Create a login account for this hire</span>
                </label>

                {form.CreateAccount && (
                  <div className="mt-4 space-y-3 fx-mode-swap">
                    <Field label="Login email" error={errors.acctEmail}>
                      <input type="email" className={`${inputCls} ${errors.acctEmail ? errCls : ''}`} value={acctEmail}
                        onChange={e => setAcctEmail(e.target.value)} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Access level">
                        <select className={inputCls} value={acctRole} onChange={e => setAcctRole(e.target.value)}>
                          {LOGIN_ROLES.map(r => <option key={r}>{r}</option>)}
                        </select>
                      </Field>
                      <Field label="Temporary password" error={errors.acctPassword}>
                        <div className="relative">
                          <input type={showPw ? 'text' : 'password'} value={acctPassword}
                            onChange={e => setAcctPassword(e.target.value)}
                            className={`${inputCls} pr-10 ${errors.acctPassword ? errCls : ''}`} />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <button type="button" onClick={() => setAcctPassword(generatePassword())} title="Generate"
                              className="h-7 w-7 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 transition-colors">
                              <RefreshCw size={13} />
                            </button>
                            <button type="button" onClick={() => setShowPw(v => !v)} title="Toggle"
                              className="h-7 w-7 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 transition-colors">
                              {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          </div>
                        </div>
                      </Field>
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-[#6B7280]">
                      Share this password securely — we recommend the employee changes it on first sign-in.
                    </p>
                  </div>
                )}
              </div>
            )}

            {isAccount && (
              <Field label="Temporary password" error={errors.acctPassword}>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={acctPassword}
                    onChange={e => setAcctPassword(e.target.value)}
                    className={`${inputCls} pr-10 ${errors.acctPassword ? errCls : ''}`} />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button type="button" onClick={() => setAcctPassword(generatePassword())} title="Generate"
                      className="h-7 w-7 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 transition-colors">
                      <RefreshCw size={13} />
                    </button>
                    <button type="button" onClick={() => setShowPw(v => !v)} title="Toggle"
                      className="h-7 w-7 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-400 transition-colors">
                      {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>
              </Field>
            )}

            <button onClick={confirm} disabled={saving}
              className="w-full bg-[#FF2B66] hover:bg-[#E0245A] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-rose-500/20">
              {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <>
                {isAccount ? 'Create account' : 'Add team member'} <ArrowRight size={15} />
              </>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}