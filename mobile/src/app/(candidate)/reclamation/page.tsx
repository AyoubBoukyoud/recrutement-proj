'use client';

// Interface 14 — Formulaire de réclamation.

import { useState } from 'react';
import Link from 'next/link';
import { useNetwork } from '@/context/NetworkContext';
import { useProfile } from '@/context/ProfileContext';
import { useLanguage } from '@/context/LanguageContext';
import { AudioRecorder } from '@/components/shared/AudioRecorder';
import { WithPageSkeleton } from '@/components/shared/SkeletonLoader';
import { MOCK_RECLAMATIONS } from '@/lib/mockData';
import type { ReclamationEntry } from '@/lib/types';

const CATEGORIES = ['Problème technique', 'Question sur mon dossier', 'Signaler une offre suspecte', 'Suggestion', 'Autre'];
const CATEGORY_LABEL_KEYS: Record<string, string> = {
  'Problème technique': 'technique',
  'Question sur mon dossier': 'dossier',
  'Signaler une offre suspecte': 'offreSuspecte',
  'Suggestion': 'suggestion',
  'Autre': 'autre',
};

export default function ReclamationPage() {
  const { t } = useLanguage();
  const { isOnline, queueAction } = useNetwork();
  const { profile } = useProfile();
  const [entries, setEntries] = useState<ReclamationEntry[]>(
    MOCK_RECLAMATIONS.filter((r) => r.authorRole === 'candidate')
  );
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [voiceNoteUrl, setVoiceNoteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketRef, setTicketRef] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!category || (!message.trim() && !voiceNoteUrl)) {
      setError(t('candidateD:reclamation.form.errorRequired'));
      return;
    }
    setError(null);
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const entry: ReclamationEntry = {
      id: `rec_${Date.now()}`,
      subject: category,
      category,
      message: message.trim() || t('candidateD:reclamation.form.voiceNoteFallback'),
      status: 'ouverte',
      createdAt: new Date().toISOString(),
      authorName: `${profile.firstName} ${profile.lastName}`.trim() || t('candidateD:reclamation.form.defaultAuthor'),
      authorRole: 'candidate',
    };

    if (!isOnline) {
      queueAction('submit_reclamation', { entry });
    }

    setEntries((prev) => [entry, ...prev]);
    setCategory('');
    setMessage('');
    setVoiceNoteUrl(null);
    setIsSubmitting(false);
    setTicketRef(`AMU-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`);
  };

  return (
    <WithPageSkeleton layout="form">
    <div className="min-h-screen bg-surface pb-24">
      <header className="sticky top-0 z-10 flex h-16 items-center border-b border-surface-container bg-surface px-6">
        <Link href="/dashboard" className="mr-4 text-primary-dark transition-transform active:scale-95">
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
        </Link>
        <h1 className="text-lg font-bold text-primary-dark">{t('candidateD:reclamation.header.title')}</h1>
      </header>

      <main className="mx-auto max-w-md space-y-8 px-6 pt-8">
        <div className="flex flex-col items-center">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary-container shadow-sm">
            <span className="material-symbols-outlined fill text-on-primary" style={{ fontSize: 44 }}>
              report_problem
            </span>
          </div>
          <h2 className="text-center text-2xl font-bold text-primary-dark">{t('candidateD:reclamation.intro.title')}</h2>
          <p className="mt-2 text-center text-sm text-onSurface-variant">{t('candidateD:reclamation.intro.subtitle')}</p>
        </div>

        <Link
          href="/faq"
          className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low p-4 shadow-soft transition-colors hover:bg-surface-container"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary-dark" style={{ fontSize: 22 }}>quiz</span>
            <div>
              <p className="text-sm font-bold text-onSurface">{t('candidateD:reclamation.faqLink.title')}</p>
              <p className="text-xs text-onSurface-variant">{t('candidateD:reclamation.faqLink.subtitle')}</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-outline" style={{ fontSize: 18 }}>chevron_right</span>
        </Link>

        <section className="space-y-6">
          <div className="space-y-2">
            <label className="block px-1 text-sm font-medium text-onSurface-variant">{t('candidateD:reclamation.form.subjectLabel')}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3.5 text-sm outline-none transition-all focus:border-primary-dark focus:ring-2 focus:ring-primary-dark/20"
            >
              <option value="" disabled>{t('candidateD:reclamation.form.subjectPlaceholder')}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{t(`candidateD:reclamation.categories.${CATEGORY_LABEL_KEYS[c]}`)}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between px-1">
              <label className="text-sm font-medium text-onSurface-variant">{t('candidateD:reclamation.form.messageLabel')}</label>
              <span dir="ltr" className="text-xs text-onSurface-variant">{t('candidateD:reclamation.form.charCount', { count: message.length })}</span>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
              placeholder={t('candidateD:reclamation.form.messagePlaceholder')}
              className="h-36 w-full resize-none rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-sm outline-none transition-all focus:border-primary-dark focus:ring-2 focus:ring-primary-dark/20"
            />
          </div>

          <div className="flex items-center gap-4 py-2">
            <div className="h-px flex-1 bg-outline-variant" />
            <span className="text-xs font-bold text-outline">{t('candidateD:reclamation.form.or')}</span>
            <div className="h-px flex-1 bg-outline-variant" />
          </div>

          <div className="space-y-4 rounded-xl bg-surface-container-low p-4">
            <p className="text-center text-sm font-semibold text-onSurface">{t('candidateD:reclamation.form.voiceTitle')}</p>
            <AudioRecorder onRecordingComplete={(url) => setVoiceNoteUrl(url)} />
            {voiceNoteUrl && (
              <p className="text-center text-xs font-semibold text-primary-dark">{t('candidateD:reclamation.form.voiceReady')}</p>
            )}
          </div>
        </section>

        {error && <p className="text-sm font-medium text-error">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary-container py-4 text-lg font-semibold text-on-primary shadow-lg transition-all hover:brightness-105 active:scale-95 disabled:opacity-60"
        >
          {isSubmitting ? t('candidateD:reclamation.form.submitLoading') : t('candidateD:reclamation.form.submit')}
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>send</span>
        </button>

        <section className="space-y-3 pb-6">
          <h2 className="text-sm font-bold text-primary-dark">{t('candidateD:reclamation.list.title', { count: entries.length })}</h2>
          <div className="space-y-2.5">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3.5 shadow-soft">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-onSurface">{entry.subject}</span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      entry.status === 'resolue'
                        ? 'bg-primary-light text-onPrimary-container'
                        : entry.status === 'en_cours'
                        ? 'bg-gold-light text-gold-dark'
                        : 'bg-secondary-light text-onSecondary-container'
                    }`}
                  >
                    {entry.status === 'resolue'
                      ? t('candidateD:reclamation.status.resolue')
                      : entry.status === 'en_cours'
                      ? t('candidateD:reclamation.status.enCours')
                      : t('candidateD:reclamation.status.ouverte')}
                  </span>
                </div>
                <p className="mt-1 text-xs text-onSurface-variant">{entry.message}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {ticketRef && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-primary-dark/40 px-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-surface-container-lowest p-8 text-center shadow-2xl">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-container text-on-primary">
              <span className="material-symbols-outlined" style={{ fontSize: 40 }}>check</span>
            </div>
            <h3 className="mb-2 text-xl font-bold text-primary-dark">{t('candidateD:reclamation.successModal.title')}</h3>
            <p className="mb-6 text-sm text-onSurface-variant">{t('candidateD:reclamation.successModal.subtitle')}</p>
            <div className="inline-block rounded-lg border border-outline-variant bg-surface-container p-3">
              <span className="block text-xs font-bold uppercase tracking-wider text-onSurface-variant">{t('candidateD:reclamation.successModal.referenceLabel')}</span>
              <span dir="ltr" className="text-lg font-bold text-primary-dark">#{ticketRef}</span>
            </div>
            <button
              type="button"
              onClick={() => setTicketRef(null)}
              className="mt-8 w-full rounded-xl bg-primary-dark py-4 text-sm font-semibold text-on-primary"
            >
              {t('candidateD:reclamation.successModal.backHome')}
            </button>
          </div>
        </div>
      )}
    </div>
    </WithPageSkeleton>
  );
}
