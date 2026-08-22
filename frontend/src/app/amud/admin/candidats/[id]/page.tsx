'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ConfirmDialog, Modal, Tabs } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { exportCsv } from '@/lib/amud/csv';
import { candidatesSeed, STATUT_CLASS, type Candidate, type StatutCandidate } from '@/data/amud/candidates';
import { candidatesCollection } from '@/lib/amud/localCandidates';
import { useCollection } from '@/lib/amud/storage/useCollection';

const TABS = [
  { id: 'overview', label: "Vue d'ensemble" },
  { id: 'infos', label: 'Informations' },
];

function initials(nom: string) {
  return nom
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function AmudAdminCandidatProfilePage() {
  const notify = useToast();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [candidates, { update: updateCandidate, remove: removeCandidate }] = useCollection(candidatesCollection, candidatesSeed);
  const candidate = useMemo<Candidate | null>(() => candidates.find((x) => x.id === params.id) ?? null, [candidates, params.id]);
  const [tab, setTab] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  if (candidate === null) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-xl text-center">
        <span className="material-symbols-outlined mb-md text-4xl text-amud-outline">person_off</span>
        <h2 className="text-title-lg text-amud-on-surface">Candidat introuvable</h2>
        <p className="mt-2 text-body-md text-amud-on-surface-variant">Aucun profil ne correspond à &quot;{params.id}&quot;.</p>
        <Link href="/amud/admin/candidats" className="mt-4 inline-block text-amud-primary hover:underline">
          Retour à la liste des candidats
        </Link>
      </div>
    );
  }

  const c = candidate;

  function setStatut(next: StatutCandidate) {
    updateCandidate(c.id, { statut: next });
    notify(`Statut mis à jour : ${next}.`);
  }

  function handleDelete() {
    removeCandidate(c.id);
    notify(`« ${c.nom} » supprimé.`, 'info');
    router.push('/amud/admin/candidats');
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <section className="relative mb-lg overflow-hidden rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        <div className="absolute bottom-0 left-0 top-0 w-2 bg-amud-primary" />
        <div className="flex flex-col items-start justify-between gap-lg md:flex-row md:items-center">
          <div className="flex items-center gap-lg">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-amud-surface bg-amud-primary-container text-title-lg font-bold text-white shadow-sm">
              {initials(c.nom)}
            </div>
            <div>
              <div className="mb-1 flex items-center gap-sm">
                <h2 className="text-headline-lg text-amud-on-surface">{c.nom}</h2>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-label-sm ${STATUT_CLASS[c.statut]}`}>{c.statut}</span>
              </div>
              <p className="flex items-center gap-xs text-title-lg text-amud-on-surface-variant">
                {c.posteRecherche}
                <span className="text-amud-outline-variant">•</span>
                <span className="material-symbols-outlined text-sm">location_on</span> {c.ville}
              </p>
              <div className="mt-sm flex flex-wrap gap-md text-label-md text-amud-on-surface-variant">
                <span className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-sm">mail</span> {c.email}
                </span>
                <span className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-sm">phone</span> {c.telephone}
                </span>
                <span className="flex items-center gap-xs text-amud-outline">
                  <span className="material-symbols-outlined text-sm">calendar_month</span> Inscrit le {c.creeLe}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-sm">
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-xs rounded-lg bg-amud-primary px-md py-sm text-label-md text-white transition-opacity hover:opacity-90"
            >
              <span className="material-symbols-outlined text-sm">edit</span> Modifier
            </button>
            {c.statut !== 'Bloqué' ? (
              <>
                <button
                  onClick={() => setStatut(c.statut === 'Actif' ? 'Inactif' : 'Actif')}
                  className="flex items-center gap-xs rounded-lg border border-amud-outline-variant px-md py-sm text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low"
                >
                  <span className="material-symbols-outlined text-sm">block</span> {c.statut === 'Actif' ? 'Désactiver' : 'Activer'}
                </button>
                <button
                  onClick={() => setStatut('Bloqué')}
                  className="flex items-center gap-xs rounded-lg border border-amud-outline-variant px-md py-sm text-label-md text-amud-error transition-colors hover:bg-amud-error-container"
                >
                  <span className="material-symbols-outlined text-sm">gpp_maybe</span> Bloquer
                </button>
              </>
            ) : (
              <button
                onClick={() => setStatut('Actif')}
                className="flex items-center gap-xs rounded-lg border border-amud-outline-variant px-md py-sm text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low"
              >
                <span className="material-symbols-outlined text-sm">lock_open</span> Débloquer
              </button>
            )}
            <button
              onClick={() => {
                exportCsv(`candidat-${c.id}`, [
                  {
                    Nom: c.nom,
                    Email: c.email,
                    Téléphone: c.telephone,
                    Ville: c.ville,
                    'Poste recherché': c.posteRecherche,
                    Compétences: c.competences.join(' / '),
                    Disponibilité: c.disponibilite,
                    Statut: c.statut,
                    Score: c.score,
                  },
                ]);
                notify('Dossier exporté.');
              }}
              className="flex items-center justify-center rounded-lg border border-amud-outline-variant p-sm text-amud-on-surface transition-colors hover:bg-amud-surface-container-low"
            >
              <span className="material-symbols-outlined">download</span>
            </button>
            <button
              onClick={() => setConfirmDeleteOpen(true)}
              className="flex items-center justify-center rounded-lg border border-amud-outline-variant p-sm text-amud-error transition-colors hover:bg-amud-error-container"
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      </section>

      <div className="mb-lg">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === 'infos' ? (
        <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
          <h3 className="mb-md text-title-lg text-amud-on-surface">Informations du candidat</h3>
          <dl className="grid grid-cols-1 gap-md sm:grid-cols-2">
            <InfoRow label="Nom" value={c.nom} />
            <InfoRow label="Email" value={c.email} />
            <InfoRow label="Téléphone" value={c.telephone} />
            <InfoRow label="Ville" value={c.ville} />
            <InfoRow label="Poste recherché" value={c.posteRecherche} />
            <InfoRow label="Disponibilité" value={c.disponibilite} />
            <InfoRow label="Créé le" value={c.creeLe} />
            <InfoRow label="Dernier accès" value={c.dernierAcces} />
          </dl>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
          <div className="flex flex-col gap-lg lg:col-span-2">
            <div className="grid grid-cols-2 gap-md md:grid-cols-3">
              <KpiCard icon="military_tech" value={c.score} label="Score de profil" />
              <KpiCard icon="event_available" value={c.disponibilite} label="Disponibilité" />
              <KpiCard icon="location_on" value={c.ville} label="Ville" />
            </div>
            <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
              <h3 className="mb-md text-title-lg text-amud-on-surface">Compétences</h3>
              {c.competences.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {c.competences.map((s) => (
                    <span key={s} className="rounded-full bg-amud-surface-container-high px-3 py-1 text-label-sm text-amud-on-surface-variant">
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-body-md text-amud-on-surface-variant">Aucune compétence renseignée.</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-lg">
            <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
              <div className="mb-md flex items-start justify-between">
                <h3 className="text-title-lg text-amud-on-surface">Score de profil</h3>
                <span className="material-symbols-outlined text-3xl text-amud-primary opacity-20">analytics</span>
              </div>
              <div className="mb-1 h-2 w-full rounded-full bg-amud-surface-container-high">
                <div className="h-2 rounded-full bg-amud-primary" style={{ width: `${Math.min(100, c.score)}%` }} />
              </div>
              <span className="text-label-sm text-amud-on-surface-variant">{c.score}/100</span>
            </div>
          </div>
        </div>
      )}

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Modifier le candidat">
        <EditCandidateForm
          candidate={c}
          onSubmit={(patch) => {
            updateCandidate(c.id, patch);
            notify('Profil mis à jour.');
            setEditOpen(false);
          }}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer ce candidat ?"
        description="Cette action est irréversible. Le profil sera retiré de la liste des candidats."
        confirmLabel="Supprimer"
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-label-sm text-amud-on-surface-variant">{label}</dt>
      <dd className="text-body-md text-amud-on-surface">{value}</dd>
    </div>
  );
}

function KpiCard({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-md">
      <span className="material-symbols-outlined mb-sm text-amud-primary">{icon}</span>
      <div>
        <div className="text-title-lg text-amud-on-surface">{value}</div>
        <div className="text-label-sm text-amud-on-surface-variant">{label}</div>
      </div>
    </div>
  );
}

function EditCandidateForm({
  candidate,
  onSubmit,
  onCancel,
}: {
  candidate: Candidate;
  onSubmit: (patch: Partial<Candidate>) => void;
  onCancel: () => void;
}) {
  const [nom, setNom] = useState(candidate.nom);
  const [email, setEmail] = useState(candidate.email);
  const [telephone, setTelephone] = useState(candidate.telephone);
  const [ville, setVille] = useState(candidate.ville);
  const [posteRecherche, setPosteRecherche] = useState(candidate.posteRecherche);
  const [disponibilite, setDisponibilite] = useState(candidate.disponibilite);
  const [competences, setCompetences] = useState(candidate.competences.join(', '));

  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        if (!nom.trim()) return;
        onSubmit({
          nom: nom.trim(),
          email: email.trim(),
          telephone: telephone.trim(),
          ville: ville.trim(),
          posteRecherche: posteRecherche.trim(),
          disponibilite: disponibilite.trim(),
          competences: competences
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        });
      }}
      className="grid grid-cols-1 gap-md sm:grid-cols-2"
    >
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Nom</label>
        <input value={nom} onChange={(e) => setNom(e.target.value)} required className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
      </div>
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
      </div>
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Téléphone</label>
        <input value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
      </div>
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Ville</label>
        <input value={ville} onChange={(e) => setVille(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
      </div>
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Poste recherché</label>
        <input value={posteRecherche} onChange={(e) => setPosteRecherche(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
      </div>
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Disponibilité</label>
        <input value={disponibilite} onChange={(e) => setDisponibilite(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Compétences (séparées par des virgules)</label>
        <input value={competences} onChange={(e) => setCompetences(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
      </div>
      <div className="flex justify-end gap-sm sm:col-span-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
          Annuler
        </button>
        <button type="submit" className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white hover:bg-amud-primary-dark">
          Enregistrer
        </button>
      </div>
    </form>
  );
}
