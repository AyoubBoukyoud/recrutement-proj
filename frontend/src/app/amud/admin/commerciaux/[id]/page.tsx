'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Modal, Tabs } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { exportCsv } from '@/lib/amud/csv';
import { commerciaux as commerciauxSeed, STATUT_LABEL, type Commercial } from '@/data/amud/commerciaux';
import { commerciauxCollection } from '@/lib/amud/localCommerciaux';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { activitesSeed, TYPE_ICON, RESULTAT_CLASS, type Activite } from '@/data/amud/commercialActivites';
import { activitesCollection } from '@/lib/amud/localCommercialActivites';
import { logAudit } from '@/lib/amud/storage/audit';
import { objectivesSeed, getObjectiveForCommercial } from '@/data/amud/objectives';
import { objectivesCollection } from '@/lib/amud/localObjectives';

const TABS = [
  { id: 'overview', label: "Vue d'ensemble" },
  { id: 'infos', label: 'Informations' },
  { id: 'activites', label: 'Activités' },
  { id: 'appels', label: 'Appels' },
  { id: 'rappels', label: 'Rappels' },
  { id: 'rdv', label: 'Rendez-vous' },
  { id: 'objectifs', label: 'Objectifs' },
  { id: 'performance', label: 'Performance' },
  { id: 'historique', label: 'Historique' },
  { id: 'permissions', label: 'Permissions' },
];

export default function AmudAdminCommercialProfilePage() {
  const notify = useToast();
  const params = useParams<{ id: string }>();
  const [commerciaux, { update: updateCommercial }] = useCollection(commerciauxCollection, commerciauxSeed);
  const commercial = useMemo<Commercial | null>(() => commerciaux.find((x) => x.id === params.id) ?? null, [commerciaux, params.id]);
  const [tab, setTab] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);

  const [allActivites] = useCollection(activitesCollection, activitesSeed);
  const activites = useMemo(() => (commercial ? allActivites.filter((a) => a.commercialId === commercial.id) : []), [commercial, allActivites]);
  const [objectives] = useCollection(objectivesCollection, objectivesSeed);
  const objective = useMemo(() => (commercial ? getObjectiveForCommercial(commercial.id, objectives) : undefined), [commercial, objectives]);
  const appels = useMemo(() => activites.filter((a) => a.type === 'Appel'), [activites]);
  const rappels = useMemo(() => activites.filter((a) => a.type === 'Follow-up'), [activites]);

  if (commercial === null) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-xl text-center">
        <span className="material-symbols-outlined mb-md text-4xl text-amud-outline">person_off</span>
        <h2 className="text-title-lg text-amud-on-surface">Commercial introuvable</h2>
        <p className="mt-2 text-body-md text-amud-on-surface-variant">Aucun profil ne correspond à &quot;{params.id}&quot;.</p>
        <Link href="/amud/admin/commerciaux" className="mt-4 inline-block text-amud-primary hover:underline">
          Retour à la liste des commerciaux
        </Link>
      </div>
    );
  }

  const c = commercial;
  const actif = c.actif !== false;
  const objectifAppelsJour = objective?.appelsJour ?? c.objectifAppelsJour;
  const objectifRdvSemaine = objective?.rdvSemaine ?? c.objectifRdvSemaine;
  const objectifConversionsMois = c.objectifConversionsMois;
  const pctAppels = Math.round((c.appelsJour / objectifAppelsJour) * 100);
  const pctRdv = Math.round((c.rdvSemaine / objectifRdvSemaine) * 100);
  const pctConv = Math.round((c.conversionsMois / objectifConversionsMois) * 100);

  return (
    <div className="mx-auto max-w-[1200px]">
      <section className="relative mb-lg overflow-hidden rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        <div className="absolute bottom-0 left-0 top-0 w-2 bg-amud-primary" />
        <div className="flex flex-col items-start justify-between gap-lg md:flex-row md:items-center">
          <div className="flex items-center gap-lg">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-amud-surface bg-amud-primary-container text-title-lg font-bold text-white shadow-sm">
              {c.avatarInitials}
            </div>
            <div>
              <div className="mb-1 flex items-center gap-sm">
                <h2 className="text-headline-lg text-amud-on-surface">
                  {c.prenom} {c.nom}
                </h2>
                <span
                  className={`flex items-center gap-1 rounded px-2 py-1 text-label-sm ${
                    actif ? 'bg-amud-primary-fixed text-amud-on-primary-fixed' : 'bg-amud-surface-container-highest text-amud-on-surface-variant'
                  }`}
                >
                  <span className={`inline-block h-2 w-2 rounded-full ${actif ? 'bg-amud-primary' : 'bg-amud-outline'}`} />
                  {actif ? STATUT_LABEL[c.statut] : 'Désactivé'}
                </span>
              </div>
              <p className="flex items-center gap-xs text-title-lg text-amud-on-surface-variant">
                {c.fonction}
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
                  <span className="material-symbols-outlined text-sm">calendar_month</span> Membre depuis le {c.dateEntree}
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
              onClick={() => {
                updateCommercial(c.id, { actif: !actif });
                logAudit({
                  utilisateur: 'Administrateur',
                  role: 'Admin',
                  action: actif ? 'Désactivation de commercial' : 'Réactivation de commercial',
                  actionType: actif ? 'disable' : 'update',
                  module: 'Commerciaux',
                  reference: `${c.prenom} ${c.nom} (#${c.id})`,
                });
                notify(actif ? `${c.prenom} ${c.nom} a été désactivé.` : `${c.prenom} ${c.nom} a été réactivé.`);
              }}
              className="flex items-center gap-xs rounded-lg border border-amud-outline-variant px-md py-sm text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low"
            >
              <span className="material-symbols-outlined text-sm">block</span> {actif ? 'Désactiver' : 'Réactiver'}
            </button>
            <button
              onClick={() => notify('Un email de réinitialisation a été envoyé.')}
              className="flex items-center gap-xs rounded-lg border border-amud-outline-variant px-md py-sm text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low"
            >
              <span className="material-symbols-outlined text-sm">lock_reset</span> Réinitialiser mot de passe
            </button>
            <button
              onClick={() => {
                exportCsv(`commercial-${c.id}`, [
                  { Prénom: c.prenom, Nom: c.nom, Fonction: c.fonction, Ville: c.ville, Email: c.email, Téléphone: c.telephone, 'Appels/jour': c.appelsJour, 'Taux réponse': `${c.tauxReponse}%`, 'Réalisé mensuel': c.realiseMensuel },
                ]);
                notify('Dossier exporté.');
              }}
              className="flex items-center justify-center rounded-lg border border-amud-outline-variant p-sm text-amud-on-surface transition-colors hover:bg-amud-surface-container-low"
            >
              <span className="material-symbols-outlined">download</span>
            </button>
          </div>
        </div>
      </section>

      <div className="mb-lg">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === 'activites' || tab === 'appels' || tab === 'rappels' ? (
        <ActiviteList
          activites={tab === 'activites' ? activites : tab === 'appels' ? appels : rappels}
          emptyText={tab === 'activites' ? 'Aucune activité enregistrée.' : tab === 'appels' ? 'Aucun appel enregistré.' : 'Aucun follow-up enregistré.'}
        />
      ) : tab !== 'overview' ? (
        <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-xl text-center text-amud-on-surface-variant">
          Cet onglet n&apos;est pas encore disponible dans cette version.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
          <div className="flex flex-col gap-lg lg:col-span-2">
            <div className="grid grid-cols-2 gap-md md:grid-cols-4">
              <KpiCard icon="call" value={c.appelsJour} label="Appels aujourd'hui" />
              <KpiCard icon="forum" value={`${c.tauxReponse}%`} label="Taux de réponse" />
              <KpiCard icon="calendar_today" value={c.rdvSemaine} label="Rendez-vous" />
              <KpiCard icon="notifications_active" value={12} label="Rappels" accent />
              <KpiCard icon="person" value={c.candidatsContactes} label="Candidats contactés" />
              <KpiCard icon="business_center" value={c.recruteursContactes} label="Recruteurs contactés" />
              <div className="col-span-2 flex flex-col justify-between rounded-xl border border-amud-outline-variant/30 bg-gradient-to-r from-amud-surface-container-lowest to-amud-surface-container-low p-md md:col-span-2">
                <div className="mb-sm flex items-center justify-between">
                  <span className="material-symbols-outlined text-amud-primary">trending_up</span>
                  <span className="text-label-sm text-amud-primary">Taux de conversion</span>
                </div>
                <div>
                  <div className="text-display-lg text-amud-on-surface">{c.tauxConversion}%</div>
                  <div className="text-label-md text-amud-on-surface-variant">Sur les 30 derniers jours</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
              <h3 className="mb-md text-title-lg text-amud-on-surface">Activités récentes</h3>
              <div className="relative ml-sm space-y-6 border-l border-amud-outline-variant">
                {[
                  { icon: 'phone_in_talk', color: 'text-amud-primary', title: 'Appel sortant', when: "Aujourd'hui, 14:30 (5 min)", body: 'Contact avec Marie Laurent (Candidat). Résultat: Positif.' },
                  { icon: 'event', color: 'text-amud-secondary', title: 'Prise de rendez-vous', when: "Aujourd'hui, 11:15", body: 'Rendez-vous planifié avec TechCorp Solutions (Recruteur).' },
                  { icon: 'mail', color: 'text-amud-outline', title: 'Email envoyé', when: 'Hier, 16:45', body: 'Follow-up avec Paul Martin (Candidat).' },
                ].map((a, i) => (
                  <div key={i} className="relative border-b border-amud-outline-variant/30 pb-md pl-lg last:border-0">
                    <div className="absolute left-[-6.5px] top-1 h-3 w-3 rounded-full bg-amud-primary ring-4 ring-amud-surface-container-lowest" />
                    <div className="mb-xs flex items-center justify-between">
                      <div className="flex items-center gap-xs text-label-md font-bold text-amud-on-surface">
                        <span className={`material-symbols-outlined text-sm ${a.color}`}>{a.icon}</span> {a.title}
                      </div>
                      <div className="text-label-sm text-amud-outline">{a.when}</div>
                    </div>
                    <div className="text-body-md text-amud-on-surface-variant">{a.body}</div>
                  </div>
                ))}
              </div>
              <Link href="/amud/admin/activites" className="mt-md block w-full rounded-lg border border-amud-outline-variant py-sm text-center text-label-md text-amud-primary transition-colors hover:bg-amud-surface-container-low">
                Voir tout l&apos;historique
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-lg">
            <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
              <div className="mb-md flex items-start justify-between">
                <h3 className="text-title-lg text-amud-on-surface">Atteinte des objectifs</h3>
                <span className="material-symbols-outlined text-3xl text-amud-primary opacity-20">analytics</span>
              </div>
              <ObjectifBar label="Quotidien (Appels)" value={c.appelsJour} target={objectifAppelsJour} pct={pctAppels} color="bg-amud-primary" />
              <ObjectifBar label="Hebdomadaire (RDV)" value={c.rdvSemaine} target={objectifRdvSemaine} pct={pctRdv} color="bg-amud-tertiary-fixed-dim" />
              <ObjectifBar label="Mensuel (Conversions)" value={c.conversionsMois} target={objectifConversionsMois} pct={pctConv} color="bg-amud-primary" last />
            </div>
          </div>
        </div>
      )}

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Modifier le commercial">
        <EditCommercialForm
          commercial={c}
          onSubmit={(patch) => {
            updateCommercial(c.id, patch);
            logAudit({ utilisateur: 'Administrateur', role: 'Admin', action: 'Modification de commercial', actionType: 'update', module: 'Commerciaux', reference: `${c.prenom} ${c.nom} (#${c.id})` });
            notify('Profil mis à jour.');
            setEditOpen(false);
          }}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>
    </div>
  );
}

function KpiCard({ icon, value, label, accent }: { icon: string; value: string | number; label: string; accent?: boolean }) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-md">
      <span className={`material-symbols-outlined mb-sm ${accent ? 'text-amud-secondary' : 'text-amud-primary'}`}>{icon}</span>
      <div>
        <div className="text-title-lg text-amud-on-surface">{value}</div>
        <div className="text-label-sm text-amud-on-surface-variant">{label}</div>
      </div>
    </div>
  );
}

function ActiviteList({ activites, emptyText }: { activites: Activite[]; emptyText: string }) {
  if (activites.length === 0) {
    return (
      <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-xl text-center text-amud-on-surface-variant">
        {emptyText}
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
      <div className="relative ml-sm space-y-6 border-l border-amud-outline-variant">
        {activites.map((a) => (
          <div key={a.id} className="relative border-b border-amud-outline-variant/30 pb-md pl-lg last:border-0">
            <div className="absolute left-[-6.5px] top-1 h-3 w-3 rounded-full bg-amud-primary ring-4 ring-amud-surface-container-lowest" />
            <div className="mb-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-xs text-label-md font-bold text-amud-on-surface">
                <span className="material-symbols-outlined text-sm text-amud-primary">{TYPE_ICON[a.type]}</span> {a.type}
                <span className="font-normal text-amud-on-surface-variant">· {a.entrepriseNom}</span>
              </div>
              <div className="text-label-sm text-amud-outline">
                {a.date}, {a.heureDebut}
              </div>
            </div>
            <div className="text-body-md text-amud-on-surface-variant">{a.resume}</div>
            <span className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${RESULTAT_CLASS[a.resultat]}`}>{a.resultat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditCommercialForm({
  commercial,
  onSubmit,
  onCancel,
}: {
  commercial: Commercial;
  onSubmit: (patch: Partial<Commercial>) => void;
  onCancel: () => void;
}) {
  const [prenom, setPrenom] = useState(commercial.prenom);
  const [nom, setNom] = useState(commercial.nom);
  const [fonction, setFonction] = useState(commercial.fonction);
  const [ville, setVille] = useState(commercial.ville);
  const [email, setEmail] = useState(commercial.email);
  const [telephone, setTelephone] = useState(commercial.telephone);

  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        if (!prenom.trim() || !nom.trim()) return;
        onSubmit({ prenom: prenom.trim(), nom: nom.trim(), fonction: fonction.trim(), ville: ville.trim(), email: email.trim(), telephone: telephone.trim() });
      }}
      className="grid grid-cols-1 gap-md sm:grid-cols-2"
    >
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Prénom</label>
        <input value={prenom} onChange={(e) => setPrenom(e.target.value)} required className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
      </div>
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Nom</label>
        <input value={nom} onChange={(e) => setNom(e.target.value)} required className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
      </div>
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Fonction</label>
        <input value={fonction} onChange={(e) => setFonction(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
      </div>
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Ville</label>
        <input value={ville} onChange={(e) => setVille(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
      </div>
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
      </div>
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Téléphone</label>
        <input value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
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

function ObjectifBar({
  label,
  value,
  target,
  pct,
  color,
  last,
}: {
  label: string;
  value: number;
  target: number;
  pct: number;
  color: string;
  last?: boolean;
}) {
  return (
    <div className={last ? '' : 'mb-sm'}>
      <div className="mb-xs flex items-end justify-between">
        <span className="text-label-sm text-amud-on-surface-variant">{label}</span>
        <span className="text-label-sm text-amud-on-surface">
          {value} / {target}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-amud-surface-container-high">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}
