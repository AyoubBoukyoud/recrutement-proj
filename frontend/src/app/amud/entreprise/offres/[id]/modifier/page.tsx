'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { offresCollection } from '@/lib/amud/localOffres';
import { offresSeed } from '@/data/amud/offres';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';
import { OffreWizard } from '@/components/amud/entreprise/OffreWizard';

export default function AmudEntrepriseOffreModifierPage() {
  const params = useParams<{ id: string }>();
  const [offres] = useCollection(offresCollection, offresSeed);
  const offre = offres.find((o) => o.id === params.id && o.entrepriseId === CURRENT_EMPLOYER.entrepriseId);

  if (!offre) {
    return (
      <div className="rounded-xl border border-dashed border-amud-outline-variant p-xl text-center">
        <p className="text-body-md font-medium text-amud-on-surface">Offre introuvable.</p>
        <Link href="/amud/entreprise/offres" className="mt-md inline-flex items-center gap-1 text-label-md font-medium text-amud-primary hover:underline">
          Retour aux offres
        </Link>
      </div>
    );
  }

  return <OffreWizard mode="edit" initial={offre} />;
}
