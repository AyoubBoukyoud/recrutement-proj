'use client';

import { useEffect, useState } from 'react';

const CHECKLIST_INITIAL = [
  { id: 'competence', label: 'Ajouter une compétence clé', done: false },
  { id: 'experience', label: "Compléter l'expérience", done: false },
  { id: 'cv', label: 'Ajouter un CV', done: true },
];

const JOBS = [
  {
    id: 'j1',
    titre: 'Infirmier en Soins Intensifs',
    entreprise: 'Hôpital Universitaire de Munich',
    match: 98,
    icon: 'medical_services',
    tags: ['Munich, DE', 'CDI', 'Temps plein'],
  },
  {
    id: 'j2',
    titre: 'Ingénieur Logiciel (React)',
    entreprise: 'Berlin Tech Hub',
    match: 92,
    icon: 'developer_mode',
    tags: ['Berlin, DE', 'CDI', 'Hybride'],
  },
];

export default function AmudCandidateDashboardPage() {
  const [checklist, setChecklist] = useState(CHECKLIST_INITIAL);
  const [postulees, setPostulees] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2200);
    return () => clearTimeout(t);
  }, [notice]);

  const checkedCount = checklist.filter((c) => c.done).length;
  const pct = Math.min(100, 55 + checkedCount * 30);

  function toggle(id: string) {
    setChecklist((prev) => prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c)));
  }

  function postuler(job: (typeof JOBS)[number]) {
    setPostulees((prev) => [...prev, job.id]);
    setNotice(`Candidature envoyée pour « ${job.titre} ».`);
  }

  return (
    <>
      {notice ? (
        <div className="flex items-center gap-2 rounded-lg border border-amud-primary-fixed-dim bg-amud-primary-fixed p-md text-body-md text-amud-on-primary-fixed">
          <span className="material-symbols-outlined">check_circle</span>
          {notice}
        </div>
      ) : null}

      <section>
        <h1 className="mb-2 text-headline-lg text-amud-on-background">Bonjour Mohamed 👋</h1>
        <p className="text-body-lg text-amud-on-surface-variant">Voici un résumé de votre activité aujourd&apos;hui.</p>
      </section>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-md sm:grid-cols-3 lg:col-span-2">
          <div className="group relative overflow-hidden rounded-xl border border-amud-outline-variant/40 bg-amud-surface-container-lowest p-lg shadow-sm transition-colors hover:border-amud-primary/30">
            <div className="absolute bottom-0 left-0 top-0 w-1 bg-amud-primary" />
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-lg bg-amud-surface-container-low p-2 text-amud-primary">
                <span className="material-symbols-outlined">assignment</span>
              </div>
              <span className="rounded-full bg-amud-primary-container/20 px-2 py-1 text-label-sm font-bold text-amud-primary">+2 cette semaine</span>
            </div>
            <h3 className="mb-1 text-display-lg text-amud-on-surface">12</h3>
            <p className="text-body-md text-amud-on-surface-variant">Candidatures actives</p>
          </div>
          <div className="group relative overflow-hidden rounded-xl border border-amud-outline-variant/40 bg-amud-surface-container-lowest p-lg shadow-sm transition-colors hover:border-amud-primary/30">
            <div className="absolute bottom-0 left-0 top-0 w-1 bg-amud-secondary-container" />
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-lg bg-amud-surface-container-low p-2 text-amud-secondary-container">
                <span className="material-symbols-outlined">calendar_month</span>
              </div>
            </div>
            <h3 className="mb-1 text-display-lg text-amud-on-surface">3</h3>
            <p className="text-body-md text-amud-on-surface-variant">Entretiens prévus</p>
          </div>
          <div className="group relative overflow-hidden rounded-xl border border-amud-outline-variant/40 bg-amud-surface-container-lowest p-lg shadow-sm transition-colors hover:border-amud-primary/30">
            <div className="absolute bottom-0 left-0 top-0 w-1 bg-amud-tertiary-fixed-dim" />
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-lg bg-amud-surface-container-low p-2 text-amud-tertiary">
                <span className="material-symbols-outlined">bookmark</span>
              </div>
            </div>
            <h3 className="mb-1 text-display-lg text-amud-on-surface">8</h3>
            <p className="text-body-md text-amud-on-surface-variant">Offres sauvegardées</p>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-amud-outline-variant/40 bg-amud-surface-container-lowest p-lg shadow-sm">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-title-lg text-amud-on-surface">Profil à {pct}%</h3>
              <span className="material-symbols-outlined text-amud-primary">military_tech</span>
            </div>
            <div className="mb-6 h-2.5 w-full rounded-full bg-amud-surface-container-high">
              <div className="h-2.5 rounded-full bg-amud-primary transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="mb-4 text-label-md text-amud-on-surface-variant">Un profil complet attire 3x plus les recruteurs.</p>
            <ul className="space-y-3">
              {checklist.map((item) => (
                <li key={item.id}>
                  <button onClick={() => toggle(item.id)} className={`flex w-full items-start gap-2 text-left ${item.done ? 'text-amud-outline-variant line-through' : 'text-amud-on-surface'}`}>
                    <span className={`material-symbols-outlined mt-0.5 text-sm ${item.done ? 'text-amud-primary' : 'text-amud-outline'}`}>
                      {item.done ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span className="text-body-md">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => setNotice('Direction la page de profil (à venir).')}
            className="mt-6 w-full rounded-lg border border-amud-outline-variant py-2 text-center text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low"
          >
            Améliorer mon profil
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <div className="space-y-md lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-headline-md text-amud-on-surface">Suivi des candidatures</h2>
            <button onClick={() => setNotice('Ouverture de toutes vos candidatures.')} className="text-label-md font-bold text-amud-primary hover:underline">
              Voir tout
            </button>
          </div>

          <div className="relative rounded-xl border border-amud-outline-variant/40 bg-amud-surface-container-lowest p-lg shadow-sm">
            <div className="absolute bottom-6 left-0 top-6 w-1 rounded-r-full bg-amud-surface-container-highest" />
            <div className="mb-6 flex items-center justify-between pl-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-amud-outline-variant/30 bg-amud-surface-container-low">
                  <span className="material-symbols-outlined text-3xl text-amud-primary">local_hospital</span>
                </div>
                <div>
                  <h4 className="text-title-lg text-amud-on-surface">Infirmier Diplômé d&apos;État</h4>
                  <p className="text-body-md text-amud-on-surface-variant">Clinique Pasteur • Paris</p>
                </div>
              </div>
              <span className="rounded-full border border-amud-tertiary-fixed-dim/30 bg-amud-tertiary-fixed-dim/20 px-3 py-1 text-label-sm font-bold text-amud-tertiary-container">En cours</span>
            </div>
            <div className="relative overflow-x-auto pb-4 pl-4 pt-8">
              <div className="flex min-w-[500px] items-center justify-between">
                {['Nouvelle', 'Présélection', 'Entretien', 'Shortlist', 'Décision'].map((stage, i) => {
                  const done = i < 2;
                  const active = i === 2;
                  return (
                    <div key={stage} className="relative z-10 flex w-1/5 flex-col items-center">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-amud-surface-container-lowest ${
                          done ? 'bg-amud-primary text-white' : active ? 'border-2 border-amud-primary bg-amud-surface-container-lowest' : 'border border-amud-outline-variant bg-amud-surface-container-highest'
                        }`}
                      >
                        {done ? <span className="material-symbols-outlined text-[14px]">check</span> : active ? <div className="h-2 w-2 rounded-full bg-amud-primary" /> : null}
                      </div>
                      <span className={`mt-2 text-center text-label-sm ${active ? 'font-bold text-amud-primary' : done ? 'text-amud-on-surface' : 'text-amud-outline'}`}>{stage}</span>
                      {active ? <span className="absolute -bottom-4 whitespace-nowrap text-[10px] text-amud-on-surface-variant">Jeu 14 Fév</span> : null}
                    </div>
                  );
                })}
              </div>
              <div className="absolute left-[10%] right-[10%] top-11 -z-0 h-[2px] bg-amud-outline-variant/50" />
              <div className="absolute left-[10%] top-11 -z-0 h-[2px] w-[40%] bg-amud-primary" />
            </div>
          </div>

          <button
            onClick={() => setNotice('Détail de candidature ouvert.')}
            className="flex w-full items-center justify-between rounded-xl border border-amud-outline-variant/40 bg-amud-surface-container-lowest p-md text-left shadow-sm transition-colors hover:bg-amud-surface-container-low"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amud-surface-container-low">
                <span className="material-symbols-outlined text-amud-on-surface-variant">code</span>
              </div>
              <div>
                <h4 className="font-medium text-amud-on-surface">Développeur Fullstack</h4>
                <p className="text-label-sm text-amud-on-surface-variant">TechCorp • Remote</p>
              </div>
            </div>
            <div className="text-right">
              <span className="block text-label-md text-amud-on-surface">Présélection</span>
              <span className="text-[11px] text-amud-outline">Il y a 2 jours</span>
            </div>
          </button>
        </div>

        <div className="space-y-md lg:col-span-1">
          <h2 className="mb-4 text-headline-md text-amud-on-surface">Recommandations</h2>
          {JOBS.map((job) => {
            const postule = postulees.includes(job.id);
            return (
              <div key={job.id} className="rounded-xl border border-amud-outline-variant/40 bg-amud-surface-container-lowest p-lg shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amud-surface-container">
                    <span className="material-symbols-outlined text-amud-primary">{job.icon}</span>
                  </div>
                  <span className="flex items-center gap-1 rounded bg-amud-primary-container/10 px-2 py-1 text-label-sm font-bold text-amud-primary-container">
                    <span className="material-symbols-outlined text-[14px]">bolt</span> {job.match}% Match
                  </span>
                </div>
                <h3 className="mb-1 text-title-lg text-amud-on-surface">{job.titre}</h3>
                <p className="mb-4 text-body-md text-amud-on-surface-variant">{job.entreprise}</p>
                <div className="mb-6 flex flex-wrap gap-2">
                  {job.tags.map((t) => (
                    <span key={t} className="rounded border border-amud-outline-variant/20 bg-amud-surface-container-low px-2 py-1 text-label-sm text-amud-on-surface-variant">
                      {t}
                    </span>
                  ))}
                </div>
                {postule ? (
                  <button disabled className="flex w-full items-center justify-center gap-2 rounded-lg bg-amud-primary-fixed py-2 text-label-md font-medium text-amud-on-primary-fixed">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    Candidature envoyée
                  </button>
                ) : (
                  <button onClick={() => postuler(job)} className="w-full rounded-lg bg-amud-primary py-2 text-label-md font-medium text-white transition-colors hover:bg-amud-primary-container">
                    Postuler
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
