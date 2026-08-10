'use client';

import { CEFR_LEVELS } from '@/lib/mockData';

interface CEFRGaugeProps {
  level: (typeof CEFR_LEVELS)[number] | null;
  interactive?: boolean;
  onChange?: (level: (typeof CEFR_LEVELS)[number]) => void;
  label?: string;
}

export function CEFRGauge({ level, interactive = false, onChange, label }: CEFRGaugeProps) {
  const activeIndex = level ? CEFR_LEVELS.indexOf(level) : -1;

  return (
    <div>
      {label && <div className="mb-2 text-sm font-bold text-primary">{label}</div>}
      <div className="flex items-center gap-1.5">
        {CEFR_LEVELS.map((lvl, idx) => {
          const isActive = idx <= activeIndex;
          const Tag = interactive ? 'button' : 'div';
          return (
            <Tag
              key={lvl}
              type={interactive ? 'button' : undefined}
              onClick={interactive && onChange ? () => onChange(lvl) : undefined}
              className={`h-2.5 flex-1 rounded-sm transition-colors ${
                isActive ? 'bg-primary' : 'bg-outline-variant/40'
              } ${interactive ? 'cursor-pointer hover:opacity-80' : ''}`}
            />
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-bold uppercase tracking-wider text-outline">
        {CEFR_LEVELS.map((lvl) => (
          <span key={lvl}>{lvl}</span>
        ))}
      </div>
      {level && <div className="mt-1.5 text-sm font-bold text-primary">Niveau {level}</div>}
    </div>
  );
}
