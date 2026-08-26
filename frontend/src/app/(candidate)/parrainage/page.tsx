'use client';

// Page : Programme de Parrainage - Candidat (Stitch exact template)
//
// L'habillage vient de la maquette Stitch ; les données viennent de l'API
// réelle (`GET /referrals/me` via `marketplaceApi.referral`) : code de
// parrainage, filleuls inscrits et gains sont ceux du back, plus les valeurs
// figées de la maquette.

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/shared/Button';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { candidateParrainageContentFor } from '@/lib/candidateParrainageContent';
import { marketplaceApi, type ReferralMe } from '@/lib/candidateMarketplace';

/** Initiales affichées dans la pastille d'un filleul (« Yassine B. » -> « YB »). */
function initialsOf(name: string | null): string {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Le back renvoie un statut technique par inscription ; la maquette n'en
 * distingue que deux (inscrit / profil complété). Tout ce qui a dépassé la
 * simple inscription est présenté comme « profil complété ».
 */
function isCompleted(status: string): boolean {
  return status !== 'pending' && status !== 'registered';
}

export default function ParrainagePage() {
  const { language } = useLanguage();
  const content = candidateParrainageContentFor(language);
  const { token } = useAuth();
  const [copied, setCopied] = useState(false);

  const query = useQuery<ReferralMe>({
    queryKey: ['candidate-referral'],
    queryFn: () => marketplaceApi.referral(token as string),
    enabled: Boolean(token),
  });

  const referralCode = query.data?.code ?? '—';
  const registrations = query.data?.registrations ?? [];
  const registrationsCount = query.data?.registrations_count ?? 0;
  const completedCount = registrations.filter((r) => isCompleted(r.status)).length;
  // La maquette montrait une progression figée à 2/3 : on garde le palier de
  // 3 filleuls, mais la barre suit maintenant les filleuls réellement aboutis.
  const goal = 3;
  const progressPct = Math.min(100, Math.round((completedCount / goal) * 100));

  const copyCode = () => {
    if (!query.data) return;
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    if (!query.data) return;
    const text = encodeURIComponent(`${content.codeCard.shareMessagePrefix} ${referralCode}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-surface pb-24 text-onSurface">
      {/* TopAppBar Section */}
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-surface-container-high bg-surface px-1.5 shadow-subtle lg:px-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-[28px]">handshake</span>
            <span className="text-lg font-extrabold">Amud Skills</span>
          </Link>
        </div>
        <div className="h-10 w-10 overflow-hidden rounded-full border border-outline-variant">
          <img
            className="h-full w-full object-cover"
            alt={content.profileAlt}
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBd4TCaezSThyQP19dulzza0czNA9IA07iOkJPiCCWM9fUceYSCnNXpKxZYLpti03fDleRe5FLOWByB0qhO1eXPGuy8i2jOdTZ_k7QpyO_1SMPHhDC65snZVB70WWR64YwonnSkMMCjqspz54Y8O746P6yB3mnnJb42gd-Kc_v2ZosZd1h2z73_RhvNYoDp8wxO-VB3gpTKy0s4C_iyojfkMZTfD-HibdIjuiL6p2iBPfNq88ovt-a9"
          />
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6 lg:max-w-5xl lg:px-10 lg:py-8">
        {/* Welcome Header */}
        <div className="mb-6 lg:max-w-2xl">
          <h1 className="mb-1 text-2xl font-extrabold text-primary">{content.hero.title}</h1>
          <p className="text-sm leading-relaxed text-onSurface-variant">{content.hero.body}</p>
        </div>

        {query.isError && (
          <p role="alert" className="mb-6 rounded-xl border border-error/30 bg-error/10 p-4 text-sm font-medium text-error">
            Impossible de charger votre programme de parrainage.
          </p>
        )}

        <div className="lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-6">
        {/* Referral Code Card */}
        <div className="mb-6 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-subtle lg:col-start-1 lg:row-start-1 lg:mb-0">
          <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-secondary">
            {content.codeCard.eyebrow}
          </span>
          <h2 className="mb-4 text-lg font-extrabold text-onSurface">{content.codeCard.title}</h2>

          <div
            onClick={copyCode}
            className="group flex cursor-pointer items-center justify-between rounded-lg border border-outline-variant bg-surface-container p-4 transition-colors hover:border-primary"
          >
            <span className="text-2xl font-black tracking-[0.2em] text-primary">
              {query.isLoading ? '…' : referralCode}
            </span>
            <span className="material-symbols-outlined text-outline group-hover:text-primary" style={{ fontSize: 22 }}>
              content_copy
            </span>
          </div>
          {copied && <p className="mt-1 text-xs font-bold text-primary">{content.codeCard.copiedNotice}</p>}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button onClick={copyCode} disabled={!query.data} className="flex-1 text-xs shadow-sm">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                content_copy
              </span>
              {content.codeCard.copyButton}
            </Button>
            <Button
              onClick={shareWhatsApp}
              disabled={!query.data}
              className="flex-1 bg-[#25D366] text-xs text-white shadow-sm hover:enabled:bg-[#20ba5a]"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                share
              </span>
              {content.codeCard.shareButton}
            </Button>
          </div>
        </div>

        {/* QR Code Card */}
        <div className="mb-6 flex flex-col items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest p-6 text-center shadow-subtle lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:mb-0 lg:h-full lg:justify-center">
          <div className="mb-3 rounded-xl border border-outline-variant bg-white p-3 shadow-sm">
            <img
              className="h-36 w-36"
              alt={content.qrCard.alt}
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDehmNW9i40bVElibHulNmC8v8ikVC6dJNV08VB_OKbuN4vDQPJYI67o-A1zJL_E7Rgml7qMIuWf9nCq43OWj-P7BEqXafjX1uIc_cxHN_N3u6B73XTKTYGq-RjUa5wo8ZCfD-aICGMn_RuVbXtOvkK-VlcbRBUEY0Du6ZJysknfbufRj5BZ_sSoH999kOlU_77zs4hctZxaVo1NcwbLJn05QkTcHrOQiBveg3lN04vBPO_7HW_q6Yl"
            />
          </div>
          <p className="text-xs font-bold text-onSurface-variant">{content.qrCard.instructions}</p>
          <div className="mt-2 rounded-full bg-surface-container px-3 py-1">
            <span className="text-[10px] font-bold uppercase tracking-tighter text-onSurface">
              {content.qrCard.tokenLabel}: {query.isLoading ? '…' : referralCode}
            </span>
          </div>
        </div>

        {/* Progress & Stats Section */}
        <div className="mb-6 space-y-3 lg:col-start-1 lg:row-start-2 lg:mb-0">
          <div className="flex items-center gap-4 rounded-xl bg-surface-container-low p-4 text-primary shadow-subtle border border-primary/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-onPrimary">
              <span className="material-symbols-outlined text-[24px]">group</span>
            </div>
            <div>
              <h3 className="text-2xl font-black leading-none">{registrationsCount}</h3>
              <p className="text-xs font-medium opacity-90">{content.stats.referralsLabel}</p>
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-subtle">
            <div className="mb-2 flex items-end justify-between">
              <p className="text-xs font-bold text-onSurface">
                {content.stats.progressPrefix} {completedCount}/{goal}
              </p>
              <p className="text-xs font-extrabold text-secondary">{content.stats.rewardHint}</p>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container">
              <div
                className="h-full rounded-full bg-secondary transition-all duration-1000"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filleuls List Section */}
        <div className="mb-6 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-subtle lg:col-span-2 lg:mt-6 lg:mb-0">
          <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
            <h3 className="text-sm font-extrabold text-onSurface">{content.list.title}</h3>
            <span className="material-symbols-outlined text-outline" style={{ fontSize: 18 }}>
              filter_list
            </span>
          </div>
          <div className="divide-y divide-outline-variant">
            {query.isLoading && (
              <p className="p-4 text-sm text-onSurface-variant">Chargement…</p>
            )}
            {!query.isLoading && registrations.length === 0 && (
              <p className="p-4 text-sm text-onSurface-variant">
                Aucun filleul pour l’instant — partagez votre code pour commencer.
              </p>
            )}
            {registrations.map((registration) => {
              const completed = isCompleted(registration.status);
              return (
                <div
                  key={registration.id}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-surface-container-low"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high font-bold text-primary">
                      {initialsOf(registration.candidate_name)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-onSurface">
                        {registration.candidate_name ?? 'Filleul'}
                      </p>
                      <p className="text-xs text-onSurface-variant">
                        {new Date(registration.registered_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  {completed ? (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      {content.list.statusProfileCompleted}
                    </span>
                  ) : (
                    <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold text-onSurface-variant">
                      {content.list.statusRegistered}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        </div>

        {/* Primary Footer Action */}
        <div className="flex flex-col items-center gap-2 pt-2">
          {query.data && (
            <p className="text-xs font-bold text-onSurface-variant">
              {query.data.earnings.owed.toLocaleString('fr-FR')} {query.data.earnings.currency} en attente ·{' '}
              {query.data.earnings.paid.toLocaleString('fr-FR')} {query.data.earnings.currency} versés
            </p>
          )}
          <Button pill className="px-8 shadow-md">
            {content.footer.viewRewards}
          </Button>
        </div>
      </main>
    </div>
  );
}
