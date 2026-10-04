'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Instagram, Linkedin, Menu, X, Youtube } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { AUTH, translator, type Locale } from '@/components/landing/content';
import './reference.css';
import './reference-enhancements.css';
import { PrivacyNotice } from './PrivacyNotice';

export function PublicSiteHeader({ locale }: { locale: Locale }) {
  const t = translator(locale);
  const { setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const nav = [
    ['/#parcours', t('Pour les talents', 'للمواهب', 'Für Talente', 'For talent')],
    ['/entreprises', t('Pour les entreprises', 'للشركات', 'Für Unternehmen', 'For companies')],
    ['/crm-centre-formation', t('Centres de formation', 'مراكز التكوين', 'Bildungszentren', 'Training centres')],
    ['/#faq', 'FAQ'],
  ];

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);

  return <header className="r-header"><div className="r-header-inner">
    <a href="/" className="r-logo" aria-label={t('AMUD Skills, accueil', 'AMUD Skills، الرئيسية', 'AMUD Skills, Startseite', 'AMUD Skills, home')}><Image src="/landing-assets/amud-logo-brand.svg" width={70} height={70} alt="AMUD Skills" unoptimized/></a>
    <nav className="r-desktop-nav" aria-label={t('Navigation principale', 'القائمة الرئيسية', 'Hauptnavigation', 'Main navigation')}>{nav.map(([href,label])=><a key={href} href={href}>{label}</a>)}</nav>
    <div className="r-header-actions"><div className="r-languages" aria-label={t('Langue', 'اللغة', 'Sprache', 'Language')}>{(['fr','ar','de','en'] as const).map(lang=><button type="button" key={lang} aria-label={{fr:'Français',ar:'العربية',de:'Deutsch',en:'English'}[lang]} aria-pressed={lang===locale} onClick={()=>setLanguage(lang)}>{lang==='ar'?'ع':lang.toUpperCase()}</button>)}</div><a href={AUTH} className="r-login">{t('Connexion', 'الدخول', 'Anmelden', 'Sign in')}</a><a className="r-button r-header-cta" href={AUTH}>{t('Créer mon profil', 'إنشاء ملفي', 'Profil erstellen', 'Create my profile')}<ArrowUpRight/></a><button ref={buttonRef} className="r-menu-button" type="button" aria-expanded={open} aria-controls="public-page-menu" aria-label={open?t('Fermer le menu', 'إغلاق القائمة', 'Menü schließen', 'Close menu'):t('Ouvrir le menu', 'فتح القائمة', 'Menü öffnen', 'Open menu')} onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></div>
    {open&&<nav className="r-mobile-nav" id="public-page-menu">{nav.map(([href,label])=><a key={href} href={href} onClick={()=>setOpen(false)}>{label}</a>)}<a href={AUTH}>{t('Connexion', 'الدخول', 'Anmelden', 'Sign in')}</a></nav>}
  </div></header>;
}

export function PublicSiteFooter({ locale }: { locale: Locale }) {
  const t = translator(locale);
  return <><footer className="r-footer"><div className="r-container"><a href="/" className="r-footer-brand"><Image src="/landing-assets/amud-logo-brand.svg" alt="AMUD Skills" width={62} height={62} unoptimized/></a><nav aria-label={t('Pied de page', 'روابط التذييل', 'Fußnavigation', 'Footer navigation')}><a href="/#parcours">{t('À propos', 'حول المنصة', 'Über uns', 'About')}</a><a href="/#faq">FAQ</a><a href="/crm-centre-formation">{t('Centres de formation', 'مراكز التكوين', 'Bildungszentren', 'Training centres')}</a><a href="/entreprises">{t('Entreprises', 'الشركات', 'Unternehmen', 'Companies')}</a></nav><div className="r-social" aria-hidden="true"><Linkedin/><Youtube/><Instagram/></div><small>© 2026 AMUD Skills<br/>{t('Tous droits réservés.', 'جميع الحقوق محفوظة.', 'Alle Rechte vorbehalten.', 'All rights reserved.')}</small></div></footer><PrivacyNotice locale={locale}/></>;
}
