'use client';

import { useEffect, useState } from 'react';
import { Modal, ModalActions } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { generateId } from '@/lib/amud/storage/ids';
import { logAudit } from '@/lib/amud/storage/audit';
import { logCenterActivity } from '@/lib/amud/localCenterActivities';
import { canPerform, PERMISSION_DENIED_MESSAGE } from '@/lib/amud/centerPermissions';
import { centresCollection } from '@/lib/amud/localCentres';
import { centresSeed, PARTNERSHIP_STATUSES, PARTNERSHIP_LABELS, THEMES, type Centre } from '@/data/amud/centres';
import { commerciaux } from '@/data/amud/commerciaux';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const DEFAULT_HORAIRES: Centre['horaires'] = [
  { jour: 'Lundi', ouverture: '09:00', fermeture: '19:00' },
  { jour: 'Mardi', ouverture: '09:00', fermeture: '19:00' },
  { jour: 'Mercredi', ouverture: '09:00', fermeture: '19:00' },
  { jour: 'Jeudi', ouverture: '09:00', fermeture: '19:00' },
  { jour: 'Vendredi', ouverture: '09:00', fermeture: '18:00' },
  { jour: 'Samedi', ouverture: '10:00', fermeture: '14:00' },
  { jour: 'Dimanche', ouverture: '', fermeture: '', ferme: true },
];

/**
 * Modal unique de création / édition d'un centre (cahier des charges
 * §5/§6/§88/§89 : pas de page `nouveau` séparée). Réutilisée à l'identique
 * pour "Ajouter un centre" (`centre` absent) et "Modifier" (`centre`
 * fourni, formulaire pré-rempli) depuis `/amud/admin/centres`.
 */
export function CenterFormModal({ open, onClose, centre, onSaved }: { open: boolean; onClose: () => void; centre?: Centre; onSaved?: (c: Centre) => void }) {
  const notify = useToast();
  const [, { add: addCentre, update: updateCentre }] = useCollection(centresCollection, centresSeed);
  const isEdit = !!centre;

  const [nom, setNom] = useState('');
  const [logo, setLogo] = useState('school');
  const [description, setDescription] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [siteWeb, setSiteWeb] = useState('');
  const [contactNom, setContactNom] = useState('');
  const [contactTelephone, setContactTelephone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [pays, setPays] = useState('Maroc');
  const [ville, setVille] = useState('');
  const [adresse, setAdresse] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [statut, setStatut] = useState<Centre['statut']>('En attente');
  const [partnershipStatus, setPartnershipStatus] = useState<Centre['partnershipStatus']>('PROSPECT');
  const [partnershipDateDebut, setPartnershipDateDebut] = useState(() => new Date().toLocaleDateString('fr-FR'));
  const [assignedCommercialId, setAssignedCommercialId] = useState(commerciaux[0]?.id ?? '');
  const [siteEnabled, setSiteEnabled] = useState(true);
  const [theme, setTheme] = useState<Centre['theme']>('modern-education');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (centre) {
      setNom(centre.nom);
      setLogo(centre.logo);
      setDescription(centre.description);
      setTelephone(centre.telephone);
      setEmail(centre.email);
      setSiteWeb(centre.siteWeb ?? '');
      setContactNom(centre.contactNom);
      setContactTelephone(centre.contactTelephone);
      setContactEmail(centre.contactEmail);
      setPays(centre.pays);
      setVille(centre.ville);
      setAdresse(centre.adresse);
      setGoogleMapsUrl(centre.googleMapsUrl ?? '');
      setStatut(centre.statut);
      setPartnershipStatus(centre.partnershipStatus);
      setPartnershipDateDebut(centre.partnershipDateDebut);
      setAssignedCommercialId(centre.assignedCommercialId || commerciaux[0]?.id || '');
      setSiteEnabled(centre.site.enabled);
      setTheme(centre.theme);
    } else {
      setNom('');
      setLogo('school');
      setDescription('');
      setTelephone('');
      setEmail('');
      setSiteWeb('');
      setContactNom('');
      setContactTelephone('');
      setContactEmail('');
      setPays('Maroc');
      setVille('');
      setAdresse('');
      setGoogleMapsUrl('');
      setStatut('En attente');
      setPartnershipStatus('PROSPECT');
      setPartnershipDateDebut(new Date().toLocaleDateString('fr-FR'));
      setAssignedCommercialId(commerciaux[0]?.id ?? '');
      setSiteEnabled(true);
      setTheme('modern-education');
    }
  }, [open, centre]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim() || !ville.trim()) return;
    // Vérifiée ici, pas seulement par l'absence de bouton côté Admin
    // (cahier des charges §19 : les fonctions doivent aussi vérifier).
    if (!canPerform('ADMIN', 'manage-centers')) {
      notify(PERMISSION_DENIED_MESSAGE, 'error');
      return;
    }
    setSubmitting(true);
    const commercial = commerciaux.find((c) => c.id === assignedCommercialId);
    const now = new Date().toISOString();

    if (isEdit && centre) {
      const patch: Partial<Centre> = {
        nom: nom.trim(),
        logo,
        description: description.trim(),
        telephone: telephone.trim(),
        email: email.trim(),
        siteWeb: siteWeb.trim() || undefined,
        contactNom: contactNom.trim(),
        contactTelephone: contactTelephone.trim(),
        contactEmail: contactEmail.trim(),
        pays,
        ville: ville.trim(),
        adresse: adresse.trim(),
        googleMapsUrl: googleMapsUrl.trim() || undefined,
        statut,
        partnershipStatus,
        partnershipDateDebut,
        assignedCommercialId,
        assignedCommercialNom: commercial ? `${commercial.prenom} ${commercial.nom}` : centre.assignedCommercialNom,
        theme,
        site: { ...centre.site, enabled: siteEnabled },
        updatedAt: now,
      };
      updateCentre(centre.id, patch);
      logAudit({ utilisateur: 'Administrateur', role: 'Admin', action: 'Modification centre', actionType: 'update', module: 'Centres de formation', reference: `${nom} (#${centre.id})`, centerId: centre.id });
      logCenterActivity({ centerId: centre.id, type: 'CENTER_UPDATED', message: `Centre « ${nom} » modifié.`, utilisateur: 'Administrateur', role: 'ADMIN' });
      if (patch.partnershipStatus && patch.partnershipStatus !== centre.partnershipStatus) {
        logCenterActivity({ centerId: centre.id, type: 'PARTNERSHIP_UPDATED', message: `Partenariat de « ${nom} » : ${PARTNERSHIP_LABELS[patch.partnershipStatus]}.`, utilisateur: 'Administrateur', role: 'ADMIN' });
      }
      notify(`« ${nom} » mis à jour.`);
      onSaved?.({ ...centre, ...patch } as Centre);
    } else {
      const id = generateId('center');
      const created: Centre = {
        id,
        slug: slugify(nom) || id,
        nom: nom.trim(),
        logo,
        description: description.trim(),
        telephone: telephone.trim(),
        email: email.trim(),
        siteWeb: siteWeb.trim() || undefined,
        contactNom: contactNom.trim(),
        contactTelephone: contactTelephone.trim(),
        contactEmail: contactEmail.trim(),
        pays,
        ville: ville.trim(),
        adresse: adresse.trim(),
        googleMapsUrl: googleMapsUrl.trim() || undefined,
        statut,
        partnershipStatus,
        partnershipDateDebut,
        assignedCommercialId,
        assignedCommercialNom: commercial ? `${commercial.prenom} ${commercial.nom}` : '',
        theme,
        horaires: DEFAULT_HORAIRES,
        site: {
          enabled: siteEnabled,
          tagline: `Apprenez l'allemand à ${ville.trim()} avec des enseignants natifs et certifiés.`,
          avantages: ['Groupes restreints', 'Enseignants certifiés Goethe-Institut', 'Préparation aux examens officiels'],
          temoignages: [],
          faq: [],
          ctaLabel: 'Demander une inscription',
        },
        createdAt: now,
        updatedAt: now,
      };
      addCentre(created);
      logAudit({ utilisateur: 'Administrateur', role: 'Admin', action: 'Création centre', actionType: 'create', module: 'Centres de formation', reference: `${created.nom} (#${created.id})`, centerId: created.id });
      logCenterActivity({ centerId: created.id, type: 'CENTER_CREATED', message: `Nouveau centre « ${created.nom} » créé à ${created.ville}.`, utilisateur: 'Administrateur', role: 'ADMIN' });
      notify(`« ${created.nom} » ajouté aux centres de formation.`);
      onSaved?.(created);
    }
    setSubmitting(false);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Modifier le centre' : 'Ajouter un centre'}
      widthClassName="max-w-2xl"
      footer={<ModalActions onCancel={onClose} form="center-form" submitLabel={isEdit ? 'Enregistrer' : "Ajouter le centre"} disabled={submitting} />}
    >
      <form id="center-form" onSubmit={handleSubmit} className="flex flex-col gap-lg">
        <section>
          <h4 className="mb-md text-label-md font-semibold uppercase tracking-wider text-amud-outline">Informations générales</h4>
          <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Nom du centre *</label>
              <input autoFocus value={nom} onChange={(e) => setNom(e.target.value)} required className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" placeholder="Deutsch Akademie Casablanca" type="text" />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Icône / logo</label>
              <select value={logo} onChange={(e) => setLogo(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
                {['school', 'auto_stories', 'translate', 'menu_book', 'language'].map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Statut du compte</label>
              <select value={statut} onChange={(e) => setStatut(e.target.value as Centre['statut'])} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
                <option>Actif</option>
                <option>Inactif</option>
                <option>En attente</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Téléphone</label>
              <input value={telephone} onChange={(e) => setTelephone(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="tel" />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="email" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Site web</label>
              <input value={siteWeb} onChange={(e) => setSiteWeb(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" placeholder="www.exemple.com" type="text" />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Personne de contact</label>
              <input value={contactNom} onChange={(e) => setContactNom(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Téléphone du contact</label>
              <input value={contactTelephone} onChange={(e) => setContactTelephone(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="tel" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Email du contact</label>
              <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="email" />
            </div>
          </div>
        </section>

        <section>
          <h4 className="mb-md text-label-md font-semibold uppercase tracking-wider text-amud-outline">Localisation</h4>
          <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Pays</label>
              <input value={pays} onChange={(e) => setPays(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Ville *</label>
              <input value={ville} onChange={(e) => setVille(e.target.value)} required className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Adresse</label>
              <input value={adresse} onChange={(e) => setAdresse(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Lien Google Maps</label>
              <input value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" />
            </div>
          </div>
        </section>

        <section>
          <h4 className="mb-md text-label-md font-semibold uppercase tracking-wider text-amud-outline">Partenariat &amp; commercial</h4>
          <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Statut du partenariat</label>
              <select value={partnershipStatus} onChange={(e) => setPartnershipStatus(e.target.value as Centre['partnershipStatus'])} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
                {PARTNERSHIP_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PARTNERSHIP_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Date de début</label>
              <input value={partnershipDateDebut} onChange={(e) => setPartnershipDateDebut(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" placeholder="jj/mm/aaaa" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Commercial affecté</label>
              <select value={assignedCommercialId} onChange={(e) => setAssignedCommercialId(e.target.value)} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
                {commerciaux.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.prenom} {c.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section>
          <h4 className="mb-md text-label-md font-semibold uppercase tracking-wider text-amud-outline">Site public</h4>
          <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border border-amud-outline-variant bg-amud-surface-container-low px-md py-sm sm:col-span-2">
              <span className="text-label-md text-amud-on-surface">Site public activé</span>
              <input type="checkbox" checked={siteEnabled} onChange={(e) => setSiteEnabled(e.target.checked)} className="h-5 w-5 accent-amud-primary" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Thème</label>
              <select value={theme} onChange={(e) => setTheme(e.target.value as Centre['theme'])} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
                {THEMES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>
      </form>
    </Modal>
  );
}
