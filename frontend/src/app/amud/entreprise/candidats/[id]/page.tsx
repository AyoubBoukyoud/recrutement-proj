'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { candidatesCollection } from '@/lib/amud/localCandidates';
import { candidatesSeed } from '@/data/amud/candidates';
import { applicationsCollection } from '@/lib/amud/localApplications';
import { applicationsSeed, STATUS_LABEL } from '@/data/amud/applications';
import { offresCollection } from '@/lib/amud/localOffres';
import { offresSeed } from '@/data/amud/offres';
import { favoritesCollection } from '@/lib/amud/localFavorites';
import { favoritesSeed } from '@/data/amud/favorites';
import { candidateNotesCollection } from '@/lib/amud/localCandidateNotes';
import { candidateNotesSeed } from '@/data/amud/candidateNotes';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';
import { toggleFavorite } from '@/lib/amud/favoriteCascades';
import { startConversation } from '@/lib/amud/messageCascades';
import { generateId } from '@/lib/amud/storage/ids';
import { pushNotification } from '@/lib/amud/storage/notify';
import { logAudit } from '@/lib/amud/storage/audit';
import { BottomActionBar } from '@/components/amud/entreprise/BottomActionBar';

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

export default function AmudEntrepriseCandidatDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const notify = useToast();
  const [candidates] = useCollection(candidatesCollection, candidatesSeed);
  const [applications, { add: addApplication }] = useCollection(applicationsCollection, applicationsSeed);
  const [offres] = useCollection(offresCollection, offresSeed);
  const [favorites] = useCollection(favoritesCollection, favoritesSeed);
  const [notes, { add: addNote }] = useCollection(candidateNotesCollection, candidateNotesSeed);
  const [noteText, setNoteText] = useState('');
  const [recommendOfferId, setRecommendOfferId] = useState('');

  const candidate = candidates.find((c) => c.id === params.id);
  const myOffres = useMemo(() => offres.filter((o) => o.entrepriseId === CURRENT_EMPLOYER.entrepriseId && o.statut === 'Publiée'), [offres]);
  const candidateApplications = useMemo(
    () => applications.filter((a) => a.candidateId === params.id && a.entrepriseId === CURRENT_EMPLOYER.entrepriseId),
    [applications, params.id],
  );
  const candidateNotes = useMemo(
    () => notes.filter((n) => n.entrepriseId === CURRENT_EMPLOYER.entrepriseId && n.candidateId === params.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [notes, params.id],
  );
  const isFavori = favorites.some((f) => f.entrepriseId === CURRENT_EMPLOYER.entrepriseId && f.candidateId === params.id);

  if (!candidate) {
    return (
      <div className="rounded-xl border border-dashed border-amud-outline-variant p-xl text-center">
        <p className="text-body-md font-medium text-amud-on-surface">Candidat introuvable.</p>
        <Link href="/amud/entreprise/candidats" className="mt-md inline-flex items-center gap-1 text-label-md font-medium text-amud-primary hover:underline">
          Retour aux candidats
        </Link>
      </div>
    );
  }

  function handleContacter() {
    const conv = startConversation({ candidateId: candidate!.id, candidateNom: candidate!.nom, text: `Bonjour ${candidate!.nom}, votre profil a retenu notre attention chez ${CURRENT_EMPLOYER.entrepriseNom}.` });
    notify(`Conversation démarrée avec ${candidate!.nom}.`);
    router.push(`/amud/entreprise/messages/${conv.id}`);
  }

  function handleToggleFavorite() {
    const { added } = toggleFavorite(candidate!.id, favorites);
    notify(added ? `${candidate!.nom} ajouté(e) aux favoris.` : `${candidate!.nom} retiré(e) des favoris.`);
  }

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    addNote({ id: generateId('note'), entrepriseId: CURRENT_EMPLOYER.entrepriseId, candidateId: candidate!.id, authorNom: CURRENT_EMPLOYER.userNom, text: noteText.trim(), createdAt: new Date().toISOString() });
    setNoteText('');
    notify('Note ajoutée.');
  }

  function handleRecommend() {
    const offre = myOffres.find((o) => o.id === recommendOfferId);
    if (!offre) return;
    const now = new Date().toISOString();
    addApplication({
      id: generateId('application'),
      candidateId: candidate!.id,
      candidateNom: candidate!.nom,
      offerId: offre.id,
      offerTitre: offre.titre,
      entrepriseId: CURRENT_EMPLOYER.entrepriseId,
      entrepriseNom: CURRENT_EMPLOYER.entrepriseNom,
      recruiterId: CURRENT_EMPLOYER.userId,
      recruiterNom: CURRENT_EMPLOYER.userNom,
      tags: candidate!.competences.slice(0, 3),
      score: candidate!.score,
      createdAt: now,
      updatedAt: now,
      status: 'NEW',
    });
    logAudit({ utilisateur: CURRENT_EMPLOYER.userNom, role: 'Recruteur', action: 'Candidat recommandé pour une offre', actionType: 'create', module: 'Candidatures', reference: `${candidate!.nom} — ${offre.titre}` });
    pushNotification({ scope: 'employer', title: `${candidate!.nom} recommandé(e) pour « ${offre.titre} ».`, category: 'Applications', href: '/amud/entreprise/candidatures' });
    notify(`${candidate!.nom} recommandé(e) pour « ${offre.titre} ».`);
    setRecommendOfferId('');
  }

  return (
    <div className="pb-28 md:pb-6">
      <Link href="/amud/entreprise/candidats" className="mb-3 flex items-center gap-1 text-label-sm text-amud-on-surface-variant hover:text-amud-primary">
        <span className="material-symbols-outlined text-[16px]">arrow_back</span> Candidats
      </Link>

      <div className="mb-lg flex flex-wrap items-start gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-amud-primary-fixed text-lg font-bold text-amud-on-primary-fixed">{initialsOf(candidate.nom)}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-headline-lg text-amud-on-surface">{candidate.nom}</h2>
          <p className="text-body-md text-amud-on-surface-variant">{candidate.posteRecherche}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-md gap-y-1 text-label-sm text-amud-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">location_on</span> {candidate.ville}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">schedule</span> {candidate.disponibilite}
            </span>
            <span className="font-bold text-amud-primary">{candidate.score}% profil</span>
          </div>
        </div>
        <button
          onClick={() => downloadMockCv(candidate.nom, candidate.posteRecherche, candidate.competences)}
          className="hidden items-center gap-1 rounded-lg border border-amud-outline-variant px-md py-2 text-label-md font-medium text-amud-on-surface hover:bg-amud-surface-container-low md:flex"
        >
          <span className="material-symbols-outlined text-[18px]">download</span> Télécharger le CV
        </button>
      </div>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
        <div className="flex flex-col gap-lg lg:col-span-2">
          <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
            <h3 className="mb-md text-title-lg text-amud-on-surface">Compétences</h3>
            <div className="flex flex-wrap gap-xs">
              {candidate.competences.map((s) => (
                <span key={s} className="rounded-full bg-amud-surface-container-highest px-sm py-1 text-[11px] font-medium text-amud-on-surface-variant">
                  {s}
                </span>
              ))}
            </div>
            <button
              onClick={() => downloadMockCv(candidate.nom, candidate.posteRecherche, candidate.competences)}
              className="mt-md flex items-center gap-1 text-label-md font-medium text-amud-primary hover:underline md:hidden"
            >
              <span className="material-symbols-outlined text-[18px]">download</span> Télécharger le CV
            </button>
          </div>

          <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
            <h3 className="mb-md text-title-lg text-amud-on-surface">Candidatures chez {CURRENT_EMPLOYER.entrepriseNom}</h3>
            {candidateApplications.length === 0 ? (
              <p className="text-label-md text-amud-on-surface-variant">Ce candidat n’a pas encore postulé chez vous.</p>
            ) : (
              <div className="flex flex-col gap-sm">
                {candidateApplications.map((a) => (
                  <Link key={a.id} href={`/amud/entreprise/candidatures/${a.id}`} className="flex items-center justify-between rounded-lg border border-amud-outline-variant bg-amud-surface p-sm hover:border-amud-primary">
                    <span className="text-label-md text-amud-on-surface">{a.offerTitre}</span>
                    <span className="text-label-sm text-amud-on-surface-variant">{STATUS_LABEL[a.status]}</span>
                  </Link>
                ))}
              </div>
            )}
            {myOffres.length > 0 ? (
              <div className="mt-md flex flex-col gap-sm border-t border-amud-outline-variant pt-md sm:flex-row">
                <select value={recommendOfferId} onChange={(e) => setRecommendOfferId(e.target.value)} className="flex-1 rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
                  <option value="">Recommander pour une offre…</option>
                  {myOffres.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.titre}
                    </option>
                  ))}
                </select>
                <button onClick={handleRecommend} disabled={!recommendOfferId} className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">
                  Recommander
                </button>
              </div>
            ) : null}
          </div>
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

      <BottomActionBar
        onContacter={handleContacter}
        onPlanifier={() => router.push(`/amud/entreprise/entretiens?candidatId=${candidate.id}`)}
        onFavori={handleToggleFavorite}
        isFavori={isFavori}
      />
    </div>
  );
}
