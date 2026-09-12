'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { applicationsCollection } from '@/lib/amud/localApplications';
import { applicationsSeed, STATUS_LABEL, type ApplicationStatus } from '@/data/amud/applications';
import { candidatesCollection } from '@/lib/amud/localCandidates';
import { candidatesSeed } from '@/data/amud/candidates';
import { offresCollection } from '@/lib/amud/localOffres';
import { offresSeed } from '@/data/amud/offres';
import { interviewsCollection } from '@/lib/amud/localInterviews';
import { interviewsSeed } from '@/data/amud/interviews';
import { STATUT_CLASS as INTERVIEW_STATUT_CLASS } from '@/data/amud/interviews';
import { candidateNotesCollection } from '@/lib/amud/localCandidateNotes';
import { candidateNotesSeed } from '@/data/amud/candidateNotes';
import { conversationsCollection } from '@/lib/amud/localConversations';
import { conversationsSeed } from '@/data/amud/conversations';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';
import { changeApplicationStatus } from '@/lib/amud/applicationCascades';
import { startConversation } from '@/lib/amud/messageCascades';
import { generateId } from '@/lib/amud/storage/ids';

const ALL_STATUSES = Object.keys(STATUS_LABEL) as ApplicationStatus[];

function initialsOf(nom: string): string {
  return nom.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function downloadMockCv(nom: string, posteRecherche: string, competences: string[]) {
  const content = `CV — ${nom}\nPoste recherché : ${posteRecherche}\nCompétences : ${competences.join(', ')}\n\nDocument généré par Amud Skills (démo).`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CV-${nom.replace(/\s+/g, '-')}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function AmudEntrepriseCandidatureDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const notify = useToast();
  const [applications] = useCollection(applicationsCollection, applicationsSeed);
  const [candidates] = useCollection(candidatesCollection, candidatesSeed);
  const [offres] = useCollection(offresCollection, offresSeed);
  const [interviews] = useCollection(interviewsCollection, interviewsSeed);
  const [notes, { add: addNote }] = useCollection(candidateNotesCollection, candidateNotesSeed);
  const [conversations] = useCollection(conversationsCollection, conversationsSeed);
  const [noteText, setNoteText] = useState('');

  const application = applications.find((a) => a.id === params.id && a.entrepriseId === CURRENT_EMPLOYER.entrepriseId);
  const candidate = candidates.find((c) => c.id === application?.candidateId);
  const offre = offres.find((o) => o.id === application?.offerId);
  const appInterviews = useMemo(() => interviews.filter((i) => i.applicationId === application?.id), [interviews, application?.id]);
  const candidateNotes = useMemo(
    () => (application ? notes.filter((n) => n.entrepriseId === CURRENT_EMPLOYER.entrepriseId && n.candidateId === application.candidateId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : []),
    [notes, application],
  );
  const conversation = conversations.find((c) => c.entrepriseId === CURRENT_EMPLOYER.entrepriseId && c.candidateId === application?.candidateId);

  if (!application) {
    return (
      <div className="rounded-xl border border-dashed border-amud-outline-variant p-xl text-center">
        <p className="text-body-md font-medium text-amud-on-surface">Candidature introuvable.</p>
        <Link href="/amud/entreprise/candidatures" className="mt-md inline-flex items-center gap-1 text-label-md font-medium text-amud-primary hover:underline">
          Retour aux candidatures
        </Link>
      </div>
    );
  }

  const timeline = [
    { date: application.createdAt, label: 'Candidature reçue' },
    ...(application.updatedAt !== application.createdAt ? [{ date: application.updatedAt, label: `Statut mis à jour : ${STATUS_LABEL[application.status]}` }] : []),
    ...appInterviews.map((i) => ({ date: i.createdAt, label: `Entretien ${i.type.toLowerCase()} planifié (${i.status})` })),
    ...candidateNotes.map((n) => ({ date: n.createdAt, label: `Note ajoutée par ${n.authorNom}` })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  function handleContacter() {
    if (conversation) {
      router.push(`/amud/entreprise/messages/${conversation.id}`);
      return;
    }
    const conv = startConversation({
      candidateId: application!.candidateId,
      candidateNom: application!.candidateNom,
      offerId: application!.offerId,
      offerTitre: application!.offerTitre,
      text: `Bonjour ${application!.candidateNom}, merci pour votre candidature au poste de ${application!.offerTitre}.`,
    });
    notify(`Conversation démarrée avec ${application!.candidateNom}.`);
    router.push(`/amud/entreprise/messages/${conv.id}`);
  }

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    addNote({ id: generateId('note'), entrepriseId: CURRENT_EMPLOYER.entrepriseId, candidateId: application!.candidateId, authorNom: CURRENT_EMPLOYER.userNom, text: noteText.trim(), createdAt: new Date().toISOString() });
    setNoteText('');
    notify('Note ajoutée.');
  }

  return (
    <div className="pb-20">
      <Link href="/amud/entreprise/candidatures" className="mb-3 flex items-center gap-1 text-label-sm text-amud-on-surface-variant hover:text-amud-primary">
        <span className="material-symbols-outlined text-[16px]">arrow_back</span> Candidatures
      </Link>

      <div className="mb-lg flex flex-wrap items-start gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-amud-primary-fixed text-lg font-bold text-amud-on-primary-fixed">{initialsOf(application.candidateNom)}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-headline-lg text-amud-on-surface">{application.candidateNom}</h2>
          <p className="text-body-md text-amud-on-surface-variant">{application.offerTitre}</p>
          <div className="mt-2 flex flex-wrap items-center gap-sm">
            <select
              value={application.status}
              onChange={(e) => {
                changeApplicationStatus(application, e.target.value as ApplicationStatus);
                notify(`Statut mis à jour : ${STATUS_LABEL[e.target.value as ApplicationStatus]}.`);
              }}
              className="rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-1.5 text-label-md outline-none focus:ring-2 focus:ring-amud-primary"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <span className="text-label-md font-bold text-amud-primary">{application.score}% match</span>
          </div>
        </div>
        <div className="flex w-full flex-wrap gap-sm sm:w-auto">
          {candidate ? (
            <Link href={`/amud/entreprise/candidats/${candidate.id}`} className="flex-1 rounded-lg border border-amud-outline-variant px-md py-2 text-center text-label-md font-medium text-amud-on-surface hover:bg-amud-surface-container-low sm:flex-none">
              Voir profil candidat
            </Link>
          ) : null}
          <button onClick={handleContacter} className="flex-1 rounded-lg border border-amud-outline-variant px-md py-2 text-label-md font-medium text-amud-on-surface hover:bg-amud-surface-container-low sm:flex-none">
            Contacter
          </button>
          <Link href={`/amud/entreprise/entretiens?candidatureId=${application.id}`} className="flex-1 rounded-lg bg-amud-primary px-md py-2 text-center text-label-md font-medium text-white hover:brightness-110 sm:flex-none">
            Planifier entretien
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
        <div className="flex flex-col gap-lg lg:col-span-2">
          <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
            <div className="mb-md flex items-center justify-between">
              <h3 className="text-title-lg text-amud-on-surface">Profil</h3>
              <button
                onClick={() => candidate && downloadMockCv(candidate.nom, candidate.posteRecherche, candidate.competences)}
                className="flex items-center gap-1 text-label-md font-medium text-amud-primary hover:underline"
              >
                <span className="material-symbols-outlined text-[18px]">download</span> Télécharger le CV
              </button>
            </div>
            <dl className="grid grid-cols-1 gap-md sm:grid-cols-2">
              <div>
                <dt className="text-label-sm text-amud-on-surface-variant">Ville</dt>
                <dd className="text-body-md text-amud-on-surface">{candidate?.ville ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-label-sm text-amud-on-surface-variant">Poste recherché</dt>
                <dd className="text-body-md text-amud-on-surface">{candidate?.posteRecherche ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-label-sm text-amud-on-surface-variant">Disponibilité</dt>
                <dd className="text-body-md text-amud-on-surface">{candidate?.disponibilite ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-label-sm text-amud-on-surface-variant">Candidature déposée le</dt>
                <dd className="text-body-md text-amud-on-surface">{new Date(application.createdAt).toLocaleDateString('fr-FR')}</dd>
              </div>
            </dl>
            {application.tags.length > 0 || candidate?.competences.length ? (
              <div className="mt-md flex flex-wrap gap-xs border-t border-amud-outline-variant pt-md">
                {Array.from(new Set([...application.tags, ...(candidate?.competences ?? [])])).map((t) => (
                  <span key={t} className="rounded-full bg-amud-surface-container-highest px-sm py-1 text-[11px] font-medium text-amud-on-surface-variant">
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
            <h3 className="mb-md text-title-lg text-amud-on-surface">Entretiens</h3>
            {appInterviews.length === 0 ? (
              <p className="text-label-md text-amud-on-surface-variant">Aucun entretien programmé.</p>
            ) : (
              <div className="flex flex-col gap-sm">
                {appInterviews.map((i) => (
                  <Link key={i.id} href={`/amud/entreprise/entretiens/${i.id}`} className="flex items-center justify-between rounded-lg border border-amud-outline-variant bg-amud-surface p-sm hover:border-amud-primary">
                    <span className="text-label-md text-amud-on-surface">
                      {new Date(i.date).toLocaleDateString('fr-FR')} à {i.heureDebut} · {i.type}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${INTERVIEW_STATUT_CLASS[i.status]}`}>{i.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
            <h3 className="mb-md text-title-lg text-amud-on-surface">Historique d’activité</h3>
            <ul className="flex flex-col gap-sm border-l-2 border-amud-outline-variant pl-md">
              {timeline.map((t, i) => (
                <li key={i} className="relative text-label-md text-amud-on-surface">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-amud-primary" />
                  {t.label}
                  <span className="ml-2 text-label-sm text-amud-on-surface-variant">{new Date(t.date).toLocaleDateString('fr-FR')}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-lg">
          <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
            <h3 className="mb-md text-title-lg text-amud-on-surface">Messages</h3>
            {conversation ? (
              <Link href={`/amud/entreprise/messages/${conversation.id}`} className="flex items-center justify-between rounded-lg border border-amud-outline-variant bg-amud-surface p-sm hover:border-amud-primary">
                <span className="truncate text-label-md text-amud-on-surface">{conversation.messages.at(-1)?.text ?? 'Conversation ouverte'}</span>
                <span className="material-symbols-outlined text-amud-on-surface-variant">chevron_right</span>
              </Link>
            ) : (
              <p className="text-label-md text-amud-on-surface-variant">Aucun message échangé pour le moment.</p>
            )}
          </div>

          <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
            <h3 className="mb-md text-title-lg text-amud-on-surface">Notes internes</h3>
            <form onSubmit={handleAddNote} className="mb-md flex flex-col gap-sm">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
                placeholder="Ajouter une note visible par votre équipe…"
                className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              />
              <button type="submit" className="self-end rounded-lg bg-amud-primary px-md py-1.5 text-label-sm font-medium text-white hover:brightness-110">
                Ajouter la note
              </button>
            </form>
            {candidateNotes.length === 0 ? (
              <p className="text-label-md text-amud-on-surface-variant">Aucune note pour le moment.</p>
            ) : (
              <div className="flex flex-col gap-sm">
                {candidateNotes.map((n) => (
                  <div key={n.id} className="rounded-lg border border-amud-outline-variant bg-amud-surface p-sm">
                    <p className="text-body-md text-amud-on-surface">{n.text}</p>
                    <p className="mt-1 text-label-sm text-amud-on-surface-variant">
                      {n.authorNom} · {new Date(n.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
