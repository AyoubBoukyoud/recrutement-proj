'use client';

// Interface 14 — Formulaire de réclamation.

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useNetwork } from '@/context/NetworkContext';
import { AudioRecorder } from '@/components/shared/AudioRecorder';
import { Button } from '@/components/shared/Button';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { ApiError } from '@/lib/api';
import {
  listMyComplaints,
  submitTextComplaint,
  submitVoiceComplaint,
  parseSubject,
  type Complaint,
} from '@/lib/complaints';
import { useLanguage } from '@/context/LanguageContext';
import { candidateReclamationContentFor, categoryLabelFor } from '@/lib/candidateReclamationContent';

// Valeurs canoniques (français) : préfixées telles quelles dans `body` lors
// de l'envoi (`submitTextComplaint`/`submitVoiceComplaint`) puis relues par
// `parseSubject` — les garder stables évite des sujets incohérents selon la
// langue active au moment de l'envoi. L'affichage traduit passe par
// `categoryLabelFor`.
const CATEGORIES = ['Problème technique', 'Question sur mon dossier', 'Signaler une offre suspecte', 'Suggestion', 'Autre'];

export default function ReclamationPage() {
  const { language } = useLanguage();
  const content = candidateReclamationContentFor(language);

  const STATUS_LABELS: Record<Complaint['status'], string> = content.statusLabels;

  function messageOf(error: unknown, fallback: string): string {
    if (error instanceof ApiError) {
      if (error.isNetworkFailure) return content.errors.networkUnreachable;
      if (error.status === 401) return content.errors.sessionExpired;
      return error.message || fallback;
    }
    return fallback;
  }

  const { token } = useAuth();
  const { isOnline } = useNetwork();
  const [entries, setEntries] = useState<Complaint[]>([]);
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketRef, setTicketRef] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!token) return;
    listMyComplaints(token)
      .then(setEntries)
      .catch(() => setEntries([]));
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSubmit = async () => {
    if (!token) return;
    if (!category || (!message.trim() && !voiceBlob)) {
      setError(content.form.validationError);
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const entry = voiceBlob
        ? await submitVoiceComplaint(category, voiceBlob, token)
        : await submitTextComplaint(category, message.trim(), token);

      setEntries((prev) => [entry, ...prev]);
      setCategory('');
      setMessage('');
      setVoiceBlob(null);
      setVoiceUrl(null);
      setTicketRef(`AMU-${new Date().getFullYear()}-${String(entry.id).padStart(4, '0')}`);
    } catch (cause) {
      setError(messageOf(cause, content.errors.submitFailed));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="sticky top-0 z-10 flex h-16 items-center border-b border-surface-container bg-surface px-6 lg:px-10">
        <Link href="/dashboard" className="mr-4 text-primary-dark transition-transform active:scale-95">
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
        </Link>
        <h1 className="flex-1 text-lg font-bold text-primary-dark">{content.header.title}</h1>
        <div className="flex items-center gap-1">
          <LanguageSwitcher compact />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-8 px-6 pt-8 lg:max-w-5xl lg:px-10 lg:pt-10">
        <div className="flex flex-col items-center lg:items-start lg:text-left">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary-container shadow-sm">
            <span className="material-symbols-outlined fill text-on-primary" style={{ fontSize: 44 }}>
              report_problem
            </span>
          </div>
          <h2 className="text-center text-2xl font-bold text-primary-dark lg:text-left">{content.intro.title}</h2>
          <p className="mt-2 text-center text-sm text-onSurface-variant lg:text-left">{content.intro.body}</p>
        </div>

        {!isOnline && (
          <p className="rounded-xl bg-secondary-light p-3 text-sm font-medium text-onSecondary-container">
            {content.offlineNotice}
          </p>
        )}

        <div className="space-y-8 lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-8 lg:space-y-0">
        <div className="space-y-8">
        <Link
          href="/faq"
          className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low p-4 shadow-soft transition-colors hover:bg-surface-container"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary-dark" style={{ fontSize: 22 }}>quiz</span>
            <div>
              <p className="text-sm font-bold text-onSurface">{content.faqLink.title}</p>
              <p className="text-xs text-onSurface-variant">{content.faqLink.subtitle}</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-outline" style={{ fontSize: 18 }}>chevron_right</span>
        </Link>

        <section className="space-y-6">
          <div className="space-y-2">
            <label className="block px-1 text-sm font-medium text-onSurface-variant">{content.form.subjectLabel}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-outline bg-surface-container-lowest px-4 py-3.5 text-sm outline-none transition-all focus:border-primary-dark focus:ring-2 focus:ring-primary-dark/20"
            >
              <option value="" disabled>{content.form.subjectPlaceholder}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{categoryLabelFor(content, c)}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between px-1">
              <label className="text-sm font-medium text-onSurface-variant">{content.form.messageLabel}</label>
              <span className="text-xs text-onSurface-variant">{message.length} / 1000</span>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
              placeholder={content.form.messagePlaceholder}
              className="h-36 w-full resize-none rounded-xl border border-outline bg-surface-container-lowest p-4 text-sm outline-none transition-all focus:border-primary-dark focus:ring-2 focus:ring-primary-dark/20"
            />
          </div>

          <div className="flex items-center gap-4 py-2">
            <div className="h-px flex-1 bg-outline-variant" />
            <span className="text-xs font-bold text-outline">{content.form.orDivider}</span>
            <div className="h-px flex-1 bg-outline-variant" />
          </div>

          <div className="space-y-4 rounded-xl bg-surface-container-low p-4">
            <p className="text-center text-sm font-semibold text-onSurface">{content.form.voiceTitle}</p>
            <AudioRecorder
              onRecordingComplete={(url, blob) => {
                setVoiceUrl(url);
                setVoiceBlob(blob);
              }}
            />
            {voiceUrl && (
              <p className="text-center text-xs font-semibold text-primary-dark">{content.form.voiceReady}</p>
            )}
          </div>
        </section>

        {error && <p className="text-sm font-medium text-error">{error}</p>}

        <Button
          size="lg"
          fullWidth
          onClick={handleSubmit}
          disabled={isSubmitting || !isOnline}
          isLoading={isSubmitting}
          loadingLabel={content.submitButton.loadingLabel}
          className="gap-3 text-lg shadow-lg"
        >
          {isSubmitting ? content.submitButton.loadingLabel : content.submitButton.label}
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>send</span>
        </Button>
        </div>

        <section className="space-y-3 pb-6">
          <h2 className="text-sm font-bold text-primary-dark">{content.history.titlePrefix} ({entries.length})</h2>
          <div className="space-y-2.5">
            {entries.map((entry) => {
              const { subject, message: body } = parseSubject(entry.body);
              return (
                <div key={entry.id} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3.5 shadow-soft">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-onSurface">
                      {subject ?? (entry.type === 'voice' ? content.history.voiceFallback : content.history.textFallback)}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        entry.status === 'resolved'
                          ? 'bg-primary-light text-onPrimary-container'
                          : entry.status === 'in_review'
                          ? 'bg-gold-light text-gold-dark'
                          : 'bg-secondary-light text-onSecondary-container'
                      }`}
                    >
                      {STATUS_LABELS[entry.status]}
                    </span>
                  </div>
                  {body && <p className="mt-1 text-xs text-onSurface-variant">{body}</p>}
                  {entry.audio_url && (
                    <audio controls src={entry.audio_url} className="mt-2 w-full" />
                  )}
                  {entry.admin_response && (
                    <p className="mt-2 rounded-lg bg-surface-container p-2 text-xs text-onSurface">
                      <span className="font-bold">{content.history.responsePrefix} </span>
                      {entry.admin_response}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
        </div>
      </main>

      {ticketRef && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center bg-primary-dark/40 px-6 backdrop-blur-sm">
          <div className="grow-[3]" aria-hidden="true" />
          <div className="w-full max-w-sm rounded-3xl bg-surface-container-lowest p-8 text-center shadow-2xl">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-container text-on-primary">
              <span className="material-symbols-outlined" style={{ fontSize: 40 }}>check</span>
            </div>
            <h3 className="mb-2 text-xl font-bold text-primary-dark">{content.successModal.title}</h3>
            <p className="mb-6 text-sm text-onSurface-variant">{content.successModal.body}</p>
            <div className="inline-block rounded-lg border border-outline-variant bg-surface-container p-3">
              <span className="block text-xs font-bold uppercase tracking-wider text-onSurface-variant">{content.successModal.ticketLabel}</span>
              <span className="text-lg font-bold text-primary-dark">#{ticketRef}</span>
            </div>
            <Button size="lg" fullWidth onClick={() => setTicketRef(null)} className="mt-8 bg-primary-dark">
              {content.successModal.backButton}
            </Button>
          </div>
          <div className="grow-[17]" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
