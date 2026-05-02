import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      })
      if (error) setError(error.message)
      else setSuccess('Check your email for a confirmation link!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-10">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-white" style={{fontSize:'20px'}}>bolt</span>
          </div>
          <div>
            <p className="text-white font-bold text-lg tracking-wider uppercase">ShiftLog</p>
            <p className="text-text-muted text-[10px] uppercase tracking-widest">Deep Focus Tracking</p>
          </div>
        </div>

        {/* Card */}
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
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Arjun"
                  required
                  className="w-full bg-bg border border-border rounded px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-text-muted uppercase tracking-widest mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-bg border border-border rounded px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-text-muted uppercase tracking-widest mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                className="w-full bg-bg border border-border rounded px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
                <span className="material-symbols-outlined" style={{fontSize:'14px'}}>error</span>
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded px-3 py-2">
                <span className="material-symbols-outlined" style={{fontSize:'14px'}}>check_circle</span>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-2.5 rounded text-sm transition-all active:scale-[0.99] mt-2"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-text-muted">
            {mode === 'login' ? (
              <>Don't have an account?{' '}
                <button onClick={() => { setMode('signup'); setError(''); setSuccess('') }} className="text-primary hover:underline">
                  Sign up
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => { setMode('login'); setError(''); setSuccess('') }} className="text-primary hover:underline">
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
