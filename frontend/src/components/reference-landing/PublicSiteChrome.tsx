'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Facebook, Instagram, Linkedin, Menu, X, Youtube } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { AUTH, translator, type Locale } from '@/components/landing/content';
import { LEGAL_PATHS } from '@/content/legal';
import { COMPANY, companyPlace } from '@/lib/company';
import './reference.css';
import './reference-enhancements.css';
import './premium-footer.css';
import { AccordionFooterColumn } from './AccordionFooterColumn';

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
  { name: 'Instagram', href: COMPANY.social.instagram, Icon: Instagram },
  { name: 'Facebook', href: COMPANY.social.facebook, Icon: Facebook },
  { name: 'LinkedIn', href: COMPANY.social.linkedin, Icon: Linkedin },
];

export function PublicSiteFooter({ locale }: { locale: Locale }) {
  const t = translator(locale);
  const place = companyPlace(locale);
  const columns = [
    { title: t('Candidats','المرشحون','Bewerber','Candidates'), links: [
      ['/emploi-allemagne-maroc',t('Emploi en Allemagne','العمل في ألمانيا','Arbeit in Deutschland','Jobs in Germany')],
      ['/contrat-travail-allemagne',t('Contrat de travail','عقد العمل','Arbeitsvertrag','Employment contract')],
      ['/ausbildung-allemagne-maroc','Ausbildung'],
      ['/niveau-allemand-travail-allemagne',t('Niveau d’allemand','مستوى الألمانية','Deutschkenntnisse','German level')],
      ['/#faq','FAQ'],
    ]},
    { title: t('Métiers','المهن','Berufe','Professions'), links: [
      ['/chauffeur-allemagne',t('Chauffeur','سائق','Fahrer','Driver')],
      ['/logistique-allemagne',t('Logistique','اللوجستيك','Logistik','Logistics')],
      ['/hotellerie-allemagne',t('Hôtellerie','الفندقة','Hotellerie','Hospitality')],
      ['/sante-allemagne',t('Santé','الصحة','Gesundheit','Healthcare')],
      ['/btp-allemagne',t('BTP','البناء والأشغال','Bauwesen','Construction')],
      ['/metiers',t('Tous les métiers','كل المهن','Alle Berufe','All trades')],
    ]},
    { title: t('Entreprises','الشركات','Unternehmen','Employers'), links: [
      ['/employeurs',t('Recruter des talents','استقطاب المواهب','Talente rekrutieren','Recruit talent')],
      ['/entreprises',t('Solutions entreprises','حلول الشركات','Unternehmenslösungen','Business solutions')],
      ['/de/fachkraefte-aus-marokko','Fachkräfte aus Marokko'],
      ['/crm-centre-formation',t('Centres de formation','مراكز التكوين','Bildungszentren','Training centres')],
    ]},
    { title: t('Informations Amud Skills','معلومات Amud Skills','Über Amud Skills','Amud Skills information'), links: [
      ['/notre-entreprise',t('Notre entreprise','عن الشركة','Unser Unternehmen','Our company')],
      ['/notre-entreprise/startup',t('Notre startup','شركتنا الناشئة','Unser Startup','Our startup')],
      ['/a-propos',t('À propos','من نحن','Über uns','About')],
      ['/comment-ca-marche',t('Comment ça marche','كيف تعمل المنصة','So funktioniert es','How it works')],
      ['/securite-des-offres',t('Sécurité des offres','سلامة فرص العمل','Sicherheit von Stellenangeboten','Job safety')],
      ['/contact',t('Contact','اتصل بنا','Kontakt','Contact')],
    ]},
  ];
  return <footer className="r-footer"><div className="r-container">
    <div className="premium-footer-top"><div className="premium-footer-brand"><a href="/" aria-label={t('Accueil Amud Skills','الرئيسية Amud Skills','Amud Skills Startseite','Amud Skills home')}><Image src="/landing-assets/amud-logo-brand.svg" alt="AMUD Skills" width={62} height={62} unoptimized/></a><p>{t('Des compétences. Des rencontres. Un avenir.','مهارات. لقاءات. مستقبل.','Kompetenzen. Begegnungen. Zukunft.','Skills. Connections. A future.')}<span>{t('Du Maroc vers l’Allemagne.','من المغرب إلى ألمانيا.','Von Marokko nach Deutschland.','From Morocco to Germany.')}</span></p></div>
    <nav className="r-social" aria-label={t('Réseaux sociaux','الشبكات الاجتماعية','Soziale Medien','Social media')}>{SOCIAL_LINKS.map(({name,href,Icon})=><a key={name} href={href} target="_blank" rel="noopener noreferrer" aria-label={name}><Icon size={18} aria-hidden="true"/></a>)}<span className="r-social-placeholder" role="img" aria-label={t('YouTube, bientôt','يوتيوب، قريبًا','YouTube, demnächst','YouTube, coming soon')}><Youtube size={18} aria-hidden="true"/></span></nav></div>
    <nav className="premium-footer-nav" aria-label={t('Pied de page','روابط التذييل','Fußnavigation','Footer navigation')}>{columns.map(column=><AccordionFooterColumn key={column.title} {...column}/>)}</nav>
    <div className="premium-footer-bottom"><small>© 2026 {COMPANY.legalName ?? COMPANY.name}{COMPANY.registration && <><br/>{COMPANY.registration}</>}{place && <><br/>{place}</>}<br/><a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a><br/>{t('Tous droits réservés.','جميع الحقوق محفوظة.','Alle Rechte vorbehalten.','All rights reserved.')}</small><nav className="premium-footer-legal" aria-label={t('Informations légales','المعلومات القانونية','Rechtliche Informationen','Legal information')}><a href={LEGAL_PATHS.privacy}>{t('Confidentialité','الخصوصية','Datenschutz','Privacy')}</a><a href={LEGAL_PATHS.notice}>{t('Mentions légales','الإشعارات القانونية','Impressum','Legal notice')}</a><a href={LEGAL_PATHS.terms}>{t('Conditions d’utilisation','شروط الاستخدام','Nutzungsbedingungen','Terms of use')}</a></nav></div>
  </div></footer>;
}
