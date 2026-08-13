import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import RecruiterSearch from './pages/RecruiterSearch'
import AgentDashboard from './pages/AgentDashboard'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminOverview } from './pages/admin/AdminOverview'
import { AdminCandidates } from './pages/admin/AdminCandidates'
import { AdminCandidateDetailPage } from './pages/admin/AdminCandidateDetail'
import { AdminComplaints } from './pages/admin/AdminComplaints'
import { AdminInternships } from './pages/admin/AdminInternships'
import { AdminUsers } from './pages/admin/AdminUsers'
import { AdminCommissions } from './pages/admin/AdminCommissions'
import { AdminNotFound } from './pages/admin/AdminNotFound'

function Home() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  // L'administrateur a désormais son propre routeur imbriqué plutôt qu'une
  // page unique — recruteur et agent gardent leur comportement d'origine.
  if (user.roles.includes('Administrator')) return <Navigate to="/admin/apercu" replace />
  if (user.roles.includes('Company')) return <RecruiterSearch />
  if (user.roles.includes('Commercial Agent')) return <AgentDashboard />
  return (
    <p className="helper-text m-12 text-center">
      Votre compte n&apos;a pas encore accès à un tableau de bord.
    </p>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

/** `/admin/*` est réservé au rôle Administrator ; toute autre session,
 *  authentifiée ou non, repart de `/` où `Home` la redirige vers son propre
 *  espace (ou le message « pas d'accès »). */
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!user.roles.includes('Administrator')) return <Navigate to="/" replace />
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
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<Navigate to="apercu" replace />} />
        <Route path="apercu" element={<AdminOverview />} />
        <Route path="candidats" element={<AdminCandidates />} />
        <Route path="candidats/:id" element={<AdminCandidateDetailPage />} />
        <Route path="reclamations" element={<AdminComplaints />} />
        <Route path="stage" element={<AdminInternships />} />
        <Route path="utilisateurs" element={<AdminUsers />} />
        <Route path="parrainage" element={<AdminCommissions />} />
        <Route path="*" element={<AdminNotFound />} />
      </Route>
    </Routes>
  )
}

export default App
