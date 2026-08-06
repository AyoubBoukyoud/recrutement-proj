'use client';

import type { DocumentEntry } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';

const STATUS_ICON: Record<DocumentEntry['status'], string> = {
  valide: 'check_circle',
  en_attente: 'schedule',
  rejete: 'cancel',
};

const STATUS_CLASS: Record<DocumentEntry['status'], string> = {
  valide: 'text-primary',
  en_attente: 'text-gold-dark',
  rejete: 'text-error',
};

const STATUS_KEY: Record<DocumentEntry['status'], string> = {
  valide: 'valide',
  en_attente: 'enAttente',
  rejete: 'rejete',
};

interface DocumentViewerProps {
  document: DocumentEntry;
  previewUrl?: string | null;
  onRemove?: () => void;
}

export function DocumentViewer({ document, previewUrl, onRemove }: DocumentViewerProps) {
  const { t } = useLanguage();
  const isImage = /\.(png|jpe?g|webp)$/i.test(document.name);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-lowest p-3 shadow-soft">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary-light text-primary">
        {previewUrl && isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={document.name} className="h-full w-full object-cover" />
        ) : (
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
            {isImage ? 'image' : 'description'}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-onSurface">{document.name}</div>
        <div className={`mt-1 flex items-center gap-1.5 text-xs font-medium ${STATUS_CLASS[document.status]}`}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            {STATUS_ICON[document.status]}
          </span>
          {t(`common:components.documentViewer.status.${STATUS_KEY[document.status]}`)}
        </div>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded-full px-2 py-1 text-xs font-semibold text-error hover:bg-error-light"
        >
          {t('common:components.documentViewer.remove')}
        </button>
      )}
    </div>
  );
}
