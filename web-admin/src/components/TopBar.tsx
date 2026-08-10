import { Link, useLocation } from 'react-router-dom'
import { Button, Wordmark } from './ui'
import { useAuth } from '../context/AuthContext'

const DEV_PAGES = [
  { to: '/admin', label: 'Admin' },
  { to: '/recruiter', label: 'Recruiter' },
  { to: '/agent', label: 'Agent' },
]

/** Dev-only: jump straight to any dashboard regardless of the logged-in
 * user's role, so all pages can be clicked through without switching accounts. */
function DevPageSwitcher() {
  const location = useLocation()
  return (
    <nav style={{ display: 'flex', gap: 'var(--sp-xs, 4px)' }}>
      {DEV_PAGES.map((page) => (
        <Link
          key={page.to}
          to={page.to}
          className={`btn btn-ghost btn-compact${location.pathname === page.to ? ' btn-primary' : ''}`}
          style={{ textDecoration: 'none' }}
        >
          {page.label}
        </Link>
      ))}
    </nav>
  )
}

export function TopBar({ title }: { title: string }) {
  const { user, logout } = useAuth()

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--sp-md)',
        padding: 'var(--sp-md) var(--sp-xl)',
        background: 'var(--card)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-lg)' }}>
        <Wordmark subtitle={title} />
        {import.meta.env.DEV && <DevPageSwitcher />}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-md)' }}>
        <div style={{ textAlign: 'right', display: 'grid', gap: 2 }}>
          {/* Mono for the phone number: the form itself would have printed it. */}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '0.5px' }}>
            {user?.phone}
          </span>
          <span className="eyebrow">{user?.roles.join(' · ')}</span>
        </div>
        <Button variant="ghost" size="compact" onClick={logout}>
          Log out
        </Button>
      </div>
    </header>
  )
}
