'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Commercial } from '@/data/amud/commerciaux';
import { addLocalCommercial } from '@/lib/amud/localCommerciaux';
import { useToast } from '@/components/amud/Toast';

const RESPONSABLES = ['Marie Dubois - Directrice Commerciale', 'Paul Martin - Chef de Secteur'];
const NIVEAUX = ['Junior (0-2 ans)', 'Intermédiaire (3-5 ans)', 'Senior (5+ ans)'];

function todayFr() {
  return new Date().toLocaleDateString('fr-FR');
}

export default function AmudAdminNouveauCommercialPage() {
  const router = useRouter();
  const notify = useToast();
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [ville, setVille] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [dateEntree, setDateEntree] = useState('');
  const [responsable, setResponsable] = useState('');
  const [niveau, setNiveau] = useState(NIVEAUX[0]);
  const [zone, setZone] = useState('');
  const [secteur, setSecteur] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState<'draft' | null>(null);

  function buildCommercial(): Commercial {
    const id = `${prenom}-${nom}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return {
      id: id || `commercial-${Date.now()}`,
      prenom,
      nom,
      fonction: 'Agent Commercial',
      ville: ville || ' —',
      email,
      telephone,
      dateEntree: dateEntree || todayFr(),
      statut: 'hors_ligne',
      avatarInitials: `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase(),
      objectifAppelsJour: 40,
      appelsJour: 0,
      tauxReponse: 0,
      rdvSemaine: 0,
      objectifRdvSemaine: 12,
      candidatsContactes: 0,
      recruteursContactes: 0,
      objectifMensuel: 400,
      realiseMensuel: 0,
      conversionsMois: 0,
      objectifConversionsMois: 8,
      tauxConversion: 0,
    };
  }

  function validate() {
    const errs: string[] = [];
    if (!prenom.trim()) errs.push('Le prénom est requis.');
    if (!nom.trim()) errs.push('Le nom est requis.');
    if (!email.trim() || !email.includes('@')) errs.push('Un email professionnel valide est requis.');
    setErrors(errs);
    return errs.length === 0;
  }

  function handleSaveDraft() {
    if (!validate()) return;
    addLocalCommercial(buildCommercial());
    setSaved('draft');
    notify('Brouillon enregistré.');
  }

  function handleCreateAndInvite() {
    if (!validate()) return;
    const c = buildCommercial();
    addLocalCommercial(c);
    notify(`« ${c.prenom} ${c.nom} » créé, invitation envoyée.`);
    router.push(`/amud/admin/commerciaux/${c.id}`);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-lg pb-32">
      <div>
        <nav className="mb-2 flex items-center text-label-sm text-amud-on-surface-variant">
          <Link href="/amud/admin/commerciaux" className="transition-colors hover:text-amud-primary">
            Commerciaux
          </Link>
          <span className="material-symbols-outlined mx-1 text-[16px]">chevron_right</span>
          <span className="text-amud-on-surface">Ajouter</span>
        </nav>
        <h1 className="text-headline-lg text-amud-on-surface">Ajouter un commercial</h1>
        <p className="mt-2 text-body-md text-amud-on-surface-variant">
          Renseignez les informations pour créer un nouveau profil agent commercial dans le système Amud Skills.
        </p>
      </div>

      {errors.length > 0 ? (
        <div className="rounded-lg border border-amud-error bg-amud-error-container p-md text-body-md text-amud-on-error-container">
          <ul className="list-inside list-disc">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {saved === 'draft' ? (
        <div className="flex items-center gap-2 rounded-lg border border-amud-primary-fixed-dim bg-amud-primary-fixed p-md text-body-md text-amud-on-primary-fixed">
          <span className="material-symbols-outlined">check_circle</span>
          Brouillon enregistré. Vous pouvez continuer à modifier ce profil.
        </div>
      ) : null}

      <section className="relative overflow-hidden rounded-2xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
        <div className="absolute left-0 top-0 h-full w-2 rounded-l-2xl bg-amud-primary" />
        <h2 className="mb-md flex items-center gap-2 text-title-lg text-amud-on-surface">
          <span className="material-symbols-outlined text-amud-primary">badge</span>
          Identité
        </h2>
        <div className="flex flex-col gap-lg md:flex-row">
          <div className="flex w-full flex-col items-center gap-4 md:w-1/4">
            <div className="group relative flex h-32 w-32 flex-col items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-amud-outline-variant bg-amud-surface-container-high transition-colors hover:bg-amud-surface-container">
              <span className="material-symbols-outlined mb-1 text-3xl text-amud-outline transition-colors group-hover:text-amud-primary">add_a_photo</span>
              <span className="text-label-sm text-amud-outline transition-colors group-hover:text-amud-primary">Photo</span>
              <input className="absolute inset-0 cursor-pointer opacity-0" type="file" accept="image/*" />
            </div>
          </div>
          <div className="grid w-full grid-cols-1 gap-md md:w-3/4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Prénom</label>
              <input
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none transition-all focus:ring-2 focus:ring-amud-primary focus:ring-offset-1"
                placeholder="Jean"
                type="text"
              />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Nom</label>
              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none transition-all focus:ring-2 focus:ring-amud-primary focus:ring-offset-1"
                placeholder="Dupont"
                type="text"
              />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Email pro</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none transition-all focus:ring-2 focus:ring-amud-primary focus:ring-offset-1"
                placeholder="jean.dupont@amudskills.com"
                type="email"
              />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Téléphone</label>
              <input
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none transition-all focus:ring-2 focus:ring-amud-primary focus:ring-offset-1"
                placeholder="+33 6 00 00 00 00"
                type="tel"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Adresse</label>
              <input
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none transition-all focus:ring-2 focus:ring-amud-primary focus:ring-offset-1"
                placeholder="123 Rue de la République"
                type="text"
              />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Ville</label>
              <input
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none transition-all focus:ring-2 focus:ring-amud-primary focus:ring-offset-1"
                placeholder="Paris"
                type="text"
              />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Date de naissance</label>
              <input
                value={dateNaissance}
                onChange={(e) => setDateNaissance(e.target.value)}
                className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none transition-all focus:ring-2 focus:ring-amud-primary focus:ring-offset-1"
                type="date"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
        <div className="absolute left-0 top-0 h-full w-2 rounded-l-2xl bg-amud-primary" />
        <h2 className="mb-md flex items-center gap-2 text-title-lg text-amud-on-surface">
          <span className="material-symbols-outlined text-amud-primary">work</span>
          Informations professionnelles
        </h2>
        <div className="grid grid-cols-1 gap-md md:grid-cols-2">
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Fonction</label>
            <input
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none"
              readOnly
              type="text"
              value="Agent Commercial"
            />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Date d&apos;entrée</label>
            <input
              value={dateEntree}
              onChange={(e) => setDateEntree(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none transition-all focus:ring-2 focus:ring-amud-primary focus:ring-offset-1"
              type="date"
            />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Responsable</label>
            <select
              value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none transition-all focus:ring-2 focus:ring-amud-primary focus:ring-offset-1"
            >
              <option value="">Sélectionner un responsable</option>
              {RESPONSABLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Niveau d&apos;expérience</label>
            <select
              value={niveau}
              onChange={(e) => setNiveau(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none transition-all focus:ring-2 focus:ring-amud-primary focus:ring-offset-1"
            >
              {NIVEAUX.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Zone géographique</label>
            <input
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none transition-all focus:ring-2 focus:ring-amud-primary focus:ring-offset-1"
              placeholder="Ex: Île-de-France"
              type="text"
            />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Secteur d&apos;activité cible</label>
            <input
              value={secteur}
              onChange={(e) => setSecteur(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none transition-all focus:ring-2 focus:ring-amud-primary focus:ring-offset-1"
              placeholder="Ex: BTP, IT, Santé"
              type="text"
            />
          </div>
        </div>
      </section>

      <footer className="fixed inset-x-0 bottom-0 z-30 flex flex-wrap justify-end gap-md border-t border-amud-outline-variant bg-amud-surface p-md pb-[max(16px,env(safe-area-inset-bottom))] md:left-64">
        <Link
          href="/amud/admin/commerciaux"
          className="rounded-lg border border-amud-primary px-lg py-2 text-label-md font-medium text-amud-primary transition-colors hover:bg-amud-surface-container-low"
        >
          Annuler
        </Link>
        <button
          onClick={handleSaveDraft}
          className="rounded-lg bg-amud-surface-container-high px-lg py-2 text-label-md font-medium text-amud-on-surface transition-colors hover:bg-amud-surface-container-highest"
        >
          Enregistrer
        </button>
        <button
          onClick={handleCreateAndInvite}
          className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark"
        >
          Créer et envoyer les accès
        </button>
      </footer>
    </div>
  );
}
