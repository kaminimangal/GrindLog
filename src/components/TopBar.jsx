import { useLocation } from 'react-router-dom'

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/left-off': 'Where I Left Off',
  '/history': 'History',
  '/progress': 'Progress Tracker',
  '/goals': 'Goals',
}

export default function TopBar({ onMenuClick }) {
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] || 'GrindLog'

  return (
    <header className="fixed top-0 right-0 left-0 md:left-[240px] h-14 bg-bg/90 backdrop-blur border-b border-border flex items-center justify-between px-4 md:px-8 z-40">
      <div className="flex items-center gap-3">
        {/* Hamburger — only shows on mobile */}
        <button onClick={onMenuClick} className="md:hidden text-text-muted hover:text-white">
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>menu</span>
        </button>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-text-muted hidden sm:block">Workspace</span>
          <span className="text-text-muted hidden sm:block">/</span>
          <span className="text-white font-semibold">{title}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder="Search entries..."
            className="bg-surface-low border border-border text-xs px-3 py-1.5 rounded w-56 focus:outline-none focus:border-primary text-text-secondary placeholder-text-muted transition-colors"
          />
          <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-text-muted" style={{ fontSize: '16px' }}>search</span>
        </div>
        <button className="text-text-muted hover:text-white transition-colors">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="text-text-muted hover:text-white transition-colors">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>
    </header>
  )
}