'use client';

import { ConfirmDialog, Toggle } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { settingsCollection, saveCompanySettings } from '@/lib/amud/localSettings';
import { defaultCompanySettings, type Language, type ProfileVisibility } from '@/data/amud/settings';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';
import { ROLE_LABEL } from '@/data/amud/recruiters';
import { useState } from 'react';

export default function AmudEntrepriseParametresPage() {
  const notify = useToast();
  const [rows, { update: updateSettingsRow, add: addSettingsRow }] = useCollection(settingsCollection, [defaultCompanySettings(CURRENT_EMPLOYER.entrepriseId)]);
  const settings = rows.find((r) => r.id === CURRENT_EMPLOYER.entrepriseId) ?? defaultCompanySettings(CURRENT_EMPLOYER.entrepriseId);
  const [confirmDisable, setConfirmDisable] = useState(false);

  function patch(update: Partial<typeof settings>) {
    const exists = rows.some((r) => r.id === CURRENT_EMPLOYER.entrepriseId);
    if (exists) updateSettingsRow(CURRENT_EMPLOYER.entrepriseId, update);
    else addSettingsRow({ ...settings, ...update });
    saveCompanySettings(CURRENT_EMPLOYER.entrepriseId, update);
  }

  return (
    <div className="flex flex-col gap-lg pb-6">
      <div>
        <h2 className="text-headline-lg text-amud-on-surface">Paramètres</h2>
        <p className="mt-1 text-body-md text-amud-on-surface-variant">Compte, notifications, sécurité et préférences de {CURRENT_EMPLOYER.entrepriseNom}.</p>
      </div>

      <section className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
        <h3 className="mb-md text-title-lg text-amud-on-surface">Compte</h3>
        <dl className="grid grid-cols-1 gap-md sm:grid-cols-2">
          <div>
            <dt className="text-label-sm text-amud-on-surface-variant">Utilisateur connecté</dt>
            <dd className="text-body-md text-amud-on-surface">{CURRENT_EMPLOYER.userNom}</dd>
          </div>
          <div>
            <dt className="text-label-sm text-amud-on-surface-variant">Rôle</dt>
            <dd className="text-body-md text-amud-on-surface">{ROLE_LABEL.ADMIN_ENTREPRISE}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
        <h3 className="mb-md text-title-lg text-amud-on-surface">Entreprise</h3>
        <p className="text-body-md text-amud-on-surface-variant">
          Les informations publiques (logo, description, coordonnées) se gèrent depuis{' '}
          <a href="/amud/entreprise/profil" className="font-medium text-amud-primary hover:underline">
            Mon entreprise
          </a>
          . La composition de l’équipe se gère depuis{' '}
          <a href="/amud/entreprise/equipe" className="font-medium text-amud-primary hover:underline">
            Équipe
          </a>
          .
        </p>
        <div className="mt-md flex items-center justify-between border-t border-amud-outline-variant pt-md">
          <div>
            <p className="text-label-md text-amud-on-surface">Visibilité du profil entreprise</p>
            <p className="text-label-sm text-amud-on-surface-variant">Contrôle si votre profil est visible publiquement par les candidats.</p>
          </div>
          <select value={settings.profileVisibility} onChange={(e) => patch({ profileVisibility: e.target.value as ProfileVisibility })} className="rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
            <option value="Publique">Publique</option>
            <option value="Privée">Privée</option>
          </select>
        </div>
      </section>

      <section className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
        <h3 className="mb-md text-title-lg text-amud-on-surface">Notifications</h3>
        <div className="flex flex-col gap-md">
          <div className="flex items-center justify-between">
            <span className="text-label-md text-amud-on-surface">Email — nouvelles candidatures</span>
            <Toggle checked={settings.notifyEmailApplications} onChange={(v) => patch({ notifyEmailApplications: v })} label="Email — nouvelles candidatures" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-label-md text-amud-on-surface">Email — nouveaux messages</span>
            <Toggle checked={settings.notifyEmailMessages} onChange={(v) => patch({ notifyEmailMessages: v })} label="Email — nouveaux messages" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-label-md text-amud-on-surface">Notifications push — entretiens</span>
            <Toggle checked={settings.notifyPushInterviews} onChange={(v) => patch({ notifyPushInterviews: v })} label="Notifications push — entretiens" />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
        <h3 className="mb-md text-title-lg text-amud-on-surface">Sécurité</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-label-md text-amud-on-surface">Authentification à deux facteurs</p>
            <p className="text-label-sm text-amud-on-surface-variant">Ajoute une vérification par code lors de la connexion.</p>
          </div>
          <Toggle checked={settings.twoFactorEnabled} onChange={(v) => patch({ twoFactorEnabled: v })} label="Authentification à deux facteurs" />
        </div>
      </section>

      <section className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
        <h3 className="mb-md text-title-lg text-amud-on-surface">Confidentialité &amp; permissions d’équipe</h3>
        <p className="text-body-md text-amud-on-surface-variant">
          Les rôles ADMIN_ENTREPRISE / RECRUTEUR / ASSISTANT_RECRUTEUR déterminent l’accès aux offres, candidatures et entretiens de votre entreprise — gérez-les depuis{' '}
          <a href="/amud/entreprise/equipe" className="font-medium text-amud-primary hover:underline">
            Équipe
          </a>
          . Aucune donnée d’une autre entreprise n’est jamais accessible depuis cet espace.
        </p>
      </section>

      <section className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
        <h3 className="mb-md text-title-lg text-amud-on-surface">Préférences</h3>
        <div className="flex items-center justify-between">
          <span className="text-label-md text-amud-on-surface">Langue de l’espace</span>
          <select value={settings.language} onChange={(e) => patch({ language: e.target.value as Language })} className="rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
            <option value="Français">Français</option>
            <option value="Anglais">Anglais</option>
            <option value="Arabe">Arabe</option>
          </select>
        </div>
      </section>

      <section className="rounded-xl border border-amud-error/40 bg-amud-error-container/30 p-lg">
        <h3 className="mb-md text-title-lg text-amud-on-surface">Zone sensible</h3>
        <div className="flex items-center justify-between gap-md">
          <p className="text-body-md text-amud-on-surface-variant">Désactive temporairement la visibilité de votre entreprise pour les candidats (démo — sans effet sur les autres espaces).</p>
          <button onClick={() => setConfirmDisable(true)} className="shrink-0 rounded-lg border border-amud-error px-md py-2 text-label-md font-medium text-amud-error hover:bg-amud-error-container">
            Désactiver
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmDisable}
        onClose={() => setConfirmDisable(false)}
        onConfirm={() => {
          patch({ profileVisibility: 'Privée' });
          notify('Profil entreprise désactivé (visibilité privée).', 'info');
        }}
        title="Désactiver la visibilité de l’entreprise ?"
        description="Votre profil ne sera plus visible publiquement par les candidats tant que vous ne le réactivez pas."
        confirmLabel="Désactiver"
      />
    </div>
  );
}
