'use client';

import { ReactNode } from 'react';
import { Badge, BadgeTone, EmptyState, FilterBar, PageHeader, ReadOnlyNotice } from '@/components/amud/ui';

/**
 * Vue de liste CRUD partagée par toutes les pages `/amud/centre/*`
 * (étudiants, enseignants, formations, groupes, plannings, paiements,
 * tarifs, leads…).
 *
 * Mobile first : à partir de 360px les lignes sont rendues en **cartes**
 * empilées (titre, badge de statut, paires libellé/valeur, actions tactiles
 * de 44px) et le tableau n'apparaît qu'à partir de `md`. Le même composant
 * porte donc la recherche, les filtres (repliés en bottom-sheet sur mobile),
 * l'état vide et le bouton flottant d'ajout — plutôt que 8 pages qui
 * réimplémentent chacune leur variante.
 */
export type CrudRow = {
  id: string;
  /** Cellules du tableau desktop, dans l'ordre de `columns`. */
  cells: ReactNode[];
  /** Titre de la carte mobile (par défaut : première cellule). */
  cardTitle?: ReactNode;
  /** Sous-titre de la carte mobile (par défaut : deuxième cellule). */
  cardSubtitle?: ReactNode;
  /** Statut mis en pastille en haut de la carte et masqué des paires. */
  badge?: { label: string; tone: BadgeTone };
  /** Photo ou initiales affichées dans la carte mobile. */
  avatar?: { photo?: string; initials: string };
  onEdit?: () => void;
  onDelete?: () => void;
  onOpen?: () => void;
};

export function CenterCrudTable({
  title,
  subtitle,
  addLabel,
  onAdd,
  allowed,
  columns,
  rows,
  empty,
  emptyIcon = 'inbox',
  emptyDescription,
  search,
  onSearchChange,
  searchPlaceholder,
  filters,
  activeFilterCount = 0,
  onResetFilters,
  stats,
  readOnlyMessage = 'Votre rôle actuel ne permet que la consultation de cette section.',
  /** Indices des colonnes à ne pas répéter dans la carte mobile (déjà en titre/sous-titre). */
  cardHiddenColumns = [0, 1],
}: {
  title: string;
  subtitle?: string;
  addLabel: string;
  onAdd: () => void;
  allowed: boolean;
  columns: string[];
  rows: CrudRow[];
  empty: string;
  emptyIcon?: string;
  emptyDescription?: string;
  search?: string;
  onSearchChange?: (next: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  activeFilterCount?: number;
  onResetFilters?: () => void;
  stats?: ReactNode;
  readOnlyMessage?: string;
  cardHiddenColumns?: number[];
}) {
  const hasToolbar = typeof search === 'string' && !!onSearchChange;
  const isFiltered = (search ?? '').trim().length > 0 || activeFilterCount > 0;

  return (
    <div className="pb-20 md:pb-0">
      <PageHeader title={title} subtitle={subtitle} actionLabel={allowed ? addLabel : undefined} onAction={allowed ? onAdd : undefined} />

      {!allowed ? <ReadOnlyNotice>{readOnlyMessage}</ReadOnlyNotice> : null}

      {stats ? <div className="mb-lg grid grid-cols-2 gap-md lg:grid-cols-4">{stats}</div> : null}

      {hasToolbar ? (
        <FilterBar
          search={search as string}
          onSearchChange={onSearchChange as (n: string) => void}
          searchPlaceholder={searchPlaceholder}
          filters={filters}
          activeFilterCount={activeFilterCount}
          onReset={onResetFilters}
        />
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
          <EmptyState
            icon={isFiltered ? 'search_off' : emptyIcon}
            title={isFiltered ? 'Aucun résultat' : empty}
            description={
              isFiltered
                ? 'Aucun élément ne correspond à votre recherche ou à vos filtres.'
                : emptyDescription ?? (allowed ? `Commencez par « ${addLabel} ».` : undefined)
            }
            actionLabel={!isFiltered && allowed ? addLabel : undefined}
            onAction={!isFiltered && allowed ? onAdd : undefined}
          />
        </div>
      ) : (
        <>
          {/* ---- Cartes (mobile / tablette étroite) ---- */}
          <ul className="flex flex-col gap-md md:hidden">
            {rows.map((row) => {
              const cardTitle = row.cardTitle ?? row.cells[0];
              const cardSubtitle = row.cardSubtitle ?? row.cells[1];
              const pairs = columns
                .map((label, i) => ({ label, value: row.cells[i], i }))
                .filter((p) => !cardHiddenColumns.includes(p.i) && p.value !== undefined && p.value !== null && p.value !== '');

              return (
                <li key={row.id} className="animate-amud-rise-in overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
                  <div className="flex items-start gap-md p-md">
                    {row.avatar ? (
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amud-primary-container text-label-md font-bold text-white">
                        {row.avatar.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.avatar.photo} alt="" className="h-full w-full object-cover" />
                        ) : (
                          row.avatar.initials
                        )}
                      </span>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-label-md font-semibold text-amud-on-surface">{cardTitle}</p>
                      {cardSubtitle ? <p className="truncate text-label-sm text-amud-on-surface-variant">{cardSubtitle}</p> : null}
                    </div>
                    {row.badge ? <Badge tone={row.badge.tone}>{row.badge.label}</Badge> : null}
                  </div>

                  {pairs.length > 0 ? (
                    <dl className="grid grid-cols-2 gap-x-md gap-y-sm border-t border-amud-outline-variant px-md py-sm">
                      {pairs.map((p) => (
                        <div key={p.i} className="min-w-0">
                          <dt className="text-label-sm uppercase tracking-wide text-amud-on-surface-variant">{p.label}</dt>
                          <dd className="truncate text-body-md text-amud-on-surface">{p.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}

                  {allowed && (row.onEdit || row.onDelete || row.onOpen) ? (
                    <div className="flex divide-x divide-amud-outline-variant border-t border-amud-outline-variant">
                      {row.onOpen ? (
                        <button onClick={row.onOpen} className="flex min-h-[44px] flex-1 items-center justify-center gap-2 text-label-md text-amud-on-surface-variant transition-colors active:bg-amud-surface-container-low">
                          <span className="material-symbols-outlined text-[18px]">visibility</span> Voir
                        </button>
                      ) : null}
                      {row.onEdit ? (
                        <button onClick={row.onEdit} className="flex min-h-[44px] flex-1 items-center justify-center gap-2 text-label-md text-amud-primary transition-colors active:bg-amud-surface-container-low">
                          <span className="material-symbols-outlined text-[18px]">edit</span> Modifier
                        </button>
                      ) : null}
                      {row.onDelete ? (
                        <button onClick={row.onDelete} className="flex min-h-[44px] flex-1 items-center justify-center gap-2 text-label-md text-amud-error transition-colors active:bg-amud-error-container/30">
                          <span className="material-symbols-outlined text-[18px]">delete</span> Supprimer
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>

          {/* ---- Tableau (desktop) ---- */}
          <div className="hidden overflow-x-auto rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm md:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-amud-outline-variant bg-amud-surface-container-low/50 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">
                  {columns.map((c) => (
                    <th key={c} scope="col" className="whitespace-nowrap px-6 py-3">
                      {c}
                    </th>
                  ))}
                  {allowed ? (
                    <th scope="col" className="px-6 py-3 text-right">
                      Actions
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-amud-outline-variant">
                {rows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-amud-surface-container-low/40">
                    {row.cells.map((cell, i) => (
                      <td key={i} className="px-6 py-3 text-body-md text-amud-on-surface-variant">
                        {i === 0 ? <span className="font-medium text-amud-on-surface">{cell}</span> : cell}
                      </td>
                    ))}
                    {allowed ? (
                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end gap-sm">
                          {row.onOpen ? (
                            <button onClick={row.onOpen} className="rounded-lg p-2 text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-high hover:text-amud-primary" aria-label="Voir">
                              <span className="material-symbols-outlined text-[18px]">visibility</span>
                            </button>
                          ) : null}
                          {row.onEdit ? (
                            <button onClick={row.onEdit} className="rounded-lg p-2 text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-high hover:text-amud-primary" aria-label="Modifier">
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                          ) : null}
                          {row.onDelete ? (
                            <button onClick={row.onDelete} className="rounded-lg p-2 text-amud-on-surface-variant transition-colors hover:bg-amud-error-container/30 hover:text-amud-error" aria-label="Supprimer">
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Action collante mobile — au-dessus de la barre de navigation basse. */}
      {allowed && rows.length > 0 ? (
        <button
          onClick={onAdd}
          aria-label={addLabel}
          className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-amud-primary text-white shadow-lg transition-transform active:scale-95 md:hidden"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      ) : null}
    </div>
  );
}
