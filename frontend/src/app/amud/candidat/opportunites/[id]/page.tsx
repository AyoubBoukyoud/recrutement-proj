'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Badge, Button, ErrorState, Modal, ModalActions } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCurrentCandidate } from '@/lib/amud/useCurrentCandidate';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { offresCollection } from '@/lib/amud/localOffres';
import { applicationsCollection } from '@/lib/amud/localApplications';
import { candidateOfferFavoritesCollection } from '@/lib/amud/localCandidateOfferFavorites';
import { candidateDocumentsCollection } from '@/lib/amud/localCandidateDocuments';
import { offresSeed } from '@/data/amud/offres';
import { computeMatchScore } from '@/lib/amud/matchScoreService';
import { hasApplied, submitApplication } from '@/lib/amud/candidateApplicationCascades';
import { toggleOfferFavorite } from '@/lib/amud/candidateFavoriteCascades';
import { computeProfileCompletion } from '@/lib/amud/candidateProfileService';

export default function OffreDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const notify = useToast();
  const { candidate } = useCurrentCandidate();
  const [offres] = useCollection(offresCollection, offresSeed);
  const [applications] = useCollection(applicationsCollection, []);
  const [favorites] = useCollection(candidateOfferFavoritesCollection, []);
  const [documents] = useCollection(candidateDocumentsCollection, []);
  const [applyOpen, setApplyOpen] = useState(false);

  const offre = offres.find((o) => o.id === params.id);
  const existingApplication = candidate ? hasApplied(candidate.id, params.id, applications) : undefined;
  const isFavorite = candidate ? favorites.some((f) => f.candidateAccountId === candidate.id && f.offerId === params.id) : false;
  const match = useMemo(() => (candidate && offre ? computeMatchScore(candidate, offre) : null), [candidate, offre]);
  const cvDocs = candidate ? documents.filter((d) => d.candidateAccountId === candidate.id && d.type === 'CV') : [];

  if (!offre) {
    return (
      <div className="mx-auto max-w-2xl py-xl">
        <ErrorState title="Offre introuvable" description="Cette offre n'existe plus ou a été retirée." onRetry={() => router.push('/amud/candidat/opportunites')} />
      </div>
    );
  }

  function onFavoriteClick() {
    if (!candidate) return;
    const { added } = toggleOfferFavorite(candidate.id, offre!, favorites);
    notify(added ? 'Offre ajoutée aux favoris' : 'Offre retirée des favoris', 'success');
  }

  return (
    <div className="mx-auto max-w-3xl pb-24">
      <Link href="/amud/candidat/opportunites" className="mb-lg inline-flex items-center gap-1 text-label-md font-medium text-amud-primary">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Retour aux opportunités
      </Link>

      <div className="mb-lg flex items-start justify-between gap-md">
        <div>
          <h1 className="text-headline-md text-amud-on-surface">{offre.titre}</h1>
          <p className="mt-1 text-body-lg text-amud-on-surface-variant">{offre.entreprise} · {offre.ville}</p>
          <div className="mt-sm flex flex-wrap gap-1">
            <Badge tone="info">{offre.contrat}</Badge>
            {offre.teletravail ? <Badge>{offre.teletravail}</Badge> : null}
            {offre.salaireMin && offre.salaireMax ? <Badge>{offre.salaireMin} – {offre.salaireMax} MAD/mois</Badge> : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onFavoriteClick}
          aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          aria-pressed={isFavorite}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors ${
            isFavorite ? 'border-amud-primary bg-amud-primary/10 text-amud-primary' : 'border-amud-outline-variant text-amud-on-surface-variant hover:bg-amud-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined" style={isFavorite ? { fontVariationSettings: "'FILL' 1" } : undefined}>
            star
          </span>
        </button>
      </div>

      {match ? (
        <div className="mb-lg rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
          <div className="mb-md flex items-center justify-between">
            <h2 className="text-title-lg text-amud-on-surface">{match.score}% compatible avec votre profil</h2>
            <Badge tone={match.score >= 70 ? 'success' : match.score >= 40 ? 'warning' : 'danger'}>{match.score}%</Badge>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-amud-surface-container-high">
            <div className="h-full rounded-full bg-amud-primary transition-all" style={{ width: `${match.score}%` }} />
          </div>
          {match.matches.length > 0 ? (
            <div className="mt-md">
              <p className="mb-1 text-label-sm font-semibold uppercase tracking-wide text-amud-on-surface-variant">Correspondances</p>
              <ul className="flex flex-col gap-1">
                {match.matches.map((m) => (
                  <li key={m} className="flex items-center gap-1 text-body-md text-amud-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-amud-primary">check</span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {match.gaps.length > 0 ? (
            <div className="mt-md">
              <p className="mb-1 text-label-sm font-semibold uppercase tracking-wide text-amud-on-surface-variant">À améliorer</p>
              <ul className="flex flex-col gap-1">
                {match.gaps.map((g) => (
                  <li key={g} className="flex items-center gap-1 text-body-md text-amud-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-amud-tertiary-fixed-dim">warning</span>
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {offre.description ? (
        <Section title="Description">
          <p className="whitespace-pre-line text-body-md text-amud-on-surface-variant">{offre.description}</p>
        </Section>
      ) : null}
      {offre.missions && offre.missions.length > 0 ? (
        <Section title="Missions">
          <BulletList items={offre.missions} />
        </Section>
      ) : null}
      {offre.competences && offre.competences.length > 0 ? (
        <Section title="Compétences">
          <div className="flex flex-wrap gap-1">
            {offre.competences.map((c) => (
              <Badge key={c}>{c}</Badge>
            ))}
          </div>
        </Section>
      ) : null}
      {offre.niveauExperience ? (
        <Section title="Expérience">
          <p className="text-body-md text-amud-on-surface-variant">{offre.niveauExperience}</p>
        </Section>
      ) : null}
      {offre.langues && offre.langues.length > 0 ? (
        <Section title="Langues">
          <BulletList items={offre.langues} />
        </Section>
      ) : null}
      {offre.avantages && offre.avantages.length > 0 ? (
        <Section title="Conditions">
          <BulletList items={[...(offre.avantages ?? []), ...(offre.horaires ? [offre.horaires] : [])]} />
        </Section>
      ) : null}

      <div className="hidden md:block">
        {existingApplication ? (
          <div className="flex items-center gap-md rounded-xl border border-amud-primary/30 bg-amud-primary/5 p-md">
            <span className="material-symbols-outlined text-amud-primary">check_circle</span>
            <p className="flex-1 text-body-md text-amud-on-surface">Vous avez déjà postulé à cette offre.</p>
            <Link href={`/amud/candidat/candidatures/${existingApplication.id}`} className="text-label-md font-medium text-amud-primary hover:underline">
              Suivre ma candidature
            </Link>
          </div>
        ) : (
          <Button onClick={() => setApplyOpen(true)} icon="send">
            Postuler
          </Button>
        )}
      </div>

      {/* Sticky CTA mobile (§18) */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-amud-outline-variant bg-amud-surface p-md shadow-lg md:hidden" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        {existingApplication ? (
          <Link href={`/amud/candidat/candidatures/${existingApplication.id}`} className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-amud-primary px-lg text-label-md font-medium text-amud-primary">
            Suivre ma candidature
          </Link>
        ) : (
          <Button fullWidth icon="send" onClick={() => setApplyOpen(true)}>
            Postuler
          </Button>
        )}
      </div>

      {candidate ? (
        <ApplyModal
          open={applyOpen}
          onClose={() => setApplyOpen(false)}
          candidate={candidate}
          offre={offre}
          cvDocs={cvDocs}
          onSubmitted={(applicationId) => {
            setApplyOpen(false);
            notify('Votre candidature a été envoyée avec succès.', 'success');
            router.push(`/amud/candidat/candidatures/${applicationId}`);
          }}
        />
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-lg">
      <h2 className="mb-sm text-title-lg text-amud-on-surface">{title}</h2>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((i) => (
        <li key={i} className="flex items-start gap-2 text-body-md text-amud-on-surface-variant">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amud-primary" />
          {i}
        </li>
      ))}
    </ul>
  );
}

const STEPS = ['Profil', 'CV', 'Message', 'Vérification'];

function ApplyModal({
  open,
  onClose,
  candidate,
  offre,
  cvDocs,
  onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  candidate: import('@/data/amud/candidateAccount').CandidateAccount;
  offre: import('@/data/amud/offres').Offre;
  cvDocs: import('@/data/amud/candidateDocuments').CandidateDocument[];
  onSubmitted: (applicationId: string) => void;
}) {
  const [step, setStep] = useState(0);
  const [selectedCvId, setSelectedCvId] = useState(cvDocs[0]?.id ?? '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const completion = computeProfileCompletion(candidate, cvDocs.length > 0);

  function close() {
    setStep(0);
    onClose();
  }

  function next() {
    if (step === 1 && !selectedCvId) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function send() {
    setSubmitting(true);
    const application = submitApplication({ account: candidate, offre, message: message.trim() || undefined });
    setSubmitting(false);
    onSubmitted(application.id);
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Postuler"
      subtitle={offre.titre}
      footer={
        step < STEPS.length - 1 ? (
          <ModalActions onCancel={close} submitLabel="Suivant" onSubmit={next} disabled={step === 1 && !selectedCvId} />
        ) : (
          <ModalActions onCancel={close} submitLabel="Envoyer ma candidature" onSubmit={send} disabled={submitting} cancelLabel="Modifier" />
        )
      }
    >
      <div className="mb-md flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-amud-primary' : 'bg-amud-surface-container-high'}`} />
        ))}
      </div>

      {step === 0 ? (
        <div className="flex flex-col gap-sm">
          <p className="text-body-md text-amud-on-surface-variant">Vérifiez que votre profil est prêt à être envoyé.</p>
          {(['informations', 'competences', 'experience', 'formation', 'langues'] as const).map((key) => (
            <div key={key} className="flex items-center gap-2 text-body-md text-amud-on-surface">
              <span className={`material-symbols-outlined text-[18px] ${completion.sections[key] ? 'text-amud-primary' : 'text-amud-tertiary-fixed-dim'}`}>
                {completion.sections[key] ? 'check_circle' : 'warning'}
              </span>
              {key === 'informations' ? 'Informations personnelles' : key === 'competences' ? 'Compétences' : key === 'experience' ? 'Expériences' : key === 'formation' ? 'Formation' : 'Langues'}
            </div>
          ))}
        </div>
      ) : null}

      {step === 1 ? (
        <div className="flex flex-col gap-sm">
          {cvDocs.length === 0 ? (
            <div className="rounded-lg border border-amud-tertiary-fixed-dim bg-amud-tertiary-fixed p-md text-body-md text-amud-on-tertiary-fixed">
              Aucun CV ajouté.{' '}
              <Link href="/amud/candidat/documents" className="font-medium underline">
                Ajouter mon CV
              </Link>{' '}
              avant de continuer.
            </div>
          ) : (
            cvDocs.map((doc) => (
              <label key={doc.id} className="flex items-center gap-sm rounded-lg border border-amud-outline-variant p-md">
                <input type="radio" name="cv" checked={selectedCvId === doc.id} onChange={() => setSelectedCvId(doc.id)} />
                <span className="text-body-md text-amud-on-surface">{doc.nom}</span>
              </label>
            ))
          )}
        </div>
      ) : null}

      {step === 2 ? (
        <label className="flex flex-col gap-1">
          <span className="text-label-sm font-medium text-amud-on-surface-variant">Message (optionnel)</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Présentez-vous brièvement à l'entreprise…"
            className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-body-md outline-none focus:border-transparent focus:ring-2 focus:ring-amud-primary"
          />
        </label>
      ) : null}

      {step === 3 ? (
        <div className="flex flex-col gap-sm text-body-md text-amud-on-surface">
          <Row label="Poste" value={offre.titre} />
          <Row label="Entreprise" value={offre.entreprise} />
          <Row label="Candidat" value={`${candidate.prenom} ${candidate.nom}`} />
          <Row label="CV" value={cvDocs.find((d) => d.id === selectedCvId)?.nom ?? '—'} />
          <Row label="Compétences" value={candidate.competences.join(', ') || '—'} />
          <Row label="Message" value={message.trim() || '—'} />
        </div>
      ) : null}
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-md border-b border-amud-outline-variant/60 py-1.5">
      <span className="text-amud-on-surface-variant">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
