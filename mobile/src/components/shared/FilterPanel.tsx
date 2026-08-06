'use client';

import { useLanguage } from '@/context/LanguageContext';

interface FilterPanelProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onApply?: () => void;
  onReset?: () => void;
  children: React.ReactNode;
}

export function FilterPanel({ title, isOpen, onClose, onApply, onReset, children }: FilterPanelProps) {
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[85vh] w-full flex-col rounded-t-3xl bg-surface shadow-floating md:max-w-md md:rounded-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant p-4">
          <h3 className="text-base font-bold text-primary">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common:components.filterPanel.close')}
            className="rounded-full p-1.5 hover:bg-surface-container"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              close
            </span>
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">{children}</div>
        <div className="flex gap-3 border-t border-outline-variant p-4">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="flex-1 rounded-xl border border-outline py-2.5 text-sm font-semibold text-onSurface-variant"
            >
              {t('common:components.filterPanel.reset')}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onApply?.();
              onClose();
            }}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-onPrimary transition hover:bg-primary/90"
          >
            {t('common:components.filterPanel.apply')}
          </button>
        </div>
      </div>
    </div>
  );
}
