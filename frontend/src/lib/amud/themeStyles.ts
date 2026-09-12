import type { ThemeId } from '@/data/amud/centerTypes';

/**
 * Différenciation **réelle** des 5 thèmes du site public.
 *
 * Un thème ne change pas seulement de couleur : il change de mise en page
 * (`heroLayout`), de navigation (`navStyle`), de rythme vertical
 * (`sectionPadding`), de typographie (graisse, casse, interlettrage des
 * titres), de forme de carte, de rayon de bouton et d'ombre. Ces tokens sont
 * consommés à la fois par la route publique `/amud/centres/[slug]`, par
 * l'aperçu en direct de `/amud/centre/site` et par les vignettes de
 * sélection de thème — un seul jeu de valeurs, jamais deux rendus qui
 * divergent.
 */
export type ThemeStyle = {
  /* Palette */
  bg: string;
  surface: string;
  surfaceAlt: string;
  primary: string;
  primaryText: string;
  accent: string;
  text: string;
  textMuted: string;
  border: string;

  /* Typographie */
  headingFont: string;
  bodyFont: string;
  headingWeight: number;
  headingTransform: 'none' | 'uppercase';
  headingSpacing: string;
  /** Multiplicateur appliqué à la taille des titres de section. */
  headingScale: number;

  /* Formes */
  radius: string;
  buttonRadius: string;
  cardStyle: 'soft' | 'flat' | 'bold' | 'minimal' | 'luxe';
  shadow: string;

  /* Structure */
  navStyle: 'solid' | 'bordered' | 'centered' | 'minimal' | 'contrast';
  heroLayout: 'split' | 'banner' | 'stacked' | 'editorial' | 'showcase';
  heroAlign: 'left' | 'center';
  /** Padding vertical des sections en px (mobile, desktop). */
  sectionPadding: [number, number];
  /** Séparateur entre sections : trait fin, aucun, ou aplat de couleur. */
  sectionDivider: 'line' | 'none' | 'block';
  footerStyle: 'simple' | 'columns' | 'contrast';
  /** Étiquette au-dessus des titres de section (« 01 », « — », rien). */
  sectionOverline: 'number' | 'dash' | 'none';
};

export const THEME_STYLES: Record<ThemeId, ThemeStyle> = {
  'modern-education': {
    bg: '#f4f7fb',
    surface: '#ffffff',
    surfaceAlt: '#eaf1fb',
    primary: '#2563eb',
    primaryText: '#ffffff',
    // #0ea5e9 (sky-500) measured 2.58:1 / 2.77:1 against bg/surface — fails
    // WCAG AA even for large/bold text (needs 3:1). #0369a1 (sky-800) keeps
    // the same blue family at 5.52:1 / 5.93:1, passing AA even for body text.
    accent: '#0369a1',
    text: '#0f172a',
    textMuted: '#475569',
    border: '#dbe6f7',
    headingFont: "'Segoe UI', system-ui, sans-serif",
    bodyFont: "'Segoe UI', system-ui, sans-serif",
    headingWeight: 800,
    headingTransform: 'none',
    headingSpacing: '-0.02em',
    headingScale: 1,
    radius: '20px',
    buttonRadius: '999px',
    cardStyle: 'soft',
    shadow: '0 10px 30px rgba(37, 99, 235, 0.10)',
    navStyle: 'solid',
    heroLayout: 'split',
    heroAlign: 'left',
    sectionPadding: [40, 72],
    sectionDivider: 'none',
    footerStyle: 'columns',
    sectionOverline: 'dash',
  },
  'professional-academy': {
    bg: '#f7f7f5',
    surface: '#ffffff',
    surfaceAlt: '#eef0ee',
    primary: '#1e3a5f',
    primaryText: '#ffffff',
    // Contraste : l'or #a68a3f mesurait 3.09:1 / 3.32:1 / 2.90:1 sur bg /
    // surface / surfaceAlt. `accent` sert ici à du texte de 11 à 14px
    // (niveau de formation, réduction tarifaire, numéro d'avantage, étoiles
    // de témoignage, overline de section) : bien en dessous du seuil "gros
    // texte" WCAG (18.66px gras / 24px normal), donc le plancher applicable
    // est 4.5:1, pas 3:1 — les trois valeurs échouaient. #7d662e garde la
    // même famille or/bronze à 5.14:1 / 5.51:1 / 4.81:1, et porte aussi le
    // badge promotion (blanc sur accent) de 3.32:1 à 5.51:1.
    accent: '#7d662e',
    text: '#1c1c1c',
    textMuted: '#5b5b58',
    border: '#dcdcd6',
    headingFont: "Georgia, 'Times New Roman', serif",
    bodyFont: "'Segoe UI', system-ui, sans-serif",
    headingWeight: 700,
    headingTransform: 'none',
    headingSpacing: '0',
    headingScale: 0.95,
    radius: '4px',
    buttonRadius: '4px',
    cardStyle: 'flat',
    shadow: 'none',
    navStyle: 'bordered',
    heroLayout: 'banner',
    heroAlign: 'left',
    sectionPadding: [36, 64],
    sectionDivider: 'line',
    footerStyle: 'columns',
    sectionOverline: 'number',
  },
  'german-excellence': {
    bg: '#0b0b0c',
    surface: '#161617',
    surfaceAlt: '#1f1f21',
    primary: '#c8102e',
    primaryText: '#ffffff',
    accent: '#d4af37',
    text: '#f5f5f5',
    textMuted: '#b3b3b3',
    border: '#2c2c2e',
    headingFont: "'Arial Black', Impact, sans-serif",
    bodyFont: 'Arial, system-ui, sans-serif',
    headingWeight: 900,
    headingTransform: 'uppercase',
    headingSpacing: '0.04em',
    headingScale: 1.1,
    radius: '2px',
    buttonRadius: '2px',
    cardStyle: 'bold',
    shadow: '0 0 0 1px rgba(212, 175, 55, 0.18)',
    navStyle: 'contrast',
    heroLayout: 'stacked',
    heroAlign: 'center',
    sectionPadding: [48, 88],
    sectionDivider: 'block',
    footerStyle: 'contrast',
    sectionOverline: 'number',
  },
  'minimal-learning': {
    bg: '#ffffff',
    surface: '#ffffff',
    surfaceAlt: '#fafafa',
    primary: '#111111',
    primaryText: '#ffffff',
    accent: '#0f766e',
    text: '#111111',
    textMuted: '#737373',
    border: '#e5e5e5',
    headingFont: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    bodyFont: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    headingWeight: 400,
    headingTransform: 'none',
    headingSpacing: '-0.01em',
    headingScale: 0.9,
    radius: '0px',
    buttonRadius: '0px',
    cardStyle: 'minimal',
    shadow: 'none',
    navStyle: 'minimal',
    heroLayout: 'editorial',
    heroAlign: 'left',
    sectionPadding: [56, 96],
    sectionDivider: 'line',
    footerStyle: 'simple',
    sectionOverline: 'none',
  },
  'premium-training': {
    bg: '#0d0d10',
    surface: '#17171b',
    surfaceAlt: '#1f1f24',
    primary: '#c9a24b',
    primaryText: '#0d0d10',
    accent: '#e8c874',
    text: '#f3ede0',
    textMuted: '#a89f8c',
    border: '#2a2a30',
    headingFont: "Georgia, 'Times New Roman', serif",
    bodyFont: "'Segoe UI', system-ui, sans-serif",
    headingWeight: 700,
    headingTransform: 'none',
    headingSpacing: '0.01em',
    headingScale: 1.05,
    radius: '12px',
    buttonRadius: '999px',
    cardStyle: 'luxe',
    shadow: '0 18px 40px rgba(0, 0, 0, 0.45)',
    navStyle: 'centered',
    heroLayout: 'showcase',
    heroAlign: 'center',
    sectionPadding: [44, 80],
    sectionDivider: 'none',
    footerStyle: 'contrast',
    sectionOverline: 'dash',
  },
};

export function themeStyleFor(theme: ThemeId): ThemeStyle {
  return THEME_STYLES[theme] ?? THEME_STYLES['modern-education'];
}

/** Style de carte dérivé du thème — utilisé par toutes les sections du site. */
export function themeCard(t: ThemeStyle) {
  return {
    background: t.cardStyle === 'luxe' ? t.surfaceAlt : t.surface,
    border: t.cardStyle === 'bold' ? `2px solid ${t.primary}` : `1px solid ${t.border}`,
    borderRadius: t.cardStyle === 'minimal' ? '0px' : t.radius,
    boxShadow: t.cardStyle === 'soft' || t.cardStyle === 'luxe' ? t.shadow : 'none',
  } as const;
}

/** Style de titre de section dérivé du thème. */
export function themeHeading(t: ThemeStyle, compact: boolean) {
  return {
    fontFamily: t.headingFont,
    fontWeight: t.headingWeight,
    textTransform: t.headingTransform,
    letterSpacing: t.headingSpacing,
    fontSize: Math.round((compact ? 18 : 28) * t.headingScale),
    margin: 0,
  } as const;
}
