"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { ProfileProvider } from "@/context/ProfileContext";
import { NetworkProvider } from "@/context/NetworkContext";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { OfflineBanner } from "./OfflineBanner";
import { ImpersonationBanner } from '@/components/ImpersonationBanner';
import { SyncBadge } from "./SyncBadge";
import { InstallPrompt } from "./InstallPrompt";

// Reflète la langue choisie sur <html lang/dir> (RTL pour l'arabe) partout dans l'app.
function HtmlLangSync() {
  const { language, dir } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [language, dir]);

  return null;
}

// Reflète le thème résolu (clair/sombre/système) sur <html class="dark"> partout dans l'app.
// Le script inline de layout.tsx pose déjà la classe avant hydratation (anti-flash) ; cet
// effet la garde synchronisée quand l'utilisateur change de mode ou que l'OS bascule.
function HtmlThemeSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

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
              <SettingsProvider>
                <ThemeProvider>
                  <HtmlLangSync />
                  <HtmlThemeSync />
                  <OfflineBanner />
                  <ImpersonationBanner />
                  {children}
                  <SyncBadge />
                  <InstallPrompt />
                </ThemeProvider>
              </SettingsProvider>
            </LanguageProvider>
          </NetworkProvider>
        </ProfileProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
