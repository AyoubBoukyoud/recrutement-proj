'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

/**
 * Colonne de marque des écrans de connexion, à partir de `lg` : une vraie
 * photo du parcours (les métiers de la santé, premier secteur recruté) et la
 * promesse de la page d'accueil, mot pour mot. Sous `lg`, l'écran reste une
 * colonne unique et la page affiche le même visuel en bandeau
 * (`AuthBrandBanner`).
 *
 * Images pré-dimensionnées et non optimisées, comme sur la page d'accueil.
 */

const PHOTO = '/landing-assets/careers/nurses';

function BrandChip() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-surface-container-lowest py-1.5 pe-3.5 ps-2 shadow-soft">
      {/* eslint-disable-next-line @next/next/no-img-element -- logo bitmap déjà dimensionné */}
      <img src="/assets/images/logo-mark.png" alt="" className="h-6 w-6 object-contain" />
      <span className="text-sm font-extrabold text-primary">AMUD Skills</span>
    </span>
  );
}

export function AuthBrandPanel() {
  const { t } = useLanguage();

  return (
    <aside className="relative hidden overflow-hidden lg:sticky lg:top-0 lg:flex lg:h-[100dvh] lg:flex-col lg:justify-between lg:p-10 xl:p-12">
      {/* eslint-disable-next-line @next/next/no-img-element -- variantes déjà dimensionnées, cf. page d'accueil */}
      <img
        src={`${PHOTO}-desktop.webp`}
        srcSet={`${PHOTO}-desktop.webp 1400w, ${PHOTO}.webp 1440w`}
        sizes="1400px"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[35%_center]"
      />
      {/* Voile : le texte blanc garde son contraste quelle que soit la photo. */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />

      <Link href="/" className="relative self-start rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface">
        <BrandChip />
        <span className="sr-only">{t('auth_brand_home')}</span>
      </Link>

      <div className="relative max-w-2xl">
        {/* Une phrase par ligne : coupées au hasard, les deux promesses se lisaient mal. */}
        <p className="text-[2rem] font-extrabold leading-[1.1] tracking-tight text-white xl:text-[2.5rem]">
          <span className="block">{t('auth_brand_title')}</span>
          <span className="block text-white/70">{t('auth_brand_title_2')}</span>
        </p>
        <p className="mt-5 flex items-start gap-2.5 text-base leading-relaxed text-white/85">
          <span className="material-symbols-outlined mt-0.5 shrink-0" aria-hidden="true" style={{ fontSize: 20 }}>
            check_circle
          </span>
          {t('auth_brand_note')}
        </p>
      </div>
    </aside>
  );
}

/** Le même visuel et la même promesse en bandeau, pour les écrans sous `lg`. */
export function AuthBrandBanner() {
  const { t } = useLanguage();

  return (
    <div className="relative h-56 shrink-0 overflow-hidden lg:hidden">
      {/* eslint-disable-next-line @next/next/no-img-element -- variantes déjà dimensionnées, cf. page d'accueil */}
      <img
        src={`${PHOTO}-tablet.webp`}
        srcSet={`${PHOTO}-mobile.webp 460w, ${PHOTO}-tablet.webp 800w, ${PHOTO}-desktop.webp 1400w`}
        sizes="100vw"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[45%_30%]"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/25" />
      <div className="absolute inset-x-6 bottom-5">
        <BrandChip />
        <p className="mt-3 text-lg font-extrabold leading-snug tracking-tight text-white">
          <span className="block">{t('auth_brand_title')}</span>
          <span className="block text-white/75">{t('auth_brand_title_2')}</span>
        </p>
      </div>
    </div>
  );
}
