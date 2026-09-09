'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Badge, Button, EmptyState, PageHeader } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCurrentCandidate } from '@/lib/amud/useCurrentCandidate';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { candidateOfferFavoritesCollection } from '@/lib/amud/localCandidateOfferFavorites';
import { offresCollection } from '@/lib/amud/localOffres';
import { offresSeed } from '@/data/amud/offres';
import { toggleOfferFavorite } from '@/lib/amud/candidateFavoriteCascades';
import { computeMatchScore } from '@/lib/amud/matchScoreService';

export default function FavorisPage() {
  const { candidate, loading } = useCurrentCandidate();
  const notify = useToast();
  const [favorites] = useCollection(candidateOfferFavoritesCollection, []);
  const [offres] = useCollection(offresCollection, offresSeed);

  const items = useMemo(() => {
    if (!candidate) return [];
    return favorites
      .filter((f) => f.candidateAccountId === candidate.id)
      .map((f) => offres.find((o) => o.id === f.offerId))
      .filter((o): o is NonNullable<typeof o> => Boolean(o));
  }, [favorites, offres, candidate]);

  if (loading) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Favoris" subtitle={`${items.length} offre(s) sauvegardée(s)`} />

      {items.length === 0 ? (
        <EmptyState icon="star" title="Vous n'avez encore sauvegardé aucune offre." actionLabel="Découvrir les offres" onAction={() => (window.location.href = '/amud/candidat/opportunites')} />
      ) : (
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
          {items.map((offre) => {
            const match = candidate ? computeMatchScore(candidate, offre) : null;
            return (
              <div key={offre.id} className="flex flex-col gap-sm rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-sm">
                <div className="flex items-start justify-between gap-sm">
                  <Link href={`/amud/candidat/opportunites/${offre.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-body-md font-semibold text-amud-on-surface">{offre.titre}</p>
                    <p className="truncate text-label-sm text-amud-on-surface-variant">{offre.entreprise} · {offre.ville}</p>
                  </Link>
                  {match ? <Badge tone={match.score >= 70 ? 'success' : 'warning'}>{match.score}%</Badge> : null}
                </div>
                <div className="flex gap-sm">
                  <Link href={`/amud/candidat/opportunites/${offre.id}`} className="flex-1">
                    <Button variant="secondary" fullWidth size="sm">
                      Voir l&apos;offre
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon="close"
                    onClick={() => {
                      toggleOfferFavorite(candidate!.id, offre, favorites);
                      notify('Offre retirée des favoris', 'success');
                    }}
                  >
                    Retirer
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
