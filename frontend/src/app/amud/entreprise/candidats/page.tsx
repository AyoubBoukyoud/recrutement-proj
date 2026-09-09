'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Drawer } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { candidatesCollection } from '@/lib/amud/localCandidates';
import { candidatesSeed } from '@/data/amud/candidates';
import { favoritesCollection } from '@/lib/amud/localFavorites';
import { favoritesSeed } from '@/data/amud/favorites';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';
import { toggleFavorite } from '@/lib/amud/favoriteCascades';

function initialsOf(nom: string): string {
  return nom.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function AmudEntrepriseCandidatsPage() {
  const notify = useToast();
  const [candidates] = useCollection(candidatesCollection, candidatesSeed);
  const [favorites] = useCollection(favoritesCollection, favoritesSeed);
  const [search, setSearch] = useState('');
  const [ville, setVille] = useState('');
  const [disponibilite, setDisponibilite] = useState('');
  const [minCompletude, setMinCompletude] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const myFavoriteIds = useMemo(
    () => new Set(favorites.filter((f) => f.entrepriseId === CURRENT_EMPLOYER.entrepriseId).map((f) => f.candidateId)),
    [favorites],
  );
  const villes = useMemo(() => Array.from(new Set(candidates.map((c) => c.ville))).sort(), [candidates]);
  const disponibilites = useMemo(() => Array.from(new Set(candidates.map((c) => c.disponibilite))).sort(), [candidates]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return candidates
      .filter((c) => c.statut === 'Actif')
      .filter((c) => !q || c.nom.toLowerCase().includes(q) || c.posteRecherche.toLowerCase().includes(q) || c.competences.some((s) => s.toLowerCase().includes(q)))
      .filter((c) => !ville || c.ville === ville)
      .filter((c) => !disponibilite || c.disponibilite === disponibilite)
      .filter((c) => c.score >= minCompletude)
      .sort((a, b) => b.score - a.score);
  }, [candidates, search, ville, disponibilite, minCompletude]);

  const activeFiltersCount = [ville, disponibilite, minCompletude > 0].filter(Boolean).length;

  function handleToggleFavorite(candidateId: string, nom: string) {
    const { added } = toggleFavorite(candidateId, favorites);
    notify(added ? `${nom} ajouté(e) aux favoris.` : `${nom} retiré(e) des favoris.`);
  }

  const filtersContent = (
    <div className="flex flex-col gap-md">
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Ville</label>
        <select value={ville} onChange={(e) => setVille(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
          <option value="">Toutes les villes</option>
          {villes.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Disponibilité</label>
        <select value={disponibilite} onChange={(e) => setDisponibilite(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
          <option value="">Toutes</option>
          {disponibilites.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Complétude du profil minimum : {minCompletude}%</label>
        <input type="range" min={0} max={100} step={5} value={minCompletude} onChange={(e) => setMinCompletude(Number(e.target.value))} className="w-full accent-amud-primary" />
      </div>
      {activeFiltersCount > 0 ? (
        <button
          onClick={() => {
            setVille('');
            setDisponibilite('');
            setMinCompletude(0);
          }}
          className="text-label-md font-medium text-amud-primary hover:underline"
        >
          Réinitialiser les filtres
        </button>
      ) : null}
    </div>
  );

  return (
    <div>
      <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
        <div>
          <h2 className="text-headline-lg text-amud-on-surface">Candidats</h2>
          <p className="mt-1 text-body-md text-amud-on-surface-variant">{filtered.length} candidat(s) correspondent à votre recherche.</p>
        </div>
        <Link href="/amud/entreprise/favoris" className="flex items-center gap-1 rounded-lg border border-amud-outline-variant px-md py-2 text-label-md font-medium text-amud-on-surface hover:bg-amud-surface-container-low">
          <span className="material-symbols-outlined text-[18px]">star</span> Mes favoris
        </Link>
      </div>

      <div className="mb-lg flex items-center gap-sm">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-amud-on-surface-variant">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, poste recherché, compétence…"
            aria-label="Nom, poste recherché, compétence"
            className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface-container-low py-2 pl-10 pr-4 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
            type="text"
          />
        </div>
        <button
          onClick={() => setFiltersOpen(true)}
          className="flex shrink-0 items-center justify-center gap-1 rounded-lg border border-amud-outline-variant px-md py-2 text-label-md font-medium text-amud-on-surface hover:bg-amud-surface-container-low"
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          Filtres {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-amud-outline-variant p-xl text-center">
          <span className="material-symbols-outlined text-4xl text-amud-on-surface-variant">person_search</span>
          <p className="mt-sm text-body-md font-medium text-amud-on-surface">Aucun candidat trouvé.</p>
          <p className="mt-1 text-label-sm text-amud-on-surface-variant">Essayez d’élargir vos filtres.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const isFav = myFavoriteIds.has(c.id);
            return (
              <div key={c.id} className="flex flex-col gap-sm rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
                <div className="flex items-start justify-between gap-sm">
                  <div className="flex items-center gap-sm">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amud-primary-fixed text-[13px] font-bold text-amud-on-primary-fixed">{initialsOf(c.nom)}</span>
                    <div className="min-w-0">
                      <Link href={`/amud/entreprise/candidats/${c.id}`} className="truncate font-bold text-amud-on-surface hover:text-amud-primary">
                        {c.nom}
                      </Link>
                      <p className="truncate text-label-sm text-amud-on-surface-variant">{c.posteRecherche}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleFavorite(c.id, c.nom)}
                    aria-pressed={isFav}
                    aria-label={isFav ? `Retirer ${c.nom} des favoris` : `Ajouter ${c.nom} aux favoris`}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${isFav ? 'text-amud-secondary' : 'text-amud-on-surface-variant hover:text-amud-secondary'}`}
                  >
                    <span className="material-symbols-outlined" style={isFav ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                      star
                    </span>
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-x-md gap-y-1 text-label-sm text-amud-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">location_on</span> {c.ville}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">schedule</span> {c.disponibilite}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {c.competences.slice(0, 4).map((s) => (
                    <span key={s} className="rounded bg-amud-surface-container-highest px-1.5 py-0.5 text-[10px] font-medium text-amud-on-surface-variant">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="mt-1 flex items-center justify-between border-t border-amud-outline-variant pt-sm">
                  <span className="text-label-sm font-bold text-amud-primary">{c.score}% profil</span>
                  <Link href={`/amud/entreprise/candidats/${c.id}`} className="text-label-sm font-medium text-amud-primary hover:underline">
                    Voir profil
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} anchor="bottom" title="Filtres">
        {filtersContent}
      </Drawer>
    </div>
  );
}
