'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { EmptyState, FilterBar, PageHeader, ReadOnlyNotice, SelectFilter, StatCard } from '@/components/amud/ui';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { centresCollection } from '@/lib/amud/localCentres';
import { centresSeed, PARTNERSHIP_LABELS, PARTNERSHIP_CLASS, PARTNERSHIP_STATUSES } from '@/data/amud/centres';
import { centerStudentsCollection } from '@/lib/amud/localCenterStudents';
import { centerStudentsSeed } from '@/data/amud/centerStudents';
import { centerTeachersCollection } from '@/lib/amud/localCenterTeachers';
import { centerTeachersSeed } from '@/data/amud/centerTeachers';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';
import { CURRENT_COMMERCIAL } from '@/data/amud/currentCommercial';
import { auditLogs } from '@/lib/amud/storage/audit';
import { auditLogSeed } from '@/data/amud/auditLog';

/**
 * Espace Commercial, lecture seule (cahier des charges §13-17) : recherche,
 * filtres, consultation — aucun bouton Modifier/Supprimer. Le toggle "Mes
 * centres" suit le même principe que `/amud/commercial/entreprises`
 * (`commercialResponsable === CURRENT_COMMERCIAL.nom`), tous les centres
 * restent visibles, seuls les siens sont mis en avant.
 */
export default function AmudCommercialCentresPage() {
  const [centres] = useCollection(centresCollection, centresSeed);
  const [students] = useCollection(centerStudentsCollection, centerStudentsSeed);
  const [teachers] = useCollection(centerTeachersCollection, centerTeachersSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [logs] = useCollection(auditLogs, auditLogSeed);

  const [search, setSearch] = useState('');
  const [ville, setVille] = useState('');
  const [partnership, setPartnership] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);

  const villes = useMemo(() => Array.from(new Set(centres.map((c) => c.ville))).sort(), [centres]);

  /** Dernière activité par centre — colonne demandée dans la vue Commercial. */
  const lastActivity = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of logs) {
      if (!l.centerId) continue;
      const stamp = `${l.date} ${l.heure}`;
      const current = map.get(l.centerId);
      if (!current || stamp > current) map.set(l.centerId, stamp);
    }
    return map;
  }, [logs]);
  const counts = useMemo(() => {
    const byCenterCount = (arr: { centerId: string }[]) => {
      const map = new Map<string, number>();
      for (const item of arr) map.set(item.centerId, (map.get(item.centerId) ?? 0) + 1);
      return map;
    };
    return { students: byCenterCount(students), teachers: byCenterCount(teachers), formations: byCenterCount(formations) };
  }, [students, teachers, formations]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return centres.filter(
      (c) =>
        (!q || c.nom.toLowerCase().includes(q) || c.ville.toLowerCase().includes(q) || c.telephone.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.contactNom.toLowerCase().includes(q)) &&
        (!ville || c.ville === ville) &&
        (!partnership || c.partnershipStatus === partnership) &&
        (!onlyMine || c.assignedCommercialNom === CURRENT_COMMERCIAL.nom),
    );
  }, [centres, search, ville, partnership, onlyMine]);

  const kpis = [
    { label: 'Centres partenaires', value: centres.length, accent: 'bg-amud-secondary' },
    { label: 'Mes centres', value: centres.filter((c) => c.assignedCommercialNom === CURRENT_COMMERCIAL.nom).length, accent: 'bg-amud-primary' },
    { label: 'Actifs', value: centres.filter((c) => c.partnershipStatus === 'ACTIF').length, accent: 'bg-amud-primary-container' },
    { label: 'En négociation', value: centres.filter((c) => c.partnershipStatus === 'NEGOCIATION' || c.partnershipStatus === 'ESSAI').length, accent: 'bg-amud-tertiary-fixed-dim' },
  ];

  const activeFilterCount = [ville, partnership, onlyMine ? 'x' : ''].filter(Boolean).length;

  return (
    <div>
      <PageHeader title="Centres partenaires" subtitle="Consultez les centres de formation partenaires." />

      <ReadOnlyNotice>Espace Commercial en lecture seule : consultation uniquement, aucune modification n’est possible ici.</ReadOnlyNotice>

      <div className="mb-lg grid grid-cols-2 gap-md md:grid-cols-4">
        {kpis.map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} accent={k.accent} />
        ))}
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher par nom, ville, téléphone, email, contact…"
        activeFilterCount={activeFilterCount}
        onReset={() => {
          setSearch('');
          setVille('');
          setPartnership('');
          setOnlyMine(false);
        }}
        filters={
          <>
            <SelectFilter label="Ville" value={ville} onChange={setVille} options={villes.map((v) => ({ value: v, label: v }))} />
            <SelectFilter
              label="Partenariat"
              value={partnership}
              onChange={setPartnership}
              options={PARTNERSHIP_STATUSES.map((st) => ({ value: st, label: PARTNERSHIP_LABELS[st] }))}
            />
            <label className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg border border-amud-outline-variant px-4 text-label-md text-amud-on-surface">
              <input
                type="checkbox"
                checked={onlyMine}
                onChange={(e) => setOnlyMine(e.target.checked)}
                className="h-4 w-4 rounded border-amud-outline text-amud-primary focus:ring-amud-primary"
              />
              Mes centres
            </label>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <Link
            key={c.id}
            href={`/amud/commercial/centres/${c.id}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-3 border-b border-amud-outline-variant p-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-amud-outline-variant bg-amud-surface">
                <span className="material-symbols-outlined text-amud-primary">{c.logo}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-label-md font-semibold text-amud-on-surface group-hover:text-amud-primary">{c.nom}</h3>
                <p className="text-label-sm text-amud-on-surface-variant">{c.ville}</p>
              </div>
              {c.assignedCommercialNom === CURRENT_COMMERCIAL.nom ? (
                <span className="rounded-full bg-amud-primary/10 px-2 py-0.5 text-[11px] font-semibold text-amud-primary">Le mien</span>
              ) : null}
            </div>
            <div className="flex flex-1 flex-col gap-sm p-lg">
              <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${PARTNERSHIP_CLASS[c.partnershipStatus]}`}>{PARTNERSHIP_LABELS[c.partnershipStatus]}</span>
              <div className="mt-sm grid grid-cols-3 gap-sm text-center">
                <div>
                  <div className="text-title-lg text-amud-on-surface">{counts.students.get(c.id) ?? 0}</div>
                  <div className="text-label-sm text-amud-on-surface-variant">Étudiants</div>
                </div>
                <div>
                  <div className="text-title-lg text-amud-on-surface">{counts.teachers.get(c.id) ?? 0}</div>
                  <div className="text-label-sm text-amud-on-surface-variant">Enseignants</div>
                </div>
                <div>
                  <div className="text-title-lg text-amud-on-surface">{counts.formations.get(c.id) ?? 0}</div>
                  <div className="text-label-sm text-amud-on-surface-variant">Formations</div>
                </div>
              </div>
              <p className="mt-auto pt-sm text-label-sm text-amud-on-surface-variant">Commercial : {c.assignedCommercialNom || '—'}</p>
              <p className="text-label-sm text-amud-on-surface-variant">Dernière activité : {lastActivity.get(c.id) ?? '—'}</p>
              <span className="mt-sm flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-amud-outline-variant text-label-md font-medium text-amud-primary transition-colors group-hover:bg-amud-primary/5">
                <span className="material-symbols-outlined text-[18px]">visibility</span> Voir
              </span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 ? (
          <div className="col-span-full rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
            <EmptyState icon="search_off" title="Aucun centre trouvé" description="Aucun centre ne correspond à votre recherche ou à vos filtres." />
          </div>
        ) : null}
      </div>
    </div>
  );
}
