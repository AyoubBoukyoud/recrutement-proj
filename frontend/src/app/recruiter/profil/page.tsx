'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api } from '@/lib/opsApi';
import { useToast } from '@/components/amud/Toast';

/*
 * Mon entreprise — porte le style de la maquette `/amud/entreprise/profil`
 * sur le nouvel endpoint `GET/PATCH /recruiter/profile` (+ `POST
 * /recruiter/profile/logo`) : avant cette page, rien ne permettait à un
 * recruteur de décrire sa propre entreprise, seul un administrateur pouvait
 * toucher `CompanyProfile`, et seulement son statut de vérification.
 */
type CompanyProfile = {
  company_name: string | null;
  sector: string | null;
  description: string | null;
  city: string | null;
  address: string | null;
  country: string | null;
  phone: string | null;
  website: string | null;
  employees_count: number | null;
  founded_year: number | null;
  company_type: string | null;
  logo_url: string | null;
  social_links: { linkedin?: string; facebook?: string; twitter?: string; instagram?: string } | null;
  verified_at: string | null;
  created_at: string;
};

const COMPANY_TYPES = ['PME', 'Grande entreprise', 'Startup', 'Cabinet de recrutement', 'Multinationale', 'Association/ONG'];
const inputCls = 'w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary';
const labelCls = 'mb-1 block text-label-md text-amud-on-surface-variant';

function errorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined;
    return (data?.errors ? Object.values(data.errors)[0]?.[0] : undefined) ?? data?.message ?? fallback;
  }
  return fallback;
}

export default function RecruiterProfilPage() {
  const notify = useToast();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profile = useQuery({
    queryKey: ['recruiter-profile'],
    queryFn: () => api.get('/recruiter/profile').then((r) => r.data as CompanyProfile),
  });

  const [form, setForm] = useState({
    company_name: '',
    sector: '',
    description: '',
    website: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    employees_count: '',
    founded_year: '',
    company_type: '',
    linkedin: '',
    facebook: '',
    twitter: '',
    instagram: '',
  });

  useEffect(() => {
    if (!profile.data) return;
    const p = profile.data;
    setForm({
      company_name: p.company_name ?? '',
      sector: p.sector ?? '',
      description: p.description ?? '',
      website: p.website ?? '',
      phone: p.phone ?? '',
      address: p.address ?? '',
      city: p.city ?? '',
      country: p.country ?? '',
      employees_count: p.employees_count != null ? String(p.employees_count) : '',
      founded_year: p.founded_year != null ? String(p.founded_year) : '',
      company_type: p.company_type ?? '',
      linkedin: p.social_links?.linkedin ?? '',
      facebook: p.social_links?.facebook ?? '',
      twitter: p.social_links?.twitter ?? '',
      instagram: p.social_links?.instagram ?? '',
    });
  }, [profile.data]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const save = useMutation({
    mutationFn: () =>
      api.patch('/recruiter/profile', {
        company_name: form.company_name.trim(),
        sector: form.sector.trim() || null,
        description: form.description.trim() || null,
        website: form.website.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        country: form.country.trim() || null,
        employees_count: form.employees_count ? Number(form.employees_count) : null,
        founded_year: form.founded_year ? Number(form.founded_year) : null,
        company_type: form.company_type || null,
        social_links: {
          linkedin: form.linkedin.trim() || null,
          facebook: form.facebook.trim() || null,
          twitter: form.twitter.trim() || null,
          instagram: form.instagram.trim() || null,
        },
      }),
    onSuccess: () => {
      notify('Profil de l’entreprise enregistré.');
      qc.invalidateQueries({ queryKey: ['recruiter-profile'] });
    },
    onError: (error) => notify(errorMessage(error, 'Enregistrement impossible.'), 'error'),
  });

  const uploadLogo = useMutation({
    mutationFn: (file: File) => {
      const body = new FormData();
      body.append('logo', file);
      return api.post('/recruiter/profile/logo', body, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      notify('Logo mis à jour.');
      qc.invalidateQueries({ queryKey: ['recruiter-profile'] });
    },
    onError: (error) => notify(errorMessage(error, 'Téléversement impossible.'), 'error'),
  });

  if (profile.isLoading) {
    return <p className="text-body-md text-amud-on-surface-variant">Chargement…</p>;
  }

  return (
    <div className="pb-6">
      <div className="mb-lg">
        <h2 className="text-headline-lg text-amud-on-surface">Mon entreprise</h2>
        <p className="mt-1 text-body-md text-amud-on-surface-variant">
          Gérez les informations publiques de votre entreprise.
          {profile.data ? ` Membre depuis le ${new Date(profile.data.created_at).toLocaleDateString('fr-FR')}.` : ''}
          {profile.data?.verified_at ? ' Entreprise vérifiée.' : ''}
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="flex flex-col gap-lg"
      >
        <div className="flex items-center gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-amud-primary-container">
            {profile.data?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.data.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-3xl text-amud-primary">apartment</span>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadLogo.isPending}
              className="rounded-lg border border-amud-outline-variant px-md py-2 text-label-md font-medium text-amud-on-surface hover:bg-amud-surface-container-low disabled:opacity-50"
            >
              {uploadLogo.isPending ? 'Envoi…' : 'Changer le logo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadLogo.mutate(file);
                e.target.value = '';
              }}
              className="hidden"
            />
            <p className="mt-1 text-label-sm text-amud-on-surface-variant">PNG, JPG ou WebP, 2 Mo max.</p>
          </div>
        </div>

        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
          <h3 className="mb-md text-title-lg text-amud-on-surface">Informations générales</h3>
          <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
            <div>
              <label className={labelCls}>Nom de l’entreprise *</label>
              <input value={form.company_name} onChange={(e) => set('company_name', e.target.value)} className={inputCls} type="text" required />
            </div>
            <div>
              <label className={labelCls}>Secteur</label>
              <input value={form.sector} onChange={(e) => set('sector', e.target.value)} className={inputCls} type="text" />
            </div>
            <div>
              <label className={labelCls}>Type d’entreprise</label>
              <select value={form.company_type} onChange={(e) => set('company_type', e.target.value)} className={inputCls}>
                <option value="">Non spécifié</option>
                {COMPANY_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Année de création</label>
              <input value={form.founded_year} onChange={(e) => set('founded_year', e.target.value.replace(/\D/g, ''))} className={inputCls} type="text" inputMode="numeric" />
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
              <input value={form.website} onChange={(e) => set('website', e.target.value)} className={inputCls} type="text" />
            </div>
            <div>
              <label className={labelCls}>Téléphone</label>
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls} type="tel" />
            </div>
            <div>
              <label className={labelCls}>Effectif</label>
              <input value={form.employees_count} onChange={(e) => set('employees_count', e.target.value.replace(/\D/g, ''))} className={inputCls} type="text" inputMode="numeric" placeholder="250" />
            </div>
            <div>
              <label className={labelCls}>Ville</label>
              <input value={form.city} onChange={(e) => set('city', e.target.value)} className={inputCls} type="text" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Adresse</label>
              <input value={form.address} onChange={(e) => set('address', e.target.value)} className={inputCls} type="text" />
            </div>
            <div>
              <label className={labelCls}>Pays</label>
              <input value={form.country} onChange={(e) => set('country', e.target.value)} className={inputCls} type="text" />
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

        {save.error ? <p className="rounded-lg bg-amud-error-container p-md text-body-md text-amud-on-error-container">{errorMessage(save.error, 'Enregistrement impossible.')}</p> : null}

        <button type="submit" disabled={save.isPending} className="self-end rounded-lg bg-amud-primary px-xl py-3 text-label-md font-medium text-white shadow-sm hover:brightness-110 disabled:opacity-50">
          {save.isPending ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </button>
      </form>
    </div>
  );
}
