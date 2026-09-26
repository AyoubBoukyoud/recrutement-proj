'use client';

import { useLanguage } from '@/context/LanguageContext';
import { PublicSiteFooter, PublicSiteHeader } from './PublicSiteChrome';
import { EmployersPage, TrainingCentrePage } from './marketing-pages';

export function PublicMarketingLanding({ kind }: { kind: 'employers' | 'centre' }) {
  const { language } = useLanguage();
  const Page = kind === 'employers' ? EmployersPage : TrainingCentrePage;
  return <div className="reference-home" dir={language === 'ar' ? 'rtl' : 'ltr'} lang={language}>
    <PublicSiteHeader locale={language}/>
    <main className="marketing-main"><Page locale={language}/></main>
    <PublicSiteFooter locale={language}/>
  </div>;
}
