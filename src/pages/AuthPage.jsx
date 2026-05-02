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
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
      if (error) setError(friendlyError(error.message))
      else setSuccess('Account created! You can now log in.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(friendlyError(error.message))
    }
    setLoading(false)
  }

  function switchMode(newMode) {
    setMode(newMode); setError(''); setSuccess(''); setPassword('')
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="flex items-center gap-3 justify-center mb-10">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>bolt</span>
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
            {mode === 'login' ? 'Log in to continue your grind.' : 'Start tracking your career switch.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-xs text-text-muted uppercase tracking-widest mb-1.5 block">Your name</label>
                <input type="text" value={name} onChange={e => { setName(e.target.value); setError('') }}
                  placeholder="Kamini" className="w-full bg-bg border border-border rounded px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors" />
              </div>
            )}

            <div>
              <label className="text-xs text-text-muted uppercase tracking-widest mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="you@gmail.com" className="w-full bg-bg border border-border rounded px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors" />
            </div>

            <div>
              <label className="text-xs text-text-muted uppercase tracking-widest mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="Min 6 characters"
                  className="w-full bg-bg border border-border rounded px-3 py-2.5 pr-10 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {mode === 'signup' && password.length > 0 && password.length < 6 && (
                <p className="text-xs text-amber-400 mt-1">{6 - password.length} more characters needed</p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded px-3 py-2">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                {success}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-semibold py-2.5 rounded text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2">
              {loading && <span className="material-symbols-outlined animate-spin" style={{ fontSize: '16px' }}>progress_activity</span>}
              {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
            </button>
          </form>

          {mode === 'login' && (
            <div className="mt-3 text-center">
              <button onClick={async () => {
                if (!email) { setError('Enter your email above first.'); return }
                await supabase.auth.resetPasswordForEmail(email)
                setError('')
                setSuccess('Password reset email sent! Check your inbox.')
              }} className="text-xs text-text-muted hover:text-primary transition-colors">
                Forgot password?
              </button>
            </div>
          )}

          <div className="mt-4 text-center text-sm text-text-muted">
            {mode === 'login' ? (
              <>Don't have an account?{' '}
                <button onClick={() => switchMode('signup')} className="text-primary hover:underline font-medium">Sign up</button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => switchMode('login')} className="text-primary hover:underline font-medium">Log in</button>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-text-muted text-xs mt-6">Your data is private and stored securely.</p>
      </div>
    </div>
  )
}