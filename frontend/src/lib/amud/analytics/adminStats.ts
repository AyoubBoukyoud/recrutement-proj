import type { Candidate } from '@/data/amud/candidates';
import type { Entreprise } from '@/data/amud/entreprises';
import type { Centre } from '@/data/amud/centres';
import type { CenterTeacher } from '@/data/amud/centerTeachers';
import type { CenterStudent } from '@/data/amud/centerStudents';
import type { CenterFormation } from '@/data/amud/centerFormations';
import type { Offre } from '@/data/amud/offres';
import type { Application } from '@/data/amud/applications';
import type { Activite } from '@/data/amud/commercialActivites';
import type { AuditLog } from '@/data/amud/auditLog';
import { applicationsFunnel, countBy, topN, type Count } from './aggregate';
import { bucketByHour, bucketByWeekday, bucketTimeSeries, comparePeriods, inRange, previousPeriodRange, type PeriodRange, type TrendComparison } from './period';

export type AdminKpis = {
  totalCandidats: number;
  totalEntreprises: number;
  totalCentres: number;
  totalEnseignants: number;
  totalEtudiants: number;
  totalFormations: number;
  totalOffres: number;
  appelsAujourdhui: number;
};

export type InscriptionPoint = { label: string; etudiants: number; candidats: number; centres: number };

export type AdminStats = {
  kpis: AdminKpis;
  trends: { totalCandidats: TrendComparison; totalCentres: TrendComparison; totalEtudiants: TrendComparison };
  /** Évolution étudiants/candidats/centres — 3 séries bucketées sur la même `range` (mêmes libellés d'axe X). */
  inscriptions: InscriptionPoint[];
  /** Répartition des centres partenaires (Actifs/En attente/En négociation/Suspendus). */
  centresRepartition: Count[];
  candidatsParVille: Count[];
  /** Volume d'activités commerciales par jour de semaine sur la période. */
  activiteCommercialeHebdo: Count[];
  /** Funnel cumulatif de recrutement sur TOUTES les candidatures de la plateforme. */
  funnel: Count[];
  offresParStatut: Count[];
  /** Activité de la plateforme (journal d'audit) par jour de semaine et par heure. */
  activitePlateformeHebdo: Count[];
  activitePlateformeHoraire: Count[];
};

function todayFr(): string {
  return new Date().toLocaleDateString('fr-FR');
}

/**
 * Statistiques `/amud/admin` (tableau de bord) + `/amud/admin/analytics` —
 * mêmes collections déjà chargées par `admin/page.tsx` aujourd'hui (aucun
 * scoping ici, contrairement à `recruiterStats.ts` : l'admin voit toute la
 * plateforme), simplement migrées dans une fonction pure testable et
 * réutilisable par les deux pages.
 */
export function getAdminStats(
  candidates: Candidate[],
  entreprises: Entreprise[],
  centres: Centre[],
  centerTeachers: CenterTeacher[],
  centerStudents: CenterStudent[],
  centerFormations: CenterFormation[],
  offres: Offre[],
  applications: Application[],
  activites: Activite[],
  auditLogs: AuditLog[],
  range: PeriodRange,
): AdminStats {
  const today = todayFr();

  const kpis: AdminKpis = {
    totalCandidats: candidates.length,
    totalEntreprises: entreprises.length,
    totalCentres: centres.length,
    totalEnseignants: centerTeachers.length,
    totalEtudiants: centerStudents.length,
    totalFormations: centerFormations.length,
    totalOffres: offres.length,
    appelsAujourdhui: activites.filter((a) => a.type === 'Appel' && a.date === today).length,
  };

  const previousRange = previousPeriodRange(range);
  const trends = {
    totalCandidats: comparePeriods(
      candidates.filter((c) => inRange(c.creeLe, range)).length,
      candidates.filter((c) => inRange(c.creeLe, previousRange)).length,
      { positiveIsGood: true },
    ),
    totalCentres: comparePeriods(
      centres.filter((c) => inRange(c.createdAt, range)).length,
      centres.filter((c) => inRange(c.createdAt, previousRange)).length,
      { positiveIsGood: true },
    ),
    totalEtudiants: comparePeriods(
      centerStudents.filter((s) => inRange(s.dateInscription, range)).length,
      centerStudents.filter((s) => inRange(s.dateInscription, previousRange)).length,
      { positiveIsGood: true },
    ),
  };

  const candidatsSeries = bucketTimeSeries(candidates, (c) => c.creeLe, range);
  const centresSeries = bucketTimeSeries(centres, (c) => c.createdAt, range);
  const etudiantsSeries = bucketTimeSeries(centerStudents, (s) => s.dateInscription, range);
  const inscriptions: InscriptionPoint[] = candidatsSeries.map((point, i) => ({
    label: point.label,
    candidats: point.value,
    centres: centresSeries[i]?.value ?? 0,
    etudiants: etudiantsSeries[i]?.value ?? 0,
  }));

  // Reprend exactement les 2 classifications déjà utilisées inline par les
  // tuiles KPI "Centres actifs" (`statut`) et "En négociation"/"Suspendus"
  // (`partnershipStatus`) — "En attente" complète la 3e valeur de `statut`
  // restée jusqu'ici sans tuile dédiée.
  const centresRepartition: Count[] = [
    { label: 'Actifs', value: centres.filter((c) => c.statut === 'Actif').length },
    { label: 'En attente', value: centres.filter((c) => c.statut === 'En attente').length },
    { label: 'En négociation', value: centres.filter((c) => c.partnershipStatus === 'NEGOCIATION' || c.partnershipStatus === 'ESSAI').length },
    { label: 'Suspendus', value: centres.filter((c) => c.partnershipStatus === 'SUSPENDU' || c.partnershipStatus === 'EXPIRE').length },
  ];

  const candidatsParVille = topN(candidates, (c) => c.ville);

  const activiteCommercialeHebdo = bucketByWeekday(activites, (a) => a.date, range);

  const funnel = applicationsFunnel(applications);

  const offresParStatut = countBy(offres, (o) => o.statut);

  const activitePlateformeHebdo = bucketByWeekday(auditLogs, (l) => l.date, range);
  const activitePlateformeHoraire = bucketByHour(auditLogs, (l) => l.heure);

  return {
    kpis,
    trends,
    inscriptions,
    centresRepartition,
    candidatsParVille,
    activiteCommercialeHebdo,
    funnel,
    offresParStatut,
    activitePlateformeHebdo,
    activitePlateformeHoraire,
  };
}
