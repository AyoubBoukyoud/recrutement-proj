'use client';

import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';

/**
 * Gauge circulaire — objectif commercial ("82/100 appels" → 82%), progression
 * étudiant, taux de présence, etc. Un seul composant pour toute progression
 * bornée 0→100%, plutôt qu'une variante par dashboard.
 */
export function ProgressGauge({
  value,
  max = 100,
  label,
  sublabel,
  color,
  size = 160,
}: {
  value: number;
  max?: number;
  label?: string;
  sublabel?: string;
  color?: string;
  size?: number;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;
  const data = [{ name: label ?? 'progression', value: pct, fill: color ?? 'var(--amud-primary)' }];

  return (
    <div role="img" aria-label={`${label ?? 'Progression'} : ${pct}%`} className="flex flex-col items-center">
      <div style={{ width: size, height: size }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="72%" outerRadius="100%" data={data} startAngle={90} endAngle={-270} barSize={12}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar background={{ fill: 'var(--amud-surface-container-high)' }} dataKey="value" cornerRadius={8} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-headline-md font-bold text-amud-on-surface">{pct}%</span>
          {sublabel ? <span className="text-label-sm text-amud-on-surface-variant">{sublabel}</span> : null}
        </div>
      </div>
      {label ? <p className="mt-sm text-center text-label-md text-amud-on-surface-variant">{label}</p> : null}
    </div>
  );
}
