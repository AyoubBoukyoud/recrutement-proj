'use client';

// Page : Offres d'emploi - Candidat (Stitch exact template)

import Link from 'next/link';
import { Button, IconButton } from '@/components/shared/Button';
import { useState } from 'react';

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

export default function OffresPage() {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Tous');

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div className="min-h-screen bg-surface pb-24 text-onSurface">
      {/* TopAppBar */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-4 shadow-subtle lg:px-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-full border border-outline-variant">
            <img
              className="h-full w-full object-cover"
              alt="Profil Candidat"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPqRi7uOfHx4qDLV3jcEYoiF5AeUAPOc9qwHNBwrI3wC8MvbITgV3g32wcLhQlFGqGBuuxUGOv12XjyPxoXY7ZZJiaFzsICmrDZN57TVLXDlqjl3_eI3sDYP_kGv3aG47XF1zb1DuuqDlgMeTYavqAUHjR15B-aeEAqM-bnUplCp6qX_HuelHwo1wJPJCEq8Jm1oZU2JOxIk1duMeR6GmVR9HUmXijT09cjIn0dUaJ5hcxHwYu9Rof"
            />
          </div>
          <h1 className="text-lg font-extrabold text-primary">Amud Careers</h1>
        </div>
        <IconButton variant="ghost" aria-label="Notifications">
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
            notifications
          </span>
        </IconButton>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6 lg:max-w-6xl lg:px-10 lg:py-8">
        {/* Header & Search */}
        <div className="mb-6 lg:max-w-xl">
          <h2 className="mb-3 text-2xl font-extrabold text-primary">Offres pour vous</h2>
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline" aria-hidden="true" style={{ fontSize: 20 }}>
              search
            </span>
            <label htmlFor="offres-search" className="sr-only">Rechercher un métier ou une ville</label>
            <input
              id="offres-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un métier ou une ville..."
              className="w-full rounded-xl border border-outline bg-surface-container-lowest py-3 pl-12 pr-4 text-sm font-semibold text-onSurface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
            />
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 lg:flex-wrap lg:overflow-visible">
          <Button
            variant={selectedFilter === 'Tous' ? 'primary' : 'outline'}
            size="sm"
            pill
            onClick={() => setSelectedFilter('Tous')}
            aria-pressed={selectedFilter === 'Tous'}
            className="shrink-0 gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              tune
            </span>
            <span>Filtres</span>
          </Button>
          <div className="h-6 w-px shrink-0 bg-outline-variant" />
          {['Santé', 'Électricité', 'Hôtellerie', 'Logistique', 'Disponibilité immédiate'].map((filter) => (
            <Button
              key={filter}
              variant={selectedFilter === filter ? 'primary' : 'outline'}
              size="sm"
              pill
              onClick={() => setSelectedFilter(filter)}
              aria-pressed={selectedFilter === filter}
              className="shrink-0 whitespace-nowrap"
            >
              {filter}
            </Button>
          ))}
        </div>

        {/* Jobs Grid/List */}
        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0 xl:grid-cols-3">
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
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite(job.id)}
                      aria-pressed={isFav}
                      aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      className={isFav ? 'text-secondary-dark' : 'text-outline hover:enabled:text-secondary-dark'}
                    >
                      <span className={`material-symbols-outlined ${isFav ? 'fill' : ''}`} style={{ fontSize: 22 }}>
                        favorite
                      </span>
                    </IconButton>
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

                <Button
                  variant="secondary"
                  fullWidth
                  className="text-xs font-extrabold uppercase tracking-wider shadow-sm"
                >
                  Je suis intéressé
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    arrow_forward
                  </span>
                </Button>
              </div>
            );
          })}
        </div>

        {/* Featured Banner */}
        <div className="relative mt-8 overflow-hidden rounded-2xl bg-primary p-6 text-onPrimary shadow-lg">
          <div className="relative z-10">
            <h3 className="mb-2 text-xl font-extrabold">Booster votre visibilité</h3>
            <p className="mb-4 text-xs leading-relaxed text-onPrimary/90">
              Complétez votre profil à 100% pour apparaître en priorité auprès des recruteurs allemands.
            </p>
            <Link
              href="/visibilite"
              className="inline-block rounded-lg bg-onPrimary px-5 py-2.5 text-xs font-extrabold text-primary transition-colors hover:bg-surface-container-low"
            >
              Optimiser mon profil
            </Link>
          </div>
          <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-[120px] text-onPrimary/10 pointer-events-none">
            trending_up
          </span>
        </div>
      </main>
    </div>
  );
}
