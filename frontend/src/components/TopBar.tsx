'use client';

import type { ReactNode } from 'react'
import { Button, Wordmark } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

export function TopBar({ title, connectivity }: { title: string; connectivity?: ReactNode }) {
  const { user, logout } = useAuth()

  return (
    <header className="fixed inset-x-0 bottom-0 z-40 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant bg-surface-lowest px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:static md:inset-x-auto md:bottom-auto md:z-auto md:gap-4 md:border-b md:border-t-0 md:px-8 md:py-4 md:pb-4">
      <div className="flex flex-wrap items-center gap-4">
        <Wordmark subtitle={title} />
        {/* Emplacement générique : n'importe quel appelant peut y glisser un
            indicateur (StatusPill, etc.) sans que TopBar ait à en connaître
            la nature. L'admin y met la connectivité de l'API ; recruteur et
            agent n'y mettent rien. */}
        {connectivity}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <LanguageSwitcher compact />
          <ThemeToggle />
        </div>
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
