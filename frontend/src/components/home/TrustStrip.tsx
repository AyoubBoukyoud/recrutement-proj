'use client';

import { useHomeContent } from '@/lib/useLocalizedContent';

/**
 * Trois phrases placées avant tout argumentaire, parce qu'elles répondent aux
 * trois peurs réelles du visiteur — payer, être fiché, perdre le contrôle.
 * Reconnaître la peur avant de vendre est ce qui débloque l'état de défiance.
 *
 * Pas de carrousel en mobile : il cacherait deux tiers du message.
 */
export function TrustStrip() {
  const { trust } = useHomeContent();
  return (
    <section className="border-y border-outline-variant/40 bg-surface-container/70">
      <ul className="mx-auto grid w-full max-w-[1280px] gap-3 px-6 py-5 sm:grid-cols-3 lg:px-12">
        {trust.items.map((item) => (
          <li key={item.label} className="flex items-center gap-2.5 text-sm font-semibold text-onSurface">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }} aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
