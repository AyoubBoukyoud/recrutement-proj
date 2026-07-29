import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import RecruiterSearch from './pages/RecruiterSearch'
import AgentDashboard from './pages/AgentDashboard'

function Home() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.roles.includes('Administrator')) return <AdminDashboard />
  if (user.roles.includes('Company')) return <RecruiterSearch />
  if (user.roles.includes('Commercial Agent')) return <AgentDashboard />
  return (
    <p className="helper-text" style={{ margin: '3rem', textAlign: 'center' }}>
      Your account has no dashboard access yet.
    </p>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Home />
          </RequireAuth>
        }
      />
    </Routes>
  )
}

export default App
