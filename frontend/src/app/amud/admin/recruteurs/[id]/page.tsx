'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ConfirmDialog, Modal, Tabs } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { exportCsv } from '@/lib/amud/csv';
import { recruitersSeed, STATUT_CLASS, type Recruiter, type StatutRecruteur } from '@/data/amud/recruiters';
import { recruitersCollection } from '@/lib/amud/localRecruiters';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { entreprisesSeed } from '@/data/amud/entreprises';

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

export default function AmudAdminRecruteurProfilePage() {
  const notify = useToast();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [recruiters, { update: updateRecruiter, remove: removeRecruiter }] = useCollection(recruitersCollection, recruitersSeed);
  const recruiter = useMemo<Recruiter | null>(() => recruiters.find((x) => x.id === params.id) ?? null, [recruiters, params.id]);
  const [tab, setTab] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  if (recruiter === null) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-xl text-center">
        <span className="material-symbols-outlined mb-md text-4xl text-amud-outline">person_off</span>
        <h2 className="text-title-lg text-amud-on-surface">Recruteur introuvable</h2>
        <p className="mt-2 text-body-md text-amud-on-surface-variant">Aucun profil ne correspond à &quot;{params.id}&quot;.</p>
        <Link href="/amud/admin/recruteurs" className="mt-4 inline-block text-amud-primary hover:underline">
          Retour à la liste des recruteurs
        </Link>
      </div>
    );
  }

  const r = recruiter;
  const entreprise = entreprisesSeed.find((e) => e.id === r.entrepriseId);

  function setStatut(next: StatutRecruteur) {
    updateRecruiter(r.id, { statut: next });
    notify(`Statut mis à jour : ${next}.`);
  }

  function toggleVerifie() {
    updateRecruiter(r.id, { verifie: !r.verifie });
    notify(!r.verifie ? `« ${r.nom} » a été vérifié.` : 'Vérification retirée.');
  }

  function handleDelete() {
    removeRecruiter(r.id);
    notify(`« ${r.nom} » supprimé.`, 'info');
    router.push('/amud/admin/recruteurs');
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <section className="relative mb-lg overflow-hidden rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        <div className="absolute bottom-0 left-0 top-0 w-2 bg-amud-primary" />
        <div className="flex flex-col items-start justify-between gap-lg md:flex-row md:items-center">
          <div className="flex items-center gap-lg">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-amud-surface bg-amud-primary-container text-title-lg font-bold text-white shadow-sm">
              {initials(r.nom)}
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-sm">
                <h2 className="text-headline-lg text-amud-on-surface">{r.nom}</h2>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-label-sm ${STATUT_CLASS[r.statut]}`}>{r.statut}</span>
                {r.verifie ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amud-primary-fixed px-3 py-1 text-label-sm text-amud-on-primary-fixed">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      verified
                    </span>
                    Vérifié
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amud-surface-container-highest px-3 py-1 text-label-sm text-amud-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">gpp_maybe</span>
                    Non vérifié
                  </span>
                )}
              </div>
              <p className="flex items-center gap-xs text-title-lg text-amud-on-surface-variant">
                {r.poste} — {r.entrepriseNom}
                <span className="text-amud-outline-variant">•</span>
                <span className="material-symbols-outlined text-sm">location_on</span> {r.ville}
              </p>
              <div className="mt-sm flex flex-wrap gap-md text-label-md text-amud-on-surface-variant">
                <span className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-sm">mail</span> {r.email}
                </span>
                <span className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-sm">phone</span> {r.telephone}
                </span>
                <span className="flex items-center gap-xs text-amud-outline">
                  <span className="material-symbols-outlined text-sm">calendar_month</span> Inscrit le {r.creeLe}
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
            <button
              onClick={toggleVerifie}
              className="flex items-center gap-xs rounded-lg border border-amud-outline-variant px-md py-sm text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low"
            >
              <span className="material-symbols-outlined text-sm">{r.verifie ? 'gpp_maybe' : 'verified'}</span> {r.verifie ? 'Retirer la vérification' : 'Vérifier'}
            </button>
            {r.statut !== 'Bloqué' ? (
              <>
                <button
                  onClick={() => setStatut(r.statut === 'Actif' ? 'Inactif' : 'Actif')}
                  className="flex items-center gap-xs rounded-lg border border-amud-outline-variant px-md py-sm text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low"
                >
                  <span className="material-symbols-outlined text-sm">block</span> {r.statut === 'Actif' ? 'Désactiver' : 'Activer'}
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
                exportCsv(`recruteur-${r.id}`, [
                  {
                    Nom: r.nom,
                    Email: r.email,
                    Téléphone: r.telephone,
                    Poste: r.poste,
                    Entreprise: r.entrepriseNom,
                    Ville: r.ville,
                    Statut: r.statut,
                    Vérifié: r.verifie ? 'Oui' : 'Non',
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
          <h3 className="mb-md text-title-lg text-amud-on-surface">Informations du recruteur</h3>
          <dl className="grid grid-cols-1 gap-md sm:grid-cols-2">
            <InfoRow label="Nom" value={r.nom} />
            <InfoRow label="Email" value={r.email} />
            <InfoRow label="Téléphone" value={r.telephone} />
            <InfoRow label="Poste" value={r.poste} />
            <InfoRow label="Entreprise" value={r.entrepriseNom} />
            <InfoRow label="Ville" value={r.ville} />
            <InfoRow label="Créé le" value={r.creeLe} />
            <InfoRow label="Dernier accès" value={r.dernierAcces} />
          </dl>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
          <div className="flex flex-col gap-lg lg:col-span-2">
            <div className="grid grid-cols-2 gap-md md:grid-cols-3">
              <KpiCard icon="badge" value={r.poste} label="Poste" />
              <KpiCard icon="location_on" value={r.ville} label="Ville" />
              <KpiCard icon="event" value={r.dernierAcces} label="Dernier accès" />
            </div>
            <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
              <h3 className="mb-md text-title-lg text-amud-on-surface">Entreprise rattachée</h3>
              {entreprise ? (
                <div className="flex items-center gap-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded border border-amud-outline-variant bg-amud-surface">
                    <span className="material-symbols-outlined text-amud-primary">{entreprise.icon}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-amud-on-surface">{entreprise.nom}</p>
                    <p className="text-label-sm text-amud-on-surface-variant">
                      {entreprise.secteur} · {entreprise.ville}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-body-md text-amud-on-surface-variant">
                  Entreprise « {r.entrepriseNom} » (fiche non trouvée dans le référentiel entreprises).
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-lg">
            <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
              <div className="mb-md flex items-start justify-between">
                <h3 className="text-title-lg text-amud-on-surface">Vérification</h3>
                <span className="material-symbols-outlined text-3xl text-amud-primary opacity-20">verified</span>
              </div>
              <p className="text-body-md text-amud-on-surface-variant">
                {r.verifie ? 'Ce compte recruteur a été vérifié par un administrateur.' : "Ce compte recruteur n'a pas encore été vérifié."}
              </p>
              <button
                onClick={toggleVerifie}
                className="mt-md w-full rounded-lg border border-amud-outline-variant py-sm text-center text-label-md text-amud-primary transition-colors hover:bg-amud-surface-container-low"
              >
                {r.verifie ? 'Retirer la vérification' : 'Marquer comme vérifié'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Modifier le recruteur">
        <EditRecruiterForm
          recruiter={r}
          onSubmit={(patch) => {
            updateRecruiter(r.id, patch);
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
        title="Supprimer ce recruteur ?"
        description="Cette action est irréversible. Le compte sera retiré de la liste des recruteurs."
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

function EditRecruiterForm({
  recruiter,
  onSubmit,
  onCancel,
}: {
  recruiter: Recruiter;
  onSubmit: (patch: Partial<Recruiter>) => void;
  onCancel: () => void;
}) {
  const [nom, setNom] = useState(recruiter.nom);
  const [email, setEmail] = useState(recruiter.email);
  const [telephone, setTelephone] = useState(recruiter.telephone);
  const [poste, setPoste] = useState(recruiter.poste);
  const [ville, setVille] = useState(recruiter.ville);
  const [entrepriseId, setEntrepriseId] = useState(recruiter.entrepriseId);

  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        if (!nom.trim()) return;
        const entreprise = entreprisesSeed.find((e) => e.id === entrepriseId);
        onSubmit({
          nom: nom.trim(),
          email: email.trim(),
          telephone: telephone.trim(),
          poste: poste.trim(),
          ville: ville.trim(),
          entrepriseId,
          entrepriseNom: entreprise ? entreprise.nom : recruiter.entrepriseNom,
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
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Poste</label>
        <input value={poste} onChange={(e) => setPoste(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
      </div>
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Ville</label>
        <input value={ville} onChange={(e) => setVille(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
      </div>
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Entreprise</label>
        <select
          value={entrepriseId}
          onChange={(e) => setEntrepriseId(e.target.value)}
          className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
        >
          {entreprisesSeed.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nom}
            </option>
          ))}
        </select>
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
