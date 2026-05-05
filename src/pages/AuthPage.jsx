import { useState } from 'react'
import { supabase } from '../lib/supabase'

function friendlyError(msg) {
  if (!msg) return ''
  if (msg.includes('Invalid login credentials')) return 'Wrong email or password. Please try again.'
  if (msg.includes('User already registered')) return 'This email is already registered. Try logging in.'
  if (msg.includes('Password should be')) return 'Password must be at least 6 characters.'
  return msg
}

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ─────────────────────────────────────────────
  // Google OAuth — one click, no form needed
  // ─────────────────────────────────────────────
  async function handleGoogleLogin() {
    setError('')
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // After Google redirects back, land on the app root
        redirectTo: window.location.origin,
      },
    })
    // If there's an immediate error (e.g. provider not enabled in Supabase),
    // show it. Otherwise the page navigates away to Google — loading stays true.
    if (error) {
      setError(friendlyError(error.message))
      setGoogleLoading(false)
    }
  }

  // ─────────────────────────────────────────────
  // Email / password
  // ─────────────────────────────────────────────
  function validateForm() {
    if (!email.trim()) { setError('Please enter your email.'); return false }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return false }
    if (mode === 'signup' && !name.trim()) { setError('Please enter your name.'); return false }
    return true
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!validateForm()) return
    setLoading(true)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })
      if (error) setError(friendlyError(error.message))
      else setSuccess('Account created! You can now log in.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(friendlyError(error.message))
    }

    setLoading(false)
  }

  function switchMode(newMode) {
    setMode(newMode)
    setError('')
    setSuccess('')
    setPassword('')
  }

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-10">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>
              bolt
            </span>
          </div>
          <div>
            <p className="text-white font-bold text-lg tracking-wider uppercase">GrindLog</p>
            <p className="text-text-muted text-[10px] uppercase tracking-widest">Deep Focus Tracking</p>
          </div>
        </div>

        <div className="border border-border rounded-xl p-7 bg-surface-low">
          <h2 className="text-xl font-semibold text-text-primary mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-text-muted text-sm mb-6">
            {mode === 'login'
              ? 'Log in to continue your grind.'
              : 'Start tracking your career switch.'}
          </p>

          {/* ── Google OAuth button ── */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 border border-border text-text-secondary py-2.5 rounded text-sm hover:bg-surface-high disabled:opacity-60 transition-all mb-4"
          >
            {googleLoading ? (
              <span
                className="material-symbols-outlined animate-spin"
                style={{ fontSize: '18px' }}
              >
                progress_activity
              </span>
            ) : (
              /* Official Google "G" logo — exact brand colours, no fill="none" on paths */
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908C16.658 14.121 17.64 11.813 17.64 9.2Z"
                  fill="#4285F4"
                />
                <path
                  d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
                  fill="#34A853"
                />
                <path
                  d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
                  fill="#FBBC05"
                />
                <path
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {googleLoading ? 'Redirecting to Google...' : 'Continue with Google'}
          </button>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted">or continue with email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* ── Email / password form ── */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {mode === 'signup' && (
              <div>
                <label className="text-xs text-text-muted uppercase tracking-widest mb-1.5 block">
                  Your name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); setError('') }}
                  placeholder="Kamini"
                  className="w-full bg-bg border border-border rounded px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-text-muted uppercase tracking-widest mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="you@gmail.com"
                className="w-full bg-bg border border-border rounded px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-text-muted uppercase tracking-widest mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="Min 6 characters"
                  className="w-full bg-bg border border-border rounded px-3 py-2.5 pr-10 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {mode === 'signup' && password.length > 0 && password.length < 6 && (
                <p className="text-xs text-amber-400 mt-1">
                  {6 - password.length} more characters needed
                </p>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                {error}
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded px-3 py-2">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-semibold py-2.5 rounded text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {loading && (
                <span
                  className="material-symbols-outlined animate-spin"
                  style={{ fontSize: '16px' }}
                >
                  progress_activity
                </span>
              )}
              {loading
                ? 'Please wait...'
                : mode === 'login'
                  ? 'Log In'
                  : 'Create Account'}
            </button>
          </form>

          {/* Forgot password — login mode only */}
          {mode === 'login' && (
            <div className="mt-3 text-center">
              <button
                onClick={async () => {
                  if (!email) { setError('Enter your email above first.'); return }
                  await supabase.auth.resetPasswordForEmail(email)
                  setError('')
                  setSuccess('Password reset email sent! Check your inbox.')
                }}
                className="text-xs text-text-muted hover:text-primary transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Switch mode */}
          <div className="mt-4 text-center text-sm text-text-muted">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => switchMode('signup')}
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => switchMode('login')}
                  className="text-primary hover:underline font-medium"
                >
                  Log in
                </button>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-text-muted text-xs mt-6">
          Your data is private and stored securely.
        </p>
      </div>
    </div>
  )
}
