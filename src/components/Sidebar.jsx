import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const navItems = [
  { to: '/', icon: 'dashboard', label: 'Dashboard' },
  { to: '/left-off', icon: 'bookmark', label: 'Where I Left Off' },
  { to: '/history', icon: 'history', label: 'History' },
  { to: '/progress', icon: 'monitoring', label: 'Progress Tracker' },
  { to: '/goals', icon: 'flag', label: 'Goals' },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, signOut } = useAuth()
  const displayName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'You'
  const [entryCount, setEntryCount] = useState(0)

  useEffect(() => {
    if (user) {
      supabase.from('entries').select('id', { count: 'exact' }).eq('user_id', user.id)
        .then(({ count }) => setEntryCount(count || 0))
    }
  }, [user])

  return (
    <aside className={`fixed left-0 top-0 h-full w-[240px] border-r border-border bg-bg flex flex-col py-6 z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      <div className="px-6 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white" style={{ fontSize: '16px' }}>bolt</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm tracking-wider uppercase">GrindLog</p>
            <p className="text-text-muted text-[10px] uppercase tracking-widest">Deep Focus Tracking</p>
          </div>
          <button onClick={onClose} className="md:hidden text-text-muted hover:text-white">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}
            onClick={onClose}
            className={({ isActive }) => "flex items-center gap-3 px-3 py-2 rounded text-sm transition-all duration-150 " + (isActive ? 'bg-[#1F2937]/60 text-white border-l-2 border-primary pl-[10px]' : 'text-text-muted hover:bg-[#1F2937]/40 hover:text-text-secondary')}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 mt-4 space-y-2">
        <NavLink to="/" className="w-full bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded text-xs font-semibold transition-all flex items-center justify-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
          Log New Entry
        </NavLink>

        <div className="flex items-center justify-between px-3 py-2 mt-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '14px' }}>person</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-secondary">{displayName}</p>
              <p className="text-[10px] text-text-muted">{entryCount} logs total</p>
            </div>
          </div>
          <button onClick={signOut} title="Sign out" className="text-text-muted hover:text-red-400 transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>logout</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
