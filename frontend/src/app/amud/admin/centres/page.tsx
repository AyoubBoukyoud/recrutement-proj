'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ConfirmDialog, EmptyState, FilterBar, PageHeader, SelectFilter, StatCard } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { logAudit } from '@/lib/amud/storage/audit';
import { canPerform, PERMISSION_DENIED_MESSAGE } from '@/lib/amud/centerPermissions';
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
    if (!canPerform('ADMIN', 'manage-centers')) {
      notify(PERMISSION_DENIED_MESSAGE, 'error');
      return;
    }
    const c = centres.find((x) => x.id === id);
    removeCentre(id);
    if (c) logAudit({ utilisateur: 'Administrateur', role: 'Admin', action: 'Suppression centre', actionType: 'delete', module: 'Centres de formation', reference: `${c.nom} (#${c.id})`, centerId: c.id });
    setOpenMenu(null);
    notify('Centre supprimé.', 'info');
  }

  const FilterFields = (
    <>
      <SelectFilter label="Ville" value={ville} onChange={(v) => { setVille(v); setPage(1); }} options={villes.map((v) => ({ value: v, label: v }))} />
      <SelectFilter
        label="Statut"
        value={statut}
        onChange={(v) => { setStatut(v); setPage(1); }}
        options={[
          { value: 'Actif', label: 'Actif' },
          { value: 'Inactif', label: 'Inactif' },
          { value: 'En attente', label: 'En attente' },
        ]}
      />
      <SelectFilter
        label="Partenariat"
        value={partnership}
        onChange={(v) => { setPartnership(v); setPage(1); }}
        options={PARTNERSHIP_STATUSES.map((st) => ({ value: st, label: PARTNERSHIP_LABELS[st] }))}
      />
      <SelectFilter
        label="Commercial"
        value={commercialFilter}
        onChange={(v) => { setCommercialFilter(v); setPage(1); }}
        options={commerciaux.map((c) => ({ value: c.id, label: `${c.prenom} ${c.nom}` }))}
      />
    </>
  );

  const activeFilterCount = [ville, statut, partnership, commercialFilter].filter(Boolean).length;

  function resetFilters() {
    setVille('');
    setStatut('');
    setPartnership('');
    setCommercialFilter('');
    setSearch('');
    setPage(1);
  }

  /** Actions d'une ligne — mêmes libellés en menu desktop et en cartes mobiles. */
  function rowActions(c: Centre) {
    return [
      { label: 'Voir la fiche', icon: 'visibility', href: `/amud/admin/centres/${c.id}` },
      { label: 'Modifier', icon: 'edit', onClick: () => { setEditCentre(c); setFormOpen(true); setOpenMenu(null); } },
      { label: 'Gérer le partenariat', icon: 'handshake', onClick: () => { setPartnershipCentre(c); setOpenMenu(null); } },
      { label: 'Affecter un commercial', icon: 'badge', onClick: () => { setPartnershipCentre(c); setOpenMenu(null); } },
      { label: 'Supprimer', icon: 'delete', danger: true, onClick: () => { setConfirmDeleteId(c.id); setOpenMenu(null); } },
    ];
  }

  return (
    <div className="pb-20 md:pb-0">
      <PageHeader
        title="Centres de formation"
        subtitle="Gérez les centres partenaires spécialisés dans l’enseignement de l’allemand."
        actionLabel="Ajouter un centre"
        onAction={() => {
          setEditCentre(undefined);
          setFormOpen(true);
        }}
      />

      <div className="mb-lg grid grid-cols-2 gap-md md:grid-cols-5">
        {kpis.map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} accent={k.accent} />
        ))}
      </div>

      <FilterBar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Rechercher par nom, ville, téléphone, email, contact, commercial…"
        filters={FilterFields}
        activeFilterCount={activeFilterCount}
        onReset={resetFilters}
      />

      {paged.length === 0 ? (
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
          <EmptyState
            icon={search || activeFilterCount ? 'search_off' : 'storefront'}
            title={search || activeFilterCount ? 'Aucun résultat' : 'Aucun centre trouvé'}
            description={
              search || activeFilterCount
                ? 'Aucun centre ne correspond à votre recherche ou à vos filtres.'
                : 'Ajoutez un premier centre partenaire pour commencer.'
            }
            actionLabel={search || activeFilterCount ? undefined : 'Ajouter un centre'}
            onAction={
              search || activeFilterCount
                ? undefined
                : () => {
                    setEditCentre(undefined);
                    setFormOpen(true);
                  }
            }
          />
        </div>
      ) : null}

      {/* ---- Cartes (mobile) ---- */}
      {paged.length > 0 ? (
        <ul className="flex flex-col gap-md md:hidden">
          {paged.map((c) => (
            <li key={c.id} className="animate-amud-rise-in overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
              <div className="flex items-start gap-md p-md">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-amud-outline-variant bg-amud-surface">
                  <span className="material-symbols-outlined text-amud-primary">{c.logo}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/amud/admin/centres/${c.id}`} className="block truncate text-label-md font-semibold text-amud-on-surface hover:text-amud-primary">
                    {c.nom}
                  </Link>
                  <span className="text-label-sm text-amud-on-surface-variant">{c.ville}</span>
                </div>
                <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${PARTNERSHIP_CLASS[c.partnershipStatus]}`}>
                  {PARTNERSHIP_LABELS[c.partnershipStatus]}
                </span>
              </div>
              <dl className="grid grid-cols-3 gap-sm border-t border-amud-outline-variant px-md py-sm text-center">
                <div>
                  <dt className="text-label-sm text-amud-on-surface-variant">Étudiants</dt>
                  <dd className="text-title-lg text-amud-on-surface">{counts.students.get(c.id) ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-label-sm text-amud-on-surface-variant">Enseignants</dt>
                  <dd className="text-title-lg text-amud-on-surface">{counts.teachers.get(c.id) ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-label-sm text-amud-on-surface-variant">Formations</dt>
                  <dd className="text-title-lg text-amud-on-surface">{counts.formations.get(c.id) ?? 0}</dd>
                </div>
              </dl>
              <p className="border-t border-amud-outline-variant px-md py-sm text-label-sm text-amud-on-surface-variant">
                Commercial : {c.assignedCommercialNom || '—'}
              </p>
              <div className="flex flex-wrap divide-x divide-amud-outline-variant border-t border-amud-outline-variant">
                {rowActions(c).map((a) =>
                  a.href ? (
                    <Link
                      key={a.label}
                      href={a.href}
                      className="flex min-h-[44px] flex-1 basis-1/3 items-center justify-center gap-1 px-2 text-label-sm text-amud-on-surface-variant active:bg-amud-surface-container-low"
                    >
                      <span className="material-symbols-outlined text-[18px]">{a.icon}</span>
                      Voir
                    </Link>
                  ) : (
                    <button
                      key={a.label}
                      onClick={a.onClick}
                      className={`flex min-h-[44px] flex-1 basis-1/3 items-center justify-center gap-1 px-2 text-label-sm active:bg-amud-surface-container-low ${
                        a.danger ? 'text-amud-error' : 'text-amud-on-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{a.icon}</span>
                      {a.label.replace('Gérer le ', '').replace('Affecter un ', '')}
                    </button>
                  ),
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="hidden overflow-x-auto rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm md:block">
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
    </div>
  );
}
