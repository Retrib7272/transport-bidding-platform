import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CreateBidPage from './pages/CreateBidPage'
import BidDetailPage from './pages/BidDetailPage'
import CarrierBidPage from './pages/CarrierBidPage'
import CarriersPage from './pages/CarriersPage'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-lg text-slate-600">Loading...</div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public route for carriers */}
        <Route path="/bid/:bidId" element={<CarrierBidPage />} />
        
        {/* Admin routes */}
        <Route
          path="/login"
          element={!session ? <LoginPage /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/dashboard"
          element={session ? <DashboardPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/create-bid"
          element={session ? <CreateBidPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/bid-detail/:bidId"
          element={session ? <BidDetailPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/carriers"
          element={session ? <CarriersPage /> : <Navigate to="/login" />}
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
