'use client';

import { useLanguage } from '@/context/LanguageContext';
import { PublicSiteFooter, PublicSiteHeader } from './PublicSiteChrome';
import { EmployersPage, TrainingCentrePage } from './marketing-pages';
import { CompanyAboutPage } from './CompanyAboutPage';
import { StartupProfilePage } from './StartupProfilePage';
import { LandingScrollReveal } from './LandingMotion';

export function PublicMarketingLanding({ kind }: { kind: 'employers' | 'centre' | 'company' | 'startup' }) {
  const { language } = useLanguage();
  const Page = kind === 'employers' ? EmployersPage : kind === 'centre' ? TrainingCentrePage : kind === 'startup' ? StartupProfilePage : CompanyAboutPage;
  return <div className="reference-home" data-landing-motion-scope dir={language === 'ar' ? 'rtl' : 'ltr'} lang={language}>
    <LandingScrollReveal/>
    <PublicSiteHeader locale={language}/>
    <main id="main-content" tabIndex={-1} className="marketing-main"><Page locale={language}/></main>
    <PublicSiteFooter locale={language}/>
  </div>;
}
