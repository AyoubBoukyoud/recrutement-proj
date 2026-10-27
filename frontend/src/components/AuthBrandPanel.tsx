'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

function BrandChip() {
  const { t } = useLanguage();
  return (
    <Link href="/" aria-label={t('auth_brand_home')} className="inline-flex items-center gap-2 rounded-full bg-surface-container-lowest py-2 pe-4 ps-2 shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
      {/* eslint-disable-next-line @next/next/no-img-element -- small, pre-sized brand mark */}
      <img src="/assets/images/logo-mark.png" alt="" className="h-7 w-7 object-contain" />
      <span className="text-sm font-extrabold text-primary">AMUD Skills</span>
    </Link>
  );
}

/** Shared photo-free branding throughout phone and OTP authentication. */
export function AuthBrandPanel() {
  const { t } = useLanguage();
  return (
    <aside className="relative hidden overflow-hidden border-e border-outline-variant bg-gradient-to-br from-primary-light via-surface-container-low to-surface lg:sticky lg:top-0 lg:flex lg:h-[100dvh] lg:flex-col lg:justify-between lg:p-10 xl:p-12">
      <div aria-hidden="true" className="pointer-events-none absolute -end-40 top-1/4 h-[32rem] w-[32rem] rounded-full border-[70px] border-primary/5" />
      <div className="relative self-start"><BrandChip /></div>
      <div className="relative my-12 max-w-xl">
        <div aria-hidden="true" className="mb-8 flex gap-3">
          {['person', 'business_center', 'school'].map((icon) => <span key={icon} className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/10 bg-surface-container-lowest text-primary shadow-sm"><span className="material-symbols-outlined">{icon}</span></span>)}
        </div>
        <p className="text-[2rem] font-extrabold leading-[1.15] tracking-tight text-primary xl:text-[2.75rem]">
          <span className="block">{t('auth_brand_title')}</span>
          <span className="mt-2 block text-onSurface">{t('auth_brand_title_2')}</span>
        </p>
        <p className="mt-6 text-base leading-relaxed text-onSurface-variant">{t('auth_brand_ecosystem')}</p>
      </div>
      <p className="relative flex items-center gap-2 text-xs font-semibold text-onSurface-variant">
        <span className="material-symbols-outlined text-primary" aria-hidden="true" style={{ fontSize: 18 }}>lock</span>
        {t('auth_brand_secure')}
      </p>
    </aside>
  );
}

export function AuthBrandBanner() {
  return (
    <div className="shrink-0 border-b border-outline-variant bg-gradient-to-br from-primary-light to-surface px-6 pb-6 pt-20 lg:hidden">
      <BrandChip />
    </div>
  );
}
