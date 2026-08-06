import Link from 'next/link';
import type { CandidateSummary } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';

const STATUS_CLASS: Record<CandidateSummary['status'], string> = {
  nouveau: 'bg-primary text-onPrimary',
  contacte: 'bg-surface-high text-onSurface-variant',
  entretien: 'bg-gold text-onGold',
  valide: 'bg-primary-light text-onPrimary-container',
};

interface CandidateCardProps {
  candidate: CandidateSummary;
  href?: string;
}

export function CandidateCard({ candidate, href }: CandidateCardProps) {
  const { t } = useLanguage();
  const body = (
    <div className="flex items-center gap-4 rounded-xl border border-outline-variant bg-surface-lowest p-4 shadow-soft transition-colors hover:border-primary/50">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-primary">
        {candidate.avatarInitials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-bold text-onSurface">{candidate.name}</span>
          <span className="shrink-0 text-xs font-bold text-gold-dark">{candidate.matchScore}%</span>
        </div>
        <div className="truncate text-xs font-semibold text-primary">{candidate.role}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-0.5 text-[10px] text-outline">
            <span className="material-symbols-outlined" style={{ fontSize: 11 }}>
              location_on
            </span>
            {candidate.city}
          </span>
          <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-bold text-onSurface-variant">
            {candidate.languageLevel}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_CLASS[candidate.status]}`}>
            {t(`common:components.candidateCard.status.${candidate.status}`)}
          </span>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {body}
      </Link>
    );
  }

  return body;
}
