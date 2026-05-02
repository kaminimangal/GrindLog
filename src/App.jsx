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

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-text-muted text-sm">Loading ShiftLog...</div>
    </div>
  )

  if (!user) return <AuthPage />

  return (
    <>
      <Sidebar />
      <TopBar />
      <Routes>
        <Route path="/"         element={<Dashboard />} />
        <Route path="/left-off" element={<WhereILeftOff />} />
        <Route path="/history"  element={<History />} />
        <Route path="/progress" element={<ProgressTracker />} />
        <Route path="/goals"    element={<Goals />} />
        <Route path="*"         element={<Navigate to="/" />} />
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
