'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/amud/Toast';
import { useCurrentCenter } from '@/lib/amud/currentCentre';
import { useCenterAccess } from '@/lib/amud/useCenterAccess';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { logAudit } from '@/lib/amud/storage/audit';
import { centresCollection } from '@/lib/amud/localCentres';
import { centresSeed, type Centre } from '@/data/amud/centres';
import { PERMISSION_DENIED_MESSAGE } from '@/lib/amud/centerPermissions';

export default function CentreProfilPage() {
  const notify = useToast();
  const { role } = useCurrentCenter();
  const { centerId, allowed } = useCenterAccess('manage-profile');
  const [centres, { update }] = useCollection(centresCollection, centresSeed);
  const centre = centres.find((c) => c.id === centerId);

  const [form, setForm] = useState<Pick<Centre, 'description' | 'telephone' | 'email' | 'siteWeb' | 'contactNom' | 'contactTelephone' | 'contactEmail' | 'adresse'> | null>(null);

  useEffect(() => {
    if (!centre) return;
    setForm({
      description: centre.description,
      telephone: centre.telephone,
      email: centre.email,
      siteWeb: centre.siteWeb ?? '',
      contactNom: centre.contactNom,
      contactTelephone: centre.contactTelephone,
      contactEmail: centre.contactEmail,
      adresse: centre.adresse,
    });
  }, [centre?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!centre || !form) {
    return <p className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg text-center text-body-md text-amud-on-surface-variant">Chargement…</p>;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allowed || !form || !centre) {
      notify(PERMISSION_DENIED_MESSAGE, 'error');
      return;
    }
    update(centre.id, { ...form, updatedAt: new Date().toISOString() });
    logAudit({ utilisateur: 'Centre (self-service)', role: 'Centre', action: `Modification profil centre (rôle : ${role})`, actionType: 'update', module: 'Centres de formation', reference: `${centre.nom} (#${centre.id})`, centerId: centre.id });
    notify('Profil du centre mis à jour.');
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-headline-md text-amud-on-surface">Profil du centre</h1>
      <p className="mb-lg text-body-md text-amud-on-surface-variant">{centre.nom} · {centre.ville}, {centre.pays}</p>
      {!allowed ? (
        <div className="mb-lg rounded-lg border border-amud-tertiary-fixed-dim bg-amud-tertiary-fixed px-md py-sm text-label-md text-amud-on-tertiary-fixed">
          Votre rôle ({role}) ne permet pas de modifier le profil du centre — lecture seule.
        </div>
      ) : null}
      <form onSubmit={handleSubmit} className="space-y-lg rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Description</label>
          <textarea
            disabled={!allowed}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary disabled:opacity-60"
          />
        </div>
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Téléphone</label>
            <input disabled={!allowed} value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary disabled:opacity-60" type="tel" />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Email</label>
            <input disabled={!allowed} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary disabled:opacity-60" type="email" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Site web</label>
            <input disabled={!allowed} value={form.siteWeb} onChange={(e) => setForm({ ...form, siteWeb: e.target.value })} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary disabled:opacity-60" type="text" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Adresse</label>
            <input disabled={!allowed} value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary disabled:opacity-60" type="text" />
          </div>
        </div>
        <div className="border-t border-amud-outline-variant pt-lg">
          <h3 className="mb-md text-label-md font-semibold uppercase tracking-wider text-amud-outline">Personne de contact</h3>
          <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Nom</label>
              <input disabled={!allowed} value={form.contactNom} onChange={(e) => setForm({ ...form, contactNom: e.target.value })} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary disabled:opacity-60" type="text" />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Téléphone</label>
              <input disabled={!allowed} value={form.contactTelephone} onChange={(e) => setForm({ ...form, contactTelephone: e.target.value })} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary disabled:opacity-60" type="tel" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Email</label>
              <input disabled={!allowed} value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary disabled:opacity-60" type="email" />
            </div>
          </div>
        </div>
        {allowed ? (
          <div className="flex justify-end">
            <button type="submit" className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white shadow-sm hover:brightness-110">
              Enregistrer
            </button>
          </div>
        ) : null}
      </form>
    </div>
  );
}
