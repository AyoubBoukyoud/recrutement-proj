import { Button, Wordmark } from './ui'
import { useAuth } from '../context/AuthContext'

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
      <Wordmark subtitle={title} />

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
