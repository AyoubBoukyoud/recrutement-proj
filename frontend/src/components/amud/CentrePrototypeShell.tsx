'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CentreShellFrame } from './CentreShell';
import { GlobalSearch, useGlobalSearchShortcut, type GlobalSearchResult } from './GlobalSearch';
import { NotificationCenter } from './NotificationCenter';
import { useCurrentCenter } from '@/lib/amud/currentCentre';
import { CENTER_ROLES, CENTER_ROLE_LABELS } from '@/data/amud/centerTypes';
import { centresCollection } from '@/lib/amud/localCentres';
import { centresSeed } from '@/data/amud/centres';
import { loadLocalCenterStudents } from '@/lib/amud/localCenterStudents';
import { loadLocalCenterTeachers } from '@/lib/amud/localCenterTeachers';
import { loadLocalCenterFormations } from '@/lib/amud/localCenterFormations';
import { loadLocalCenterGroups } from '@/lib/amud/localCenterGroups';
import { useCollection } from '@/lib/amud/storage/useCollection';

/** Recherche header, bornée aux données du centre actif (même pattern que `useGlobalSearchResults` d'AdminShell). */
function useCentreSearchResults(query: string, centerId: string): GlobalSearchResult[] {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const results: GlobalSearchResult[] = [];

    for (const s of loadLocalCenterStudents().filter((s) => s.centerId === centerId)) {
      if (results.filter((r) => r.icon === 'group').length >= 3) break;
      const nom = `${s.prenom} ${s.nom}`;
      if (nom.toLowerCase().includes(q)) {
        results.push({ id: `etu-${s.id}`, label: nom, sub: 'Étudiant', href: '/amud/centre/etudiants', icon: 'group' });
      }
    }
    for (const t of loadLocalCenterTeachers().filter((t) => t.centerId === centerId)) {
      if (results.filter((r) => r.icon === 'cast_for_education').length >= 3) break;
      const nom = `${t.prenom} ${t.nom}`;
      if (nom.toLowerCase().includes(q)) {
        results.push({ id: `ens-${t.id}`, label: nom, sub: 'Enseignant', href: '/amud/centre/enseignants', icon: 'cast_for_education' });
      }
    }
    for (const f of loadLocalCenterFormations().filter((f) => f.centerId === centerId)) {
      if (results.filter((r) => r.icon === 'menu_book').length >= 3) break;
      if (f.nom.toLowerCase().includes(q)) {
        results.push({ id: `for-${f.id}`, label: f.nom, sub: 'Formation', href: '/amud/centre/formations', icon: 'menu_book' });
      }
    }
    for (const g of loadLocalCenterGroups().filter((g) => g.centerId === centerId)) {
      if (results.filter((r) => r.icon === 'diversity_3').length >= 3) break;
      if (g.nom.toLowerCase().includes(q)) {
        results.push({ id: `grp-${g.id}`, label: g.nom, sub: 'Groupe', href: '/amud/centre/groupes', icon: 'diversity_3' });
      }
    }

    return results.slice(0, 8);
  }, [query, centerId]);
}


function PrototypeSearch({ centerId }: { centerId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useCentreSearchResults(query, centerId);
  useGlobalSearchShortcut(() => { setOpen(true); inputRef.current?.focus(); });
  useEffect(() => { setOpen(false); setQuery(''); }, [pathname]);
  return <GlobalSearch query={query} onQueryChange={setQuery} results={results}
    onSelect={(href) => { setOpen(false); setQuery(''); router.push(href); }}
    open={open} onOpenChange={setOpen} inputRef={inputRef}
    placeholder="Rechercher un étudiant, un enseignant…" className="relative hidden w-64 md:block" />;
}

/** Legacy storage is initialized only when a prototype page is actually opened. */
export function CentrePrototypeShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { centerId, role, setCenterId, setRole } = useCurrentCenter();
  const [centres] = useCollection(centresCollection, centresSeed);
  const currentCentre = centres.find((center) => center.id === centerId);
  return <CentreShellFrame centerName={currentCentre?.nom}
    search={<PrototypeSearch centerId={centerId} />}
    notifications={<NotificationCenter key={pathname} scope="centre" />}
    profileControls={<div className="flex flex-col gap-sm p-md">
      <label className="text-label-sm text-amud-on-surface-variant">Centre actif
        <select value={centerId} onChange={(event) => setCenterId(event.target.value)} className="mt-1 w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
          {centres.map((center) => <option key={center.id} value={center.id}>{center.nom}</option>)}
        </select>
      </label>
      <label className="text-label-sm text-amud-on-surface-variant">Rôle simulé
        <select value={role} onChange={(event) => setRole(event.target.value as typeof role)} className="mt-1 w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
          {CENTER_ROLES.map((value) => <option key={value} value={value}>{CENTER_ROLE_LABELS[value]}</option>)}
        </select>
      </label>
    </div>}>
    {children}
  </CentreShellFrame>;
}
