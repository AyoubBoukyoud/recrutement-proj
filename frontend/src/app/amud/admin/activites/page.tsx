'use client';

import { useMemo, useState } from 'react';
import { Drawer } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { exportCsv } from '@/lib/amud/csv';
import {
  RESULTAT_CLASS,
  STATUT_CLASS,
  TYPE_ICON,
  activitesSeed,
  type Activite,
  type ResultatActivite,
  type StatutActivite,
  type TypeActivite,
} from '@/data/amud/commercialActivites';
import { activitesCollection } from '@/lib/amud/localCommercialActivites';
import { useCollection } from '@/lib/amud/storage/useCollection';

const TYPES: TypeActivite[] = ['Appel', 'Email', 'Note', 'Tâche', 'Rendez-vous', 'Offre créée', 'Offre publiée', 'Candidat proposé', 'Follow-up'];
const RESULTATS: ResultatActivite[] = ['Répondu', 'Sans réponse', 'Positif', 'Négatif', 'En cours', '—'];

function todayFr() {
  return new Date().toLocaleDateString('fr-FR');
}

export default function AmudAdminActivitesPage() {
  const notify = useToast();
  const [activites] = useCollection(activitesCollection, activitesSeed);

  const [search, setSearch] = useState('');
  const [commercial, setCommercial] = useState('');
  const [type, setType] = useState<TypeActivite | ''>('');
  const [resultat, setResultat] = useState<ResultatActivite | ''>('');
  const [selected, setSelected] = useState<Activite | null>(null);

  const commerciaux = useMemo(() => Array.from(new Set(activites.map((a) => a.commercial))).sort(), [activites]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activites
      .filter(
        (a) =>
          (!q || a.contact.toLowerCase().includes(q) || a.commercial.toLowerCase().includes(q) || a.entrepriseNom.toLowerCase().includes(q)) &&
          (!commercial || a.commercial === commercial) &&
          (!type || a.type === type) &&
          (!resultat || a.resultat === resultat),
      )
      .sort((a, b) => (a.date === b.date ? b.heureDebut.localeCompare(a.heureDebut) : b.date.localeCompare(a.date)));
  }, [activites, search, commercial, type, resultat]);

  const today = todayFr();
  const activitesAuj = useMemo(() => activites.filter((a) => a.date === today), [activites, today]);
  const appels = useMemo(() => activites.filter((a) => a.type === 'Appel'), [activites]);

  const kpis = [
    { label: 'Appels', value: appels.length, icon: 'call', border: 'border-l-amud-primary' },
    { label: 'Appels répondus', value: appels.filter((a) => a.resultat === 'Répondu' || a.resultat === 'Positif').length, icon: 'call_made', border: 'border-l-amud-primary-fixed' },
    { label: 'Sans réponse', value: appels.filter((a) => a.resultat === 'Sans réponse').length, icon: 'call_missed', border: 'border-l-amud-error' },
    { label: 'Follow-ups', value: activites.filter((a) => a.type === 'Follow-up').length, icon: 'history', border: 'border-l-amud-tertiary' },
    { label: 'Rendez-vous', value: activites.filter((a) => a.type === 'Rendez-vous').length, icon: 'event', border: 'border-l-amud-secondary' },
    { label: 'Notes', value: activites.filter((a) => a.type === 'Note').length, icon: 'edit_document', border: '' },
  ];

  return (
    <div>
      <div className="mb-xl flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-headline-lg text-amud-on-surface">Activités commerciales</h2>
          <p className="mt-1 text-body-lg text-amud-on-surface-variant">Suivez en temps réel les interactions de votre équipe.</p>
        </div>
        <button
          onClick={() => {
            exportCsv(
              'activites-commerciales',
              filtered.map((a) => ({ Date: a.date, Heure: a.heureDebut, Commercial: a.commercial, Contact: a.contact, Type: a.type, Résultat: a.resultat, Statut: a.statut })),
            );
            notify('Rapport exporté.');
          }}
          className="flex items-center gap-2 rounded-lg border border-amud-outline bg-amud-surface px-4 py-2 text-label-md text-amud-primary shadow-sm transition-colors hover:bg-amud-surface-container-low"
        >
          <span className="material-symbols-outlined text-[20px]">ios_share</span>
          Exporter le rapport
        </button>
      </div>

      <section className="mb-xl grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
        <div className="relative col-span-2 flex h-full flex-col justify-between overflow-hidden rounded-xl border border-amud-outline-variant/30 bg-amud-primary-container p-lg text-white shadow-sm md:col-span-4 lg:col-span-2">
          <p className="mb-2 text-label-md uppercase tracking-wider text-white/80">Activités aujourd&apos;hui</p>
          <p className="mt-auto text-display-lg">{activitesAuj.length}</p>
        </div>
        {kpis.map((k) => (
          <div key={k.label} className={`flex flex-col items-start gap-2 rounded-xl border border-amud-outline-variant bg-amud-surface p-md shadow-sm ${k.border ? `border-l-4 ${k.border}` : ''}`}>
            <div className="rounded-lg bg-amud-surface-container p-2 text-amud-primary">
              <span className="material-symbols-outlined text-[20px]">{k.icon}</span>
            </div>
            <p className="text-headline-md text-amud-on-surface">{k.value}</p>
            <p className="text-label-sm text-amud-on-surface-variant">{k.label}</p>
          </div>
        ))}
      </section>

      <section className="mb-xl space-y-4 rounded-xl border border-amud-outline-variant bg-amud-surface p-md shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative min-w-[250px] flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-amud-on-surface-variant">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface py-2 pl-10 pr-4 text-body-md outline-none transition-shadow focus:border-amud-primary focus:ring-2 focus:ring-amud-primary"
              placeholder="Rechercher une activité…"
              type="text"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={commercial} onChange={(e) => setCommercial(e.target.value)} className="rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-label-md text-amud-on-surface focus:ring-2 focus:ring-amud-primary">
              <option value="">Commercial</option>
              {commerciaux.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select value={type} onChange={(e) => setType(e.target.value as TypeActivite | '')} className="rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-label-md text-amud-on-surface focus:ring-2 focus:ring-amud-primary">
              <option value="">Type</option>
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
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-left">
            <thead>
              <tr className="border-b border-amud-outline-variant bg-amud-surface-container-low">
                {['Date', 'Commercial', 'Contact', 'Type', 'Durée', 'Résultat', 'Résumé', 'Prochaine action', 'Statut'].map((h) => (
                  <th key={h} className="p-4 text-label-sm font-semibold uppercase tracking-wider text-amud-on-surface-variant">
                    {h}
                  </th>
                ))}
                <th className="p-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-amud-outline-variant text-body-md">
              {filtered.map((a) => (
                <tr key={a.id} onClick={() => setSelected(a)} className="group cursor-pointer transition-colors hover:bg-amud-surface-container-lowest">
                  <td className="p-4">
                    <span className="block font-medium text-amud-on-surface">{a.date}</span>
                    <span className="block text-label-sm text-amud-on-surface-variant">{a.heureDebut}</span>
                  </td>
                  <td className="p-4 text-amud-on-surface">{a.commercial}</td>
                  <td className="p-4 font-medium text-amud-primary">{a.contact}</td>
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
                  <td className="max-w-[200px] truncate p-4 text-amud-on-surface-variant">{a.resume}</td>
                  <td className="max-w-[180px] truncate p-4 text-sm text-amud-on-surface-variant">{a.prochaineAction}</td>
                  <td className="p-4">
                    <div className={`flex items-center gap-1.5 ${STATUT_CLASS[a.statut]}`}>
                      <div className="h-2 w-2 rounded-full bg-current" />
                      <span className="text-sm">{a.statut}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-1 text-amud-on-surface-variant opacity-0 transition-colors group-hover:opacity-100 hover:text-amud-primary">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-10 text-center text-body-md text-amud-on-surface-variant">
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

      <Drawer open={!!selected} onClose={() => setSelected(null)} title="Détail de l'activité" subtitle={selected ? `${selected.date}, ${selected.heureDebut}` : undefined}>
        {selected ? (
          <div className="space-y-xl">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-amud-primary-container p-3 text-white">
                <span className="material-symbols-outlined text-[28px]">{TYPE_ICON[selected.type]}</span>
              </div>
              <div>
                <h4 className="text-headline-md text-amud-on-surface">{selected.type}</h4>
                <p className="mt-1 text-body-md text-amud-on-surface-variant">
                  {selected.date}, {selected.heureDebut} • {selected.duree}
                </p>
              </div>
            </div>

            <div className="relative space-y-4 overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface p-md shadow-sm">
              <div className="absolute bottom-0 left-0 top-0 w-1 bg-amud-primary" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-label-sm uppercase text-amud-on-surface-variant">Contact</p>
                  <p className="mt-1 font-medium text-amud-primary">{selected.contact}</p>
                </div>
                <div>
                  <p className="text-label-sm uppercase text-amud-on-surface-variant">Commercial</p>
                  <p className="mt-1 text-amud-on-surface">{selected.commercial}</p>
                </div>
                <div>
                  <p className="text-label-sm uppercase text-amud-on-surface-variant">Résultat</p>
                  <span className={`mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-medium ${RESULTAT_CLASS[selected.resultat]}`}>{selected.resultat}</span>
                </div>
                <div>
                  <p className="text-label-sm uppercase text-amud-on-surface-variant">Statut</p>
                  <div className={`mt-1 flex items-center gap-1.5 ${STATUT_CLASS[selected.statut]}`}>
                    <div className="h-2 w-2 rounded-full bg-current" />
                    <span className="text-sm font-medium">{selected.statut}</span>
                  </div>
                </div>
              </div>
              <div className="border-t border-amud-outline-variant pt-4">
                <p className="mb-2 text-label-sm uppercase text-amud-on-surface-variant">Résumé de la conversation</p>
                <p className="rounded-lg border border-amud-outline-variant/50 bg-amud-surface-container-lowest p-3 text-body-md text-amud-on-surface">{selected.resume}</p>
              </div>
            </div>

            <div>
              <h5 className="mb-3 text-title-lg text-amud-on-surface">Prochaine action</h5>
              <div className="flex items-center justify-between rounded-xl border border-amud-tertiary-fixed-dim bg-amud-tertiary-fixed/30 p-md">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amud-tertiary p-2 text-white">
                    <span className="material-symbols-outlined">mail</span>
                  </div>
                  <div>
                    <p className="font-medium text-amud-on-surface">{selected.prochaineAction}</p>
                    <p className="text-label-sm text-amud-on-surface-variant">Prévu prochainement</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
