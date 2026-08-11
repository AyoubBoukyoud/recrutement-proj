'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ProfileProvider } from '@/context/ProfileContext';
import { NetworkProvider } from '@/context/NetworkContext';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { OfflineBanner } from './OfflineBanner';
import { SyncBadge } from './SyncBadge';
import { InstallPrompt } from './InstallPrompt';

// Reflète la langue choisie sur <html lang/dir> (RTL pour l'arabe) partout dans l'app.
function HtmlLangSync() {
  const { language, dir } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [language, dir]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Un seul client par montage : recréé à chaque rendu, il perdrait son cache
  // et redéclencherait toutes les requêtes des écrans recruteur/admin/agent.
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProfileProvider>
          <NetworkProvider>
            <LanguageProvider>
              <HtmlLangSync />
              <OfflineBanner />
              {children}
              <SyncBadge />
              <InstallPrompt />
            </LanguageProvider>
          </NetworkProvider>
        </ProfileProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
