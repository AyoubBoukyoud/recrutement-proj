'use client';

import type { ReactNode } from 'react'
import { Button, Wordmark } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'

export function TopBar({ title, connectivity }: { title: string; connectivity?: ReactNode }) {
  const { user, logout } = useAuth()

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant bg-surface-lowest px-8 py-4">
      <div className="flex flex-wrap items-center gap-4">
        <Wordmark subtitle={title} />
        {/* Emplacement générique : n'importe quel appelant peut y glisser un
            indicateur (StatusPill, etc.) sans que TopBar ait à en connaître
            la nature. L'admin y met la connectivité de l'API ; recruteur et
            agent n'y mettent rien. */}
        {connectivity}
      </div>

      <div className="flex items-center gap-4">
        <div className="grid gap-0.5 text-right">
          {/* Chasse fixe pour le numéro : c'est ainsi que le formulaire l'aurait imprimé. */}
          <span className="font-mono text-[13px] tracking-[0.5px] text-on-surface">{user?.phone}</span>
          <span className="eyebrow">{user?.roles?.join(' · ')}</span>
        </div>
        <Button variant="ghost" size="compact" onClick={logout}>
          Se déconnecter
        </Button>
      </div>
    </header>
  )
}
