'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ErrorState } from '@/components/amud/ui';
import { useCurrentCandidate } from '@/lib/amud/useCurrentCandidate';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { interviewsCollection } from '@/lib/amud/localInterviews';
import { offresCollection } from '@/lib/amud/localOffres';
import { entreprisesCollection } from '@/lib/amud/localEntreprises';
import { offresSeed } from '@/data/amud/offres';
import { entreprisesSeed } from '@/data/amud/entreprises';
import { computeMatchScore } from '@/lib/amud/matchScoreService';

const GENERIC_QUESTIONS = [
  'Pouvez-vous vous présenter en quelques mots ?',
  'Pourquoi souhaitez-vous rejoindre notre entreprise ?',
  'Quelles sont vos plus grandes forces pour ce poste ?',
  'Décrivez une situation professionnelle difficile et comment vous l’avez gérée.',
  'Où vous voyez-vous dans 3 ans ?',
  'Avez-vous des questions pour nous ?',
];

const TIPS = [
  'Arrivez 10 minutes en avance (ou connectez-vous 5 minutes avant pour un entretien en visio).',
  'Préparez 2-3 questions à poser à l’entreprise sur le poste ou l’équipe.',
  'Relisez l’offre et repérez les mots-clés à réutiliser dans vos réponses.',
  'Ayez une copie de votre CV et de vos diplômes à portée de main.',
  'Restez concret : donnez des exemples chiffrés de vos réalisations.',
];

export default function PreparationEntretienPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { candidate } = useCurrentCandidate();
  const [interviews] = useCollection(interviewsCollection, []);
  const [offres] = useCollection(offresCollection, offresSeed);
  const [entreprises] = useCollection(entreprisesCollection, entreprisesSeed);

  const interview = interviews.find((i) => i.id === params.id && i.candidateId === candidate?.id);
  const offre = interview ? offres.find((o) => o.id === interview.offerId) : undefined;
  const entreprise = offre?.entrepriseId ? entreprises.find((e) => e.id === offre.entrepriseId) : undefined;

  if (!interview || !candidate) {
    return (
      <div className="mx-auto max-w-2xl py-xl">
        <ErrorState title="Entretien introuvable" onRetry={() => router.push('/amud/candidat/entretiens')} />
      </div>
    );
  }

  const match = offre ? computeMatchScore(candidate, offre) : null;
  const pitch = `Bonjour, je suis ${candidate.prenom} ${candidate.nom}${candidate.posteRecherche ? `, actuellement en recherche d'un poste de ${candidate.posteRecherche}` : ''}. ${
    candidate.experiences[0] ? `J'ai récemment occupé le poste de ${candidate.experiences[0].poste} chez ${candidate.experiences[0].entreprise}. ` : ''
  }${candidate.competences.length > 0 ? `Je maîtrise notamment ${candidate.competences.slice(0, 4).join(', ')}. ` : ''}Je suis motivé(e) à rejoindre ${interview.offerTitre ? `le poste de ${interview.offerTitre}` : 'votre entreprise'}.`;

  const specificQuestions = offre?.competences?.length
    ? [`Pouvez-vous détailler votre expérience avec ${offre.competences[0]} ?`, `Comment aborderiez-vous une mission liée à ${offre.competences[Math.min(1, offre.competences.length - 1)]} ?`]
    : [];

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/amud/candidat/entretiens/${interview.id}`} className="mb-lg inline-flex items-center gap-1 text-label-md font-medium text-amud-primary">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Retour à l&apos;entretien
      </Link>

      <h1 className="mb-lg text-headline-md text-amud-on-surface">Préparer mon entretien</h1>

      <Section title="Votre présentation personnelle" icon="person">
        <p className="rounded-lg bg-amud-surface-container-low p-md text-body-md text-amud-on-surface-variant">{pitch}</p>
      </Section>

      {entreprise ? (
        <Section title="À propos de l'entreprise" icon="apartment">
          <p className="text-body-md font-semibold text-amud-on-surface">{entreprise.nom}</p>
          <p className="text-body-md text-amud-on-surface-variant">{entreprise.secteur} · {entreprise.ville}</p>
          {entreprise.description ? <p className="mt-1 text-body-md text-amud-on-surface-variant">{entreprise.description}</p> : null}
        </Section>
      ) : null}

      {match && match.gaps.length > 0 ? (
        <Section title="Compétences à réviser" icon="psychology">
          <ul className="flex flex-col gap-1">
            {match.gaps.map((g) => (
              <li key={g} className="flex items-start gap-2 text-body-md text-amud-on-surface-variant">
                <span className="material-symbols-outlined mt-0.5 text-[16px] text-amud-tertiary-fixed-dim">warning</span>
                {g}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="Questions potentielles" icon="quiz">
        <ul className="flex flex-col gap-2">
          {[...GENERIC_QUESTIONS, ...specificQuestions].map((q) => (
            <li key={q} className="flex items-start gap-2 text-body-md text-amud-on-surface">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amud-primary" />
              {q}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Conseils" icon="tips_and_updates">
        <ul className="flex flex-col gap-2">
          {TIPS.map((t) => (
            <li key={t} className="flex items-start gap-2 text-body-md text-amud-on-surface-variant">
              <span className="material-symbols-outlined mt-0.5 text-[16px] text-amud-primary">check</span>
              {t}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="mb-lg rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
      <h2 className="mb-sm flex items-center gap-2 text-title-lg text-amud-on-surface">
        <span className="material-symbols-outlined text-amud-primary">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
