'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Drawer } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { CURRENT_COMMERCIAL } from '@/data/amud/currentCommercial';
import { entreprisesSeed } from '@/data/amud/entreprises';
import { entreprisesCollection } from '@/lib/amud/localEntreprises';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { PRIORITE_CLASS, STATUT_CLASS, tachesSeed, type PrioriteTache, type StatutTache, type Tache } from '@/data/amud/commercialTaches';
import { tachesCollection } from '@/lib/amud/localCommercialTaches';
import { logAudit } from '@/lib/amud/storage/audit';

const PRIORITES: PrioriteTache[] = ['Haute', 'Moyenne', 'Basse'];
const STATUTS: StatutTache[] = ['À faire', 'En cours', 'Terminée', 'En retard'];

function todayFr() {
  return new Date().toLocaleDateString('fr-FR');
}

export default function AmudCommercialTachesPage() {
  const notify = useToast();
  const searchParams = useSearchParams();

  const [allTaches, { update: updateTache }] = useCollection(tachesCollection, tachesSeed);
  const taches = useMemo(() => allTaches.filter((t) => t.commercialId === CURRENT_COMMERCIAL.id), [allTaches]);
  const [entreprises] = useCollection(entreprisesCollection, entreprisesSeed);
  const [search, setSearch] = useState('');
  const [entrepriseId, setEntrepriseId] = useState('');
  const [priorite, setPriorite] = useState<PrioriteTache | ''>('');
  const [statut, setStatut] = useState<StatutTache | ''>('');

  const [selected, setSelected] = useState<Tache | null>(null);
  const [editTitre, setEditTitre] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriorite, setEditPriorite] = useState<PrioriteTache>('Moyenne');
  const [editEcheance, setEditEcheance] = useState('');
  const [editStatut, setEditStatut] = useState<StatutTache>('À faire');

  useEffect(() => {
    const openId = searchParams.get('open');
    if (openId) {
      const found = allTaches.find((t) => t.id === openId);
      if (found) openDetail(found);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, allTaches]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return taches.filter(
      (t) =>
        (!q || t.titre.toLowerCase().includes(q) || (t.entrepriseNom ?? '').toLowerCase().includes(q)) &&
        (!entrepriseId || t.entrepriseId === entrepriseId) &&
        (!priorite || t.priorite === priorite) &&
        (!statut || t.statut === statut),
    );
  }, [taches, search, entrepriseId, priorite, statut]);

  const counts = {
    'À faire': taches.filter((t) => t.statut === 'À faire').length,
    'En cours': taches.filter((t) => t.statut === 'En cours').length,
    Terminée: taches.filter((t) => t.statut === 'Terminée').length,
    'En retard': taches.filter((t) => t.statut === 'En retard').length,
  };

  function openDetail(t: Tache) {
    setSelected(t);
    setEditTitre(t.titre);
    setEditDescription(t.description);
    setEditPriorite(t.priorite);
    setEditEcheance(t.echeance);
    setEditStatut(t.statut);
  }

  function completeTask(id: string, titre: string) {
    updateTache(id, { statut: 'Terminée' });
    logAudit({ utilisateur: CURRENT_COMMERCIAL.nom, role: 'Commercial', action: 'Tâche terminée', actionType: 'update', module: 'Tâches', reference: `${titre} (#${id})` });
    if (selected?.id === id) setEditStatut('Terminée');
    notify(`« ${titre} » marquée terminée.`);
  }

  function saveEdit() {
    if (!selected) return;
    const patch = { titre: editTitre.trim() || selected.titre, description: editDescription, priorite: editPriorite, echeance: editEcheance || todayFr(), statut: editStatut };
    updateTache(selected.id, patch);
    setSelected((prev) => (prev ? { ...prev, ...patch } : prev));
    notify('Tâche mise à jour.');
  }

  return (
    <div>
      <div className="mb-xl flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-headline-lg text-amud-on-surface">Tâches</h1>
          <p className="mt-1 text-body-md text-amud-on-surface-variant">Vos tâches personnelles et celles liées à vos entreprises.</p>
        </div>
      </div>

      <div className="mb-lg grid grid-cols-2 gap-4 md:grid-cols-4">
        {STATUTS.map((s) => (
          <div key={s} className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md">
            <p className="text-headline-md text-amud-on-surface">{counts[s]}</p>
            <p className="text-label-sm text-amud-on-surface-variant">{s}</p>
          </div>
        ))}
      </div>

      <section className="mb-lg flex flex-col gap-3 rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-sm md:flex-row md:items-center">
        <div className="relative w-full flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-amud-on-surface-variant">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface py-2 pl-10 pr-4 text-body-md outline-none focus:border-amud-primary focus:ring-2 focus:ring-amud-primary"
            placeholder="Rechercher une tâche…"
            type="text"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={entrepriseId} onChange={(e) => setEntrepriseId(e.target.value)} className="rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-label-md text-amud-on-surface focus:ring-2 focus:ring-amud-primary">
            <option value="">Entreprise</option>
            {entreprises.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nom}
              </option>
            ))}
          </select>
          <select value={priorite} onChange={(e) => setPriorite(e.target.value as PrioriteTache | '')} className="rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-label-md text-amud-on-surface focus:ring-2 focus:ring-amud-primary">
            <option value="">Priorité</option>
            {PRIORITES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <select value={statut} onChange={(e) => setStatut(e.target.value as StatutTache | '')} className="rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-label-md text-amud-on-surface focus:ring-2 focus:ring-amud-primary">
            <option value="">Statut</option>
            {STATUTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-body-md text-amud-on-surface-variant">Aucune tâche ne correspond à ces filtres.</div>
        ) : (
          <div className="divide-y divide-amud-outline-variant">
            {filtered.map((t) => (
              <div key={t.id} className="flex flex-col gap-3 p-md sm:flex-row sm:items-center sm:justify-between">
                <button onClick={() => openDetail(t)} className="min-w-0 flex-1 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-amud-on-surface hover:text-amud-primary">{t.titre}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITE_CLASS[t.priorite]}`}>{t.priorite}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUT_CLASS[t.statut]}`}>{t.statut}</span>
                  </div>
                  <p className="mt-1 truncate text-label-sm text-amud-on-surface-variant">{t.description}</p>
                  <p className="mt-1 text-label-sm text-amud-on-surface-variant">
                    Échéance : {t.echeance}
                    {t.entrepriseNom ? (
                      <>
                        {' '}
                        ·{' '}
                        <Link href={`/amud/commercial/entreprises/${t.entrepriseId}`} className="text-amud-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                          {t.entrepriseNom}
                        </Link>
                      </>
                    ) : null}
                  </p>
                </button>
                <div className="flex shrink-0 gap-xs">
                  {t.statut !== 'Terminée' ? (
                    <button onClick={() => completeTask(t.id, t.titre)} className="rounded-lg border border-amud-outline-variant px-3 py-1.5 text-label-sm text-amud-primary hover:bg-amud-surface-container-low">
                      Compléter
                    </button>
                  ) : null}
                  <button onClick={() => openDetail(t)} className="rounded-lg border border-amud-outline-variant px-3 py-1.5 text-label-sm text-amud-on-surface-variant hover:bg-amud-surface-container-low">
                    Modifier
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Détail de la tâche"
        subtitle={selected?.entrepriseNom}
        footer={
          selected ? (
            <div className="flex justify-end gap-sm">
              <button onClick={() => setSelected(null)} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                Fermer
              </button>
              <button onClick={saveEdit} className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white hover:bg-amud-primary-dark">
                Enregistrer
              </button>
            </div>
          ) : null
        }
      >
        {selected ? (
          <div className="flex flex-col gap-md">
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Titre</label>
              <input value={editTitre} onChange={(e) => setEditTitre(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Description</label>
              <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
            </div>
            {selected.entrepriseNom ? (
              <div>
                <p className="mb-1 text-label-md text-amud-on-surface-variant">Entreprise</p>
                <Link href={`/amud/commercial/entreprises/${selected.entrepriseId}`} className="text-body-md font-medium text-amud-primary hover:underline">
                  {selected.entrepriseNom}
                </Link>
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="mb-1 block text-label-md text-amud-on-surface-variant">Priorité</label>
                <select value={editPriorite} onChange={(e) => setEditPriorite(e.target.value as PrioriteTache)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
                  {PRIORITES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-label-md text-amud-on-surface-variant">Échéance (reprogrammer)</label>
                <input value={editEcheance} onChange={(e) => setEditEcheance(e.target.value)} placeholder="jj/mm/aaaa" className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Statut</label>
              <select value={editStatut} onChange={(e) => setEditStatut(e.target.value as StatutTache)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
                {STATUTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
