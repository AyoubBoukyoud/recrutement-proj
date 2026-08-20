'use client';

import { useState } from 'react';
import { Toggle } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';

/** `/amud/admin/parametres` — doc1: configuration_syst_me_param_tres_g_n_raux.html. */
export default function AmudAdminParametresPage() {
  const notify = useToast();
  const [nomPlateforme, setNomPlateforme] = useState('Amud Skills');
  const [email, setEmail] = useState('admin@amudskills.com');
  const [telephone, setTelephone] = useState('');
  const [pays, setPays] = useState('Maroc');
  const [adresse, setAdresse] = useState('');
  const [langue, setLangue] = useState('Français');
  const [fuseau, setFuseau] = useState('GMT+1 (Casablanca)');

  const [validationOffres, setValidationOffres] = useState(true);
  const [expirationJours, setExpirationJours] = useState(30);
  const [sensibiliteMatching, setSensibiliteMatching] = useState(75);

  const [objectifsAppels, setObjectifsAppels] = useState(40);
  const [dureeRelance, setDureeRelance] = useState('3 jours');
  const [typesActivites, setTypesActivites] = useState(['Appel', 'Email', 'Réunion']);
  const [nouvelleActivite, setNouvelleActivite] = useState('');
  const [ajoutActiviteOuvert, setAjoutActiviteOuvert] = useState(false);

  const [iaGlobal, setIaGlobal] = useState(true);
  const [iaFeatures, setIaFeatures] = useState({
    resumes: true,
    recommandations: true,
    annonces: false,
    moderation: true,
  });

  function addActivite() {
    const v = nouvelleActivite.trim();
    if (v && !typesActivites.includes(v)) setTypesActivites((prev) => [...prev, v]);
    setNouvelleActivite('');
    setAjoutActiviteOuvert(false);
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-xl pb-24">
      <div>
        <h2 className="text-headline-lg text-amud-on-surface">Paramètres généraux</h2>
        <p className="mt-1 text-body-md text-amud-on-surface-variant">Gérez les informations fondamentales de votre instance Amud Skills.</p>
      </div>

      {/* SECTION 1 */}
      <section className="relative overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
        <div className="absolute bottom-0 left-0 top-0 w-1 bg-amud-primary-container" />
        <div className="border-b border-amud-outline-variant p-lg">
          <h3 className="flex items-center gap-sm text-headline-md text-amud-on-surface">
            <span className="material-symbols-outlined text-amud-primary">storefront</span>
            Informations Générales
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-lg p-lg lg:grid-cols-2">
          <div className="space-y-md">
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface">Nom de la plateforme</label>
              <input
                value={nomPlateforme}
                onChange={(e) => setNomPlateforme(e.target.value)}
                className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:border-transparent focus:ring-2 focus:ring-amud-primary"
                type="text"
              />
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="mb-2 block text-label-md text-amud-on-surface">Logo Principal</label>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded border border-amud-outline-variant bg-amud-surface-container-low p-2">
                    <img src="/assets/images/logo-mark.png" alt="Logo Amud Skills" className="h-full w-full object-contain" />
                  </div>
                  <button className="rounded-lg border border-amud-outline-variant px-4 py-2 text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
                    Modifier
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-label-md text-amud-on-surface">Favicon</label>
                <label className="flex h-16 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-amud-outline-variant text-amud-on-surface-variant transition-colors hover:border-amud-primary hover:bg-amud-surface-container-low">
                  <span className="material-symbols-outlined text-lg">upload</span>
                  <input type="file" className="hidden" accept="image/*" />
                </label>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface">Email principal</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:border-transparent focus:ring-2 focus:ring-amud-primary"
                type="email"
              />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface">Téléphone</label>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-lg border border-r-0 border-amud-outline-variant bg-amud-surface-container-low px-3 text-body-md text-amud-on-surface-variant">
                  +212
                </span>
                <input
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="flex-1 rounded-r-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:border-transparent focus:ring-2 focus:ring-amud-primary"
                  type="tel"
                />
              </div>
            </div>
          </div>
          <div className="space-y-md">
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface">Pays</label>
              <select
                value={pays}
                onChange={(e) => setPays(e.target.value)}
                className="w-full appearance-none rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:border-transparent focus:ring-2 focus:ring-amud-primary"
              >
                <option>Maroc</option>
                <option>Allemagne</option>
                <option>France</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface">Adresse physique</label>
              <textarea
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:border-transparent focus:ring-2 focus:ring-amud-primary"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="mb-1 block text-label-md text-amud-on-surface">Langue par défaut</label>
                <select
                  value={langue}
                  onChange={(e) => setLangue(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:border-transparent focus:ring-2 focus:ring-amud-primary"
                >
                  <option>Français</option>
                  <option>Deutsch</option>
                  <option>العربية</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-label-md text-amud-on-surface">Fuseau horaire</label>
                <select
                  value={fuseau}
                  onChange={(e) => setFuseau(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:border-transparent focus:ring-2 focus:ring-amud-primary"
                >
                  <option>GMT+1 (Casablanca)</option>
                  <option>CET (Berlin)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-xl xl:grid-cols-2">
        {/* SECTION 2 */}
        <section className="overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
          <div className="border-b border-amud-outline-variant bg-amud-surface-container-low p-lg">
            <h3 className="flex items-center gap-sm text-title-lg text-amud-on-surface">
              <span className="material-symbols-outlined text-amud-primary">person_search</span>
              Paramètres de Recrutement
            </h3>
          </div>
          <div className="space-y-md p-lg">
            <div className="flex items-center justify-between rounded-lg border border-amud-outline-variant p-4">
              <div>
                <p className="text-label-md text-amud-on-surface">Validation des offres requise</p>
                <p className="text-sm text-amud-on-surface-variant">Nécessite l&apos;approbation d&apos;un admin avant publication.</p>
              </div>
              <Toggle checked={validationOffres} onChange={setValidationOffres} label="Validation des offres requise" />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface">Expiration par défaut des offres (jours)</label>
              <input
                value={expirationJours}
                onChange={(e) => setExpirationJours(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:border-transparent focus:ring-2 focus:ring-amud-primary"
                type="number"
              />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface">
                Sensibilité du matching intelligent — <span className="font-semibold text-amud-primary">{sensibiliteMatching}</span>
              </label>
              <input
                value={sensibiliteMatching}
                onChange={(e) => setSensibiliteMatching(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-amud-surface-container-highest accent-amud-primary"
                max={100}
                min={0}
                type="range"
              />
              <div className="mt-1 flex justify-between text-xs text-amud-on-surface-variant">
                <span>Large</span>
                <span>Strict</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 */}
        <section className="overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
          <div className="border-b border-amud-outline-variant bg-amud-surface-container-low p-lg">
            <h3 className="flex items-center gap-sm text-title-lg text-amud-on-surface">
              <span className="material-symbols-outlined text-amud-primary">monetization_on</span>
              Paramètres Commerciaux
            </h3>
          </div>
          <div className="space-y-md p-lg">
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="mb-1 block text-label-md text-amud-on-surface">Objectifs d&apos;appels quotidiens</label>
                <input
                  value={objectifsAppels}
                  onChange={(e) => setObjectifsAppels(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:border-transparent focus:ring-2 focus:ring-amud-primary"
                  type="number"
                />
              </div>
              <div>
                <label className="mb-1 block text-label-md text-amud-on-surface">Durée de relance (défaut)</label>
                <select
                  value={dureeRelance}
                  onChange={(e) => setDureeRelance(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:border-transparent focus:ring-2 focus:ring-amud-primary"
                >
                  <option>3 jours</option>
                  <option>1 semaine</option>
                  <option>2 semaines</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-label-md text-amud-on-surface">Types d&apos;activités</label>
              <div className="flex flex-wrap items-center gap-2">
                {typesActivites.map((type) => (
                  <span
                    key={type}
                    className="flex items-center gap-1 rounded-full border border-amud-outline-variant bg-amud-surface-container px-3 py-1 text-label-sm text-amud-on-surface"
                  >
                    {type}
                    <button
                      onClick={() => setTypesActivites((prev) => prev.filter((t) => t !== type))}
                      aria-label={`Retirer ${type}`}
                      className="text-amud-on-surface-variant transition-colors hover:text-amud-error"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                ))}
                {ajoutActiviteOuvert ? (
                  <input
                    autoFocus
                    value={nouvelleActivite}
                    onChange={(e) => setNouvelleActivite(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addActivite()}
                    onBlur={addActivite}
                    placeholder="Nom…"
                    className="w-28 rounded-full border border-amud-primary bg-amud-surface px-3 py-1 text-label-sm outline-none"
                  />
                ) : (
                  <button
                    onClick={() => setAjoutActiviteOuvert(true)}
                    className="flex items-center gap-1 rounded-full border border-dashed border-amud-outline-variant px-3 py-1 text-label-sm text-amud-on-surface-variant transition-colors hover:border-amud-primary hover:text-amud-primary"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span> Ajouter
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* SECTION 4 */}
      <section className="overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
        <div className="flex items-center justify-between border-b border-amud-outline-variant bg-amud-surface-bright p-lg">
          <div>
            <h3 className="flex items-center gap-sm text-title-lg text-amud-on-surface">
              <span className="material-symbols-outlined text-amud-tertiary-fixed-dim">psychology</span>
              Configuration IA
            </h3>
            <p className="mt-1 text-sm text-amud-on-surface-variant">Gérez les fonctionnalités d&apos;intelligence artificielle sur l&apos;ensemble de la plateforme.</p>
          </div>
          <Toggle checked={iaGlobal} onChange={setIaGlobal} size="lg" label="Activer l'IA" />
        </div>
        <div className="grid grid-cols-1 gap-lg p-lg md:grid-cols-2 lg:grid-cols-4">
          {[
            { key: 'resumes' as const, icon: 'description', title: 'Résumés IA', desc: 'Génère automatiquement des résumés de profils candidats.' },
            { key: 'recommandations' as const, icon: 'thumb_up', title: 'Recommandations IA', desc: 'Suggère des candidats pour les offres ouvertes.' },
            { key: 'annonces' as const, icon: 'edit_document', title: 'Annonces générées', desc: 'Aide à la rédaction des descriptions de postes.' },
            { key: 'moderation' as const, icon: 'gavel', title: 'Modération automatique', desc: 'Filtre le langage inapproprié dans les messages.' },
          ].map((f) => (
            <div
              key={f.key}
              className={`flex flex-col justify-between rounded-lg border border-amud-outline-variant p-4 transition-colors hover:border-amud-primary-container ${!iaGlobal ? 'opacity-50' : ''}`}
            >
              <div>
                <div className="mb-2 flex items-start justify-between">
                  <span className="material-symbols-outlined text-amud-primary">{f.icon}</span>
                  <Toggle
                    checked={iaFeatures[f.key]}
                    onChange={(v) => setIaFeatures((prev) => ({ ...prev, [f.key]: v }))}
                    size="sm"
                    disabled={!iaGlobal}
                    label={f.title}
                  />
                </div>
                <h4 className="mb-1 text-label-md text-amud-on-surface">{f.title}</h4>
                <p className="text-xs leading-tight text-amud-on-surface-variant">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-wrap justify-end gap-md bg-gradient-to-t from-amud-surface to-transparent p-6 pb-[max(24px,env(safe-area-inset-bottom))] md:left-64">
        <button
          onClick={() => notify('Modifications enregistrées.')}
          className="pointer-events-auto flex items-center gap-sm rounded-lg bg-amud-primary px-6 py-3 font-bold text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-amud-primary-dark hover:shadow-xl"
        >
          <span className="material-symbols-outlined">save</span>
          <span className="text-label-md font-bold">Enregistrer les modifications</span>
        </button>
      </div>
    </div>
  );
}
