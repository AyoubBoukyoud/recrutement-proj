'use client';

// Page : Offres d'emploi - Candidat (Stitch exact template)

import Link from 'next/link';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { WithPageSkeleton } from '@/components/shared/SkeletonLoader';

const JOB_OFFERS = [
  {
    id: 1,
    title: 'Infirmier Qualifié',
    company: 'Klinik Berlin',
    companyIcon: 'domain',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC65RZFkMIBKkDR_PCnqKHbnzk61gQRYHCw7Z5yMbyZwLKvMFDlzm_lCJRW5RZWCnY0Ftj-odI4LZGUntAM__NVLIP73ra80OXakvbyi0szbEaksiRxkcN7krxhPSeymAfNct5jAq_ZZXEUPo_0_jj-ObpOYrf0EhNXRudem0hZXkV4JAYovH62hJ0smPz2iPwrzLj67SF4ADw3IXop13sBXA-OvOovGiaALwYHlRfXnCffbcayNDgO',
    location: 'Berlin, Allemagne',
    salary: '3 200€ - 3 800€ / mois',
    badges: [
      { text: 'B1 requis', type: 'secondary' },
      { text: 'Plein temps', type: 'neutral' },
    ],
  },
  {
    id: 2,
    title: 'Réceptionniste',
    company: 'Hôtel München',
    companyIcon: 'hotel',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlK-c7eR7aVuA_zB0GwvOMQRcj0YxsFFcn6W4X8TY048VMvaVGP9JQE48FgpTXsygtKauIDLEGNCtoaMcdD-_v5AwZUWrCULMtjwy-hBPBT-J_wAGpWOjRnOaJpAVgM7LkIx8oD4glmmZeZiP2vMBGCD5WiZ2Ka1be6wUJA3n3PwsdDFDvE5XpolUw15GpyPXf_lJYoWMAPpX3ynilz7UKqVh6vZ_3gwU3VRhffijwOrwOY_VRrvAb',
    location: 'Munich, Allemagne',
    salary: '2 400€ - 2 900€ / mois',
    badges: [
      { text: 'B2 recommandé', type: 'tertiary' },
      { text: 'CDI', type: 'neutral' },
    ],
  },
  {
    id: 3,
    title: 'Électricien de Bâtiment',
    company: 'Elektro Gmbh',
    companyIcon: 'bolt',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBEKk99eeOD6vMgi8ElDVzQmQEyKR8BsZG7jJ2hXuQHjATwxNTbnfz_K2BUB7s42Q5HYlKSnB91UZEOCwNgzHghGzGsu9PRFZtv9aroDTaVytPI8HIQzL5nIlPmzCP_2VGXXPwNami5_7RfkZlMkXBjc6I0hIruAeHfiZn_GhTPbHsuLHMfndjwi88-s80B5vBE8Al4qVVq51Bfpy9ourTj5wNOSx8O9zL_nT2SrZ-8QBieChDqtgEc',
    location: 'Hamburg, Allemagne',
    salary: '3 000€ - 3 500€ / mois',
    badges: [
      { text: 'B1 requis', type: 'secondary' },
      { text: 'Déplacement', type: 'neutral' },
    ],
  },
  {
    id: 4,
    title: 'Chauffeur PL',
    company: 'Logistik Nord',
    companyIcon: 'local_shipping',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5Ynm3VoRzox7o4i61rcTC40ekLq52XJnr5_lMIZafa3q_1VJywVQip2XkGJjoqhNRThO4rIDPChxdU-Hf4MBuwMaNPEcoLBr2_JwKx0fuBrYRpxGMgHEcELgrPt1i70J0krQ5UTuLpoDnmqhg5V2TbTQPdGdsfVfXyUelt4kqW2KTjry_LU5VFtxaEjne3bITKC0p1Nf7LJDjIaBruyO3P7fZBPXIRGC0NL_3sv8ij9F8WfSdRpiL',
    location: 'Frankfurt, Allemagne',
    salary: '2 800€ - 3 200€ / mois',
    badges: [
      { text: 'A2 suffisant', type: 'neutral' },
      { text: 'Urgent', type: 'urgent' },
    ],
  },
];

const FILTERS = ['Santé', 'Électricité', 'Hôtellerie', 'Logistique', 'Disponibilité immédiate'];
const FILTER_LABEL_KEYS: Record<string, string> = {
  'Santé': 'sante',
  'Électricité': 'electricite',
  'Hôtellerie': 'hotellerie',
  'Logistique': 'logistique',
  'Disponibilité immédiate': 'disponibiliteImmediate',
};

export default function OffresPage() {
  const { t } = useLanguage();
  const [favorites, setFavorites] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Tous');

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <WithPageSkeleton layout="list">
    <div className="min-h-screen bg-surface pb-24 text-onSurface">
      {/* TopAppBar */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-4 shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-full border border-outline-variant">
            <img
              className="h-full w-full object-cover"
              alt={t('candidateD:offres.header.profileAlt')}
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPqRi7uOfHx4qDLV3jcEYoiF5AeUAPOc9qwHNBwrI3wC8MvbITgV3g32wcLhQlFGqGBuuxUGOv12XjyPxoXY7ZZJiaFzsICmrDZN57TVLXDlqjl3_eI3sDYP_kGv3aG47XF1zb1DuuqDlgMeTYavqAUHjR15B-aeEAqM-bnUplCp6qX_HuelHwo1wJPJCEq8Jm1oZU2JOxIk1duMeR6GmVR9HUmXijT09cjIn0dUaJ5hcxHwYu9Rof"
            />
          </div>
          <h1 className="text-lg font-extrabold text-primary">Amud Careers</h1>
        </div>
        <button
          type="button"
          aria-label={t('candidateD:offres.header.notifications')}
          className="rounded-full p-2 text-onSurface-variant hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
            notifications
          </span>
        </button>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6">
        {/* Header & Search */}
        <div className="mb-6">
          <h2 className="mb-3 text-2xl font-extrabold text-primary">{t('candidateD:offres.title')}</h2>
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: 20 }}>
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('candidateD:offres.searchPlaceholder')}
              className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest py-3 pl-12 pr-4 text-sm font-semibold text-onSurface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
            />
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setSelectedFilter('Tous')}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all shadow-sm ${
              selectedFilter === 'Tous' ? 'bg-primary text-onPrimary' : 'border border-outline-variant bg-surface-container-lowest text-onSurface'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              tune
            </span>
            <span>{t('candidateD:offres.filtersButton')}</span>
          </button>
          <div className="h-6 w-px shrink-0 bg-outline-variant" />
          {FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setSelectedFilter(filter)}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold whitespace-nowrap transition-colors ${
                selectedFilter === filter
                  ? 'border-primary bg-surface-container-low text-primary'
                  : 'border-outline-variant bg-surface-container-lowest text-onSurface hover:bg-surface-container-high'
              }`}
            >
              {t(`candidateD:offres.filters.${FILTER_LABEL_KEYS[filter]}`)}
            </button>
          ))}
        </div>

        {/* Jobs Grid/List */}
        <div className="space-y-4">
          {JOB_OFFERS.map((job) => {
            const isFav = favorites.includes(job.id);
            return (
              <div
                key={job.id}
                className="flex flex-col justify-between rounded-xl border border-outline-variant border-l-4 border-l-primary bg-surface-container-lowest p-5 shadow-subtle transition-all duration-200 hover:-translate-y-1"
              >
                <div>
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-outline-variant bg-surface-container-high p-1">
                        <img className="h-10 w-10 object-contain" alt={job.company} src={job.logo} />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-onSurface">{job.title}</h3>
                        <p className="flex items-center gap-1 text-xs font-semibold text-onSurface-variant mt-0.5">
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                            {job.companyIcon}
                          </span>{' '}
                          {job.company}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(job.id)}
                      className={`p-1 transition-colors ${isFav ? 'text-secondary' : 'text-outline hover:text-secondary'}`}
                    >
                      <span className={`material-symbols-outlined ${isFav ? 'fill' : ''}`} style={{ fontSize: 22 }}>
                        favorite
                      </span>
                    </button>
                  </div>

                  <div className="mb-5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-onSurface-variant">
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>
                        location_on
                      </span>
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-onSurface-variant">
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>
                        payments
                      </span>
                      <span className="font-extrabold text-onSurface">{job.salary}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {job.badges.map((badge, idx) => (
                        <span
                          key={idx}
                          className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${
                            badge.type === 'secondary'
                              ? 'bg-secondary/20 text-tertiary'
                              : badge.type === 'tertiary'
                              ? 'bg-gold/20 text-tertiary'
                              : badge.type === 'urgent'
                              ? 'bg-error/15 text-error'
                              : 'bg-surface-container-high text-onSurface-variant'
                          }`}
                        >
                          {badge.text}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold py-3 text-xs font-extrabold uppercase tracking-wider text-onGold shadow-sm transition-all hover:brightness-95 active:scale-[0.98]"
                >
                  {t('candidateD:offres.interested')}
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    arrow_forward
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Featured Banner */}
        <div className="relative mt-8 overflow-hidden rounded-2xl bg-primary p-6 text-onPrimary shadow-lg">
          <div className="relative z-10">
            <h3 className="mb-2 text-xl font-extrabold">{t('candidateD:offres.banner.title')}</h3>
            <p className="mb-4 text-xs leading-relaxed text-onPrimary/90">
              {t('candidateD:offres.banner.description')}
            </p>
            <Link
              href="/visibilite"
              className="inline-block rounded-lg bg-onPrimary px-5 py-2.5 text-xs font-extrabold text-primary transition-colors hover:bg-surface-container-low"
            >
              {t('candidateD:offres.banner.cta')}
            </Link>
          </div>
          <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-[120px] text-onPrimary/10 pointer-events-none">
            trending_up
          </span>
        </div>
      </main>
    </div>
    </WithPageSkeleton>
  );
}
