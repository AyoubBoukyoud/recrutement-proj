'use client';

import { useMemo, useState } from 'react';
import type { Centre } from '@/data/amud/centres';
import type { CenterFormation } from '@/data/amud/centerFormations';
import type { CenterTarif } from '@/data/amud/centerTarifs';
import { GERMAN_LEVELS, type GermanLevel } from '@/data/amud/centerTypes';
import { themeCard, themeHeading, themeStyleFor, type ThemeStyle } from '@/lib/amud/themeStyles';
import { PublicSiteContactForm } from '@/components/amud/centre/PublicSiteContactForm';

/**
 * Site public d'un centre — rendu partagé par la route publique
 * `/amud/centres/[slug]` et par l'aperçu en direct de `/amud/centre/site`,
 * pour que « ce que le centre voit en éditant » soit exactement « ce que le
 * public voit ».
 *
 * Sections (cahier des charges) : Navigation, Hero, Présentation,
 * Formations, Niveaux, Tarifs, Avantages, Témoignages, FAQ, Contact,
 * Localisation, Footer. Tout le contenu vient de localStorage (`Centre`,
 * formations et tarifs du centre) et toute la différenciation visuelle vient
 * de `themeStyles.ts` : le thème change la navigation, la mise en page du
 * hero, le rythme des sections, la typographie et les cartes — pas seulement
 * les couleurs.
 *
 * Mobile first : grilles en une colonne à 360px, deux à partir de 640px,
 * trois au-delà de 960px, via des media queries injectées (le rendu utilise
 * des styles inline puisqu'il ne peut pas dépendre des tokens Tailwind du
 * back-office).
 */

const LEVEL_DESCRIPTIONS: Record<GermanLevel, string> = {
  A1: 'Premiers mots, se présenter, situations du quotidien.',
  A2: 'Échanges simples, besoins immédiats, phrases courantes.',
  B1: 'Autonomie en voyage, récit d’expériences, opinions simples.',
  B2: 'Discussion technique, argumentation, spontanéité.',
  C1: 'Aisance professionnelle, textes longs et implicites.',
  C2: 'Maîtrise proche du locuteur natif.',
};

const NAV_SECTIONS = [
  { id: 'presentation', label: 'Le centre' },
  { id: 'formations', label: 'Formations' },
  { id: 'niveaux', label: 'Niveaux' },
  { id: 'tarifs', label: 'Tarifs' },
  { id: 'temoignages', label: 'Témoignages' },
  { id: 'faq', label: 'FAQ' },
  { id: 'contact', label: 'Contact' },
];

export function PublicSiteRenderer({
  centre,
  formations,
  tarifs,
  compact = false,
}: {
  centre: Centre;
  formations: CenterFormation[];
  tarifs: CenterTarif[];
  /** Aperçu réduit (dans un cadre de la page d'édition) plutôt que la page publique plein écran. */
  compact?: boolean;
}) {
  const t = themeStyleFor(centre.theme);
  const card = themeCard(t);
  const [pad, padDesktop] = t.sectionPadding;
  const sectionPad = compact ? 20 : pad;

  const niveaux = useMemo(() => {
    const offered = new Set(formations.map((f) => f.niveau));
    return GERMAN_LEVELS.filter((l) => offered.has(l));
  }, [formations]);

  const ouverts = centre.horaires.filter((h) => !h.ferme);

  return (
    <div
      className="amud-public-site"
      style={{ background: t.bg, color: t.text, fontFamily: t.bodyFont, minHeight: compact ? undefined : '100vh' }}
    >
      {/* Media queries : le rendu inline ne peut pas utiliser Tailwind, on les injecte. */}
      <style>{`
        .amud-public-site .aps-grid { display: grid; gap: 16px; grid-template-columns: 1fr; }
        .amud-public-site .aps-section { padding: ${sectionPad}px 20px; }
        .amud-public-site .aps-hero { padding: ${compact ? 28 : pad + 16}px 20px; }
        .amud-public-site .aps-split { display: flex; flex-direction: column; gap: 24px; }
        @media (min-width: 640px) {
          .amud-public-site .aps-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (min-width: 960px) {
          .amud-public-site .aps-grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .amud-public-site .aps-section { padding: ${compact ? 20 : padDesktop}px 24px; }
          .amud-public-site .aps-hero { padding: ${compact ? 28 : padDesktop + 16}px 24px; }
          .amud-public-site .aps-split { flex-direction: row; align-items: center; }
          .amud-public-site .aps-split > * { flex: 1; }
        }
      `}</style>

      <SiteNav centre={centre} t={t} compact={compact} />
      <SiteHero centre={centre} t={t} compact={compact} formationsCount={formations.length} niveauxCount={niveaux.length} />

      {/* Présentation */}
      <Section id="presentation" t={t} title={`À propos de ${centre.nom}`} overlineIndex={1} compact={compact}>
        <div className="aps-split">
          <p style={{ fontSize: compact ? 14 : 17, lineHeight: 1.7, color: t.textMuted, margin: 0 }}>{centre.description}</p>
          <div className="aps-grid" style={{ gap: 12 }}>
            <Stat t={t} card={card} value={String(formations.length)} label="Formations" />
            <Stat t={t} card={card} value={String(niveaux.length || GERMAN_LEVELS.length)} label="Niveaux" />
            <Stat t={t} card={card} value={centre.ville} label="Ville" />
            <Stat t={t} card={card} value={String(centre.site.temoignages.length)} label="Témoignages" />
          </div>
        </div>
      </Section>

      {/* Formations */}
      {formations.length > 0 ? (
        <Section id="formations" t={t} title="Nos formations" overlineIndex={2} compact={compact} alt>
          <div className="aps-grid aps-grid-3">
            {formations.map((f) => {
              const tarif = tarifs.find((tf) => tf.formationId === f.id);
              return (
                <article key={f.id} style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.accent }}>{f.niveau}</span>
                  <h3 style={{ ...themeHeading(t, true), fontSize: compact ? 15 : 18 }}>{f.nom}</h3>
                  <p style={{ fontSize: 13, color: t.textMuted, margin: 0, lineHeight: 1.6 }}>{f.description}</p>
                  <p style={{ fontSize: 12, color: t.textMuted, margin: 0 }}>
                    {f.dureeSemaines} semaines · {f.nombreHeures}h · {f.nombreSeances} séances
                  </p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: t.primary, margin: '4px 0 0' }}>
                    {(tarif?.prix ?? f.prix).toLocaleString('fr-FR')} MAD
                  </p>
                  {tarif?.promotion ? (
                    <span style={{ alignSelf: 'flex-start', background: t.accent, color: t.primaryText, borderRadius: t.buttonRadius, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                      {tarif.promotion}
                    </span>
                  ) : null}
                </article>
              );
            })}
          </div>
        </Section>
      ) : null}

      {/* Niveaux */}
      <Section id="niveaux" t={t} title="Les niveaux enseignés" overlineIndex={3} compact={compact}>
        <div className="aps-grid aps-grid-3">
          {(niveaux.length > 0 ? niveaux : GERMAN_LEVELS).map((l) => (
            <div key={l} style={{ ...card, padding: 18, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span
                style={{
                  background: t.primary,
                  color: t.primaryText,
                  borderRadius: t.cardStyle === 'minimal' ? 0 : '50%',
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {l}
              </span>
              <p style={{ margin: 0, fontSize: 13, color: t.textMuted, lineHeight: 1.6 }}>{LEVEL_DESCRIPTIONS[l]}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Tarifs */}
      {tarifs.length > 0 ? (
        <Section id="tarifs" t={t} title="Nos tarifs" overlineIndex={4} compact={compact} alt>
          <div className="aps-grid aps-grid-3">
            {tarifs.map((tf) => {
              const formation = formations.find((f) => f.id === tf.formationId);
              return (
                <article key={tf.id} style={{ ...card, padding: 20 }}>
                  <h3 style={{ ...themeHeading(t, true), fontSize: compact ? 15 : 17 }}>{formation?.nom ?? `Niveau ${tf.niveau}`}</h3>
                  <p style={{ fontSize: 26, fontWeight: 800, color: t.primary, margin: '8px 0' }}>{tf.prix.toLocaleString('fr-FR')} MAD</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <li style={{ fontSize: 13, color: t.textMuted }}>Frais d’inscription : {tf.fraisInscription.toLocaleString('fr-FR')} MAD</li>
                    {tf.mensualite ? <li style={{ fontSize: 13, color: t.textMuted }}>Ou {tf.mensualite.toLocaleString('fr-FR')} MAD / mois</li> : null}
                    {tf.reduction ? <li style={{ fontSize: 13, color: t.accent }}>Réduction : −{tf.reduction}%</li> : null}
                    {tf.dateValidite ? <li style={{ fontSize: 12, color: t.textMuted }}>Valable jusqu’au {tf.dateValidite}</li> : null}
                  </ul>
                </article>
              );
            })}
          </div>
        </Section>
      ) : null}

      {/* Avantages */}
      {centre.site.avantages.filter(Boolean).length > 0 ? (
        <Section id="avantages" t={t} title={`Pourquoi choisir ${centre.nom} ?`} overlineIndex={5} compact={compact}>
          <div className="aps-grid aps-grid-3">
            {centre.site.avantages.filter(Boolean).map((a, i) => (
              <div key={i} style={{ ...card, padding: 18 }}>
                <span style={{ color: t.accent, fontWeight: 800, fontSize: 13 }}>{String(i + 1).padStart(2, '0')}</span>
                <p style={{ margin: '6px 0 0', fontSize: 15, lineHeight: 1.6 }}>{a}</p>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Témoignages */}
      {centre.site.temoignages.length > 0 ? (
        <Section id="temoignages" t={t} title="Ce qu’en disent nos étudiants" overlineIndex={6} compact={compact} alt>
          <div className="aps-grid aps-grid-3">
            {centre.site.temoignages.map((tm, i) => (
              <figure key={i} style={{ ...card, padding: 20, margin: 0 }}>
                <div aria-label={`Note ${tm.note} sur 5`} style={{ color: t.accent, fontSize: 14, letterSpacing: 2 }}>
                  {'★'.repeat(Math.max(0, Math.min(5, tm.note)))}
                  <span style={{ opacity: 0.3 }}>{'★'.repeat(Math.max(0, 5 - tm.note))}</span>
                </div>
                <blockquote style={{ margin: '10px 0', fontSize: 14, fontStyle: 'italic', lineHeight: 1.6 }}>“{tm.texte}”</blockquote>
                <figcaption>
                  <span style={{ fontSize: 13, fontWeight: 700, display: 'block' }}>{tm.nom}</span>
                  <span style={{ fontSize: 12, color: t.textMuted }}>{tm.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>
      ) : null}

      {/* FAQ */}
      {centre.site.faq.length > 0 ? (
        <Section id="faq" t={t} title="Questions fréquentes" overlineIndex={7} compact={compact} narrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {centre.site.faq.map((item, i) => (
              <FaqItem key={i} t={t} card={card} question={item.question} reponse={item.reponse} defaultOpen={i === 0} />
            ))}
          </div>
        </Section>
      ) : null}

      {/* Contact + Localisation */}
      <Section id="contact" t={t} title="Nous contacter" overlineIndex={8} compact={compact} alt>
        <div className="aps-split" style={{ alignItems: 'flex-start' }}>
          <PublicSiteContactForm centre={centre} t={t} card={card} compact={compact} />
          <div style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ ...themeHeading(t, true), fontSize: compact ? 15 : 17 }}>Localisation</h3>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: t.textMuted }}>
              {centre.adresse}
              <br />
              {centre.ville}, {centre.pays}
            </p>
            <p style={{ margin: 0, fontSize: 14, color: t.textMuted }}>
              <a href={`tel:${centre.telephone}`} style={{ color: t.primary, textDecoration: 'none' }}>
                {centre.telephone}
              </a>
              {' · '}
              <a href={`mailto:${centre.email}`} style={{ color: t.primary, textDecoration: 'none' }}>
                {centre.email}
              </a>
            </p>
            {ouverts.length > 0 ? (
              <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 16px', fontSize: 13 }}>
                {ouverts.map((h) => (
                  <div key={h.jour} style={{ display: 'contents' }}>
                    <dt style={{ color: t.textMuted }}>{h.jour}</dt>
                    <dd style={{ margin: 0 }}>
                      {h.ouverture} – {h.fermeture}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {centre.googleMapsUrl ? (
              <a
                href={centre.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  alignSelf: 'flex-start',
                  background: t.primary,
                  color: t.primaryText,
                  borderRadius: t.buttonRadius,
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: 'none',
                  minHeight: 44,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                Voir sur la carte
              </a>
            ) : null}
          </div>
        </div>
      </Section>

      <SiteFooter centre={centre} t={t} compact={compact} />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Navigation — 5 variantes réelles selon `navStyle`.
 * ------------------------------------------------------------------ */
function SiteNav({ centre, t, compact }: { centre: Centre; t: ThemeStyle; compact: boolean }) {
  const [open, setOpen] = useState(false);

  const base: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: t.navStyle === 'centered' ? 'center' : 'space-between',
    flexDirection: t.navStyle === 'centered' ? 'column' : 'row',
    gap: t.navStyle === 'centered' ? 10 : 16,
    padding: compact ? '10px 20px' : '14px 20px',
    position: compact ? 'static' : 'sticky',
    top: 0,
    zIndex: 20,
  };

  const variants: Record<ThemeStyle['navStyle'], React.CSSProperties> = {
    solid: { background: t.surface, boxShadow: t.shadow },
    bordered: { background: t.surface, borderBottom: `3px double ${t.border}` },
    centered: { background: t.surface, borderBottom: `1px solid ${t.border}`, textAlign: 'center' },
    minimal: { background: 'transparent', borderBottom: `1px solid ${t.border}` },
    contrast: { background: t.primary, color: t.primaryText },
  };

  const linkColor = t.navStyle === 'contrast' ? t.primaryText : t.textMuted;

  return (
    <header style={{ ...base, ...variants[t.navStyle] }}>
      <span
        style={{
          fontFamily: t.headingFont,
          fontWeight: t.headingWeight,
          textTransform: t.headingTransform,
          letterSpacing: t.headingSpacing,
          fontSize: compact ? 15 : 19,
          color: t.navStyle === 'contrast' ? t.primaryText : t.text,
        }}
      >
        {centre.nom}
      </span>

      <nav style={{ display: 'none', gap: 18 }} className="aps-nav-desktop" aria-label="Navigation du site">
        {NAV_SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} style={{ color: linkColor, fontSize: 14, textDecoration: 'none' }}>
            {s.label}
          </a>
        ))}
      </nav>

      {!compact ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Ouvrir le menu"
          className="aps-nav-toggle"
          style={{
            minHeight: 44,
            minWidth: 44,
            border: `1px solid ${t.navStyle === 'contrast' ? t.primaryText : t.border}`,
            background: 'transparent',
            color: t.navStyle === 'contrast' ? t.primaryText : t.text,
            borderRadius: t.buttonRadius,
            cursor: 'pointer',
            fontSize: 18,
          }}
        >
          ☰
        </button>
      ) : null}

      {open && !compact ? (
        <div
          style={{
            position: 'absolute',
            insetInline: 0,
            top: '100%',
            background: t.surface,
            borderTop: `1px solid ${t.border}`,
            display: 'flex',
            flexDirection: 'column',
            padding: 8,
          }}
        >
          {NAV_SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => setOpen(false)}
              style={{ color: t.text, fontSize: 15, textDecoration: 'none', padding: '12px 16px', minHeight: 44, display: 'flex', alignItems: 'center' }}
            >
              {s.label}
            </a>
          ))}
        </div>
      ) : null}

      <style>{`
        @media (min-width: 960px) {
          .aps-nav-desktop { display: flex !important; }
          .aps-nav-toggle { display: none !important; }
        }
      `}</style>
    </header>
  );
}

/* ------------------------------------------------------------------ *
 * Hero — 5 mises en page réellement différentes.
 * ------------------------------------------------------------------ */
function SiteHero({
  centre,
  t,
  compact,
  formationsCount,
  niveauxCount,
}: {
  centre: Centre;
  t: ThemeStyle;
  compact: boolean;
  formationsCount: number;
  niveauxCount: number;
}) {
  const cta = (
    <a
      href="#contact"
      style={{
        background: t.primary,
        color: t.primaryText,
        borderRadius: t.buttonRadius,
        padding: compact ? '10px 18px' : '14px 30px',
        fontSize: compact ? 13 : 16,
        fontWeight: 700,
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 44,
      }}
    >
      {centre.site.ctaLabel}
    </a>
  );

  const title = (
    <h1
      style={{
        fontFamily: t.headingFont,
        fontWeight: t.headingWeight,
        textTransform: t.headingTransform,
        letterSpacing: t.headingSpacing,
        fontSize: compact ? 26 : Math.round(44 * t.headingScale),
        lineHeight: 1.15,
        margin: '0 0 16px',
      }}
    >
      {centre.nom}
    </h1>
  );

  const tagline = (
    <p style={{ fontSize: compact ? 14 : 18, color: t.textMuted, lineHeight: 1.6, margin: '0 0 24px', maxWidth: 620 }}>{centre.site.tagline}</p>
  );

  const badge = (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: t.buttonRadius,
        background: t.primary,
        color: t.primaryText,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        marginBottom: 16,
      }}
    >
      {centre.ville}
    </span>
  );

  const chiffres = (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 24 }}>
      {[
        { v: formationsCount, l: 'Formations' },
        { v: niveauxCount, l: 'Niveaux' },
        { v: centre.site.temoignages.length, l: 'Avis' },
      ].map((c) => (
        <div key={c.l}>
          <div style={{ fontSize: 26, fontWeight: 800, color: t.accent, fontFamily: t.headingFont }}>{c.v}</div>
          <div style={{ fontSize: 12, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{c.l}</div>
        </div>
      ))}
    </div>
  );

  const background =
    t.heroLayout === 'showcase' || t.heroLayout === 'stacked'
      ? `linear-gradient(160deg, ${t.surface}, ${t.bg})`
      : t.heroLayout === 'editorial'
        ? t.bg
        : t.surfaceAlt;

  const align = t.heroAlign;

  return (
    <section
      className="aps-hero"
      style={{
        background,
        borderBottom: t.sectionDivider === 'block' ? `6px solid ${t.primary}` : `1px solid ${t.border}`,
        textAlign: align,
      }}
    >
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        {t.heroLayout === 'split' ? (
          <div className="aps-split" style={{ textAlign: 'left' }}>
            <div>
              {badge}
              {title}
              {tagline}
              {cta}
            </div>
            <div style={{ ...themeCard(t), padding: 24 }}>{chiffres}</div>
          </div>
        ) : t.heroLayout === 'banner' ? (
          <div style={{ borderLeft: `6px solid ${t.primary}`, paddingLeft: 20 }}>
            {badge}
            {title}
            {tagline}
            {cta}
          </div>
        ) : t.heroLayout === 'editorial' ? (
          <div style={{ maxWidth: 720 }}>
            <p style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: t.textMuted, margin: '0 0 24px' }}>{centre.ville}</p>
            {title}
            {tagline}
            <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 20 }}>{cta}</div>
          </div>
        ) : (
          /* stacked (German Excellence) et showcase (Premium Training) */
          <div style={{ margin: '0 auto', maxWidth: 760 }}>
            {badge}
            {title}
            <div style={{ margin: '0 auto', maxWidth: 620 }}>{tagline}</div>
            {cta}
            {t.heroLayout === 'showcase' ? <div style={{ display: 'flex', justifyContent: 'center' }}>{chiffres}</div> : null}
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Section générique — porte l'overline, le fond alterné et le séparateur
 * définis par le thème.
 * ------------------------------------------------------------------ */
function Section({
  id,
  t,
  title,
  overlineIndex,
  children,
  compact,
  alt = false,
  narrow = false,
}: {
  id: string;
  t: ThemeStyle;
  title: string;
  overlineIndex: number;
  children: React.ReactNode;
  compact: boolean;
  alt?: boolean;
  narrow?: boolean;
}) {
  const overline =
    t.sectionOverline === 'number' ? String(overlineIndex).padStart(2, '0') : t.sectionOverline === 'dash' ? '—' : null;

  return (
    <section
      id={id}
      className="aps-section"
      style={{
        background: alt ? t.surfaceAlt : 'transparent',
        borderTop: t.sectionDivider === 'line' ? `1px solid ${t.border}` : undefined,
      }}
    >
      <div style={{ maxWidth: narrow ? 760 : 1080, margin: '0 auto' }}>
        <header style={{ marginBottom: 24 }}>
          {overline ? (
            <span style={{ display: 'block', color: t.accent, fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', marginBottom: 6 }}>{overline}</span>
          ) : null}
          <h2 style={themeHeading(t, compact)}>{title}</h2>
          {t.sectionDivider === 'block' ? <div style={{ width: 56, height: 4, background: t.primary, marginTop: 12 }} /> : null}
        </header>
        {children}
      </div>
    </section>
  );
}

function Stat({ t, card, value, label }: { t: ThemeStyle; card: React.CSSProperties; value: string; label: string }) {
  return (
    <div style={{ ...card, padding: 16 }}>
      <div style={{ fontFamily: t.headingFont, fontSize: 20, fontWeight: 800, color: t.primary }}>{value}</div>
      <div style={{ fontSize: 12, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  );
}

function FaqItem({
  t,
  card,
  question,
  reponse,
  defaultOpen,
}: {
  t: ThemeStyle;
  card: React.CSSProperties;
  question: string;
  reponse: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: '100%',
          minHeight: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '14px 18px',
          background: 'transparent',
          border: 'none',
          color: t.text,
          fontSize: 15,
          fontWeight: 700,
          textAlign: 'left',
          cursor: 'pointer',
          fontFamily: t.bodyFont,
        }}
      >
        {question}
        <span style={{ color: t.accent, fontSize: 20, lineHeight: 1 }}>{open ? '−' : '+'}</span>
      </button>
      {open ? <p style={{ margin: 0, padding: '0 18px 16px', fontSize: 14, color: t.textMuted, lineHeight: 1.7 }}>{reponse}</p> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Footer — 3 variantes selon `footerStyle`.
 * ------------------------------------------------------------------ */
function SiteFooter({ centre, t, compact }: { centre: Centre; t: ThemeStyle; compact: boolean }) {
  const social = Object.entries(centre.socialLinks ?? {}).filter(([, v]) => !!v);
  const isContrast = t.footerStyle === 'contrast';
  const bg = isContrast ? t.primary : t.surface;
  const fg = isContrast ? t.primaryText : t.text;
  const muted = isContrast ? t.primaryText : t.textMuted;

  return (
    <footer style={{ background: bg, color: fg, borderTop: `1px solid ${t.border}`, padding: compact ? '20px' : '40px 24px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        {t.footerStyle === 'columns' ? (
          <div className="aps-grid aps-grid-3" style={{ marginBottom: 24, textAlign: 'left' }}>
            <div>
              <p style={{ ...themeHeading(t, true), fontSize: 16, marginBottom: 8 }}>{centre.nom}</p>
              <p style={{ margin: 0, fontSize: 13, color: muted, opacity: isContrast ? 0.85 : 1 }}>{centre.site.tagline}</p>
            </div>
            <div>
              <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: muted, marginBottom: 8 }}>Contact</p>
              <p style={{ margin: 0, fontSize: 13, color: muted }}>{centre.telephone}</p>
              <p style={{ margin: 0, fontSize: 13, color: muted }}>{centre.email}</p>
            </div>
            <div>
              <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: muted, marginBottom: 8 }}>Adresse</p>
              <p style={{ margin: 0, fontSize: 13, color: muted }}>
                {centre.adresse}, {centre.ville}
              </p>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: muted, margin: '0 0 12px', textAlign: 'center' }}>
            {centre.adresse} · {centre.telephone} · {centre.email}
          </p>
        )}

        {social.length > 0 ? (
          <div style={{ display: 'flex', gap: 16, justifyContent: t.footerStyle === 'columns' ? 'flex-start' : 'center', flexWrap: 'wrap', marginBottom: 12 }}>
            {social.map(([name, url]) => (
              <a key={name} href={url as string} target="_blank" rel="noreferrer" style={{ color: isContrast ? t.primaryText : t.primary, fontSize: 13, textDecoration: 'none', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>
                {name}
              </a>
            ))}
          </div>
        ) : null}

        <p style={{ fontSize: 11, color: muted, opacity: 0.8, margin: 0, textAlign: t.footerStyle === 'columns' ? 'left' : 'center' }}>
          © {new Date().getFullYear()} {centre.nom} — Propulsé par Amud Skills
        </p>
      </div>
    </footer>
  );
}
