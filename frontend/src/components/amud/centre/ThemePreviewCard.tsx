'use client';

import { THEMES, type ThemeId } from '@/data/amud/centerTypes';
import { themeStyleFor } from '@/lib/amud/themeStyles';

/**
 * Vignette de sélection de thème : une **maquette miniature** réellement
 * rendue avec les tokens du thème (navigation, hero, cartes, bouton,
 * typographie), et non une simple pastille de couleur. Elle est dessinée à
 * partir du même `themeStyleFor()` que le site public, donc ce que la
 * vignette montre est ce que le site rendra.
 */
export function ThemePreviewCard({
  theme,
  selected,
  disabled,
  onSelect,
}: {
  theme: ThemeId;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  const t = themeStyleFor(theme);
  const meta = THEMES.find((th) => th.id === theme);

  const navBg = t.navStyle === 'contrast' ? t.primary : t.surface;
  const navFg = t.navStyle === 'contrast' ? t.primaryText : t.text;
  const cardBg = t.cardStyle === 'luxe' ? t.surfaceAlt : t.surface;
  const cardBorder = t.cardStyle === 'bold' ? `2px solid ${t.primary}` : `1px solid ${t.border}`;
  const cardRadius = t.cardStyle === 'minimal' ? 0 : Math.min(parseInt(t.radius, 10) || 0, 10);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex flex-col overflow-hidden rounded-xl border-2 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
        selected ? 'border-amud-primary shadow-md' : 'border-amud-outline-variant hover:border-amud-primary/50'
      }`}
    >
      {/* Maquette miniature */}
      <div style={{ background: t.bg, fontFamily: t.bodyFont, padding: 0 }} aria-hidden="true">
        <div
          style={{
            background: navBg,
            color: navFg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: t.navStyle === 'centered' ? 'center' : 'space-between',
            gap: 4,
            padding: '6px 8px',
            borderBottom: t.navStyle === 'bordered' ? `2px double ${t.border}` : `1px solid ${t.border}`,
          }}
        >
          <span style={{ fontFamily: t.headingFont, fontWeight: t.headingWeight, fontSize: 8, textTransform: t.headingTransform, letterSpacing: t.headingSpacing }}>
            Centre
          </span>
          <span style={{ display: 'flex', gap: 4 }}>
            {[10, 12, 8].map((w, i) => (
              <span key={i} style={{ display: 'block', width: w, height: 2, background: navFg, opacity: 0.5 }} />
            ))}
          </span>
        </div>

        {/* Hero — reflète `heroLayout` */}
        <div
          style={{
            background: t.heroLayout === 'showcase' || t.heroLayout === 'stacked' ? `linear-gradient(160deg, ${t.surface}, ${t.bg})` : t.surfaceAlt,
            padding: 10,
            textAlign: t.heroAlign,
            borderLeft: t.heroLayout === 'banner' ? `3px solid ${t.primary}` : undefined,
            display: t.heroLayout === 'split' ? 'flex' : 'block',
            gap: 8,
            alignItems: 'center',
            borderBottom: t.sectionDivider === 'block' ? `3px solid ${t.primary}` : undefined,
          }}
        >
          <div style={{ flex: 1 }}>
            <span style={{ display: 'inline-block', background: t.primary, color: t.primaryText, borderRadius: t.buttonRadius, padding: '1px 5px', fontSize: 5, fontWeight: 700 }}>
              VILLE
            </span>
            <div
              style={{
                fontFamily: t.headingFont,
                fontWeight: t.headingWeight,
                textTransform: t.headingTransform,
                letterSpacing: t.headingSpacing,
                color: t.text,
                fontSize: Math.round(13 * t.headingScale),
                margin: '4px 0 3px',
              }}
            >
              Apprendre l’allemand
            </div>
            <div style={{ height: 2, width: '70%', background: t.textMuted, opacity: 0.35, margin: t.heroAlign === 'center' ? '0 auto 6px' : '0 0 6px' }} />
            <span style={{ display: 'inline-block', background: t.primary, color: t.primaryText, borderRadius: t.buttonRadius, padding: '3px 10px', fontSize: 6, fontWeight: 700 }}>
              S’inscrire
            </span>
          </div>
          {t.heroLayout === 'split' ? (
            <div style={{ flex: 1, background: cardBg, border: cardBorder, borderRadius: cardRadius, padding: 6, display: 'flex', gap: 6 }}>
              {[0, 1].map((i) => (
                <div key={i}>
                  <div style={{ color: t.accent, fontWeight: 800, fontSize: 9, fontFamily: t.headingFont }}>12</div>
                  <div style={{ height: 2, width: 14, background: t.textMuted, opacity: 0.35 }} />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Cartes de formations */}
        <div style={{ display: 'flex', gap: 6, padding: 10 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                background: cardBg,
                border: cardBorder,
                borderRadius: cardRadius,
                boxShadow: t.cardStyle === 'soft' || t.cardStyle === 'luxe' ? t.shadow : 'none',
                padding: 6,
              }}
            >
              <div style={{ color: t.accent, fontSize: 5, fontWeight: 700, marginBottom: 3 }}>A{i + 1}</div>
              <div style={{ height: 2, background: t.text, opacity: 0.6, marginBottom: 3 }} />
              <div style={{ height: 2, width: '60%', background: t.textMuted, opacity: 0.35 }} />
              <div style={{ color: t.primary, fontWeight: 800, fontSize: 7, marginTop: 4 }}>3 200 MAD</div>
            </div>
          ))}
        </div>

        {/* Pied */}
        <div
          style={{
            background: t.footerStyle === 'contrast' ? t.primary : t.surface,
            borderTop: `1px solid ${t.border}`,
            padding: '6px 8px',
            display: 'flex',
            justifyContent: t.footerStyle === 'columns' ? 'flex-start' : 'center',
            gap: 6,
          }}
        >
          {[14, 10, 12].map((w, i) => (
            <span key={i} style={{ height: 2, width: w, background: t.footerStyle === 'contrast' ? t.primaryText : t.textMuted, opacity: 0.5 }} />
          ))}
        </div>
      </div>

      {/* Étiquette */}
      <div className="flex flex-1 items-start justify-between gap-sm bg-amud-surface-container-lowest p-md">
        <div className="min-w-0">
          <span className="block text-label-md font-semibold text-amud-on-surface">{meta?.nom ?? theme}</span>
          <span className="mt-0.5 block text-label-sm text-amud-on-surface-variant">{meta?.description}</span>
        </div>
        {selected ? (
          <span className="material-symbols-outlined shrink-0 text-amud-primary" aria-hidden="true">
            check_circle
          </span>
        ) : null}
      </div>
    </button>
  );
}
