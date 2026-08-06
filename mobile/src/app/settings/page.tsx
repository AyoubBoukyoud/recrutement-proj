'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { useSettings } from '@/context/SettingsContext';
import { useLanguage } from '@/context/LanguageContext';
import { useProfile } from '@/context/ProfileContext';
import { AnimatedButton } from '@/components/shared/AnimatedButton';
import { AvatarUpload } from '@/components/shared/AvatarUpload';
import { LANGUAGES } from '@/lib/i18n';
import { ChevronLeft, Moon, Sun, Monitor, Type, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { textSize, setTextSize } = useSettings();
  const { language, setLanguage, t } = useLanguage();
  const { profile, updateProfile } = useProfile();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-surface dark:bg-gray-900 transition-colors p-4 md:p-6 pb-24">
      <header className="flex items-center mb-8 gap-4">
        <AnimatedButton
          onClick={() => router.back()}
          aria-label={t('common:settings.backAriaLabel')}
          className="w-10 h-10 bg-white dark:bg-gray-800 shadow-sm rounded-full text-onSurface dark:text-gray-100"
        >
          <ChevronLeft size={24} />
        </AnimatedButton>
        <h1 className="text-2xl font-bold text-onSurface dark:text-white">{t('common:settings.pageTitle')}</h1>
      </header>

      <div className="space-y-6 max-w-2xl mx-auto">
        
        {/* Profil */}
        <section className="bg-white dark:bg-gray-800 rounded-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <AvatarUpload
              imageUrl={profile.avatarUrl}
              fallbackText={profile.avatarInitials || '?'}
              onChange={(dataUrl) => updateProfile({ avatarUrl: dataUrl })}
              size="h-16 w-16"
              ariaLabel={t('candidateB:profil.changePhotoAriaLabel')}
            />
            <div className="flex-1">
              <h2 className="text-lg font-semibold dark:text-white">{t('common:settings.profile.title')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('common:settings.profile.subtitle')}</p>
            </div>
          </div>
        </section>

        {/* Apparence (Thème) */}
        <section className="bg-white dark:bg-gray-800 rounded-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Monitor className="text-primary" />
            <h2 className="text-lg font-semibold dark:text-white">{t('common:settings.appearance.title')}</h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <AnimatedButton
              onClick={() => setTheme('light')}
              className={`p-3 border rounded-element flex flex-col items-center gap-2 ${
                theme === 'light' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 dark:border-gray-700 text-gray-500'
              }`}
            >
              <Sun size={20} />
              <span className="text-sm">{t('common:settings.appearance.light')}</span>
            </AnimatedButton>
            <AnimatedButton
              onClick={() => setTheme('dark')}
              className={`p-3 border rounded-element flex flex-col items-center gap-2 ${
                theme === 'dark' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 dark:border-gray-700 text-gray-500'
              }`}
            >
              <Moon size={20} />
              <span className="text-sm">{t('common:settings.appearance.dark')}</span>
            </AnimatedButton>
            <AnimatedButton
              onClick={() => setTheme('system')}
              className={`p-3 border rounded-element flex flex-col items-center gap-2 ${
                theme === 'system' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 dark:border-gray-700 text-gray-500'
              }`}
            >
              <Monitor size={20} />
              <span className="text-sm">{t('common:settings.appearance.system')}</span>
            </AnimatedButton>
          </div>
        </section>

        {/* Langue */}
        <section className="bg-white dark:bg-gray-800 rounded-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="text-primary" />
            <h2 className="text-lg font-semibold dark:text-white">{t('common:settings.language.title')}</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {LANGUAGES.map(({ code, label, flag }) => (
              <AnimatedButton
                key={code}
                onClick={() => setLanguage(code)}
                className={`p-3 border rounded-element gap-2 ${
                  language === code ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-300'
                }`}
              >
                <span>{flag}</span>
                <span>{label}</span>
              </AnimatedButton>
            ))}
          </div>
        </section>

        {/* Taille du texte */}
        <section className="bg-white dark:bg-gray-800 rounded-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Type className="text-primary" />
            <h2 className="text-lg font-semibold dark:text-white">{t('common:settings.textSize.title')}</h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <AnimatedButton
              onClick={() => setTextSize('small')}
              className={`p-3 border rounded-element text-sm ${
                textSize === 'small' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-300'
              }`}
            >
              {t('common:settings.textSize.small')}
            </AnimatedButton>
            <AnimatedButton
              onClick={() => setTextSize('medium')}
              className={`p-3 border rounded-element text-base ${
                textSize === 'medium' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-300'
              }`}
            >
              {t('common:settings.textSize.medium')}
            </AnimatedButton>
            <AnimatedButton
              onClick={() => setTextSize('large')}
              className={`p-3 border rounded-element text-lg ${
                textSize === 'large' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-300'
              }`}
            >
              {t('common:settings.textSize.large')}
            </AnimatedButton>
          </div>
        </section>

      </div>
    </div>
  );
}
