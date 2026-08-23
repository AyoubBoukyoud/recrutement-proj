'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Modal } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import {
  KANBAN_COLUMNS,
  STATUS_LABEL,
  applicationsSeed,
  colonneForStatus,
  isDecided,
  type Application,
  type ColonneId,
} from '@/data/amud/applications';
import { applicationsCollection } from '@/lib/amud/localApplications';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { generateId } from '@/lib/amud/storage/ids';
import { logAudit } from '@/lib/amud/storage/audit';
import { pushNotification } from '@/lib/amud/storage/notify';
import { offresSeed } from '@/data/amud/offres';
import { offresCollection } from '@/lib/amud/localOffres';

export default function AmudAdminCandidaturesPage() {
  const notify = useToast();
  const searchParams = useSearchParams();
  const [applications, { add: addApplication, update: updateApplication }] = useCollection(applicationsCollection, applicationsSeed);
  const [offres] = useCollection(offresCollection, offresSeed);
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [vue, setVue] = useState<'kanban' | 'table'>('kanban');
  const [dragCard, setDragCard] = useState<{ id: string; from: ColonneId } | null>(null);
  const [decisionsTab, setDecisionsTab] = useState<'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'>('ACCEPTED');

  const [addOpen, setAddOpen] = useState(false);
  const [nom, setNom] = useState('');
  const [offerId, setOfferId] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [score, setScore] = useState(80);
  const [colonneChoisie, setColonneChoisie] = useState<ColonneId>('NEW');

  function resetAddForm() {
    setNom('');
    setOfferId('');
    setTagsInput('');
    setScore(80);
    setColonneChoisie('NEW');
  }

  function handleAddCandidature(e: React.FormEvent) {
    e.preventDefault();
    const offre = offres.find((o) => o.id === offerId);
    if (!nom.trim() || !offre) return;
    const now = new Date().toISOString();
    const application: Application = {
      id: generateId('application'),
      candidateId: generateId('candidate'),
      candidateNom: nom.trim(),
      offerId: offre.id,
      offerTitre: offre.titre,
      entrepriseId: offre.entrepriseId ?? '',
      entrepriseNom: offre.entreprise,
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      score: Math.min(100, Math.max(0, score)),
      createdAt: now,
      updatedAt: now,
      status: colonneChoisie,
    };
    addApplication(application);
    logAudit({ utilisateur: 'Administrateur', role: 'Admin', action: 'Création de candidature', actionType: 'create', module: 'Candidatures', reference: `${application.candidateNom} — ${application.offerTitre} (#${application.id})` });
    pushNotification({ scope: 'admin', title: `Nouvelle candidature : ${application.candidateNom} pour « ${application.offerTitre} ».`, category: 'Candidatures', href: '/amud/admin/candidatures' });
    notify(`« ${application.candidateNom} » ajouté(e) à ${KANBAN_COLUMNS.find((c) => c.id === colonneChoisie)?.label}.`);
    setAddOpen(false);
    resetAddForm();
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter((a) => a.candidateNom.toLowerCase().includes(q) || a.offerTitre.toLowerCase().includes(q));
  }, [applications, search]);

  const colonnes = useMemo(() => {
    const out = {} as Record<ColonneId, Application[]>;
    for (const col of KANBAN_COLUMNS) out[col.id] = filtered.filter((a) => colonneForStatus(a.status) === col.id);
    return out;
  }, [filtered]);

  const decisions = useMemo(() => filtered.filter((a) => isDecided(a.status)), [filtered]);
  const accepted = decisions.filter((a) => a.status === 'ACCEPTED');
  const rejected = decisions.filter((a) => a.status === 'REJECTED');
  const withdrawn = decisions.filter((a) => a.status === 'WITHDRAWN');
  const decisionsByTab: Record<'ACCEPTED' | 'REJECTED' | 'WITHDRAWN', Application[]> = { ACCEPTED: accepted, REJECTED: rejected, WITHDRAWN: withdrawn };

  const totals = {
    total: applications.length,
    ...Object.fromEntries(KANBAN_COLUMNS.map((c) => [c.id, applications.filter((a) => colonneForStatus(a.status) === c.id).length])),
  } as Record<'total' | ColonneId, number>;

  function moveCard(id: string, from: ColonneId, to: ColonneId) {
    if (from === to) return;
    updateApplication(id, { status: to, updatedAt: new Date().toISOString() });
  }

  function decide(id: string, status: 'ACCEPTED' | 'REJECTED') {
    const a = applications.find((x) => x.id === id);
    updateApplication(id, { status, updatedAt: new Date().toISOString() });
    if (a) {
      logAudit({
        utilisateur: 'Administrateur',
        role: 'Admin',
        action: 'Changement de statut de candidature',
        actionType: 'update',
        module: 'Candidatures',
        reference: `${a.candidateNom} — ${a.offerTitre} (#${a.id})`,
        diff: { before: `"status": "${a.status}"`, after: `"status": "${status}"` },
      });
    }
    notify(status === 'ACCEPTED' ? 'Candidature acceptée.' : 'Candidature refusée.');
  }

  return (
    <div className="flex min-h-[calc(100vh-96px)] flex-col md:min-h-[calc(100vh-160px)]">
      <header className="mb-md flex shrink-0 flex-col gap-md">
        <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-headline-lg text-amud-on-surface">Gestion des candidatures</h2>
            <p className="mt-xs text-amud-on-surface-variant">Suivi et gestion du pipeline de recrutement.</p>
          </div>
          <div className="flex items-center gap-md">
            <div className="flex rounded-lg bg-amud-surface-container-low p-xs">
              <button
                onClick={() => setVue('kanban')}
                className={`flex items-center gap-xs rounded-md px-md py-xs text-label-md ${vue === 'kanban' ? 'bg-amud-surface text-amud-primary shadow-sm' : 'text-amud-on-surface-variant hover:bg-amud-surface-container-high'}`}
              >
                <span className="material-symbols-outlined text-[18px]">view_kanban</span>
                <span className="hidden sm:inline">Vue </span>Kanban
              </button>
              <button
                onClick={() => setVue('table')}
                className={`flex items-center gap-xs rounded-md px-md py-xs text-label-md ${vue === 'table' ? 'bg-amud-surface text-amud-primary shadow-sm' : 'text-amud-on-surface-variant hover:bg-amud-surface-container-high'}`}
              >
                <span className="material-symbols-outlined text-[18px]">table_rows</span>
                <span className="hidden sm:inline">Vue </span>Tableau
              </button>
            </div>
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-xs whitespace-nowrap rounded-lg bg-amud-primary px-md py-sm text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Ajouter une candidature
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-sm md:grid-cols-5">
          {[
            { label: 'Total', value: totals.total },
            ...KANBAN_COLUMNS.map((c) => ({ label: c.label, value: totals[c.id] })),
          ].map((k) => (
            <div key={k.label} className="flex flex-col items-center justify-center rounded-lg border border-amud-surface-container-high bg-amud-surface-container-lowest p-sm">
              <span className="text-label-sm uppercase tracking-wider text-amud-outline">{k.label}</span>
              <span className="text-title-lg font-bold text-amud-on-surface">{k.value}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-sm rounded-lg border border-amud-surface-container-high bg-amud-surface-container-lowest p-sm shadow-sm">
          <div className="relative max-w-xs flex-1">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-amud-outline">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-amud-outline-variant bg-amud-surface-container-lowest py-sm pl-xl pr-sm text-body-md outline-none transition-all focus:border-amud-primary focus:ring-2 focus:ring-amud-primary"
              placeholder="Rechercher un candidat…"
              type="text"
            />
          </div>
          <span className="text-label-sm text-amud-on-surface-variant">{filtered.length} résultat(s)</span>
        </div>
      </header>

      {vue === 'kanban' ? (
        <div className="snap-x snap-mandatory overflow-x-auto rounded-lg bg-amud-surface-container-low">
          <div className="flex w-max gap-md p-md">
            {KANBAN_COLUMNS.map((col) => (
              <div
                key={col.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragCard) moveCard(dragCard.id, dragCard.from, col.id);
                  setDragCard(null);
                }}
                className="flex w-[85vw] shrink-0 snap-start flex-col rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest sm:w-80"
              >
                <div className="flex items-center justify-between rounded-t-lg border-b border-amud-outline-variant bg-amud-surface-container-high p-sm">
                  <h3 className="flex items-center gap-sm text-title-lg text-amud-on-surface">
                    <div className={`h-3 w-3 rounded-full ${col.dot}`} />
                    {col.label}
                  </h3>
                  <span className="rounded bg-amud-surface px-xs py-[2px] text-label-sm text-amud-outline">{colonnes[col.id].length}</span>
                </div>
                <div className="flex flex-1 flex-col gap-sm p-sm">
                  {colonnes[col.id].map((a) => (
                    <div
                      key={a.id}
                      draggable
                      onDragStart={() => setDragCard({ id: a.id, from: col.id })}
                      className="group relative cursor-grab rounded-lg border border-amud-outline-variant bg-amud-surface p-sm shadow-sm transition-all animate-amud-rise-in hover:-translate-y-0.5 hover:border-amud-primary hover:shadow-md active:cursor-grabbing"
                    >
                      <div className="mb-sm flex items-start justify-between">
                        <div className="flex items-center gap-sm">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amud-surface-container-highest bg-amud-surface-container-highest font-bold text-amud-primary">
                            {a.candidateNom
                              .split(/\s+/)
                              .map((w) => w[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-label-md font-semibold text-amud-on-surface">{a.candidateNom}</h4>
                            <p className="text-label-sm text-amud-outline">{a.offerTitre}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-[2px] rounded bg-amud-primary-fixed px-xs py-[2px] text-label-sm font-semibold text-amud-on-primary-fixed">
                          <span className="material-symbols-outlined text-[14px]">bolt</span>
                          {a.score}%
                        </div>
                      </div>
                      <div className="mb-sm flex flex-wrap gap-xs">
                        {a.tags.map((t) => (
                          <span key={t} className="rounded bg-amud-surface-container-highest px-xs py-[2px] text-[11px] font-medium text-amud-on-surface-variant">
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="mb-sm flex items-center justify-between text-[11px] text-amud-outline">
                        <span className="flex items-center gap-[2px]">
                          <span className="material-symbols-outlined text-[14px]">domain</span> {a.entrepriseNom}
                        </span>
                        <span className="flex items-center gap-[2px]">
                          <span className="material-symbols-outlined text-[14px]">calendar_today</span> {new Date(a.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-xs border-t border-amud-outline-variant/50 pt-xs opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => decide(a.id, 'ACCEPTED')}
                          title="Accepter"
                          className="rounded p-1 text-amud-primary transition-colors hover:bg-amud-primary/10"
                        >
                          <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        </button>
                        <button
                          onClick={() => decide(a.id, 'REJECTED')}
                          title="Refuser"
                          className="rounded p-1 text-amud-error transition-colors hover:bg-amud-error/10"
                        >
                          <span className="material-symbols-outlined text-[18px]">cancel</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {colonnes[col.id].length === 0 ? (
                    <div className="flex min-h-[140px] flex-1 flex-col items-center justify-center p-md text-center text-amud-outline">
                      <span className="material-symbols-outlined mb-sm text-display-lg">inbox</span>
                      <p className="text-label-sm">Glissez une carte ici.</p>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead className="sticky top-0 bg-amud-surface-container-low text-label-sm text-amud-on-surface-variant">
              <tr>
                <th className="p-sm">Candidat</th>
                <th className="p-sm">Offre</th>
                <th className="p-sm">Statut</th>
                <th className="p-sm">Score</th>
                <th className="p-sm">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="animate-amud-rise-in border-t border-amud-outline-variant hover:bg-amud-surface-container-low">
                  <td className="p-sm font-medium text-amud-on-surface">{a.candidateNom}</td>
                  <td className="p-sm text-amud-on-surface-variant">{a.offerTitre}</td>
                  <td className="p-sm text-amud-on-surface-variant">{STATUS_LABEL[a.status]}</td>
                  <td className="p-sm text-amud-primary">{a.score}%</td>
                  <td className="p-sm text-amud-on-surface-variant">{new Date(a.createdAt).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {decisions.length > 0 ? (
        <section className="mt-lg rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest p-md">
          <div className="mb-sm flex items-center justify-between">
            <h3 className="text-title-lg text-amud-on-surface">Décisions récentes</h3>
            <div className="flex rounded-lg bg-amud-surface-container-low p-xs">
              <button
                onClick={() => setDecisionsTab('ACCEPTED')}
                className={`rounded-md px-md py-xs text-label-md ${decisionsTab === 'ACCEPTED' ? 'bg-amud-surface text-amud-primary shadow-sm' : 'text-amud-on-surface-variant'}`}
              >
                Acceptées ({accepted.length})
              </button>
              <button
                onClick={() => setDecisionsTab('REJECTED')}
                className={`rounded-md px-md py-xs text-label-md ${decisionsTab === 'REJECTED' ? 'bg-amud-surface text-amud-primary shadow-sm' : 'text-amud-on-surface-variant'}`}
              >
                Refusées ({rejected.length})
              </button>
              <button
                onClick={() => setDecisionsTab('WITHDRAWN')}
                className={`rounded-md px-md py-xs text-label-md ${decisionsTab === 'WITHDRAWN' ? 'bg-amud-surface text-amud-primary shadow-sm' : 'text-amud-on-surface-variant'}`}
              >
                Retirées ({withdrawn.length})
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-sm sm:grid-cols-2 lg:grid-cols-3">
            {decisionsByTab[decisionsTab].map((a) => (
              <div key={a.id} className="rounded-lg border border-amud-outline-variant bg-amud-surface p-sm">
                <div className="flex items-center justify-between">
                  <span className="text-label-md font-semibold text-amud-on-surface">{a.candidateNom}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${a.status === 'ACCEPTED' ? 'bg-amud-primary-fixed text-amud-on-primary-fixed' : a.status === 'REJECTED' ? 'bg-amud-error-container text-amud-on-error-container' : 'bg-amud-surface-container-highest text-amud-on-surface-variant'}`}>
                    {STATUS_LABEL[a.status]}
                  </span>
                </div>
                <p className="text-label-sm text-amud-outline">
                  {a.offerTitre} · {a.entrepriseNom}
                </p>
              </div>
            ))}
            {decisionsByTab[decisionsTab].length === 0 ? (
              <p className="text-label-sm text-amud-on-surface-variant">Aucune décision pour l’instant.</p>
            ) : null}
          </div>
        </section>
      ) : null}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Ajouter une candidature"
        subtitle="Le candidat rejoint la colonne sélectionnée du pipeline."
        footer={
          <div className="flex justify-end gap-sm">
            <button type="button" onClick={() => setAddOpen(false)} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
              Annuler
            </button>
            <button type="submit" form="add-candidat-form" className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark">
              Ajouter
            </button>
          </div>
        }
      >
        <form id="add-candidat-form" onSubmit={handleAddCandidature} className="grid grid-cols-1 gap-md sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Nom complet</label>
            <input
              autoFocus
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              placeholder="Sophie Martin"
              type="text"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Offre visée</label>
            <select
              value={offerId}
              onChange={(e) => setOfferId(e.target.value)}
              required
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
            >
              <option value="">Sélectionner une offre…</option>
              {offres.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.titre} — {o.entreprise}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Colonne</label>
            <select
              value={colonneChoisie}
              onChange={(e) => setColonneChoisie(e.target.value as ColonneId)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
            >
              {KANBAN_COLUMNS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Score (%)</label>
            <input
              value={score}
              onChange={(e) => setScore(Number(e.target.value) || 0)}
              min={0}
              max={100}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              type="number"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Tags (séparés par des virgules)</label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              placeholder="Soins Intensifs, Bloc Opératoire"
              type="text"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
