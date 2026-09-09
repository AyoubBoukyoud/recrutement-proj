'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Drawer, Modal } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { CURRENT_COMMERCIAL } from '@/data/amud/currentCommercial';
import { entreprisesSeed } from '@/data/amud/entreprises';
import { entreprisesCollection } from '@/lib/amud/localEntreprises';
import { useCollection } from '@/lib/amud/storage/useCollection';
import {
  RESULTAT_CLASS,
  STATUT_CLASS as ACTIVITE_STATUT_CLASS,
  TYPE_ICON,
  activitesSeed,
  type Activite,
  type ResultatActivite,
  type StatutActivite,
  type TypeActivite,
} from '@/data/amud/commercialActivites';
import { activitesCollection } from '@/lib/amud/localCommercialActivites';
import { tachesSeed } from '@/data/amud/commercialTaches';
import { tachesCollection } from '@/lib/amud/localCommercialTaches';
import { buildSeedRdvs } from '@/data/amud/commercialRdv';
import { rendezVousCollection } from '@/lib/amud/localRendezVous';

const TYPES: TypeActivite[] = ['Appel', 'Email', 'Note', 'Tâche', 'Rendez-vous', 'Offre créée', 'Offre publiée', 'Candidat proposé', 'Follow-up'];
const RESULTATS: ResultatActivite[] = ['Répondu', 'Sans réponse', 'Positif', 'Négatif', 'En cours', '—'];
const STATUTS: StatutActivite[] = ['Terminé', 'Planifié', 'En cours'];
const PERIODES = [
  { id: '', label: 'Toute la période' },
  { id: 'today', label: "Aujourd'hui" },
  { id: '7j', label: '7 derniers jours' },
  { id: '30j', label: '30 derniers jours' },
];

function todayFr() {
  return new Date().toLocaleDateString('fr-FR');
}
function nowFr() {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function parseFr(d: string): Date {
  const [day, month, year] = d.split('/').map(Number);
  return new Date(year, month - 1, day);
}

export default function AmudCommercialActivitesPage() {
  const notify = useToast();
  const searchParams = useSearchParams();

  const [allActivites, { update: updateActivite, add: addActivite }] = useCollection(activitesCollection, activitesSeed);
  const activites = useMemo(() => allActivites.filter((a) => a.commercialId === CURRENT_COMMERCIAL.id), [allActivites]);
  const [entreprises] = useCollection(entreprisesCollection, entreprisesSeed);
  const [allTaches] = useCollection(tachesCollection, tachesSeed);
  const tachesTerminees = useMemo(
    () => allTaches.filter((t) => t.commercialId === CURRENT_COMMERCIAL.id && t.statut === 'Terminée').length,
    [allTaches],
  );
  const [rdvsAll] = useCollection(rendezVousCollection, buildSeedRdvs());
  const rdvCount = rdvsAll.length;

  const [search, setSearch] = useState('');
  const [entrepriseId, setEntrepriseId] = useState(() => searchParams.get('entreprise') ?? '');
  const [type, setType] = useState<TypeActivite | ''>(() => {
    const t = searchParams.get('type');
    return t && (TYPES as string[]).includes(t) ? (t as TypeActivite) : '';
  });
  const [resultat, setResultat] = useState<ResultatActivite | ''>('');
  const [statut, setStatut] = useState<StatutActivite | ''>('');
  const [periode, setPeriode] = useState('');

  const [selected, setSelected] = useState<Activite | null>(null);
  const [editing, setEditing] = useState(false);
  const [editResume, setEditResume] = useState('');
  const [editResultat, setEditResultat] = useState<ResultatActivite>('—');
  const [editProchaine, setEditProchaine] = useState('');

  const [quickModal, setQuickModal] = useState<{ activite: Activite; mode: 'note' | 'followup' } | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return activites
      .filter(
        (a) =>
          (!q || a.entrepriseNom.toLowerCase().includes(q) || a.contact.toLowerCase().includes(q) || a.resume.toLowerCase().includes(q)) &&
          (!entrepriseId || a.entrepriseId === entrepriseId) &&
          (!type || a.type === type) &&
          (!resultat || a.resultat === resultat) &&
          (!statut || a.statut === statut) &&
          (() => {
            if (!periode) return true;
            const d = parseFr(a.date);
            if (periode === 'today') return d.getTime() === now.getTime();
            const days = periode === '7j' ? 7 : 30;
            const past = new Date(now);
            past.setDate(past.getDate() - days);
            return d >= past && d <= now;
          })(),
      )
      .sort((a, b) => (a.date === b.date ? b.heureDebut.localeCompare(a.heureDebut) : b.date.localeCompare(a.date)));
  }, [activites, search, entrepriseId, type, resultat, statut, periode]);

  const today = todayFr();
  const activitesAuj = activites.filter((a) => a.date === today);
  const appelsAuj = activitesAuj.filter((a) => a.type === 'Appel');

  const kpis = [
    { label: "Activités aujourd'hui", value: activitesAuj.length, icon: 'history' },
    { label: "Appels aujourd'hui", value: appelsAuj.length, icon: 'call' },
    { label: 'Appels répondus', value: appelsAuj.filter((a) => a.resultat === 'Répondu').length, icon: 'call_made' },
    { label: 'Appels sans réponse', value: appelsAuj.filter((a) => a.resultat === 'Sans réponse').length, icon: 'call_missed' },
    { label: 'Rendez-vous', value: rdvCount, icon: 'event' },
    { label: 'Tâches terminées', value: tachesTerminees, icon: 'task_alt' },
    { label: 'Follow-ups', value: activites.filter((a) => a.type === 'Follow-up').length, icon: 'history_toggle_off' },
    { label: 'Entreprises contactées', value: new Set(activites.map((a) => a.entrepriseId)).size, icon: 'domain' },
  ];

  function openDetail(a: Activite) {
    setSelected(a);
    setEditing(false);
    setEditResume(a.resume);
    setEditResultat(a.resultat);
    setEditProchaine(a.prochaineAction);
  }

  function saveEdit() {
    if (!selected) return;
    updateActivite(selected.id, { resume: editResume, resultat: editResultat, prochaineAction: editProchaine });
    setSelected((prev) => (prev ? { ...prev, resume: editResume, resultat: editResultat, prochaineAction: editProchaine } : prev));
    setEditing(false);
    notify('Activité mise à jour.');
  }

  function quickSubmit(texte: string, prochaine: string) {
    if (!quickModal) return;
    const base = quickModal.activite;
    const nouvelle: Activite = {
      id: `act-${Date.now()}`,
      entrepriseId: base.entrepriseId,
      entrepriseNom: base.entrepriseNom,
      contact: base.contact,
      commercialId: CURRENT_COMMERCIAL.id,
      commercial: CURRENT_COMMERCIAL.nom,
      date: todayFr(),
      heureDebut: nowFr(),
      duree: '-',
      type: quickModal.mode === 'note' ? 'Note' : 'Follow-up',
      resultat: '—',
      resume: texte,
      prochaineAction: prochaine || 'Aucune action planifiée',
      statut: quickModal.mode === 'followup' ? 'Planifié' : 'Terminé',
    };
    addActivite(nouvelle);
    notify(quickModal.mode === 'note' ? 'Note ajoutée.' : 'Follow-up planifié.');
    setQuickModal(null);
  }

  return (
    <div>
      <div className="mb-xl flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-headline-lg text-amud-on-surface">Activités</h1>
          <p className="mt-1 text-body-md text-amud-on-surface-variant">
            Historique de vos actions auprès des entreprises, candidats et recruteurs — visible uniquement pour {CURRENT_COMMERCIAL.nom}.
          </p>
        </div>
      </div>

      <section className="mb-xl grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="flex flex-col items-start gap-2 rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <div className="rounded-lg bg-amud-surface-container p-2 text-amud-primary">
              <span className="material-symbols-outlined text-[20px]">{k.icon}</span>
            </div>
            <p className="text-headline-md text-amud-on-surface">{k.value}</p>
            <p className="text-label-sm text-amud-on-surface-variant">{k.label}</p>
          </div>
        ))}
      </section>

      <section className="mb-lg space-y-3 rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-sm">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-amud-on-surface-variant">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface py-2 pl-10 pr-4 text-body-md outline-none focus:border-amud-primary focus:ring-2 focus:ring-amud-primary"
            placeholder="Rechercher une entreprise, un contact, un résumé…"
            type="text"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={periode} onChange={(e) => setPeriode(e.target.value)} className="rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-label-md text-amud-on-surface focus:ring-2 focus:ring-amud-primary">
            {PERIODES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <select value={entrepriseId} onChange={(e) => setEntrepriseId(e.target.value)} className="rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-label-md text-amud-on-surface focus:ring-2 focus:ring-amud-primary">
            <option value="">Entreprise</option>
            {entreprises.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nom}
              </option>
            ))}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value as TypeActivite | '')} className="rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-label-md text-amud-on-surface focus:ring-2 focus:ring-amud-primary">
            <option value="">Type d&apos;activité</option>
            {TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select value={resultat} onChange={(e) => setResultat(e.target.value as ResultatActivite | '')} className="rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-label-md text-amud-on-surface focus:ring-2 focus:ring-amud-primary">
            <option value="">Résultat</option>
            {RESULTATS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <select value={statut} onChange={(e) => setStatut(e.target.value as StatutActivite | '')} className="rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-label-md text-amud-on-surface focus:ring-2 focus:ring-amud-primary">
            <option value="">Statut</option>
            {STATUTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          {entrepriseId || type || resultat || statut || periode || search ? (
            <button
              onClick={() => {
                setEntrepriseId('');
                setType('');
                setResultat('');
                setStatut('');
                setPeriode('');
                setSearch('');
              }}
              className="rounded-lg border border-amud-outline-variant px-3 py-2 text-label-md text-amud-on-surface-variant hover:bg-amud-surface-container-low"
            >
              Réinitialiser
            </button>
          ) : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left">
            <thead>
              <tr className="border-b border-amud-outline-variant bg-amud-surface-container-low">
                {['Date', 'Heure', 'Commercial', 'Entreprise', 'Contact', 'Type', 'Durée', 'Résultat', 'Résumé', 'Prochaine action', 'Statut'].map((h) => (
                  <th key={h} className="p-4 text-label-sm font-semibold uppercase tracking-wider text-amud-on-surface-variant">
                    {h}
                  </th>
                ))}
                <th className="p-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-amud-outline-variant text-body-md">
              {filtered.map((a) => (
                <tr key={a.id} className="group transition-colors hover:bg-amud-surface-container-lowest">
                  <td className="cursor-pointer p-4" onClick={() => openDetail(a)}>
                    {a.date}
                  </td>
                  <td className="cursor-pointer p-4 text-amud-on-surface-variant" onClick={() => openDetail(a)}>
                    {a.heureDebut}
                  </td>
                  <td className="p-4 text-amud-on-surface">{a.commercial}</td>
                  <td className="p-4">
                    <Link href={`/amud/commercial/entreprises/${a.entrepriseId}`} className="font-medium text-amud-primary hover:underline">
                      {a.entrepriseNom}
                    </Link>
                  </td>
                  <td className="p-4 text-amud-on-surface-variant">{a.contact}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-amud-on-surface-variant">
                      <span className="material-symbols-outlined text-[20px]">{TYPE_ICON[a.type]}</span>
                      <span>{a.type}</span>
                    </div>
                  </td>
                  <td className="p-4 text-amud-on-surface-variant">{a.duree}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-medium ${RESULTAT_CLASS[a.resultat]}`}>{a.resultat}</span>
                  </td>
                  <td className="max-w-[220px] truncate p-4 text-amud-on-surface-variant">{a.resume}</td>
                  <td className="max-w-[180px] truncate p-4 text-sm text-amud-on-surface-variant">{a.prochaineAction}</td>
                  <td className="p-4">
                    <div className={`flex items-center gap-1.5 ${ACTIVITE_STATUT_CLASS[a.statut]}`}>
                      <div className="h-2 w-2 rounded-full bg-current" />
                      <span className="text-sm">{a.statut}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                      <button onClick={() => openDetail(a)} title="Voir" className="rounded p-1.5 text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container hover:text-amud-primary">
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                      </button>
                      <button onClick={() => setQuickModal({ activite: a, mode: 'note' })} title="Ajouter une note" className="rounded p-1.5 text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container hover:text-amud-primary">
                        <span className="material-symbols-outlined text-[20px]">note_add</span>
                      </button>
                      <button onClick={() => setQuickModal({ activite: a, mode: 'followup' })} title="Planifier un follow-up" className="rounded p-1.5 text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container hover:text-amud-primary">
                        <span className="material-symbols-outlined text-[20px]">schedule_send</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-10 text-center text-body-md text-amud-on-surface-variant">
                    Aucune activité ne correspond à ces filtres.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-amud-outline-variant bg-amud-surface-container-lowest p-4 text-label-sm text-amud-on-surface-variant">
          <span>
            Affichage 1-{filtered.length} sur {activites.length} activités
          </span>
        </div>
      </section>

      {/* --------------------------------------------------------- Drawer détail */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Détail de l'activité"
        subtitle={selected ? `Ticket #${selected.id}` : undefined}
        footer={
          selected ? (
            editing ? (
              <div className="flex justify-end gap-sm">
                <button onClick={() => setEditing(false)} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                  Annuler
                </button>
                <button onClick={saveEdit} className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white hover:bg-amud-primary-dark">
                  Enregistrer
                </button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-amud-outline-variant py-2 text-label-md text-amud-primary hover:bg-amud-surface-container-low">
                <span className="material-symbols-outlined text-[18px]">edit</span> Modifier
              </button>
            )
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-xl">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-amud-primary-container p-3 text-white">
                <span className="material-symbols-outlined text-[28px]">{TYPE_ICON[selected.type]}</span>
              </div>
              <div>
                <h4 className="text-headline-md text-amud-on-surface">{selected.type}</h4>
                <p className="mt-1 text-body-md text-amud-on-surface-variant">
                  {selected.date}, {selected.heureDebut} · {selected.duree}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-label-sm uppercase text-amud-on-surface-variant">Commercial</p>
                <p className="mt-1 text-amud-on-surface">{selected.commercial}</p>
              </div>
              <div>
                <p className="text-label-sm uppercase text-amud-on-surface-variant">Entreprise</p>
                <Link href={`/amud/commercial/entreprises/${selected.entrepriseId}`} className="mt-1 block font-medium text-amud-primary hover:underline">
                  {selected.entrepriseNom}
                </Link>
              </div>
              <div>
                <p className="text-label-sm uppercase text-amud-on-surface-variant">Contact</p>
                <p className="mt-1 text-amud-on-surface">{selected.contact}</p>
              </div>
              <div>
                <p className="text-label-sm uppercase text-amud-on-surface-variant">Résultat</p>
                {editing ? (
                  <select value={editResultat} onChange={(e) => setEditResultat(e.target.value as ResultatActivite)} className="mt-1 w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-2 py-1 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
                    {RESULTATS.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-medium ${RESULTAT_CLASS[selected.resultat]}`}>{selected.resultat}</span>
                )}
              </div>
            </div>

            <div>
              <p className="mb-2 text-label-sm uppercase text-amud-on-surface-variant">Résumé de la conversation</p>
              {editing ? (
                <textarea value={editResume} onChange={(e) => setEditResume(e.target.value)} rows={3} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
              ) : (
                <p className="rounded-lg border border-amud-outline-variant/50 bg-amud-surface-container-lowest p-3 text-body-md text-amud-on-surface">{selected.resume}</p>
              )}
            </div>

            <div>
              <p className="mb-2 text-label-sm uppercase text-amud-on-surface-variant">Prochaine action</p>
              {editing ? (
                <input value={editProchaine} onChange={(e) => setEditProchaine(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-amud-tertiary-fixed-dim bg-amud-tertiary-fixed/30 p-md">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amud-tertiary p-2 text-white">
                      <span className="material-symbols-outlined">flag</span>
                    </div>
                    <p className="font-medium text-amud-on-surface">{selected.prochaineAction}</p>
                  </div>
                </div>
              )}
            </div>

            {(() => {
              const related = activites.filter((a) => a.id !== selected.id && a.entrepriseId === selected.entrepriseId && a.contact === selected.contact);
              return related.length > 0 ? (
                <div>
                  <h5 className="mb-3 text-title-lg text-amud-on-surface">Activités précédentes avec ce contact</h5>
                  <div className="flex flex-col gap-2">
                    {related.slice(0, 4).map((r) => (
                      <div key={r.id} className="flex items-center justify-between rounded-lg border border-amud-outline-variant p-2 text-label-sm">
                        <span className="flex items-center gap-xs text-amud-on-surface">
                          <span className="material-symbols-outlined text-[16px] text-amud-primary">{TYPE_ICON[r.type]}</span> {r.type}
                        </span>
                        <span className="text-amud-on-surface-variant">
                          {r.date}, {r.heureDebut}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        ) : null}
      </Drawer>

      {/* --------------------------------------------------------- Modal note / follow-up */}
      <Modal open={!!quickModal} onClose={() => setQuickModal(null)} title={quickModal?.mode === 'note' ? 'Ajouter une note' : 'Planifier un follow-up'} subtitle={quickModal ? `${quickModal.activite.entrepriseNom} · ${quickModal.activite.contact}` : undefined} widthClassName="max-w-md">
        {quickModal ? <QuickForm mode={quickModal.mode} onSubmit={quickSubmit} /> : null}
      </Modal>
    </div>
  );
}

function QuickForm({ mode, onSubmit }: { mode: 'note' | 'followup'; onSubmit: (texte: string, prochaine: string) => void }) {
  const [texte, setTexte] = useState('');
  const [prochaine, setProchaine] = useState('');
  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        if (!texte.trim()) return;
        onSubmit(texte.trim(), prochaine.trim());
      }}
      className="flex flex-col gap-md"
    >
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">{mode === 'note' ? 'Note' : "Objet du follow-up"}</label>
        <textarea autoFocus value={texte} onChange={(e) => setTexte(e.target.value)} required rows={3} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
      </div>
      {mode === 'followup' ? (
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Prochaine action</label>
          <input value={prochaine} onChange={(e) => setProchaine(e.target.value)} placeholder="Ex : Rappeler le 25/08 à 10:00" className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
        </div>
      ) : null}
      <div className="flex justify-end">
        <button type="submit" className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white hover:bg-amud-primary-dark">
          {mode === 'note' ? 'Ajouter' : 'Planifier'}
        </button>
      </div>
    </form>
  );
}
