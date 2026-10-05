'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Facebook, Instagram, Linkedin, Menu, X, Youtube } from 'lucide-react';
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
    ['/notre-entreprise', t('Notre entreprise', 'عن الشركة', 'Unser Unternehmen', 'Our company')],
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

const SOCIAL_LINKS = [
  { name: 'Instagram', href: 'https://www.instagram.com/amud_skills/', Icon: Instagram },
  { name: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61590919101643', Icon: Facebook },
  { name: 'LinkedIn', href: 'https://ma.linkedin.com/company/amud_skills', Icon: Linkedin },
];

export function PublicSiteFooter({ locale }: { locale: Locale }) {
  const t = translator(locale);
  return <><footer className="r-footer"><div className="r-container"><a href="/" className="r-footer-brand"><Image src="/landing-assets/amud-logo-brand.svg" alt="AMUD Skills" width={62} height={62} unoptimized/></a><nav aria-label={t('Pied de page', 'روابط التذييل', 'Fußnavigation', 'Footer navigation')}><a href="/notre-entreprise">{t('Notre entreprise', 'عن الشركة', 'Unser Unternehmen', 'Our company')}</a><a href="/#faq">FAQ</a><a href="/crm-centre-formation">{t('Centres de formation', 'مراكز التكوين', 'Bildungszentren', 'Training centres')}</a><a href="/entreprises">{t('Entreprises', 'الشركات', 'Unternehmen', 'Companies')}</a></nav><nav className="r-social" aria-label={t('Réseaux sociaux', 'الشبكات الاجتماعية', 'Soziale Medien', 'Social media')}>
    {SOCIAL_LINKS.map(({name,href,Icon})=><a key={name} href={href} target="_blank" rel="noopener noreferrer" aria-label={t(`AMUD Skills sur ${name}`, `AMUD Skills على ${name}`, `AMUD Skills auf ${name}`, `AMUD Skills on ${name}`)}><Icon aria-hidden="true"/></a>)}
    <span className="r-social-placeholder" role="img" aria-label={t('YouTube, bientôt', 'يوتيوب، قريبًا', 'YouTube, demnächst', 'YouTube, coming soon')}><Youtube aria-hidden="true"/></span>
  </nav><small>© 2026 AMUD Skills<br/>{t('Tous droits réservés.', 'جميع الحقوق محفوظة.', 'Alle Rechte vorbehalten.', 'All rights reserved.')}</small></div></footer><PrivacyNotice locale={locale}/></>;
}
