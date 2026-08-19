'use client';

import { useEffect, useState } from 'react';

const CONTACTS = [
  { nom: 'Marie Laurent', meta: 'Candidat • Paris', priorite: 'Haute', depuis: '2j', color: 'bg-amud-secondary' },
  { nom: 'Jean Dubois', meta: 'Recruteur • Lyon', priorite: 'Moyenne', depuis: '4j', color: 'bg-amud-tertiary-fixed-dim' },
];

export default function AmudCommercialDashboardPage() {
  const objectifAppels = 40;
  const [appelsFaits, setAppelsFaits] = useState(32);
  const [notice, setNotice] = useState<string | null>(null);
  const [journal, setJournal] = useState<{ label: string; heure: string }[]>([
    { label: 'Appel sortant - Sophie Martin — A répondu, RDV fixé', heure: '10:45' },
    { label: 'Email envoyé - Tech Corp — Proposition envoyée', heure: '09:30' },
  ]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2200);
    return () => clearTimeout(t);
  }, [notice]);

  const pct = Math.min(100, Math.round((appelsFaits / objectifAppels) * 100));

  function logAppel(contact?: string) {
    setAppelsFaits((n) => n + 1);
    const label = contact ? `Appel sortant - ${contact}` : 'Appel sortant enregistré';
    setJournal((prev) => [{ label, heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }, ...prev]);
    setNotice(contact ? `Appel avec ${contact} enregistré.` : 'Appel enregistré.');
  }

  return (
    <div>
      {notice ? (
        <div className="mb-md flex items-center gap-2 rounded-lg border border-amud-primary-fixed-dim bg-amud-primary-fixed p-md text-body-md text-amud-on-primary-fixed">
          <span className="material-symbols-outlined">check_circle</span>
          {notice}
        </div>
      ) : null}

      <header className="mb-xl flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-headline-lg font-bold text-amud-primary md:text-headline-lg">Bonjour Ahmed 👋</h1>
          <p className="mt-2 text-body-md text-amud-on-surface-variant">Voici votre activité commerciale du jour.</p>
        </div>
        <button
          onClick={() => logAppel()}
          className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-amud-primary px-4 py-2 text-label-sm font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark"
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            add_call
          </span>
          Appel
        </button>
      </header>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        <div className="space-y-gutter lg:col-span-8">
          <div className="relative overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <div className="absolute bottom-0 left-0 top-0 w-2 bg-amud-primary" />
            <div className="pl-2">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-title-lg text-amud-on-surface">Objectif d&apos;appels aujourd&apos;hui</h2>
                  <p className="mt-1 text-body-md text-amud-on-surface-variant">Progression vers votre cible journalière</p>
                </div>
                <span className="material-symbols-outlined text-3xl text-amud-primary">target</span>
              </div>
              <div className="mb-4 flex items-baseline gap-4">
                <span className="text-display-lg text-amud-primary">{appelsFaits}</span>
                <span className="text-headline-md text-amud-on-surface-variant">/ {objectifAppels}</span>
                <span className="ml-auto rounded-full bg-amud-primary-container px-2 py-1 text-label-md text-white">{pct}%</span>
              </div>
              <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-amud-surface-container-high">
                <div className="h-3 rounded-full bg-amud-primary transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-label-sm text-amud-on-surface-variant">
                <span>Terminé: {appelsFaits}</span>
                <span>Restant: {Math.max(0, objectifAppels - appelsFaits)}</span>
                <span>Fin estimée: 17:30</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-md md:grid-cols-3">
            <div className="rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest p-md transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
              <div className="mb-2 flex items-center gap-2 text-amud-on-surface-variant">
                <span className="material-symbols-outlined text-xl">phone_in_talk</span>
                <span className="text-label-md">Taux de réponse</span>
              </div>
              <span className="text-headline-md text-amud-on-surface">68%</span>
            </div>
            <div className="rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest p-md transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
              <div className="mb-2 flex items-center gap-2 text-amud-on-surface-variant">
                <span className="material-symbols-outlined text-xl">event</span>
                <span className="text-label-md">Rendez-vous</span>
              </div>
              <span className="text-headline-md text-amud-on-surface">3</span>
            </div>
            <div className="rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest p-md transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
              <div className="mb-2 flex items-center gap-2 text-amud-on-surface-variant">
                <span className="material-symbols-outlined text-xl">notification_important</span>
                <span className="text-label-md">Rappels</span>
              </div>
              <span className="text-headline-md text-amud-on-surface">5</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-md md:grid-cols-4">
            <button
              onClick={() => logAppel()}
              className="flex flex-col items-center justify-center gap-2 rounded-lg bg-amud-primary p-4 text-white shadow-sm transition-colors hover:bg-amud-primary-dark"
            >
              <span className="material-symbols-outlined">add_call</span>
              <span className="text-label-sm">Nouvel appel</span>
            </button>
            <button
              onClick={() => setNotice('Ticket créé.')}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest p-4 text-amud-primary transition-colors hover:bg-amud-surface-container-low"
            >
              <span className="material-symbols-outlined">confirmation_number</span>
              <span className="text-label-sm">Nouveau ticket</span>
            </button>
            <button
              onClick={() => setNotice('Rappel planifié.')}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest p-4 text-amud-primary transition-colors hover:bg-amud-surface-container-low"
            >
              <span className="material-symbols-outlined">schedule</span>
              <span className="text-label-sm">Planifier rappel</span>
            </button>
            <button
              onClick={() => setNotice('Note ajoutée.')}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest p-4 text-amud-primary transition-colors hover:bg-amud-surface-container-low"
            >
              <span className="material-symbols-outlined">note_add</span>
              <span className="text-label-sm">Ajouter note</span>
            </button>
          </div>
        </div>

        <div className="space-y-gutter lg:col-span-4">
          <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <h3 className="mb-4 text-title-lg text-amud-on-surface">Contacts prioritaires</h3>
            <div className="flex flex-col gap-4">
              {CONTACTS.map((c) => (
                <div key={c.nom} className="group relative overflow-hidden rounded-lg border border-amud-outline-variant p-md">
                  <div className={`absolute bottom-0 left-0 top-0 w-1 ${c.color}`} />
                  <div className="mb-2 flex items-start justify-between pl-2">
                    <div>
                      <h4 className="text-label-md font-semibold">{c.nom}</h4>
                      <span className="text-label-sm text-amud-on-surface-variant">{c.meta}</span>
                    </div>
                    <span className="rounded bg-amud-secondary/10 px-2 py-0.5 text-label-sm text-amud-secondary">{c.priorite}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-amud-outline-variant/30 pl-2 pt-2">
                    <span className="flex items-center gap-1 text-label-sm text-amud-on-surface-variant">
                      <span className="material-symbols-outlined text-[14px]">history</span> {c.depuis}
                    </span>
                    <button onClick={() => logAppel(c.nom)} className="flex items-center gap-1 text-label-sm text-amud-primary hover:text-amud-primary-dark">
                      <span className="material-symbols-outlined text-[16px]">call</span> Appeler
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <h3 className="mb-4 text-title-lg text-amud-on-surface">Activité récente</h3>
            <div className="relative ml-3 space-y-6 border-l border-amud-outline-variant">
              {journal.map((item, i) => (
                <div key={i} className="relative pl-6">
                  <div className={`absolute -left-1.5 top-1.5 h-3 w-3 rounded-full ring-4 ring-amud-surface-container-lowest ${i === 0 ? 'bg-amud-primary' : 'bg-amud-surface-variant'}`} />
                  <p className="text-label-md font-semibold">{item.label}</p>
                  <span className="text-label-sm text-amud-on-surface-variant/70">{item.heure}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
