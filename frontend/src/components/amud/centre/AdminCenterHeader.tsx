'use client';

import Link from 'next/link';
import { Tabs } from '@/components/amud/ui';
import { PARTNERSHIP_CLASS, PARTNERSHIP_LABELS, type Centre } from '@/data/amud/centres';

/**
 * Fil d'Ariane + carte d'en-tête + barre d'onglets de la fiche centre côté
 * Admin — partagé par `[id]/page.tsx` et les 3 routes dédiées `[id]/activite`,
 * `[id]/finance`, `[id]/site` (cahier des charges §1) pour qu'elles aient
 * exactement le même habillage plutôt que 4 copies qui dérivent.
 */
export const ADMIN_CENTER_TABS = [
  { id: 'general', label: 'Vue générale' },
  { id: 'etudiants', label: 'Étudiants' },
  { id: 'enseignants', label: 'Enseignants' },
  { id: 'formations', label: 'Formations' },
  { id: 'groupes', label: 'Groupes' },
  { id: 'planning', label: 'Planning' },
  { id: 'presences', label: 'Présences' },
  { id: 'finance', label: 'Finances' },
  { id: 'site', label: 'Site web' },
  { id: 'activite', label: 'Activité' },
  { id: 'parametres', label: 'Paramètres' },
] as const;

/** Ces 3 onglets sont de vraies routes (`/[id]/activite`, `/finance`, `/site`) ; les autres restent des onglets locaux à `[id]/page.tsx`. */
export const ADMIN_CENTER_ROUTE_TABS = ['activite', 'finance', 'site'] as const;

export function AdminCenterHeader({
  centre,
  activeTab,
  onTabChange,
  onEdit,
  onDelete,
}: {
  centre: Centre;
  activeTab: string;
  onTabChange: (id: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <div className="mb-6 flex items-center gap-2 text-label-sm text-amud-on-surface-variant">
        <Link href="/amud/admin/centres" className="hover:text-amud-primary hover:underline">
          Centres de formation
        </Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-amud-on-surface">{centre.nom}</span>
      </div>

      <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-amud-outline-variant bg-amud-surface">
            <span className="material-symbols-outlined text-[28px] text-amud-primary">{centre.logo}</span>
          </div>
          <div>
            <h2 className="text-headline-md text-amud-on-surface">{centre.nom}</h2>
            <p className="text-body-md text-amud-on-surface-variant">
              {centre.ville}, {centre.pays} · {centre.assignedCommercialNom || 'Aucun commercial affecté'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${PARTNERSHIP_CLASS[centre.partnershipStatus]}`}>{PARTNERSHIP_LABELS[centre.partnershipStatus]}</span>
          <button onClick={onEdit} className="min-h-[44px] rounded-lg border border-amud-outline-variant px-md text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
            Modifier
          </button>
          <button onClick={onDelete} className="min-h-[44px] rounded-lg border border-amud-error px-md text-label-md text-amud-error hover:bg-amud-error-container/20">
            Supprimer
          </button>
        </div>
      </div>

      <div className="mb-6 overflow-x-auto">
        <Tabs tabs={ADMIN_CENTER_TABS as unknown as { id: string; label: string }[]} active={activeTab} onChange={onTabChange} />
      </div>
    </>
  );
}
