'use client';

import { useRef, useState } from 'react';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { entreprisesCollection } from '@/lib/amud/localEntreprises';
import { entreprisesSeed, type CompanyType, type SocialLinks } from '@/data/amud/entreprises';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';
import { logAudit } from '@/lib/amud/storage/audit';
import { isValidEmail, isValidPhone, isRequired } from '@/lib/amud/validators';

const COMPANY_TYPES: CompanyType[] = ['PME', 'Grande entreprise', 'Startup', 'Cabinet de recrutement', 'Multinationale', 'Association/ONG'];
const inputCls = 'w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary';
const labelCls = 'mb-1 block text-label-md text-amud-on-surface-variant';

export default function AmudEntrepriseProfilPage() {
  const notify = useToast();
  const [entreprises, { update: updateEntreprise }] = useCollection(entreprisesCollection, entreprisesSeed);
  const entreprise = entreprises.find((e) => e.id === CURRENT_EMPLOYER.entrepriseId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState(() => ({
    nom: entreprise?.nom ?? '',
    secteur: entreprise?.secteur ?? '',
    description: entreprise?.description ?? '',
    siteWeb: entreprise?.siteWeb ?? '',
    email: entreprise?.email ?? '',
    telephone: entreprise?.telephone ?? '',
    adresse: entreprise?.adresse ?? '',
    ville: entreprise?.ville ?? '',
    pays: entreprise?.pays ?? '',
    taille: entreprise?.taille ?? '',
    foundedYear: entreprise?.foundedYear ? String(entreprise.foundedYear) : '',
    companyType: entreprise?.companyType ?? '',
    logo: entreprise?.logo ?? '',
    linkedin: entreprise?.socialLinks?.linkedin ?? '',
    facebook: entreprise?.socialLinks?.facebook ?? '',
    twitter: entreprise?.socialLinks?.twitter ?? '',
    instagram: entreprise?.socialLinks?.instagram ?? '',
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set('logo', reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!isRequired(form.nom)) next.nom = "Le nom de l'entreprise est requis.";
    if (!isValidEmail(form.email)) next.email = 'Adresse email invalide.';
    if (form.telephone && !isValidPhone(form.telephone)) next.telephone = 'Numéro de téléphone invalide.';
    setErrors(next);
    if (Object.keys(next).length > 0 || !entreprise) return;

    const socialLinks: SocialLinks = {
      linkedin: form.linkedin.trim() || undefined,
      facebook: form.facebook.trim() || undefined,
      twitter: form.twitter.trim() || undefined,
      instagram: form.instagram.trim() || undefined,
    };

    updateEntreprise(entreprise.id, {
      nom: form.nom.trim(),
      secteur: form.secteur.trim(),
      description: form.description.trim() || undefined,
      siteWeb: form.siteWeb.trim() || undefined,
      email: form.email.trim(),
      telephone: form.telephone.trim() || undefined,
      adresse: form.adresse.trim() || undefined,
      ville: form.ville.trim() || entreprise.ville,
      pays: form.pays.trim() || undefined,
      taille: form.taille.trim() || undefined,
      foundedYear: form.foundedYear ? Number(form.foundedYear) : undefined,
      companyType: (form.companyType || undefined) as CompanyType | undefined,
      logo: form.logo || undefined,
      socialLinks,
    });
    logAudit({ utilisateur: CURRENT_EMPLOYER.userNom, role: 'Recruteur', action: 'Profil entreprise modifié', actionType: 'update', module: 'Entreprise', reference: form.nom.trim() });
    notify('Profil de l’entreprise enregistré.');
  }

  if (!entreprise) {
    return <p className="text-body-md text-amud-on-surface-variant">Entreprise introuvable.</p>;
  }

  return (
    <div className="pb-6">
      <div className="mb-lg">
        <h2 className="text-headline-lg text-amud-on-surface">Mon entreprise</h2>
        <p className="mt-1 text-body-md text-amud-on-surface-variant">Gérez les informations publiques de {entreprise.nom}. Membre depuis le {entreprise.dateInscription ?? '—'}.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
        <div className="flex items-center gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-amud-primary-container">
            {form.logo ? <img src={form.logo} alt="" className="h-full w-full object-cover" /> : <span className="material-symbols-outlined text-3xl text-white">apartment</span>}
          </div>
          <div>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-lg border border-amud-outline-variant px-md py-2 text-label-md font-medium text-amud-on-surface hover:bg-amud-surface-container-low">
              Changer le logo
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            <p className="mt-1 text-label-sm text-amud-on-surface-variant">PNG ou JPG, stocké localement pour cette démo.</p>
          </div>
        </div>

        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
          <h3 className="mb-md text-title-lg text-amud-on-surface">Informations générales</h3>
          <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
            <div>
              <label className={labelCls}>Nom de l’entreprise *</label>
              <input value={form.nom} onChange={(e) => set('nom', e.target.value)} className={inputCls} type="text" />
              {errors.nom ? <p className="mt-1 text-label-sm text-amud-error">{errors.nom}</p> : null}
            </div>
            <div>
              <label className={labelCls}>Secteur</label>
              <input value={form.secteur} onChange={(e) => set('secteur', e.target.value)} className={inputCls} type="text" />
            </div>
            <div>
              <label className={labelCls}>Type d’entreprise</label>
              <select value={form.companyType} onChange={(e) => set('companyType', e.target.value)} className={inputCls}>
                <option value="">Non spécifié</option>
                {COMPANY_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Année de création</label>
              <input value={form.foundedYear} onChange={(e) => set('foundedYear', e.target.value)} className={inputCls} type="number" min={1900} max={2026} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Description</label>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
          <h3 className="mb-md text-title-lg text-amud-on-surface">Contact &amp; adresse</h3>
          <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
            <div>
              <label className={labelCls}>Site web</label>
              <input value={form.siteWeb} onChange={(e) => set('siteWeb', e.target.value)} className={inputCls} type="text" />
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls} type="email" />
              {errors.email ? <p className="mt-1 text-label-sm text-amud-error">{errors.email}</p> : null}
            </div>
            <div>
              <label className={labelCls}>Téléphone</label>
              <input value={form.telephone} onChange={(e) => set('telephone', e.target.value)} className={inputCls} type="tel" />
              {errors.telephone ? <p className="mt-1 text-label-sm text-amud-error">{errors.telephone}</p> : null}
            </div>
            <div>
              <label className={labelCls}>Taille de l’entreprise</label>
              <input value={form.taille} onChange={(e) => set('taille', e.target.value)} className={inputCls} type="text" placeholder="250-500 employés" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Adresse</label>
              <input value={form.adresse} onChange={(e) => set('adresse', e.target.value)} className={inputCls} type="text" />
            </div>
            <div>
              <label className={labelCls}>Ville</label>
              <input value={form.ville} onChange={(e) => set('ville', e.target.value)} className={inputCls} type="text" />
            </div>
            <div>
              <label className={labelCls}>Pays</label>
              <input value={form.pays} onChange={(e) => set('pays', e.target.value)} className={inputCls} type="text" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
          <h3 className="mb-md text-title-lg text-amud-on-surface">Réseaux sociaux</h3>
          <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
            <div>
              <label className={labelCls}>LinkedIn</label>
              <input value={form.linkedin} onChange={(e) => set('linkedin', e.target.value)} className={inputCls} type="text" />
            </div>
            <div>
              <label className={labelCls}>Facebook</label>
              <input value={form.facebook} onChange={(e) => set('facebook', e.target.value)} className={inputCls} type="text" />
            </div>
            <div>
              <label className={labelCls}>Twitter / X</label>
              <input value={form.twitter} onChange={(e) => set('twitter', e.target.value)} className={inputCls} type="text" />
            </div>
            <div>
              <label className={labelCls}>Instagram</label>
              <input value={form.instagram} onChange={(e) => set('instagram', e.target.value)} className={inputCls} type="text" />
            </div>
          </div>
        </div>

        <button type="submit" className="self-end rounded-lg bg-amud-primary px-xl py-3 text-label-md font-medium text-white shadow-sm hover:brightness-110">
          Enregistrer les modifications
        </button>
      </form>
    </div>
  );
}
