'use client'

import { useRouter } from 'next/navigation'
import { Button, Wordmark } from './ui'
import { useAuth } from '../context/useDashboardAuth'

export function TopBar({ title }: { title: string }) {
  const { user, logout } = useAuth()
  const router = useRouter()

  // Next.js n'a pas la garde de route instantanée d'une SPA : sans redirection
  // explicite, l'écran resterait affiché jusqu'à la prochaine navigation.
  function handleLogout() {
    logout()
    router.replace('/auth-phone')
  }

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
        <Button variant="ghost" size="compact" onClick={handleLogout}>
          Log out
        </Button>
      </div>
    </header>
  )
}
