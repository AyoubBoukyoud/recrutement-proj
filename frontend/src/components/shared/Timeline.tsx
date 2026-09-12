import { useLanguage } from '@/context/LanguageContext';
import type { Language, TimelineStep } from '@/lib/types';

const DATE_LOCALE: Record<Language, string> = { fr: 'fr-FR', ar: 'ar-MA', en: 'en-GB', de: 'de-DE' };

function formatStepDate(value: string, locale: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(parsed);
}

const STATUS_ICON: Record<TimelineStep['status'], string> = {
  termine: 'check',
  en_cours: 'sync',
  a_venir: 'radio_button_unchecked',
};

const STATUS_CIRCLE: Record<TimelineStep['status'], string> = {
  termine: 'bg-primary text-onPrimary',
  en_cours: 'bg-primary text-onPrimary',
  a_venir: 'bg-surface-high text-onSurface-variant',
};

interface TimelineProps {
  steps: TimelineStep[];
}

export function Timeline({ steps }: TimelineProps) {
  const { language } = useLanguage();
  const locale = DATE_LOCALE[language];
  return (
    <div className="relative space-y-6 pl-9">
      <div className="absolute bottom-4 left-[15px] top-4 w-0.5 bg-outline-variant" />
      {steps.map((step) => (
        <div key={step.id} className="relative">
          <span
            className={`absolute -left-9 top-0 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-surface ${STATUS_CIRCLE[step.status]}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {STATUS_ICON[step.status]}
            </span>
          </span>
          <div className="rounded-xl border border-outline-variant/30 bg-surface-lowest p-4 shadow-soft">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-onSurface">{step.label}</span>
              {step.date && (
                <span className="shrink-0 text-[11px] font-medium text-outline">{formatStepDate(step.date, locale)}</span>
              )}
            </div>
            <p className="mt-1 text-xs text-onSurface-variant">{step.description}</p>
            {step.status === 'en_cours' && (
              <span className="mt-2 inline-block rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-onPrimary">
                En cours
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
