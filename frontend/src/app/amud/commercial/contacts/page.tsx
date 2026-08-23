'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Drawer, Modal, Toggle } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { mesContactsCollection } from '@/lib/amud/localMesContacts';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { generateId } from '@/lib/amud/storage/ids';
import { createCallTicket } from '@/lib/amud/callTicketCascade';
import { CURRENT_COMMERCIAL } from '@/data/amud/currentCommercial';
import { mesContactsSeed, type Contact, type Priorite, type Resultat, type TypeContact } from '@/data/amud/mesContacts';

const RESULTAT_CLASS: Record<Resultat, string> = {
  Positif: 'bg-amud-primary-container text-white',
  'À relancer': 'bg-amud-tertiary-fixed text-amud-tertiary',
  'Sans suite': 'bg-amud-surface-variant text-amud-on-surface-variant',
};
const PRIORITE_CLASS: Record<Priorite, string> = {
  Haute: 'bg-amud-error-container text-amud-on-error-container',
  Normale: 'bg-amud-surface-container-high text-amud-on-surface-variant',
  Basse: 'bg-amud-surface-container text-amud-outline',
};
const PRIORITE_ICON: Record<Priorite, string> = { Haute: 'keyboard_double_arrow_up', Normale: 'remove', Basse: 'keyboard_double_arrow_down' };

const TABS: TypeContact[] = ['Candidat', 'Recruteur', 'Entreprise'];

function initiales(nom: string) {
  return nom
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');
}

export default function AmudCommercialContactsPage() {
  const notify = useToast();
  const searchParams = useSearchParams();
  const [contacts, { update: updateContact, add: addContact }] = useCollection(mesContactsCollection, mesContactsSeed);
  const [tab, setTab] = useState<TypeContact>('Candidat');
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [onlyRappel, setOnlyRappel] = useState(false);
  const [onlyHaute, setOnlyHaute] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [profil, setProfil] = useState<Contact | null>(null);

  const [nouveauNom, setNouveauNom] = useState('');
  const [nouveauPoste, setNouveauPoste] = useState('');
  const [nouveauTel, setNouveauTel] = useState('');
  const [nouveauVille, setNouveauVille] = useState('');
  const [nouveauType, setNouveauType] = useState<TypeContact>('Candidat');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter(
      (c) =>
        c.type === tab &&
        (!q || c.nom.toLowerCase().includes(q) || c.poste.toLowerCase().includes(q)) &&
        (!onlyRappel || c.aRappeler) &&
        (!onlyHaute || c.priorite === 'Haute'),
    );
  }, [contacts, tab, search, onlyRappel, onlyHaute]);

  function toggleRappel(id: string) {
    const c = contacts.find((x) => x.id === id);
    if (!c) return;
    updateContact(id, { aRappeler: !c.aRappeler });
    notify(c.aRappeler ? 'Rappel annulé.' : 'Rappel planifié.');
    setProfil((p) => (p && p.id === id ? { ...p, aRappeler: !p.aRappeler } : p));
  }

  function ajouterActivite(contact: Contact) {
    createCallTicket({
      commercialId: CURRENT_COMMERCIAL.id,
      commercialNom: CURRENT_COMMERCIAL.nom,
      contactId: contact.id,
      contactNom: contact.nom,
      contactType: 'Portefeuille',
      entrepriseId: contact.entrepriseId,
      durationSeconds: 0,
      result: 'Répondu',
      summary: `Note ajoutée depuis « Mes contacts » pour ${contact.nom}.`,
      followUpRequired: false,
    });
    updateContact(contact.id, { dernierContact: new Date().toLocaleString('fr-FR') });
    notify(`Activité ajoutée pour ${contact.nom}.`);
  }

  function appeler(contact: Contact) {
    createCallTicket({
      commercialId: CURRENT_COMMERCIAL.id,
      commercialNom: CURRENT_COMMERCIAL.nom,
      contactId: contact.id,
      contactNom: contact.nom,
      contactType: 'Portefeuille',
      entrepriseId: contact.entrepriseId,
      durationSeconds: 0,
      result: 'Répondu',
      summary: `Appel sortant vers ${contact.nom}.`,
      followUpRequired: false,
    });
    updateContact(contact.id, { dernierContact: new Date().toLocaleString('fr-FR') });
    notify(`Appel avec ${contact.nom} enregistré.`);
  }

  function openNouveau() {
    setNouveauType(tab);
    setFormOpen(true);
  }

  function ajouterContact(e: React.FormEvent) {
    e.preventDefault();
    if (!nouveauNom.trim()) return;
    const contact: Contact = {
      id: generateId('contact'),
      nom: nouveauNom.trim(),
      poste: nouveauPoste.trim() || '—',
      type: nouveauType,
      telephone: nouveauTel.trim() || '—',
      ville: nouveauVille.trim() || '—',
      dernierContact: '—',
      resultat: 'À relancer',
      resultatDate: '—',
      prochaineAction: 'Premier contact à planifier',
      prochaineDate: '—',
      priorite: 'Normale',
      aRappeler: true,
    };
    addContact(contact);
    setNouveauNom('');
    setNouveauPoste('');
    setNouveauTel('');
    setNouveauVille('');
    setFormOpen(false);
    notify('Contact ajouté.');
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="m-0 text-headline-lg text-amud-on-background">Mes contacts</h2>
          <p className="mt-1 text-amud-on-surface-variant">Gérez et suivez l&apos;évolution de votre portefeuille.</p>
        </div>
        <button
          onClick={openNouveau}
          className="flex w-fit shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-amud-primary px-6 py-2.5 text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-container"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Nouveau contact
        </button>
      </div>

      <div className="flex flex-col gap-6">
        <div className="hide-scrollbar flex overflow-x-auto border-b border-amud-outline-variant">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`whitespace-nowrap px-6 py-3 text-label-md font-medium transition-colors ${
                tab === t ? 'rounded-t-lg border-b-2 border-amud-primary bg-amud-surface-container-low font-bold text-amud-primary' : 'border-b-2 border-transparent text-amud-on-surface-variant hover:border-amud-outline hover:text-amud-on-surface'
              }`}
            >
              {t === 'Candidat' ? 'Candidats' : t === 'Recruteur' ? 'Recruteurs' : 'Entreprises'}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-start gap-4 rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full shrink-0 xl:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-amud-outline" style={{ fontSize: 20 }}>
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface py-2 pl-10 pr-4 text-body-md outline-none transition-all focus:border-amud-primary focus:ring-2 focus:ring-amud-primary focus:ring-offset-1"
              placeholder="Rechercher un contact…"
              aria-label="Rechercher un contact"
              type="text"
            />
          </div>
          <div className="flex w-full flex-wrap items-center gap-2">
            <span className="mr-2 hidden text-amud-outline xl:block">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                filter_list
              </span>
            </span>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-1.5 transition-colors hover:bg-amud-surface-container-low">
              <input type="checkbox" checked={onlyRappel} onChange={(e) => setOnlyRappel(e.target.checked)} className="h-4 w-4 rounded border-amud-outline text-amud-primary focus:ring-amud-primary" />
              <span className="text-label-sm text-amud-on-surface">À rappeler</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-1.5 transition-colors hover:bg-amud-surface-container-low">
              <input type="checkbox" checked={onlyHaute} onChange={(e) => setOnlyHaute(e.target.checked)} className="h-4 w-4 rounded border-amud-outline text-amud-primary focus:ring-amud-primary" />
              <span className="text-label-sm text-amud-on-surface">Priorité haute</span>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:hidden">
          {filtered.map((c) => (
            <div key={c.id} className="animate-amud-rise-in rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <button onClick={() => setProfil(c)} className="flex items-center gap-3 text-left">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amud-primary-container font-bold text-white">{initiales(c.nom)}</div>
                  <div>
                    <p className="text-[16px] leading-tight text-amud-on-surface">{c.nom}</p>
                    <p className="mt-0.5 text-label-sm text-amud-on-surface-variant">{c.poste}</p>
                  </div>
                </button>
                <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${PRIORITE_CLASS[c.priorite]}`} title={c.priorite}>
                  <span className="material-symbols-outlined text-[16px]">{PRIORITE_ICON[c.priorite]}</span>
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${RESULTAT_CLASS[c.resultat]}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {c.resultat}
                </span>
                <span className="text-xs text-amud-on-surface-variant">{c.resultatDate}</span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-md">
                <a href={`tel:${c.telephone}`} className="flex items-center gap-1.5 text-amud-primary">
                  <span className="material-symbols-outlined text-[16px]">call</span> {c.telephone}
                </a>
                <span className="flex items-center gap-1.5 text-amud-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">location_on</span> {c.ville}
                </span>
              </div>

              <div className="mt-3 border-t border-amud-outline-variant/60 pt-3">
                <p className="text-amud-on-surface">{c.prochaineAction}</p>
                {c.prochaineDate ? (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-amud-on-surface-variant">
                    <span className="material-symbols-outlined text-[14px]">event</span>
                    {c.prochaineDate}
                  </p>
                ) : null}
              </div>

              <div className="mt-3 flex items-center gap-2 border-t border-amud-outline-variant/60 pt-3">
                <button
                  onClick={() => appeler(c)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-amud-outline-variant py-2 text-label-sm text-amud-primary transition-colors hover:bg-amud-surface-container"
                >
                  <span className="material-symbols-outlined text-[18px]">call</span> Appeler
                </button>
                <button
                  onClick={() => ajouterActivite(c)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-amud-outline-variant py-2 text-label-sm text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container"
                >
                  <span className="material-symbols-outlined text-[18px]">add_task</span> Activité
                </button>
                <button
                  onClick={() => toggleRappel(c.id)}
                  title="Planifier un rappel"
                  className={`flex items-center justify-center rounded-lg border border-amud-outline-variant p-2 transition-colors hover:bg-amud-surface-container ${
                    c.aRappeler ? 'text-amud-primary' : 'text-amud-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">edit_calendar</span>
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest px-6 py-10 text-center text-body-md text-amud-on-surface-variant">
              Aucun contact ne correspond à ces filtres.
            </div>
          ) : null}
          <p className="px-1 py-2 text-center text-sm font-medium text-amud-on-surface-variant">
            Affichage de {filtered.length} sur {contacts.filter((c) => c.type === tab).length} contacts
          </p>
        </div>

        <div className="hidden overflow-hidden rounded-lg border border-l-4 border-amud-outline-variant border-l-amud-primary bg-amud-surface-container-lowest shadow-sm lg:block">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap border-collapse text-left">
              <thead className="border-b border-amud-outline-variant bg-amud-surface-container-low">
                <tr>
                  {['Contact', 'Téléphone', 'Ville', 'Dernier résultat', 'Prochaine action', 'Priorité', 'Actions'].map((h) => (
                    <th key={h} className={`px-4 py-4 text-label-sm font-bold uppercase tracking-wider text-amud-on-surface-variant ${h === 'Actions' ? 'px-6 text-right' : h === 'Contact' ? 'px-6' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-amud-outline-variant bg-amud-surface-container-lowest">
                {filtered.map((c) => (
                  <tr key={c.id} className="group animate-amud-rise-in transition-colors hover:bg-amud-surface-container-low">
                    <td className="px-6 py-4">
                      <button onClick={() => setProfil(c)} className="flex items-center gap-3 text-left">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amud-primary-container font-bold text-white">{initiales(c.nom)}</div>
                        <div>
                          <p className="text-[16px] leading-tight text-amud-on-surface">{c.nom}</p>
                          <p className="mt-0.5 text-label-sm text-amud-on-surface-variant">{c.poste}</p>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-4 text-amud-on-surface">{c.telephone}</td>
                    <td className="px-4 py-4 text-amud-on-surface">{c.ville}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${RESULTAT_CLASS[c.resultat]}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {c.resultat}
                      </span>
                      <p className="mt-1 text-xs text-amud-on-surface-variant">{c.resultatDate}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-amud-on-surface">{c.prochaineAction}</p>
                      {c.prochaineDate ? (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-amud-on-surface-variant">
                          <span className="material-symbols-outlined text-[14px]">event</span>
                          {c.prochaineDate}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${PRIORITE_CLASS[c.priorite]}`} title={c.priorite}>
                        <span className="material-symbols-outlined text-[16px]">{PRIORITE_ICON[c.priorite]}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                        <button onClick={() => appeler(c)} title="Appeler" className="rounded p-1.5 text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container hover:text-amud-primary">
                          <span className="material-symbols-outlined text-[20px]">call</span>
                        </button>
                        <button onClick={() => setProfil(c)} title="Profil" className="rounded p-1.5 text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container hover:text-amud-primary">
                          <span className="material-symbols-outlined text-[20px]">person</span>
                        </button>
                        <button onClick={() => ajouterActivite(c)} title="Ajouter une activité" className="rounded p-1.5 text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container hover:text-amud-primary">
                          <span className="material-symbols-outlined text-[20px]">add_task</span>
                        </button>
                        <button
                          onClick={() => toggleRappel(c.id)}
                          title="Planifier un rappel"
                          className={`rounded p-1.5 transition-colors hover:bg-amud-surface-container hover:text-amud-primary ${c.aRappeler ? 'text-amud-primary' : 'text-amud-on-surface-variant'}`}
                        >
                          <span className="material-symbols-outlined text-[20px]">edit_calendar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-body-md text-amud-on-surface-variant">
                      Aucun contact ne correspond à ces filtres.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-amud-outline-variant px-6 py-4">
            <span className="text-sm font-medium text-amud-on-surface-variant">
              Affichage de {filtered.length} sur {contacts.filter((c) => c.type === tab).length} contacts
            </span>
          </div>
        </div>
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Nouveau contact"
        footer={
          <div className="flex justify-end gap-sm">
            <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
              Annuler
            </button>
            <button type="submit" form="add-contact-form" className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark">
              Ajouter
            </button>
          </div>
        }
      >
        <form id="add-contact-form" onSubmit={ajouterContact} className="grid grid-cols-1 gap-md sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Nom</label>
            <input
              autoFocus
              value={nouveauNom}
              onChange={(e) => setNouveauNom(e.target.value)}
              required
              className="w-full rounded-lg border border-amud-outline-variant px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              type="text"
            />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Poste</label>
            <input value={nouveauPoste} onChange={(e) => setNouveauPoste(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Type</label>
            <select value={nouveauType} onChange={(e) => setNouveauType(e.target.value as TypeContact)} className="w-full rounded-lg border border-amud-outline-variant px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
              {TABS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Téléphone</label>
            <input value={nouveauTel} onChange={(e) => setNouveauTel(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Ville</label>
            <input value={nouveauVille} onChange={(e) => setNouveauVille(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" />
          </div>
        </form>
      </Modal>

      <Drawer open={!!profil} onClose={() => setProfil(null)} title={profil?.nom ?? ''} subtitle={profil?.poste}>
        {profil ? (
          <div className="flex flex-col gap-lg">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amud-primary-container text-title-lg font-bold text-white">{initiales(profil.nom)}</div>
              <div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${RESULTAT_CLASS[profil.resultat]}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {profil.resultat}
                </span>
                <p className="mt-1 text-label-sm text-amud-on-surface-variant">{profil.resultatDate}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div className="rounded-lg border border-amud-outline-variant bg-amud-surface-container-low p-md">
                <p className="text-label-sm text-amud-on-surface-variant">Téléphone</p>
                <a href={`tel:${profil.telephone}`} className="font-medium text-amud-primary">
                  {profil.telephone}
                </a>
              </div>
              <div className="rounded-lg border border-amud-outline-variant bg-amud-surface-container-low p-md">
                <p className="text-label-sm text-amud-on-surface-variant">Ville</p>
                <p className="font-medium text-amud-on-background">{profil.ville}</p>
              </div>
              <div className="rounded-lg border border-amud-outline-variant bg-amud-surface-container-low p-md">
                <p className="text-label-sm text-amud-on-surface-variant">Dernier contact</p>
                <p className="font-medium text-amud-on-background">{profil.dernierContact}</p>
              </div>
              <div className="rounded-lg border border-amud-outline-variant bg-amud-surface-container-low p-md">
                <p className="text-label-sm text-amud-on-surface-variant">Priorité</p>
                <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITE_CLASS[profil.priorite]}`}>{profil.priorite}</span>
              </div>
            </div>
            <div className="rounded-lg border border-amud-outline-variant bg-amud-surface-container-low p-md">
              <p className="text-label-sm text-amud-on-surface-variant">Prochaine action</p>
              <p className="mt-1 font-medium text-amud-on-background">{profil.prochaineAction}</p>
              {profil.prochaineDate ? <p className="mt-0.5 text-label-sm text-amud-on-surface-variant">{profil.prochaineDate}</p> : null}
            </div>
            <div className="flex items-center justify-between rounded-lg border border-amud-outline-variant p-md">
              <span className="text-label-md text-amud-on-surface">Rappel planifié</span>
              <Toggle checked={profil.aRappeler} onChange={() => toggleRappel(profil.id)} />
            </div>
            <div className="flex gap-sm">
              <button
                onClick={() => appeler(profil)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amud-primary py-2 text-label-md text-white shadow-sm transition-colors hover:bg-amud-primary-dark"
              >
                <span className="material-symbols-outlined text-[18px]">call</span> Appeler
              </button>
              <button
                onClick={() => ajouterActivite(profil)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-amud-outline-variant py-2 text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container"
              >
                <span className="material-symbols-outlined text-[18px]">add_task</span> Activité
              </button>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
