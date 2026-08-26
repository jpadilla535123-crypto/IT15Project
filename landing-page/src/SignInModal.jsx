import { useState } from 'react'
import { X, Sparkles } from 'lucide-react'
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { auth, googleProvider } from './firebase'

export default function SignInModal({ open, onClose }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  if (!open) return null

  function resetForm() {
    setEmail('')
    setPassword('')
    setRemember(false)
    setError('')
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  async function handleGoogle() {
    setError('')
    setLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
      handleClose()
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(cred.user, { displayName: email.split('@')[0] })
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      handleClose()
    } catch (err) {
      const msg = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/invalid-credential': 'Invalid email or password.',
      }
      setError(msg[err.code] || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={handleClose}>
      <div className="max-w-[420px] w-full bg-[#121215] border border-neutral-800/80 rounded-2xl p-7 shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Header Row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#FF2D55] h-8 w-8 rounded-lg flex items-center justify-center text-white">
              <Sparkles size={16} />
            </div>
            <span className="text-white text-lg font-bold">EventSphere</span>
          </div>
          <button onClick={handleClose}
            className="h-8 w-8 rounded-full bg-neutral-800/70 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition">
            <X size={16} />
          </button>
        </div>

        {/* Title & Subtitle */}
        <div className="flex flex-col items-start text-left mb-6">
          <h2 className="text-2xl font-bold text-white tracking-tight mb-1">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-xs text-neutral-400">
            {isSignUp
              ? 'Sign up to start planning your next event.'
              : 'Sign in to manage your events and tickets.'}
          </p>
        </div>

        {/* Google OAuth Button */}
        <button onClick={handleGoogle} disabled={loading}
          className="w-full bg-white hover:bg-neutral-100 text-neutral-900 font-medium py-3 rounded-xl flex items-center justify-center gap-2.5 transition text-sm mb-6 disabled:opacity-50">
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-full border-t border-neutral-800/80" />
          <span className="bg-[#121215] px-3 text-[11px] text-neutral-500 font-medium absolute">
            or continue with email
          </span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>

          {/* Email Input */}
          <div className="flex flex-col items-start text-left mb-4 w-full">
            <label className="text-xs font-semibold text-neutral-300 mb-2">Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required
              className="w-full bg-[#0B0B0E] border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#FF2D55] transition" />
          </div>

          {/* Password Input */}
          <div className="w-full mb-4">
            <div className="flex justify-between items-center w-full mb-2">
              <label className="text-xs font-semibold text-neutral-300">Password</label>
              {!isSignUp && (
                <span className="text-xs font-medium text-[#FF2D55] hover:underline cursor-pointer">Forgot password?</span>
              )}
            </div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password" required minLength={6}
              className="w-full bg-[#0B0B0E] border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#FF2D55] transition" />
          </div>

          {/* Checkbox Row */}
          {!isSignUp && (
            <div className="flex items-center gap-2.5 mb-6 text-left">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 accent-[#FF2D55] cursor-pointer" />
              <label className="text-xs text-neutral-400 select-none cursor-pointer" onClick={() => setRemember(!remember)}>
                Remember me for 30 days
              </label>
            </div>
          )}

          {/* Sign In / Sign Up Button */}
          <button type="submit" disabled={loading}
            className="w-full bg-[#FF2D55] hover:bg-rose-600 text-white font-semibold py-3 rounded-xl transition text-sm shadow-md shadow-rose-950/20 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ marginBottom: isSignUp ? '1.5rem' : '0' }}>
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>

        </form>

        {/* Bottom Footer Link */}
        <p className="text-center text-xs text-neutral-400 mt-6">
          {isSignUp ? (
            <>Already have an account?{' '}
              <span onClick={() => { setIsSignUp(false); setError('') }}
                className="text-[#FF2D55] font-semibold hover:underline cursor-pointer">Sign in</span></>
          ) : (
            <>Don't have an account?{' '}
              <span onClick={() => { setIsSignUp(true); setError('') }}
                className="text-[#FF2D55] font-semibold hover:underline cursor-pointer">Create one free</span></>
          )}
        </p>

      </div>
    </div>
  )
}
