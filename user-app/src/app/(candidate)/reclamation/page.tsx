'use client';

// Interface 14 — Formulaire de réclamation.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useNetwork } from '@/context/NetworkContext';
import { useProfile } from '@/context/ProfileContext';
import { AudioRecorder } from '@/components/shared/AudioRecorder';
import { candidateRepository } from '@/data/candidate';
import type { ReclamationEntry } from '@/lib/types';
import { Button } from '@/components/shared/Button';

const CATEGORIES = ['Problème technique', 'Question sur mon dossier', 'Signaler une offre suspecte', 'Suggestion', 'Autre'];

export default function ReclamationPage() {
  const { isOnline, queueAction } = useNetwork();
  const { profile } = useProfile();
  const [entries, setEntries] = useState<ReclamationEntry[]>([]);
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [voiceNoteUrl, setVoiceNoteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketRef, setTicketRef] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    candidateRepository
      .complaints()
      .then((list) => {
        if (!cancelled) setEntries(list);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async () => {
    if (!category || (!message.trim() && !voiceNoteUrl)) {
      setError('Merci de choisir un sujet et de décrire votre problème (texte ou message vocal).');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    const authorName = `${profile.firstName} ${profile.lastName}`.trim() || 'Candidat';

    try {
      const entry = await candidateRepository.submitComplaint(
        { category, message: message.trim() || 'Message vocal joint', voiceNoteUrl },
        authorName
      );

      // Hors-ligne, la réclamation est rejouée à la reconnexion ; elle est tout
      // de même affichée tout de suite, sinon l'envoi paraîtrait sans effet.
      if (!isOnline) {
        queueAction('submit_reclamation', { entry });
      }

      setEntries((prev) => [entry, ...prev]);
      setCategory('');
      setMessage('');
      setVoiceNoteUrl(null);
      setTicketRef(`AMU-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`);
    } catch {
      setError("L'envoi a échoué. Réessayez dans un instant.");
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
        <h1 className="text-lg font-bold text-primary-dark">Réclamation</h1>
      </header>

      <main className="mx-auto max-w-md space-y-8 px-6 pt-8 lg:max-w-5xl lg:px-10 lg:pt-10">
        <div className="flex flex-col items-center lg:items-start lg:text-left">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary-container shadow-sm">
            <span className="material-symbols-outlined fill text-on-primary" style={{ fontSize: 44 }}>
              report_problem
            </span>
          </div>
          <h2 className="text-center text-2xl font-bold text-primary-dark lg:text-left">Comment pouvons-nous vous aider ?</h2>
          <p className="mt-2 text-center text-sm text-onSurface-variant lg:text-left">Votre avis nous aide à améliorer Amud Skills.</p>
        </div>

        <div className="space-y-8 lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-8 lg:space-y-0">
        <div className="space-y-8">
        <Link
          href="/faq"
          className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low p-4 shadow-soft transition-colors hover:bg-surface-container"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary-dark" style={{ fontSize: 22 }}>quiz</span>
            <div>
              <p className="text-sm font-bold text-onSurface">Centre d&apos;aide / FAQ</p>
              <p className="text-xs text-onSurface-variant">Trouvez une réponse rapide avant d&apos;envoyer une réclamation</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-outline" style={{ fontSize: 18 }}>chevron_right</span>
        </Link>

        <section className="space-y-6">
          <div className="space-y-2">
            <label className="block px-1 text-sm font-medium text-onSurface-variant">Sujet de la réclamation</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-outline bg-surface-container-lowest px-4 py-3.5 text-sm outline-none transition-all focus:border-primary-dark focus:ring-2 focus:ring-primary-dark/20"
            >
              <option value="" disabled>Choisir un type…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between px-1">
              <label className="text-sm font-medium text-onSurface-variant">Message</label>
              <span className="text-xs text-onSurface-variant">{message.length} / 1000</span>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
              placeholder="Décrivez votre problème…"
              className="h-36 w-full resize-none rounded-xl border border-outline bg-surface-container-lowest p-4 text-sm outline-none transition-all focus:border-primary-dark focus:ring-2 focus:ring-primary-dark/20"
            />
          </div>

          <div className="flex items-center gap-4 py-2">
            <div className="h-px flex-1 bg-outline-variant" />
            <span className="text-xs font-bold text-outline">OU</span>
            <div className="h-px flex-1 bg-outline-variant" />
          </div>

          <div className="space-y-4 rounded-xl bg-surface-container-low p-4">
            <p className="text-center text-sm font-semibold text-onSurface">Enregistrer un message vocal</p>
            <AudioRecorder onRecordingComplete={(url) => setVoiceNoteUrl(url)} />
            {voiceNoteUrl && (
              <p className="text-center text-xs font-semibold text-primary-dark">Message vocal prêt à être envoyé.</p>
            )}
          </div>
        </section>

        {error && <p className="text-sm font-medium text-error">{error}</p>}

        <Button
          size="lg"
          fullWidth
          onClick={handleSubmit}
          disabled={isSubmitting}
          isLoading={isSubmitting}
          loadingLabel="Envoi en cours…"
          className="gap-3 text-lg shadow-lg"
        >
          {isSubmitting ? 'Envoi en cours…' : 'Envoyer la réclamation'}
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>send</span>
        </Button>
        </div>

        <section className="space-y-3 pb-6">
          <h2 className="text-sm font-bold text-primary-dark">Mes réclamations ({entries.length})</h2>
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
                    {entry.status === 'resolue' ? 'Résolue' : entry.status === 'en_cours' ? 'En cours' : 'Ouverte'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-onSurface-variant">{entry.message}</p>
              </div>
            ))}
          </div>
        </section>
        </div>
      </main>

      {ticketRef && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-primary-dark/40 px-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-surface-container-lowest p-8 text-center shadow-2xl">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-container text-on-primary">
              <span className="material-symbols-outlined" style={{ fontSize: 40 }}>check</span>
            </div>
            <h3 className="mb-2 text-xl font-bold text-primary-dark">Envoyé avec succès !</h3>
            <p className="mb-6 text-sm text-onSurface-variant">Nous reviendrons vers vous dans les plus brefs délais.</p>
            <div className="inline-block rounded-lg border border-outline-variant bg-surface-container p-3">
              <span className="block text-xs font-bold uppercase tracking-wider text-onSurface-variant">Référence Ticket</span>
              <span className="text-lg font-bold text-primary-dark">#{ticketRef}</span>
            </div>
            <Button size="lg" fullWidth onClick={() => setTicketRef(null)} className="mt-8 bg-primary-dark">
              Retour à l&apos;accueil
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
