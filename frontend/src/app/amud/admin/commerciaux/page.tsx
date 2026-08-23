'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Modal } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { STATUT_LABEL, commerciaux as seedCommerciaux, type Commercial } from '@/data/amud/commerciaux';
import { commerciauxCollection } from '@/lib/amud/localCommerciaux';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { logAudit } from '@/lib/amud/storage/audit';

const STATUT_CLASS: Record<string, string> = {
  en_ligne: 'bg-amud-primary-fixed text-amud-on-primary-fixed',
  en_appel: 'bg-amud-tertiary-fixed text-amud-on-tertiary-fixed',
  hors_ligne: 'bg-amud-surface-container-highest text-amud-on-surface-variant',
};

const RESPONSABLES = ['Marie Dubois - Directrice Commerciale', 'Paul Martin - Chef de Secteur'];
const NIVEAUX = ['Junior (0-2 ans)', 'Intermédiaire (3-5 ans)', 'Senior (5+ ans)'];

function todayFr() {
  return new Date().toLocaleDateString('fr-FR');
}

export default function AmudAdminCommerciauxPage() {
  const notify = useToast();
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [vue, setVue] = useState<'table' | 'grid'>('table');
  const [commerciaux, { add: addCommercial }] = useCollection(commerciauxCollection, seedCommerciaux);

  const [addOpen, setAddOpen] = useState(false);
  const [addPrenom, setAddPrenom] = useState('');
  const [addNom, setAddNom] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addTelephone, setAddTelephone] = useState('');
  const [addVille, setAddVille] = useState('');
  const [addDateEntree, setAddDateEntree] = useState('');
  const [addResponsable, setAddResponsable] = useState('');
  const [addNiveau, setAddNiveau] = useState(NIVEAUX[0]);
  const [addZone, setAddZone] = useState('');
  const [addSecteur, setAddSecteur] = useState('');

  function resetAddForm() {
    setAddPrenom('');
    setAddNom('');
    setAddEmail('');
    setAddTelephone('');
    setAddVille('');
    setAddDateEntree('');
    setAddResponsable('');
    setAddNiveau(NIVEAUX[0]);
    setAddZone('');
    setAddSecteur('');
  }

  function buildCommercial(): Commercial {
    const id = `${addPrenom}-${addNom}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return {
      id: id || `commercial-${Date.now()}`,
      prenom: addPrenom,
      nom: addNom,
      fonction: 'Agent Commercial',
      ville: addVille || ' —',
      email: addEmail,
      telephone: addTelephone,
      dateEntree: addDateEntree || todayFr(),
      statut: 'hors_ligne',
      avatarInitials: `${addPrenom[0] ?? ''}${addNom[0] ?? ''}`.toUpperCase(),
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

  function handleAddCommercial(e: React.FormEvent) {
    e.preventDefault();
    if (!addPrenom.trim() || !addNom.trim() || !addEmail.trim() || !addEmail.includes('@')) return;
    const c = buildCommercial();
    addCommercial(c);
    logAudit({ utilisateur: 'Administrateur', role: 'Admin', action: 'Création de commercial', actionType: 'create', module: 'Commerciaux', reference: `${c.prenom} ${c.nom} (#${c.id})` });
    notify(`« ${c.prenom} ${c.nom} » créé, invitation envoyée.`);
    setAddOpen(false);
    resetAddForm();
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return commerciaux.filter((c) => {
      const nom = `${c.prenom} ${c.nom}`.toLowerCase();
      return (!q || nom.includes(q)) && (!statut || c.statut === statut);
    });
  }, [commerciaux, search, statut]);

  const totalAppels = commerciaux.reduce((s, c) => s + c.appelsJour, 0);
  const actifs = commerciaux.filter((c) => c.statut !== 'hors_ligne').length;
  const objectifsAtteints = Math.round(
    (commerciaux.filter((c) => c.realiseMensuel / c.objectifMensuel >= 1).length / commerciaux.length) * 100,
  );
  const rdvTotal = commerciaux.reduce((s, c) => s + c.rdvSemaine, 0);

  return (
    <div>
      <div className="mb-xl flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="mb-2 border-l-4 border-amud-primary pl-4 text-headline-lg text-amud-on-surface">Commerciaux</h2>
          <p className="max-w-2xl pl-4 text-amud-on-surface-variant">Gérez votre équipe commerciale, leurs activités et leurs objectifs.</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-amud-primary px-6 py-3 text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark"
        >
          <span className="material-symbols-outlined">add</span>
          Ajouter un commercial
        </button>
      </div>

      <div className="mb-xl grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="flex flex-col justify-between rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="mb-4 flex items-start justify-between">
            <span className="rounded-lg bg-amud-surface-container-high p-2 text-amud-primary-container">
              <span className="material-symbols-outlined">group</span>
            </span>
          </div>
          <p className="mb-1 text-label-sm text-amud-on-surface-variant">Total commerciaux</p>
          <p className="text-headline-md text-amud-on-surface">{commerciaux.length}</p>
        </div>
        <div className="flex flex-col justify-between rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="mb-4 flex items-start justify-between">
            <span className="rounded-lg bg-amud-primary-fixed/30 p-2 text-amud-primary">
              <span className="material-symbols-outlined">person_check</span>
            </span>
            <span className="rounded bg-amud-primary-fixed-dim/30 px-2 py-1 text-xs text-amud-primary">Actifs: {actifs}</span>
          </div>
          <p className="mb-1 text-label-sm text-amud-on-surface-variant">Appels aujourd&apos;hui</p>
          <p className="text-headline-md text-amud-on-surface">{totalAppels}</p>
        </div>
        <div className="flex flex-col justify-between rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="mb-4 flex items-start justify-between">
            <span className="rounded-lg bg-amud-tertiary-fixed/40 p-2 text-amud-tertiary-container">
              <span className="material-symbols-outlined">target</span>
            </span>
          </div>
          <p className="mb-1 text-label-sm text-amud-on-surface-variant">Objectifs atteints</p>
          <p className="text-headline-md text-amud-on-surface">{objectifsAtteints}%</p>
        </div>
        <div className="flex flex-col justify-between rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="mb-4 flex items-start justify-between">
            <span className="rounded-lg bg-amud-surface-container-high p-2 text-amud-on-surface-variant">
              <span className="material-symbols-outlined">calendar_today</span>
            </span>
          </div>
          <p className="mb-1 text-label-sm text-amud-on-surface-variant">Rendez-vous (semaine)</p>
          <p className="text-headline-md text-amud-on-surface">{rdvTotal}</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div className="relative w-full lg:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-amud-outline">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface py-2 pl-10 pr-4 text-amud-on-surface outline-none focus:border-transparent focus:ring-2 focus:ring-amud-primary"
              placeholder="Rechercher un commercial…"
              type="text"
            />
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              className="rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest px-3 py-1.5 text-label-md text-amud-on-surface-variant focus:ring-amud-primary"
            >
              <option value="">Statut</option>
              <option value="en_ligne">En ligne</option>
              <option value="en_appel">En appel</option>
              <option value="hors_ligne">Hors ligne</option>
            </select>
            <div className="mx-2 hidden h-6 w-px bg-amud-outline-variant sm:block" />
            <div className="flex overflow-hidden rounded-lg border border-amud-outline-variant">
              <button
                onClick={() => setVue('table')}
                title="Vue tableau"
                className={`flex items-center justify-center px-3 py-1.5 ${vue === 'table' ? 'bg-amud-surface-container-high text-amud-primary' : 'bg-amud-surface-container-lowest text-amud-on-surface-variant hover:bg-amud-surface-container'}`}
              >
                <span className="material-symbols-outlined text-[18px]">table_rows</span>
              </button>
              <button
                onClick={() => setVue('grid')}
                title="Vue cartes"
                className={`flex items-center justify-center border-l border-amud-outline-variant px-3 py-1.5 ${vue === 'grid' ? 'bg-amud-surface-container-high text-amud-primary' : 'bg-amud-surface-container-lowest text-amud-on-surface-variant hover:bg-amud-surface-container'}`}
              >
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {vue === 'table' ? (
        <div className="overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-amud-outline-variant bg-amud-surface-container">
                  <th className="p-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Commercial</th>
                  <th className="hidden p-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant sm:table-cell">Ville</th>
                  <th className="hidden p-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant md:table-cell">Statut</th>
                  <th className="p-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Objectif Appels</th>
                  <th className="hidden p-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant lg:table-cell">Progression</th>
                  <th className="hidden p-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant xl:table-cell">Taux Rép.</th>
                  <th className="p-4 text-right text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amud-outline-variant/50">
                {filtered.map((c) => {
                  const pct = Math.round((c.appelsJour / c.objectifAppelsJour) * 100);
                  return (
                    <tr key={c.id} className="group transition-colors hover:bg-amud-surface-container-low">
                      <td className="p-4">
                        <Link href={`/amud/admin/commerciaux/${c.id}`} className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amud-primary-container text-sm font-bold text-white">
                            {c.avatarInitials}
                          </div>
                          <div>
                            <p className="font-semibold text-amud-on-surface transition-colors group-hover:text-amud-primary">
                              {c.prenom} {c.nom}
                            </p>
                            <p className="text-label-sm text-amud-on-surface-variant">{c.fonction}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="hidden p-4 text-amud-on-surface-variant sm:table-cell">{c.ville}</td>
                      <td className="hidden p-4 md:table-cell">
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-wider ${STATUT_CLASS[c.statut]}`}>
                          {STATUT_LABEL[c.statut]}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-end gap-1">
                          <span className="font-semibold text-amud-on-surface">{c.appelsJour}</span>
                          <span className="mb-0.5 text-label-sm text-amud-on-surface-variant">/ {c.objectifAppelsJour}</span>
                        </div>
                      </td>
                      <td className="hidden w-48 p-4 lg:table-cell">
                        <div className="mb-1 h-2 w-full rounded-full bg-amud-surface-container-highest">
                          <div className={`h-2 rounded-full ${pct >= 60 ? 'bg-amud-primary' : 'bg-amud-secondary'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                        <span className={`text-xs ${pct >= 60 ? 'text-amud-on-surface-variant' : 'text-amud-secondary'}`}>
                          {pct}% {pct < 60 ? '- Retard' : 'atteint'}
                        </span>
                      </td>
                      <td className="hidden p-4 text-amud-on-surface-variant xl:table-cell">{c.tauxReponse}%</td>
                      <td className="p-4 text-right">
                        <Link href={`/amud/admin/commerciaux/${c.id}`} className="rounded p-1 text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container hover:text-amud-primary">
                          <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-amud-outline-variant bg-amud-surface-container-lowest px-4 py-3">
            <span className="text-label-sm text-amud-on-surface-variant">
              Affichage {filtered.length}/{commerciaux.length}
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const pct = Math.round((c.appelsJour / c.objectifAppelsJour) * 100);
            return (
              <Link
                key={c.id}
                href={`/amud/admin/commerciaux/${c.id}`}
                className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-colors hover:border-amud-primary"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amud-primary-container font-bold text-white">{c.avatarInitials}</div>
                  <div>
                    <p className="font-semibold text-amud-on-surface">
                      {c.prenom} {c.nom}
                    </p>
                    <p className="text-label-sm text-amud-on-surface-variant">
                      {c.fonction} • {c.ville}
                    </p>
                  </div>
                </div>
                <span className={`mb-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-wider ${STATUT_CLASS[c.statut]}`}>
                  {STATUT_LABEL[c.statut]}
                </span>
                <div className="h-2 w-full rounded-full bg-amud-surface-container-highest">
                  <div className={`h-2 rounded-full ${pct >= 60 ? 'bg-amud-primary' : 'bg-amud-secondary'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                <p className="mt-1 text-xs text-amud-on-surface-variant">
                  {c.appelsJour}/{c.objectifAppelsJour} appels · {pct}%
                </p>
              </Link>
            );
          })}
        </div>
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Ajouter un commercial"
        subtitle="Renseignez les informations pour créer un nouveau profil agent commercial."
        footer={
          <div className="flex justify-end gap-sm">
            <button type="button" onClick={() => setAddOpen(false)} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
              Annuler
            </button>
            <button type="submit" form="add-commercial-form" className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark">
              Créer et envoyer les accès
            </button>
          </div>
        }
      >
        <form id="add-commercial-form" onSubmit={handleAddCommercial} className="grid grid-cols-1 gap-md sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Prénom</label>
            <input
              autoFocus
              value={addPrenom}
              onChange={(e) => setAddPrenom(e.target.value)}
              required
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              placeholder="Jean"
              type="text"
            />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Nom</label>
            <input
              value={addNom}
              onChange={(e) => setAddNom(e.target.value)}
              required
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              placeholder="Dupont"
              type="text"
            />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Email pro</label>
            <input
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              placeholder="jean.dupont@amudskills.com"
              type="email"
            />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Téléphone</label>
            <input
              value={addTelephone}
              onChange={(e) => setAddTelephone(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              placeholder="+33 6 00 00 00 00"
              type="tel"
            />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Ville</label>
            <input
              value={addVille}
              onChange={(e) => setAddVille(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              placeholder="Paris"
              type="text"
            />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Date d&apos;entrée</label>
            <input
              value={addDateEntree}
              onChange={(e) => setAddDateEntree(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              type="date"
            />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Responsable</label>
            <select
              value={addResponsable}
              onChange={(e) => setAddResponsable(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
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
              value={addNiveau}
              onChange={(e) => setAddNiveau(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
            >
              {NIVEAUX.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Zone géographique</label>
            <input
              value={addZone}
              onChange={(e) => setAddZone(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              placeholder="Ex: Île-de-France"
              type="text"
            />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Secteur d&apos;activité cible</label>
            <input
              value={addSecteur}
              onChange={(e) => setAddSecteur(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              placeholder="Ex: BTP, IT, Santé"
              type="text"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
