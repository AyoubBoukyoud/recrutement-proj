'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ConfirmDialog, Drawer } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { logAudit } from '@/lib/amud/storage/audit';
import { centresCollection } from '@/lib/amud/localCentres';
import { centresSeed, PARTNERSHIP_LABELS, PARTNERSHIP_CLASS, PARTNERSHIP_STATUSES, type Centre } from '@/data/amud/centres';
import { centerStudentsCollection } from '@/lib/amud/localCenterStudents';
import { centerStudentsSeed } from '@/data/amud/centerStudents';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';
import { centerGroupsCollection } from '@/lib/amud/localCenterGroups';
import { centerGroupsSeed } from '@/data/amud/centerGroups';
import { commerciaux } from '@/data/amud/commerciaux';
import { CenterFormModal } from '@/components/amud/centre/CenterFormModal';
import { CenterPartnershipModal } from '@/components/amud/centre/CenterPartnershipModal';

const PAGE_SIZE = 6;

export default function AmudAdminCentresPage() {
  const notify = useToast();
  const [centres, { remove: removeCentre }] = useCollection(centresCollection, centresSeed);
  const [students] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [groups] = useCollection(centerGroupsCollection, centerGroupsSeed);

  const [search, setSearch] = useState('');
  const [ville, setVille] = useState('');
  const [statut, setStatut] = useState('');
  const [partnership, setPartnership] = useState('');
  const [commercialFilter, setCommercialFilter] = useState('');
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editCentre, setEditCentre] = useState<Centre | undefined>(undefined);
  const [partnershipCentre, setPartnershipCentre] = useState<Centre | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const villes = useMemo(() => Array.from(new Set(centres.map((c) => c.ville))).sort(), [centres]);

  const counts = useMemo(() => {
    const byCenterCount = (arr: { centerId: string }[]) => {
      const map = new Map<string, number>();
      for (const item of arr) map.set(item.centerId, (map.get(item.centerId) ?? 0) + 1);
      return map;
    };
    return {
      students: byCenterCount(students),
      teachers: byCenterCount(teachers),
      formations: byCenterCount(formations),
      groups: byCenterCount(groups),
    };
  }, [students, teachers, formations, groups]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return centres.filter(
      (c) =>
        (!q ||
          c.nom.toLowerCase().includes(q) ||
          c.ville.toLowerCase().includes(q) ||
          c.telephone.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.contactNom.toLowerCase().includes(q) ||
          c.assignedCommercialNom.toLowerCase().includes(q)) &&
        (!ville || c.ville === ville) &&
        (!statut || c.statut === statut) &&
        (!partnership || c.partnershipStatus === partnership) &&
        (!commercialFilter || c.assignedCommercialId === commercialFilter),
    );
  }, [centres, search, ville, statut, partnership, commercialFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const kpis = [
    { label: 'Total centres', value: centres.length, accent: 'bg-amud-primary' },
    { label: 'Actifs', value: centres.filter((c) => c.statut === 'Actif').length, accent: 'bg-amud-primary-container' },
    { label: 'Partenariat actif', value: centres.filter((c) => c.partnershipStatus === 'ACTIF').length, accent: 'bg-amud-primary-fixed-dim' },
    { label: 'En négociation', value: centres.filter((c) => c.partnershipStatus === 'NEGOCIATION' || c.partnershipStatus === 'ESSAI').length, accent: 'bg-amud-tertiary-fixed-dim' },
    { label: 'Suspendus', value: centres.filter((c) => c.partnershipStatus === 'SUSPENDU' || c.partnershipStatus === 'EXPIRE').length, accent: 'bg-amud-error' },
  ];

  function removeRow(id: string) {
    const c = centres.find((x) => x.id === id);
    removeCentre(id);
    if (c) logAudit({ utilisateur: 'Administrateur', role: 'Admin', action: 'Suppression centre', actionType: 'delete', module: 'Centres de formation', reference: `${c.nom} (#${c.id})`, centerId: c.id });
    setOpenMenu(null);
    notify('Centre supprimé.', 'info');
  }

  const FilterFields = (
    <>
      <select value={ville} onChange={(e) => { setVille(e.target.value); setPage(1); }} className="rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-label-md text-amud-on-surface focus:outline-none focus:ring-2 focus:ring-amud-primary">
        <option value="">Ville</option>
        {villes.map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
      <select value={statut} onChange={(e) => { setStatut(e.target.value); setPage(1); }} className="rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-label-md text-amud-on-surface focus:outline-none focus:ring-2 focus:ring-amud-primary">
        <option value="">Statut</option>
        <option>Actif</option>
        <option>Inactif</option>
        <option>En attente</option>
      </select>
      <select value={partnership} onChange={(e) => { setPartnership(e.target.value); setPage(1); }} className="rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-label-md text-amud-on-surface focus:outline-none focus:ring-2 focus:ring-amud-primary">
        <option value="">Partenariat</option>
        {PARTNERSHIP_STATUSES.map((s) => (
          <option key={s} value={s}>
            {PARTNERSHIP_LABELS[s]}
          </option>
        ))}
      </select>
      <select value={commercialFilter} onChange={(e) => { setCommercialFilter(e.target.value); setPage(1); }} className="rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-label-md text-amud-on-surface focus:outline-none focus:ring-2 focus:ring-amud-primary">
        <option value="">Commercial</option>
        {commerciaux.map((c) => (
          <option key={c.id} value={c.id}>
            {c.prenom} {c.nom}
          </option>
        ))}
      </select>
    </>
  );

  return (
    <div>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-headline-lg text-amud-on-surface">Centres de formation</h2>
          <p className="mt-1 text-body-md text-amud-on-surface-variant">Gérez les centres partenaires spécialisés dans l&apos;enseignement de l&apos;allemand.</p>
        </div>
        <button
          onClick={() => {
            setEditCentre(undefined);
            setFormOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-amud-primary px-6 py-3 text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            add
          </span>
          Ajouter un centre
        </button>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-gutter">
        {kpis.map((k) => (
          <div key={k.label} className="relative flex flex-col items-start justify-center overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <div className={`absolute bottom-0 left-0 top-0 w-1 ${k.accent}`} />
            <span className="mb-2 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">{k.label}</span>
            <span className="text-headline-lg text-amud-on-surface">{k.value}</span>
          </div>
        ))}
      </div>

      <div className="mb-6 flex flex-col items-center gap-4 rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)] md:flex-row">
        <div className="relative w-full flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-amud-on-surface-variant">search</span>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface py-2 pl-10 pr-4 text-body-md text-amud-on-surface outline-none focus:border-transparent focus:ring-2 focus:ring-amud-primary focus:ring-offset-2"
            placeholder="Rechercher par nom, ville, téléphone, email, contact, commercial…"
            type="text"
          />
        </div>
        <button
          onClick={() => setFiltersOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-amud-outline-variant px-4 py-2 text-label-md text-amud-on-surface md:hidden"
        >
          <span className="material-symbols-outlined text-[18px]">filter_list</span> Filtres
        </button>
        <div className="hidden w-full gap-2 overflow-x-auto pb-2 md:flex md:w-auto md:pb-0">{FilterFields}</div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-amud-outline-variant bg-amud-surface-container-low/50">
              <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Centre</th>
              <th className="hidden px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant md:table-cell">Contact</th>
              <th className="px-6 py-4 text-center text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Étudiants</th>
              <th className="hidden px-6 py-4 text-center text-label-sm uppercase tracking-wider text-amud-on-surface-variant lg:table-cell">Enseignants</th>
              <th className="hidden px-6 py-4 text-center text-label-sm uppercase tracking-wider text-amud-on-surface-variant lg:table-cell">Formations</th>
              <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Partenariat</th>
              <th className="hidden px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant md:table-cell">Commercial</th>
              <th className="px-6 py-4 text-right text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amud-outline-variant">
            {paged.map((c) => (
              <tr key={c.id} className="animate-amud-rise-in transition-colors hover:bg-amud-surface-container-lowest/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded border border-amud-outline-variant bg-amud-surface">
                      <span className="material-symbols-outlined text-amud-primary">{c.logo}</span>
                    </div>
                    <div>
                      <Link href={`/amud/admin/centres/${c.id}`} className="block text-label-md font-semibold text-amud-on-surface hover:text-amud-primary hover:underline">
                        {c.nom}
                      </Link>
                      <span className="text-label-sm text-amud-on-surface-variant">{c.ville}</span>
                    </div>
                  </div>
                </td>
                <td className="hidden px-6 py-4 md:table-cell">
                  <div className="flex flex-col">
                    <span className="text-body-md text-amud-on-surface">{c.telephone}</span>
                    <span className="text-label-sm text-amud-on-surface-variant">{c.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center text-body-md text-amud-on-surface-variant">{counts.students.get(c.id) ?? 0}</td>
                <td className="hidden px-6 py-4 text-center text-body-md text-amud-on-surface-variant lg:table-cell">{counts.teachers.get(c.id) ?? 0}</td>
                <td className="hidden px-6 py-4 text-center text-body-md text-amud-on-surface-variant lg:table-cell">{counts.formations.get(c.id) ?? 0}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${PARTNERSHIP_CLASS[c.partnershipStatus]}`}>{PARTNERSHIP_LABELS[c.partnershipStatus]}</span>
                </td>
                <td className="hidden px-6 py-4 text-body-md text-amud-on-surface-variant md:table-cell">{c.assignedCommercialNom || '—'}</td>
                <td className="relative px-6 py-4 text-right">
                  <button onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)} className="p-1 text-amud-on-surface-variant transition-colors hover:text-amud-primary">
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                  {openMenu === c.id ? (
                    <div className="absolute right-6 top-12 z-10 w-52 rounded-lg border border-amud-outline-variant bg-amud-surface py-1 text-left shadow-lg animate-amud-fade-in">
                      <Link href={`/amud/admin/centres/${c.id}`} onClick={() => setOpenMenu(null)} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                        Voir la fiche
                      </Link>
                      <button
                        onClick={() => {
                          setEditCentre(c);
                          setFormOpen(true);
                          setOpenMenu(null);
                        }}
                        className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => {
                          setPartnershipCentre(c);
                          setOpenMenu(null);
                        }}
                        className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low"
                      >
                        Modifier le partenariat
                      </button>
                      <button
                        onClick={() => {
                          setPartnershipCentre(c);
                          setOpenMenu(null);
                        }}
                        className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low"
                      >
                        Affecter un commercial
                      </button>
                      <button
                        onClick={() => {
                          setConfirmDeleteId(c.id);
                          setOpenMenu(null);
                        }}
                        className="block w-full px-4 py-2 text-left text-label-md text-amud-error hover:bg-amud-surface-container-low"
                      >
                        Supprimer
                      </button>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
            {paged.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-body-md text-amud-on-surface-variant">
                  Aucun centre ne correspond à ces filtres.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {pageCount > 1 ? (
        <div className="mt-6 flex items-center justify-between text-amud-on-surface-variant">
          <span className="text-body-md">
            Affichage de {paged.length ? (page - 1) * PAGE_SIZE + 1 : 0} à {(page - 1) * PAGE_SIZE + paged.length} sur {filtered.length}
          </span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-md border border-amud-outline-variant px-3 py-1 hover:bg-amud-surface-container-low disabled:opacity-50">
              Précédent
            </button>
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`rounded-md border px-3 py-1 ${page === i + 1 ? 'border-amud-primary bg-amud-primary text-white' : 'border-amud-outline-variant hover:bg-amud-surface-container-low'}`}
              >
                {i + 1}
              </button>
            ))}
            <button disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} className="rounded-md border border-amud-outline-variant px-3 py-1 hover:bg-amud-surface-container-low disabled:opacity-50">
              Suivant
            </button>
          </div>
        </div>
      ) : null}

      <CenterFormModal open={formOpen} onClose={() => setFormOpen(false)} centre={editCentre} />
      <CenterPartnershipModal open={!!partnershipCentre} onClose={() => setPartnershipCentre(null)} centre={partnershipCentre} />

      <ConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && removeRow(confirmDeleteId)}
        title="Supprimer ce centre ?"
        description="Cette action est irréversible. Le centre et sa fiche seront retirés de la liste."
        confirmLabel="Supprimer"
      />

      <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filtres" anchor="bottom">
        <div className="flex flex-col gap-md">{FilterFields}</div>
      </Drawer>
    </div>
  );
}
