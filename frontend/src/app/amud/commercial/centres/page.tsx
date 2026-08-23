'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
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

  const [search, setSearch] = useState('');
  const [ville, setVille] = useState('');
  const [partnership, setPartnership] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);

  const villes = useMemo(() => Array.from(new Set(centres.map((c) => c.ville))).sort(), [centres]);
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

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-headline-lg text-amud-on-surface">Centres partenaires</h2>
        <p className="mt-1 text-body-md text-amud-on-surface-variant">Consultez les centres de formation partenaires (lecture seule).</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
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
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface py-2 pl-10 pr-4 text-body-md text-amud-on-surface outline-none focus:border-transparent focus:ring-2 focus:ring-amud-primary focus:ring-offset-2"
            placeholder="Rechercher par nom, ville, téléphone, email, contact…"
            type="text"
          />
        </div>
        <div className="flex w-full items-center gap-2 overflow-x-auto pb-2 md:w-auto md:pb-0">
          <select value={ville} onChange={(e) => setVille(e.target.value)} className="rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-label-md text-amud-on-surface focus:outline-none focus:ring-2 focus:ring-amud-primary">
            <option value="">Ville</option>
            {villes.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <select value={partnership} onChange={(e) => setPartnership(e.target.value)} className="rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-label-md text-amud-on-surface focus:outline-none focus:ring-2 focus:ring-amud-primary">
            <option value="">Partenariat</option>
            {PARTNERSHIP_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PARTNERSHIP_LABELS[s]}
              </option>
            ))}
          </select>
          <label className="flex shrink-0 items-center gap-2 rounded-lg border border-amud-outline-variant px-4 py-2 text-label-md text-amud-on-surface">
            <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} className="h-4 w-4 rounded border-amud-outline text-amud-primary focus:ring-amud-primary" />
            Mes centres
          </label>
        </div>
      </div>

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
            </div>
          </Link>
        ))}
        {filtered.length === 0 ? (
          <div className="col-span-full rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-xl text-center text-body-md text-amud-on-surface-variant">
            Aucun centre ne correspond à ces filtres.
          </div>
        ) : null}
      </div>
    </div>
  );
}
