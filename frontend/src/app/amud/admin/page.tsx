'use client';

import Link from 'next/link';
import { commerciaux as commerciauxSeed } from '@/data/amud/commerciaux';
import { commerciauxCollection } from '@/lib/amud/localCommerciaux';
import { candidatesSeed } from '@/data/amud/candidates';
import { candidatesCollection } from '@/lib/amud/localCandidates';
import { recruitersSeed } from '@/data/amud/recruiters';
import { recruitersCollection } from '@/lib/amud/localRecruiters';
import { offresSeed } from '@/data/amud/offres';
import { offresCollection } from '@/lib/amud/localOffres';
import { activitesSeed } from '@/data/amud/commercialActivites';
import { activitesCollection } from '@/lib/amud/localCommercialActivites';
import { buildSeedRdvs } from '@/data/amud/commercialRdv';
import { rendezVousCollection } from '@/lib/amud/localRendezVous';
import { notificationsSeed } from '@/data/amud/notifications';
import { notifications as notificationsCollection } from '@/lib/amud/storage/notify';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { CountUp } from '@/components/amud/ui';
import { centresCollection } from '@/lib/amud/localCentres';
import { centresSeed } from '@/data/amud/centres';
import { centerStudentsCollection } from '@/lib/amud/localCenterStudents';
import { centerStudentsSeed } from '@/data/amud/centerStudents';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';
import { centerGroupsCollection } from '@/lib/amud/localCenterGroups';
import { centerGroupsSeed } from '@/data/amud/centerGroups';
import { auditLogs } from '@/lib/amud/storage/audit';
import { auditLogSeed } from '@/data/amud/auditLog';

function todayFr() {
  return new Date().toLocaleDateString('fr-FR');
}
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/** `/amud/admin` — tableau de bord (doc5: tableau_de_bord_administrateur_amud_skills.html). */
export default function AmudAdminDashboardPage() {
  const [commerciaux] = useCollection(commerciauxCollection, commerciauxSeed);
  const [candidates] = useCollection(candidatesCollection, candidatesSeed);
  const [recruiters] = useCollection(recruitersCollection, recruitersSeed);
  const [offres] = useCollection(offresCollection, offresSeed);
  const [activites] = useCollection(activitesCollection, activitesSeed);
  const [rdvs] = useCollection(rendezVousCollection, buildSeedRdvs());
  const [allNotifications] = useCollection(notificationsCollection, notificationsSeed);
  const [centres] = useCollection(centresCollection, centresSeed);
  const [centerStudents] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [centerTeachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [centerFormations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [centerGroups] = useCollection(centerGroupsCollection, centerGroupsSeed);
  const [auditEntries] = useCollection(auditLogs, auditLogSeed);

  const leaderboard = [...commerciaux]
    .sort((a, b) => b.realiseMensuel / b.objectifMensuel - a.realiseMensuel / a.objectifMensuel)
    .slice(0, 4);

  const appelsAuj = activites.filter((a) => a.type === 'Appel' && a.date === todayFr());
  const tauxReponse = appelsAuj.length > 0 ? Math.round((appelsAuj.filter((a) => a.resultat === 'Répondu' || a.resultat === 'Positif').length / appelsAuj.length) * 100) : 0;
  const rdvsAuj = rdvs.filter((r) => r.date === todayIso());

  const alertes = [...allNotifications.filter((n) => n.scope === 'admin')]
    .sort((a, b) => Number(a.read) - Number(b.read) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const kpis = [
    { label: 'Total candidats', value: candidates.length, icon: 'group', accent: 'bg-amud-primary' },
    { label: 'Total recruteurs', value: recruiters.length, icon: 'badge', accent: 'bg-amud-primary' },
    { label: 'Total commerciaux', value: commerciaux.length, icon: 'support_agent', accent: 'bg-amud-tertiary-container' },
    { label: 'Offres actives', value: offres.filter((o) => o.statut === 'Publiée').length, icon: 'work', accent: 'bg-amud-tertiary-container' },
  ];

  const centreKpis = [
    { label: 'Total centres', value: centres.length, icon: 'school', accent: 'bg-amud-primary' },
    { label: 'Centres actifs', value: centres.filter((c) => c.statut === 'Actif').length, icon: 'check_circle', accent: 'bg-amud-primary-container' },
    { label: 'En négociation', value: centres.filter((c) => c.partnershipStatus === 'NEGOCIATION' || c.partnershipStatus === 'ESSAI').length, icon: 'handshake', accent: 'bg-amud-tertiary-container' },
    { label: 'Suspendus', value: centres.filter((c) => c.partnershipStatus === 'SUSPENDU' || c.partnershipStatus === 'EXPIRE').length, icon: 'pause_circle', accent: 'bg-amud-error' },
    { label: 'Étudiants (centres)', value: centerStudents.length, icon: 'group', accent: 'bg-amud-primary' },
    { label: 'Enseignants (centres)', value: centerTeachers.length, icon: 'cast_for_education', accent: 'bg-amud-primary' },
    { label: 'Formations (centres)', value: centerFormations.length, icon: 'menu_book', accent: 'bg-amud-tertiary-container' },
    { label: 'Groupes (centres)', value: centerGroups.length, icon: 'diversity_3', accent: 'bg-amud-tertiary-container' },
  ];

  const centreActivity = [...auditEntries]
    .filter((l) => !!l.centerId)
    .sort((a, b) => `${b.date} ${b.heure}`.localeCompare(`${a.date} ${a.heure}`))
    .slice(0, 5);

  return (
    <div>
      <div className="mb-xl flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="mb-sm text-headline-lg font-semibold text-amud-on-surface">Bonjour, Administrateur 👋</h2>
          <p className="text-body-lg text-amud-on-surface-variant">Voici un aperçu de l&apos;activité de votre plateforme.</p>
        </div>
        <div className="flex gap-sm">
          <Link
            href="/amud/admin/candidatures"
            className="rounded-lg bg-amud-primary px-lg py-sm text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark"
          >
            Ajouter un candidat
          </Link>
          <Link
            href="/amud/admin/offres"
            className="rounded-lg border border-amud-primary px-lg py-sm text-label-md font-medium text-amud-primary shadow-sm transition-colors hover:bg-amud-surface-container-low"
          >
            Ajouter une offre
          </Link>
        </div>
      </div>

      <div className="mb-xl grid grid-cols-2 gap-lg lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <div
            key={kpi.label}
            style={{ animationDelay: `${i * 60}ms` }}
            className="relative overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm animate-amud-rise-in"
          >
            <div className={`absolute bottom-0 left-0 top-0 w-1 ${kpi.accent}`} />
            <div className="mb-md flex items-start justify-between">
              <div className="text-label-md text-amud-on-surface-variant">{kpi.label}</div>
              <span className="material-symbols-outlined text-amud-primary">{kpi.icon}</span>
            </div>
            <div className="flex items-baseline gap-sm">
              <div className="text-headline-lg text-amud-on-surface">
                <CountUp value={kpi.value} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-xl">
        <h3 className="mb-md text-title-lg text-amud-on-surface">Centres de formation</h3>
        <div className="grid grid-cols-2 gap-lg lg:grid-cols-4">
          {centreKpis.map((kpi, i) => (
            <div
              key={kpi.label}
              style={{ animationDelay: `${i * 60}ms` }}
              className="relative overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm animate-amud-rise-in"
            >
              <div className={`absolute bottom-0 left-0 top-0 w-1 ${kpi.accent}`} />
              <div className="mb-md flex items-start justify-between">
                <div className="text-label-md text-amud-on-surface-variant">{kpi.label}</div>
                <span className="material-symbols-outlined text-amud-primary">{kpi.icon}</span>
              </div>
              <div className="text-headline-lg text-amud-on-surface">
                <CountUp value={kpi.value} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
        <div className="space-y-xl lg:col-span-2">
          <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
            <h3 className="mb-lg text-title-lg text-amud-on-surface">Performance Commerciale (Aujourd&apos;hui)</h3>
            <div className="mb-lg grid grid-cols-3 gap-md">
              <div className="rounded-lg bg-amud-surface-container-low p-md">
                <div className="mb-xs text-label-sm text-amud-on-surface-variant">Appels</div>
                <div className="text-headline-md text-amud-primary">{appelsAuj.length}</div>
              </div>
              <div className="rounded-lg bg-amud-surface-container-low p-md">
                <div className="mb-xs text-label-sm text-amud-on-surface-variant">Taux de réponse</div>
                <div className="text-headline-md text-amud-primary">{tauxReponse}%</div>
              </div>
              <div className="rounded-lg bg-amud-surface-container-low p-md">
                <div className="mb-xs text-label-sm text-amud-on-surface-variant">Rendez-vous</div>
                <div className="text-headline-md text-amud-primary">{rdvsAuj.length}</div>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-amud-outline-variant">
              <table className="w-full border-collapse text-left">
                <thead className="bg-amud-surface-container-low text-label-sm uppercase text-amud-on-surface-variant">
                  <tr>
                    <th className="border-b border-amud-outline-variant px-md py-sm font-medium">Rang</th>
                    <th className="border-b border-amud-outline-variant px-md py-sm font-medium">Commercial</th>
                    <th className="border-b border-amud-outline-variant px-md py-sm text-right font-medium">Objectif Atteint</th>
                  </tr>
                </thead>
                <tbody className="text-body-md">
                  {leaderboard.map((c, i) => {
                    const pct = Math.round((c.realiseMensuel / c.objectifMensuel) * 100);
                    return (
                      <tr key={c.id} className="border-b border-amud-outline-variant transition-colors last:border-0 hover:bg-amud-surface-container-lowest">
                        <td className="px-md py-sm">{i + 1}</td>
                        <td className="px-md py-sm font-medium">
                          <Link href={`/amud/admin/commerciaux/${c.id}`} className="hover:underline">
                            {c.prenom} {c.nom}
                          </Link>
                        </td>
                        <td className="px-md py-sm text-right font-bold text-amud-primary">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-xl lg:col-span-1">
          <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
            <h3 className="mb-lg flex items-center gap-sm text-title-lg text-amud-on-surface">
              <span className="material-symbols-outlined text-amud-secondary">warning</span>
              Alertes Requises
            </h3>
            <div className="space-y-sm">
              {alertes.length === 0 ? (
                <p className="text-body-md text-amud-on-surface-variant">Aucune alerte pour le moment.</p>
              ) : (
                alertes.map((a) => (
                  <Link
                    key={a.id}
                    href={a.href ?? '/amud/admin'}
                    className="flex items-center justify-between rounded p-sm transition-colors hover:bg-amud-surface-container-low"
                  >
                    <div className="flex items-center gap-sm text-body-md text-amud-on-surface">
                      <div className={`h-2 w-2 rounded-full ${a.read ? 'bg-amud-outline-variant' : 'bg-amud-secondary'}`} />
                      {a.title}
                    </div>
                    <span className="rounded-full bg-amud-surface-container-highest px-2 py-1 text-label-sm text-amud-on-surface-variant">{a.category}</span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
            <h3 className="mb-lg flex items-center gap-sm text-title-lg text-amud-on-surface">
              <span className="material-symbols-outlined text-amud-primary">school</span>
              Activité récente des centres
            </h3>
            <div className="space-y-sm">
              {centreActivity.length === 0 ? (
                <p className="text-body-md text-amud-on-surface-variant">Aucune activité récente.</p>
              ) : (
                centreActivity.map((l) => (
                  <Link
                    key={l.id}
                    href={l.centerId ? `/amud/admin/centres/${l.centerId}` : '/amud/admin/centres'}
                    className="block rounded p-sm transition-colors hover:bg-amud-surface-container-low"
                  >
                    <div className="text-body-md text-amud-on-surface">{l.action}</div>
                    <div className="text-label-sm text-amud-on-surface-variant">
                      {l.reference} · {l.date}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
