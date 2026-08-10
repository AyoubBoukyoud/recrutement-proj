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

// Direct, bookmarkable routes for each dashboard. In dev builds any logged-in
// user can open any of them (`npm run dev`), so the whole app can be clicked
// through without needing an Admin/Company/Commercial Agent account for each
// role. Production keeps the real role check.
function RequireRole({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  const allowed = import.meta.env.DEV || roles.some((role) => user.roles.includes(role))
  if (!allowed) return <Navigate to="/" replace />
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
      <Route
        path="/admin"
        element={
          <RequireRole roles={['Administrator']}>
            <AdminDashboard />
          </RequireRole>
        }
      />
      <Route
        path="/recruiter"
        element={
          <RequireRole roles={['Company']}>
            <RecruiterSearch />
          </RequireRole>
        }
      />
      <Route
        path="/agent"
        element={
          <RequireRole roles={['Commercial Agent']}>
            <AgentDashboard />
          </RequireRole>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
