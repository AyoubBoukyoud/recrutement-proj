'use client';

import { useEffect } from 'react';
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
  return (
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
  );
}
