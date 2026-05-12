import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
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
// Add this import at the top of App.jsx
import { useQueryClient } from '@tanstack/react-query'
import CategorySets from './pages/CategorySets'

function AppRoutes() {
  const { user, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const queryClient = useQueryClient()

  // Replace the existing useEffect that triggers onboarding with this:
  useEffect(() => {
    if (!user) return

    async function checkAndSeed() {
      // Check if this user already has category sets
      const { count } = await supabase
        .from('category_sets')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (count > 0) {
        // Returning user — check if they need onboarding for entries
        const { count: entryCount } = await supabase
          .from('entries')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
        if (entryCount === 0) setShowOnboarding(true)
        return
      }

      // ── Brand new user — seed three template sets ───────────────────────
      const templates = [
        {
          name: 'Interview Prep',
          categories: [
            { label: 'DSA / LeetCode', color: '#9333EA', short_label: 'DSA', sort_order: 0 },
            { label: 'System Design', color: '#3B82F6', short_label: 'SYS DESIGN', sort_order: 1 },
            { label: 'Behavioural Prep', color: '#14B8A6', short_label: 'BEHAVIOURAL', sort_order: 2 },
            { label: 'Job Applications', color: '#F97316', short_label: 'JOB APPS', sort_order: 3 },
            { label: 'Networking', color: '#10B981', short_label: 'NETWORKING', sort_order: 4 },
          ],
        },
        {
          name: 'Side Project',
          categories: [
            { label: 'Frontend', color: '#3B82F6', short_label: 'FRONTEND', sort_order: 0 },
            { label: 'Backend', color: '#9333EA', short_label: 'BACKEND', sort_order: 1 },
            { label: 'Design', color: '#EC4899', short_label: 'DESIGN', sort_order: 2 },
            { label: 'Marketing', color: '#F59E0B', short_label: 'MARKETING', sort_order: 3 },
          ],
        },
        {
          name: 'Study Sprint',
          categories: [
            { label: 'Deep Reading', color: '#10B981', short_label: 'READING', sort_order: 0 },
            { label: 'Note Taking', color: '#F59E0B', short_label: 'NOTES', sort_order: 1 },
            { label: 'Practice', color: '#EF4444', short_label: 'PRACTICE', sort_order: 2 },
            { label: 'Review', color: '#14B8A6', short_label: 'REVIEW', sort_order: 3 },
          ],
        },
      ]

      for (let i = 0; i < templates.length; i++) {
        const template = templates[i]

        // Create the set — first template is active by default
        const { data: newSet, error: setError } = await supabase
          .from('category_sets')
          .insert({
            user_id: user.id,
            name: template.name,
            is_active: i === 0, // only the first set starts active
          })
          .select()
          .single()

        if (setError) { console.error('Seed error:', setError); continue }

        // Create the categories for this set
        const { error: catError } = await supabase
          .from('categories')
          .insert(
            template.categories.map(cat => ({
              ...cat,
              user_id: user.id,
              set_id: newSet.id,
            }))
          )

        if (catError) console.error('Category seed error:', catError)
      }

      // Tell React Query the category cache is now stale so it refetches
      queryClient.invalidateQueries({ queryKey: ['categories', user.id] })
      queryClient.invalidateQueries({ queryKey: ['category_sets', user.id] })

      setShowOnboarding(true)
    }

    checkAndSeed()
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
        <Route path="/categories" element={<CategorySets />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (

    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>

  )
}
