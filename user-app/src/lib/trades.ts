// Taxonomie des métiers : ce que la recherche de la page d'accueil interroge.
//
// Il n'existe pas d'offres d'emploi dans ce produit — les recruteurs cherchent
// des candidats, pas l'inverse (voir docs/plan-home-recruitment.md §0). Une
// barre « recherche d'emploi » n'aurait donc rien à interroger. Elle porte ici
// l'intention « je commence maintenant » et mène à une fiche métier, qui elle
// dit quelque chose de vrai : le niveau d'allemand attendu et ce que le dossier
// doit contenir.
//
// Les `slug` sont identiques dans les quatre langues : une fiche partagée reste
// valide quand le visiteur change de langue.

import type { Language } from '@/lib/types';
import fr from '@/content/trades.fr.json';
import en from '@/content/trades.en.json';
import de from '@/content/trades.de.json';
import ar from '@/content/trades.ar.json';

export type RecognitionRule = 'required' | 'recommended' | 'none';

export interface Trade {
  slug: string;
  label: string;
  sector: string;
  icon: string;
  popular: boolean;
  synonyms: string[];
  germanLevel: string;
  recognition: RecognitionRule;
  summary: string;
  requirements: string[];
  dossier: string[];
  /** Renseigné seulement quand une fourchette a été sourcée et validée. */
  salaryBand: string | null;
}

type TradeData = typeof fr;

// Même contrainte de typage que pour les textes : une traduction incomplète
// casse le build plutôt que la page.
const DATA: Record<Language, TradeData> = { fr, en, de, ar };

function parse(data: TradeData): Trade[] {
  return data.trades.map((trade) => ({
    ...trade,
    recognition: trade.recognition as RecognitionRule,
    salaryBand: trade.salaryBand as string | null,
  }));
}

const CACHE = new Map<Language, Trade[]>();

export function tradesFor(language: Language): Trade[] {
  const cached = CACHE.get(language);
  if (cached) return cached;

  const parsed = parse(DATA[language] ?? DATA.fr);
  CACHE.set(language, parsed);

  return parsed;
}

export function sectorsFor(language: Language): string[] {
  return (DATA[language] ?? DATA.fr).sectors;
}

/** Les métiers proposés avant toute saisie : un champ vide qui propose déjà quelque chose. */
export function popularFor(language: Language): Trade[] {
  return tradesFor(language)
    .filter((trade) => trade.popular)
    .slice(0, 6);
}

/**
 * Sans accents ni casse : « électricien », « Electricien » et « electricien »
 * sont la même recherche, et un clavier arabe ou allemand ne doit pas être un
 * obstacle.
 */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Correspondance sur l'intitulé *et* les synonymes : un candidat tape le mot
 * qu'il utilise, pas l'intitulé officiel — « nurse », « Krankenpfleger » ou
 * « ممرض » doivent tous trouver le métier, quelle que soit la langue affichée.
 * Chaque fichier de langue porte donc aussi les synonymes des autres.
 */
export function searchTrades(term: string, language: Language, limit = 8): Trade[] {
  const needle = normalize(term);
  if (needle === '') return popularFor(language).slice(0, limit);

  const scored = tradesFor(language)
    .map((trade) => {
      const label = normalize(trade.label);
      const synonyms = trade.synonyms.map(normalize);

      // Un préfixe est un signal plus fort qu'une occurrence au milieu d'un mot :
      // « cui » doit remonter « Cuisinier » avant « Mécanicien industriel ».
      if (label.startsWith(needle)) return { trade, score: 0 };
      if (synonyms.some((synonym) => synonym.startsWith(needle))) return { trade, score: 1 };
      if (label.includes(needle)) return { trade, score: 2 };
      if (synonyms.some((synonym) => synonym.includes(needle))) return { trade, score: 3 };
      if (normalize(trade.sector).includes(needle)) return { trade, score: 4 };

      return { trade, score: -1 };
    })
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => a.score - b.score);

  return scored.slice(0, limit).map((entry) => entry.trade);
}

export function findTrade(slug: string, language: Language = 'fr'): Trade | undefined {
  return tradesFor(language).find((trade) => trade.slug === slug);
}

/** Les slugs sont partagés : ils suffisent à générer les routes statiques. */
export function allSlugs(): string[] {
  return fr.trades.map((trade) => trade.slug);
}
