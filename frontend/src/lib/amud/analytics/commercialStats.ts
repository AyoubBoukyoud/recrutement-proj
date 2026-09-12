import type { Activite } from '@/data/amud/commercialActivites';
import type { CallTicket } from '@/data/amud/callTickets';
import type { Centre } from '@/data/amud/centres';
import type { Entreprise } from '@/data/amud/entreprises';
import type { Objective } from '@/data/amud/objectives';
import type { Commercial } from '@/data/amud/commerciaux';
import { bucketByWeekday, inRange, parseAnyDate, type PeriodRange } from './period';
import { countBy, percentOf } from './aggregate';

export type CommercialKpis = {
  appelsAujourdHui: number;
  appelsSemaine: number;
  prospectsContactes: number;
  rendezVous: number;
  centresContactes: number;
  partenariatsObtenus: number;
  objectifMensuelPct: number;
  tauxConversion: number;
};

export type CommercialObjectifMensuel = { realise: number; objectif: number; pct: number };

export type CommercialStats = {
  kpis: CommercialKpis;
  objectifMensuel: CommercialObjectifMensuel;
  activiteParJour: { label: string; value: number }[];
  funnel: { label: string; value: number }[];
  resultatsAppels: { label: string; value: number }[];
};

/**
 * Contexte "assigné à ce commercial" nécessaire au funnel et à l'objectif
 * mensuel — en plus de `activites`/`callTickets` (déjà scopés par
 * l'appelant, même convention que `getRecruiterStats`). `centres` et
 * `entreprises` doivent eux aussi déjà être filtrés pour ce commercial
 * (`assignedCommercialNom`/`commercialResponsable` — voir
 * `/amud/commercial/page.tsx` et `/amud/commercial/entreprises/page.tsx`).
 */
export type CommercialScope = {
  centres: Centre[];
  entreprises: Entreprise[];
  objective?: Objective;
};

function todayFr(): string {
  return new Date().toLocaleDateString('fr-FR');
}

type ProspectFlags = { contacted: boolean; interested: boolean; hasRdv: boolean; isPartner: boolean };

/**
 * Statistiques commerciales (`/amud/commercial` — pas de page
 * `/statistiques` séparée, tout reste sur ce tableau de bord unique).
 * `activites`/`callTickets` doivent déjà être filtrés pour le commercial
 * courant par l'appelant ; `scope.centres`/`scope.entreprises` de même. Cette
 * fonction reste pure, sans logique de scope elle-même.
 */
export function getCommercialStats(activites: Activite[], callTickets: CallTicket[], scope: CommercialScope, range: PeriodRange): CommercialStats {
  const today = todayFr();
  const now = new Date();
  const appels = activites.filter((a) => a.type === 'Appel');

  const appelsAujourdHui = appels.filter((a) => a.date === today).length;
  const appelsSemaine = appels.filter((a) => inRange(a.date, range)).length;
  const rendezVousCount = activites.filter((a) => a.type === 'Rendez-vous').length;

  // --- Funnel commercial : Prospects → Contactés → Intéressés → Rendez-vous → Partenaires,
  // sur l'ensemble des centres + entreprises assignés à ce commercial.
  //
  // Surprise de forme de données : `Activite` ne référence que `entrepriseId`
  // (jamais un centre) — impossible de savoir si UN centre précis a été
  // "contacté" via le journal d'activités comme on le fait pour les
  // entreprises. On s'appuie donc sur la progression déjà trackée par
  // `Centre.partnershipStatus` (qui a lui-même un palier `CONTACTE` distinct
  // de `PROSPECT`) comme équivalent de "≥1 Activite loggée". Faute de lien
  // Activite<->Centre, le stade "Rendez-vous" des centres est approximé par
  // les statuts `ESSAI`/`ACTIF` (on a forcément échangé pour arriver là).
  const entrepriseIdsWithActivite = new Set(activites.map((a) => a.entrepriseId).filter((id): id is string => !!id));
  const entrepriseIdsWithRdv = new Set(
    activites.filter((a) => a.type === 'Rendez-vous').map((a) => a.entrepriseId).filter((id): id is string => !!id),
  );

  const centreProspects: ProspectFlags[] = scope.centres.map((c) => ({
    contacted: c.partnershipStatus !== 'PROSPECT',
    interested: c.partnershipStatus === 'NEGOCIATION' || c.partnershipStatus === 'ESSAI',
    hasRdv: c.partnershipStatus === 'ESSAI' || c.partnershipStatus === 'ACTIF',
    isPartner: c.partnershipStatus === 'ACTIF',
  }));

  const entrepriseProspects: ProspectFlags[] = scope.entreprises.map((e) => ({
    contacted: entrepriseIdsWithActivite.has(e.id),
    interested: e.statut === 'En attente',
    hasRdv: entrepriseIdsWithRdv.has(e.id),
    isPartner: e.statut === 'Active' || e.statut === 'Vérifiée',
  }));

  const allProspects = [...centreProspects, ...entrepriseProspects];
  const contactes = allProspects.filter((p) => p.contacted);
  // Chaque stade est un sous-ensemble STRICT du précédent (pas seulement de
  // Contactés) pour que le funnel reste monotone décroissant à l'affichage,
  // même si "intéressé"/"a un RDV"/"est partenaire" ne s'emboîteraient pas
  // naturellement les uns dans les autres.
  const interesses = contactes.filter((p) => p.interested);
  const rdvStage = interesses.filter((p) => p.hasRdv);
  const partenairesStage = rdvStage.filter((p) => p.isPartner);

  const funnel = [
    { label: 'Prospects', value: allProspects.length },
    { label: 'Contactés', value: contactes.length },
    { label: 'Intéressés', value: interesses.length },
    { label: 'Rendez-vous', value: rdvStage.length },
    { label: 'Partenaires', value: partenairesStage.length },
  ];

  // KPIs "vrais" : comptages directs (non contraints par l'emboîtement
  // ci-dessus, qui n'existe que pour que la FORME du funnel reste lisible).
  const centresContactes = scope.centres.filter((c) => c.partnershipStatus !== 'PROSPECT').length;
  const partenariatsObtenus = allProspects.filter((p) => p.isPartner).length;
  const tauxConversion = percentOf(partenariatsObtenus, contactes.length);

  const objectif = scope.objective?.objectifMensuel ?? 0;
  const realise = appels.filter((a) => {
    const d = parseAnyDate(a.date);
    return !!d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const objectifMensuelPct = objectif > 0 ? percentOf(realise, objectif) : 0;

  const kpis: CommercialKpis = {
    appelsAujourdHui,
    appelsSemaine,
    prospectsContactes: contactes.length,
    rendezVous: rendezVousCount,
    centresContactes,
    partenariatsObtenus,
    objectifMensuelPct,
    tauxConversion,
  };

  const activiteParJour = bucketByWeekday(activites, (a) => a.date);
  const resultatsAppels = countBy(callTickets, (c) => c.result);

  return {
    kpis,
    objectifMensuel: { realise, objectif, pct: objectifMensuelPct },
    activiteParJour,
    funnel,
    resultatsAppels,
  };
}

export type CommercialComparisonRow = {
  id: string;
  nom: string;
  appels: number;
  rdv: number;
  partenariats: number;
  tauxConversion: number;
  objectif: number;
  progressionPct: number;
};

/**
 * Classement des commerciaux pour le leaderboard `/amud/admin` — migré tel
 * quel depuis la logique en dur de `admin/page.tsx` (tri par ratio
 * réalisé/objectif mensuel décroissant), pour que la page admin (éditée dans
 * une autre passe) puisse l'importer sans dupliquer le calcul. `partenariats`
 * mappe `conversionsMois` (pas de champ "partenariats" dédié sur `Commercial`
 * — les conversions du roster admin sont l'équivalent le plus proche de
 * "partenariats obtenus" pour un commercial).
 */
export function getCommercialComparisonStats(commerciaux: Commercial[]): CommercialComparisonRow[] {
  return [...commerciaux]
    .sort((a, b) => b.realiseMensuel / b.objectifMensuel - a.realiseMensuel / a.objectifMensuel)
    .map((c) => ({
      id: c.id,
      nom: `${c.prenom} ${c.nom}`,
      appels: c.appelsJour,
      rdv: c.rdvSemaine,
      partenariats: c.conversionsMois,
      tauxConversion: c.tauxConversion,
      objectif: c.objectifMensuel,
      progressionPct: c.objectifMensuel > 0 ? Math.round((c.realiseMensuel / c.objectifMensuel) * 100) : 0,
    }));
}
