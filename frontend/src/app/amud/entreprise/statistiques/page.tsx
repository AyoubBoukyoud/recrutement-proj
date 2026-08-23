'use client';

import { useMemo, useState } from 'react';
import { CountUp } from '@/components/amud/ui';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { offresCollection } from '@/lib/amud/localOffres';
import { offresSeed } from '@/data/amud/offres';
import { applicationsCollection } from '@/lib/amud/localApplications';
import { applicationsSeed } from '@/data/amud/applications';
import { interviewsCollection } from '@/lib/amud/localInterviews';
import { interviewsSeed } from '@/data/amud/interviews';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';

function daysBetween(a: string, b: string): number {
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24)));
}

export default function AmudEntrepriseStatistiquesPage() {
  const [offres] = useCollection(offresCollection, offresSeed);
  const [applications] = useCollection(applicationsCollection, applicationsSeed);
  const [interviews] = useCollection(interviewsCollection, interviewsSeed);
  const [selectedOfferId, setSelectedOfferId] = useState('');

  const myOffres = useMemo(() => offres.filter((o) => o.entrepriseId === CURRENT_EMPLOYER.entrepriseId), [offres]);
  const myApplications = useMemo(() => applications.filter((a) => a.entrepriseId === CURRENT_EMPLOYER.entrepriseId), [applications]);
  const myInterviews = useMemo(() => interviews.filter((i) => i.entrepriseId === CURRENT_EMPLOYER.entrepriseId), [interviews]);

  const stats = useMemo(() => {
    const published = myOffres.filter((o) => o.statut === 'Publiée' || o.statut === 'Expirée' || o.statut === 'En pause' || o.statut === 'Archivée').length;
    const totalViews = myOffres.reduce((sum, o) => sum + (o.vues ?? 0), 0);
    const hires = myApplications.filter((a) => a.status === 'ACCEPTED');
    const rejections = myApplications.filter((a) => a.status === 'REJECTED').length;
    const conversion = myApplications.length > 0 ? Math.round((hires.length / myApplications.length) * 100) : 0;
    const avgApplicationsPerOffer = myOffres.length > 0 ? Math.round((myApplications.length / myOffres.length) * 10) / 10 : 0;
    const timeToHireDays = hires.length > 0 ? Math.round(hires.reduce((sum, a) => sum + daysBetween(a.createdAt, a.updatedAt), 0) / hires.length) : 0;
    return {
      published,
      totalApplications: myApplications.length,
      totalViews,
      totalInterviews: myInterviews.length,
      hires: hires.length,
      rejections,
      conversion,
      avgApplicationsPerOffer,
      timeToHireDays,
    };
  }, [myOffres, myApplications, myInterviews]);

  const selectedOffer = myOffres.find((o) => o.id === selectedOfferId);
  const offerFunnel = useMemo(() => {
    if (!selectedOffer) return null;
    const offerApplications = myApplications.filter((a) => a.offerId === selectedOffer.id);
    const counts = { screening: 0, interview: 0, shortlist: 0, accepted: 0, rejected: 0 };
    for (const a of offerApplications) {
      if (a.status === 'SCREENING') counts.screening += 1;
      if (a.status === 'INTERVIEW') counts.interview += 1;
      if (a.status === 'SHORTLIST') counts.shortlist += 1;
      if (a.status === 'ACCEPTED') counts.accepted += 1;
      if (a.status === 'REJECTED') counts.rejected += 1;
    }
    const conversion = offerApplications.length > 0 ? Math.round((counts.accepted / offerApplications.length) * 100) : 0;
    return { vues: selectedOffer.vues ?? 0, applications: offerApplications.length, ...counts, conversion };
  }, [selectedOffer, myApplications]);

  const KPIS = [
    { label: 'Offres publiées', value: stats.published, icon: 'work' },
    { label: 'Candidatures', value: stats.totalApplications, icon: 'assignment' },
    { label: 'Vues cumulées', value: stats.totalViews, icon: 'visibility' },
    { label: 'Entretiens', value: stats.totalInterviews, icon: 'event' },
    { label: 'Recrutements', value: stats.hires, icon: 'check_circle' },
    { label: 'Refus', value: stats.rejections, icon: 'cancel' },
  ];

  return (
    <div>
      <div className="mb-lg">
        <h2 className="text-headline-lg text-amud-on-surface">Statistiques</h2>
        <p className="mt-1 text-body-md text-amud-on-surface-variant">Performance de recrutement de {CURRENT_EMPLOYER.entrepriseNom}.</p>
      </div>

      <div className="mb-lg grid grid-cols-2 gap-md md:grid-cols-3 lg:grid-cols-6">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md">
            <span className="material-symbols-outlined text-amud-primary">{k.icon}</span>
            <div className="mt-1 text-headline-md font-bold text-amud-on-surface">
              <CountUp value={k.value} />
            </div>
            <div className="text-label-sm text-amud-on-surface-variant">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-lg grid grid-cols-1 gap-md sm:grid-cols-3">
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
          <div className="text-headline-md font-bold text-amud-primary">{stats.conversion}%</div>
          <div className="text-label-sm text-amud-on-surface-variant">Taux de conversion global</div>
        </div>
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
          <div className="text-headline-md font-bold text-amud-primary">{stats.avgApplicationsPerOffer}</div>
          <div className="text-label-sm text-amud-on-surface-variant">Candidatures / offre en moyenne</div>
        </div>
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
          <div className="text-headline-md font-bold text-amud-primary">{stats.timeToHireDays} j</div>
          <div className="text-label-sm text-amud-on-surface-variant">Délai moyen de recrutement</div>
        </div>
      </div>

      <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
        <h3 className="mb-md text-title-lg text-amud-on-surface">Détail par offre</h3>
        <select value={selectedOfferId} onChange={(e) => setSelectedOfferId(e.target.value)} className="mb-md w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary sm:max-w-sm">
          <option value="">Sélectionner une offre</option>
          {myOffres.map((o) => (
            <option key={o.id} value={o.id}>
              {o.titre}
            </option>
          ))}
        </select>
        {offerFunnel ? (
          <div className="grid grid-cols-2 gap-md sm:grid-cols-4 lg:grid-cols-7">
            {[
              { label: 'Vues', value: offerFunnel.vues },
              { label: 'Candidatures', value: offerFunnel.applications },
              { label: 'Présélection', value: offerFunnel.screening },
              { label: 'Entretien', value: offerFunnel.interview },
              { label: 'Shortlist', value: offerFunnel.shortlist },
              { label: 'Acceptées', value: offerFunnel.accepted },
              { label: 'Refusées', value: offerFunnel.rejected },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-amud-outline-variant bg-amud-surface p-sm text-center">
                <div className="text-title-lg font-bold text-amud-on-surface">{s.value}</div>
                <div className="text-label-sm text-amud-on-surface-variant">{s.label}</div>
              </div>
            ))}
            <div className="col-span-2 rounded-lg border border-amud-outline-variant bg-amud-surface p-sm text-center sm:col-span-4 lg:col-span-7">
              <span className="text-label-md text-amud-on-surface-variant">Conversion vues → recrutement : </span>
              <span className="text-label-md font-bold text-amud-primary">{offerFunnel.conversion}%</span>
            </div>
          </div>
        ) : (
          <p className="text-label-md text-amud-on-surface-variant">Sélectionnez une offre pour voir son détail.</p>
        )}
      </div>

    </div>
  );
}
