import type { CandidateAccount, GermanLevel } from '@/data/amud/candidateAccount';
import type { Offre } from '@/data/amud/offres';

const GERMAN_ORDER: GermanLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function germanLevelRequiredByOffer(offre: Offre): GermanLevel | null {
  const found = (offre.langues ?? []).find((l) => /allemand|german|deutsch/i.test(l));
  if (!found) return null;
  const match = found.match(/\b([ABC][12])\b/i);
  return match ? (match[1].toUpperCase() as GermanLevel) : null;
}

function experienceYearsFromLabel(label?: string): number {
  if (!label) return 0;
  if (/^10\+/.test(label)) return 10;
  const match = label.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function experienceYearsRequiredByOffer(offre: Offre): number {
  switch (offre.niveauExperience) {
    case 'Débutant':
      return 0;
    case '1-3 ans':
      return 1;
    case '3-5 ans':
      return 3;
    case '5-10 ans':
      return 5;
    case '10+ ans':
      return 10;
    default:
      return 0;
  }
}

export type MatchScoreResult = {
  score: number;
  matches: string[];
  gaps: string[];
};

/**
 * Compatibilité candidat ↔ offre (§17) — calcul frontend déterministe,
 * pondéré, aucun appel réseau/IA. Pondération : 45% compétences, 20%
 * expérience, 20% allemand (si l'offre en exige), 15% localisation/télétravail.
 * Si l'offre n'exige pas d'allemand, ce poids est redistribué sur les
 * compétences pour ne pas plafonner artificiellement le score.
 */
export function computeMatchScore(account: CandidateAccount, offre: Offre): MatchScoreResult {
  const matches: string[] = [];
  const gaps: string[] = [];

  const offerSkills = (offre.competences ?? []).map(normalize);
  const candidateSkills = new Set(account.competences.map(normalize));
  const skillHits = offerSkills.filter((s) => candidateSkills.has(s));
  const skillRatio = offerSkills.length > 0 ? skillHits.length / offerSkills.length : 1;
  for (const skill of offre.competences ?? []) {
    if (candidateSkills.has(normalize(skill))) matches.push(skill);
    else gaps.push(`Compétence recommandée : ${skill}`);
  }

  const requiredYears = experienceYearsRequiredByOffer(offre);
  const candidateYears = experienceYearsFromLabel(account.experienceAnnees) || account.experiences.length * 1.5;
  const experienceRatio = requiredYears === 0 ? 1 : Math.min(1, candidateYears / requiredYears);
  if (requiredYears > 0) {
    if (experienceRatio >= 1) matches.push(`${requiredYears}+ ans d'expérience`);
    else gaps.push(`Expérience recommandée : ${offre.niveauExperience ?? `${requiredYears} ans`}`);
  }

  const requiredGerman = germanLevelRequiredByOffer(offre);
  let germanRatio = 1;
  let germanWeight = 0.2;
  if (requiredGerman) {
    const candidateLevel = account.allemagne.niveau;
    const candidateIdx = candidateLevel ? GERMAN_ORDER.indexOf(candidateLevel) : -1;
    const requiredIdx = GERMAN_ORDER.indexOf(requiredGerman);
    germanRatio = candidateIdx >= 0 ? Math.min(1, (candidateIdx + 1) / (requiredIdx + 1)) : 0;
    if (germanRatio >= 1) matches.push(`Allemand ${candidateLevel}`);
    else gaps.push(`Allemand ${requiredGerman} recommandé${candidateLevel ? ` (vous : ${candidateLevel})` : ''}`);
  } else {
    germanWeight = 0;
  }

  const locationRatio =
    !offre.teletravail || offre.teletravail === 'Télétravail complet' || !account.preferencesPro.teletravail
      ? 1
      : account.preferencesPro.teletravail === offre.teletravail
        ? 1
        : 0.5;
  if (locationRatio >= 1 && offre.ville) matches.push(`Localisation compatible : ${offre.ville}`);

  const skillWeight = 0.45 + (0.2 - germanWeight === 0.2 && germanWeight === 0 ? 0.2 : 0);
  const experienceWeight = 0.2;
  const locationWeight = 1 - skillWeight - experienceWeight - germanWeight;

  const score = Math.round(skillRatio * skillWeight * 100 + experienceRatio * experienceWeight * 100 + germanRatio * germanWeight * 100 + locationRatio * locationWeight * 100);

  return { score: Math.max(0, Math.min(100, score)), matches, gaps };
}
