'use client';

import { useLanguage } from '@/context/LanguageContext';
import { PublicSiteFooter, PublicSiteHeader } from './PublicSiteChrome';
import { EmployersPage, TrainingCentrePage } from './marketing-pages';
import { CompanyAboutPage } from './CompanyAboutPage';

export function PublicMarketingLanding({ kind }: { kind: 'employers' | 'centre' | 'company' }) {
  const { language } = useLanguage();
  const Page = kind === 'employers' ? EmployersPage : kind === 'centre' ? TrainingCentrePage : CompanyAboutPage;
  return <div className="reference-home" dir={language === 'ar' ? 'rtl' : 'ltr'} lang={language}>
    <PublicSiteHeader locale={language}/>
    <main className="marketing-main"><Page locale={language}/></main>
    <PublicSiteFooter locale={language}/>
  </div>;
}
