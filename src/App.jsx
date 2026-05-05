import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import WhereILeftOff from './pages/WhereILeftOff'
import History from './pages/History'
import ProgressTracker from './pages/ProgressTracker'
import Goals from './pages/Goals'
import AIMotivation from './pages/AIMotivation'
import OnboardingModal from './components/OnboardingModal'
import Settings from './pages/Settings'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

function AppRoutes() {
  const { user, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  // ✅ useEffect MUST be here — before any conditional return
  // Rule of Hooks: hooks must always run in the same order every render
  useEffect(() => {
    if (!user) return
    supabase
      .from('entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => {
        if (count === 0) setShowOnboarding(true)
      })
  }, [user])

  // Loading screen — shown while Supabase checks session
  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-text-muted text-sm">Loading GrindLog...</div>
    </div>
  )

  // Not logged in — show auth page
  if (!user) return <AuthPage />

  return (
    <>
      {showOnboarding && (
        <OnboardingModal onComplete={() => setShowOnboarding(false)} />
      )}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuClick={() => setSidebarOpen(prev => !prev)} />
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/left-off" element={<WhereILeftOff />} />
        <Route path="/history" element={<History />} />
        <Route path="/progress" element={<ProgressTracker />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/ai" element={<AIMotivation />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
