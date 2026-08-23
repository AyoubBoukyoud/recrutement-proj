import { EmptyState, ResponsiveTable } from '@/components/amud/ui';
import type { ReactNode } from 'react';

/**
 * Adaptateur partagé (lignes « brutes » → `ResponsiveTable`) — extrait de
 * `admin/centres/[id]/page.tsx` pour être réutilisé par les 3 routes
 * dédiées `/activite`, `/finance`, `/site` (cahier des charges §1) sans
 * dupliquer ce petit wrapper à chaque fois.
 */
export function SimpleTable({ columns, rows, empty }: { columns: string[]; rows: ReactNode[][]; empty: string }) {
  return (
    <ResponsiveTable
      columns={columns}
      rows={rows.map((cells, i) => ({ id: String(i), cells }))}
      empty={<EmptyState icon="inbox" title={empty} />}
    />
  );
}
