'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { favoritesCollection } from '@/lib/amud/localFavorites';
import { favoritesSeed } from '@/data/amud/favorites';
import { candidatesCollection } from '@/lib/amud/localCandidates';
import { candidatesSeed } from '@/data/amud/candidates';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';
import { toggleFavorite } from '@/lib/amud/favoriteCascades';
import { startConversation } from '@/lib/amud/messageCascades';

function initialsOf(nom: string): string {
  return nom.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function AmudEntrepriseFavorisPage() {
  const notify = useToast();
  const router = useRouter();
  const [favorites] = useCollection(favoritesCollection, favoritesSeed);
  const [candidates] = useCollection(candidatesCollection, candidatesSeed);

  const myFavorites = useMemo(
    () =>
      favorites
        .filter((f) => f.entrepriseId === CURRENT_EMPLOYER.entrepriseId)
        .map((f) => ({ favorite: f, candidate: candidates.find((c) => c.id === f.candidateId) }))
        .filter((row) => row.candidate)
        .sort((a, b) => b.favorite.createdAt.localeCompare(a.favorite.createdAt)),
    [favorites, candidates],
  );

  function handleRemove(candidateId: string, nom: string) {
    toggleFavorite(candidateId, favorites);
    notify(`${nom} retiré(e) des favoris.`, 'info');
  }

  function handleContacter(candidateId: string, nom: string) {
    const conv = startConversation({ candidateId, candidateNom: nom, text: `Bonjour ${nom}, votre profil a retenu notre attention chez ${CURRENT_EMPLOYER.entrepriseNom}.` });
    notify(`Conversation démarrée avec ${nom}.`);
    router.push(`/amud/entreprise/messages/${conv.id}`);
  }

  return (
    <div>
      <div className="mb-lg">
        <h2 className="text-headline-lg text-amud-on-surface">Favoris</h2>
        <p className="mt-1 text-body-md text-amud-on-surface-variant">Candidats que vous avez enregistrés pour {CURRENT_EMPLOYER.entrepriseNom}.</p>
      </div>

      {myFavorites.length === 0 ? (
        <div className="rounded-xl border border-dashed border-amud-outline-variant p-xl text-center">
          <span className="material-symbols-outlined text-4xl text-amud-on-surface-variant">star_border</span>
          <p className="mt-sm text-body-md font-medium text-amud-on-surface">Aucun favori pour le moment.</p>
          <p className="mt-1 text-label-sm text-amud-on-surface-variant">Enregistrez des candidats depuis la recherche pour les retrouver ici.</p>
          <Link href="/amud/entreprise/candidats" className="mt-md inline-flex items-center gap-1 rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white hover:brightness-110">
            Rechercher un candidat
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-3">
          {myFavorites.map(({ favorite, candidate }) => (
            <div key={favorite.id} className="flex flex-col gap-sm rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
              <div className="flex items-center gap-sm">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amud-primary-fixed text-[13px] font-bold text-amud-on-primary-fixed">{initialsOf(candidate!.nom)}</span>
                <div className="min-w-0">
                  <Link href={`/amud/entreprise/candidats/${candidate!.id}`} className="truncate font-bold text-amud-on-surface hover:text-amud-primary">
                    {candidate!.nom}
                  </Link>
                  <p className="truncate text-label-sm text-amud-on-surface-variant">{candidate!.posteRecherche}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {candidate!.competences.slice(0, 4).map((s) => (
                  <span key={s} className="rounded bg-amud-surface-container-highest px-1.5 py-0.5 text-[10px] font-medium text-amud-on-surface-variant">
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-1 flex items-center gap-xs border-t border-amud-outline-variant pt-sm">
                <Link href={`/amud/entreprise/candidats/${candidate!.id}`} className="flex-1 rounded-lg border border-amud-outline-variant px-sm py-1.5 text-center text-label-sm font-medium text-amud-on-surface hover:bg-amud-surface-container-low">
                  Voir profil
                </Link>
                <button onClick={() => handleContacter(candidate!.id, candidate!.nom)} className="flex-1 rounded-lg border border-amud-outline-variant px-sm py-1.5 text-center text-label-sm font-medium text-amud-on-surface hover:bg-amud-surface-container-low">
                  Contacter
                </button>
                <button
                  onClick={() => handleRemove(candidate!.id, candidate!.nom)}
                  aria-label={`Retirer ${candidate!.nom} des favoris`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-amud-secondary hover:bg-amud-surface-container-low"
                >
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
