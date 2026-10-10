'use client';

import { useEffect, useState } from 'react';
import { BarChart3, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { ANALYTICS_CONSENT_EVENT, ANALYTICS_CONSENT_KEY, isPublicAnalyticsPage } from '@/lib/analytics';
import './privacy-notice.css';
import './privacy-notice-compact.css';

type Locale = 'fr' | 'ar' | 'de' | 'en';
type Choice = 'unknown' | 'granted' | 'denied';

const copy: Record<Locale, {
  label: string; title: string; body: string; accept: string; reject: string;
  settings: string; close: string; eu: string; morocco: string;
}> = {
  fr: {
    label: 'VOS DONNÉES ET VOTRE CHOIX', title: 'Cookies analytiques',
    body: 'Avec votre accord, Google Analytics mesure la fréquentation de nos pages publiques pour nous aider à améliorer le site. Vous pouvez refuser et continuer votre visite. Votre choix peut être modifié à tout moment.',
    accept: 'Autoriser les statistiques', reject: 'Tout refuser', settings: 'Gérer les cookies', close: 'Fermer les préférences',
    eu: 'RGPD · article 7', morocco: 'Loi 09-08 · CNDP',
  },
  ar: {
    label: 'بياناتك واختيارك', title: 'ملفات تعريف الارتباط التحليلية',
    body: 'بموافقتك، تقيس Google Analytics عدد زيارات الصفحات العامة لمساعدتنا على تحسين الموقع. يمكنك الرفض ومواصلة التصفح. يمكنك تغيير اختيارك في أي وقت.',
    accept: 'السماح بالإحصاءات', reject: 'رفض الكل', settings: 'إدارة ملفات الارتباط', close: 'إغلاق الإعدادات',
    eu: 'اللائحة الأوروبية · المادة 7', morocco: 'القانون 09-08 · CNDP',
  },
  de: {
    label: 'IHRE DATEN UND IHRE WAHL', title: 'Analyse-Cookies',
    body: 'Mit Ihrer Zustimmung misst Google Analytics die Besuche unserer öffentlichen Seiten, damit wir die Website verbessern können. Sie können ablehnen und weiter surfen. Ihre Wahl können Sie jederzeit ändern.',
    accept: 'Statistik erlauben', reject: 'Alle ablehnen', settings: 'Cookie-Einstellungen', close: 'Einstellungen schließen',
    eu: 'DSGVO · Artikel 7', morocco: 'Gesetz 09-08 · CNDP',
  },
  en: {
    label: 'YOUR DATA AND YOUR CHOICE', title: 'Analytics cookies',
    body: 'With your permission, Google Analytics measures visits to our public pages so we can improve the site. You can refuse and continue browsing. You can change your choice at any time.',
    accept: 'Allow analytics', reject: 'Reject all', settings: 'Cookie settings', close: 'Close preferences',
    eu: 'GDPR · Article 7', morocco: 'Law 09-08 · CNDP',
  },
};

export function PrivacyNotice() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const routeLocale = pathname.startsWith('/ar/') ? 'ar' : pathname.startsWith('/de/') ? 'de' : pathname.startsWith('/fr/') ? 'fr' : language;
  const locale = (['fr', 'ar', 'de', 'en'].includes(routeLocale) ? routeLocale : 'fr') as Locale;
  const text = copy[locale];
  const [choice, setChoice] = useState<Choice>('unknown');
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const isPublic = isPublicAnalyticsPage(pathname);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
      setChoice(stored === 'granted' || stored === 'denied' ? stored : 'unknown');
    } catch {
      setChoice('unknown');
    }
    setReady(true);
  }, []);

  const saveChoice = (next: 'granted' | 'denied') => {
    try { window.localStorage.setItem(ANALYTICS_CONSENT_KEY, next); }
    catch { /* The choice still applies for this session if storage is unavailable. */ }
    setChoice(next);
    setOpen(false);
    window.dispatchEvent(new CustomEvent(ANALYTICS_CONSENT_EVENT, { detail: next }));
  };

  if (!ready || !isPublic) return null;

  const showPanel = choice === 'unknown' || open;

  return <>
    {showPanel ? <section className="amud-privacy-notice" aria-live="polite" aria-labelledby="amud-privacy-title" dir={locale === 'ar' ? 'rtl' : 'ltr'} lang={locale}>
      <div className="amud-privacy-top">
        <p>{text.label}</p>
        {choice !== 'unknown' && <button type="button" className="amud-privacy-close" aria-label={text.close} onClick={() => setOpen(false)}><X size={18}/></button>}
      </div>
      <h2 id="amud-privacy-title">{text.title}</h2>
      <p className="amud-privacy-body">{text.body}</p>
      <div className="amud-privacy-links">
        <a href="https://eur-lex.europa.eu/eli/reg/2016/679/art_7/oj" target="_blank" rel="noreferrer">{text.eu}</a>
        <a href="https://www.cndp.ma/conformite-des-sites-web/" target="_blank" rel="noreferrer">{text.morocco}</a>
      </div>
      <div className="amud-privacy-actions">
        <button className="amud-privacy-primary" type="button" onClick={() => saveChoice('granted')}><BarChart3 size={16}/>{text.accept}</button>
        <button className="amud-privacy-secondary" type="button" onClick={() => saveChoice('denied')}>{text.reject}</button>
      </div>
    </section> : <button className="amud-privacy-settings" type="button" onClick={() => setOpen(true)} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {text.settings}
    </button>}
  </>;
}
