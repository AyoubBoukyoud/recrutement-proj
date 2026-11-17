/**
 * Graduations d'axe compactes : `32 000` ne tient pas dans les 32 px de
 * l'axe Y et était coupé (revenus en MAD). Au-delà de 1 000 on affiche
 * `32k`, au-delà du million `1,2M` ; la valeur exacte reste dans le tooltip.
 */
export function compactTick(value: number | string): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return String(value);
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}M`;
  if (abs >= 1_000) return `${(n / 1_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}k`;
  return n.toLocaleString('fr-FR');
}
