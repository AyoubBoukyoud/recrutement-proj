'use client';

import Link from 'next/link';
import { useHomeContent } from '@/lib/useLocalizedContent';
import type { Trade } from '@/lib/trades';
import { Reveal } from './Reveal';

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

const RECOGNITION_ICON: Record<Trade['recognition'], string> = {
  required: 'verified_user',
  recommended: 'task_alt',
  none: 'remove_moderator',
};

/**
 * Carte métier : photo (repli icône + dégradé tant qu'aucune image réelle
 * n'est renseignée sur le métier), niveau d'allemand, statut de
 * reconnaissance du diplôme, et lien vers la fiche complète.
 *
 * `trade.image` reste `null` pour l'instant — aucune photographie
 * professionnelle vérifiée n'est disponible. Le composant est prêt à
 * l'afficher dès qu'un chemin d'image est renseigné dans `trades.*.json`.
 */
export function JobCard({ trade, delay = 0 }: { trade: Trade; delay?: number }) {
  const { trades: content } = useHomeContent();

  return (
    <Reveal delay={delay} className="h-full min-w-[78%] snap-start sm:min-w-0">
      <Link
        href={`/metiers/${trade.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-lowest transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-soft"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container">
          {trade.image ? (
            <img
              src={trade.image}
              alt={trade.imageAlt ?? trade.label}
              loading="lazy"
              width={480}
              height={360}
              className="h-full w-full object-cover transition-transform duration-300 motion-reduce:transition-none group-hover:scale-105 motion-reduce:group-hover:scale-100"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-primary/5 to-transparent"
            >
              <Icon name={trade.icon} className="text-6xl text-primary/40" />
            </div>
          )}

          {trade.popular ? (
            <span className="absolute start-3 top-3 inline-flex items-center gap-1 rounded-full bg-surface-lowest/90 px-2.5 py-1 text-[11px] font-bold text-primary shadow-soft backdrop-blur">
              <Icon name="trending_up" className="text-sm" />
              {content.badge}
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-6">
          <h3 className="text-lg font-bold leading-snug text-primary-dark transition-colors group-hover:text-primary">
            {trade.label}
          </h3>

          <dl className="mb-6 mt-4 space-y-1.5 text-sm text-onSurface-variant">
            <div className="flex items-center gap-2">
              <dt className="sr-only">{content.levelPrefix}</dt>
              <Icon name="translate" className="text-base text-outline" />
              <dd className="font-semibold text-onSurface">
                {content.levelPrefix} {trade.germanLevel}
              </dd>
            </div>
            <div className="flex items-start gap-2">
              <dt className="sr-only">{content.qualificationPrefix}</dt>
              <Icon name={RECOGNITION_ICON[trade.recognition]} className="mt-0.5 shrink-0 text-base text-outline" />
              <dd>
                <span className="font-semibold text-onSurface">{content.qualificationPrefix} : </span>
                {content.recognition[trade.recognition]}
              </dd>
            </div>
          </dl>

          <span className="mt-auto inline-flex items-center gap-1.5 border-t border-outline-variant/50 pt-4 text-sm font-semibold text-primary">
            {content.cardCta}
            <Icon
              name="arrow_forward"
              className="text-base transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
            />
          </span>
        </div>
      </Link>
    </Reveal>
  );
}
