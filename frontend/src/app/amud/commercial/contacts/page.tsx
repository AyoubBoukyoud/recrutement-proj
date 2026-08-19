'use client';

import { useMemo, useRef, useState } from 'react';

type TypeContact = 'Candidat' | 'Recruteur' | 'Entreprise';
type Priorite = 'Haute' | 'Normale' | 'Basse';
type Resultat = 'Positif' | 'À relancer' | 'Sans suite';

type Contact = {
  id: string;
  nom: string;
  poste: string;
  type: TypeContact;
  telephone: string;
  ville: string;
  dernierContact: string;
  resultat: Resultat;
  resultatDate: string;
  prochaineAction: string;
  prochaineDate: string;
  priorite: Priorite;
  aRappeler: boolean;
};

const SEED: Contact[] = [
  { id: 'c1', nom: 'Thomas Dubois', poste: 'Développeur Full-Stack', type: 'Candidat', telephone: '06 12 34 56 78', ville: 'Paris', dernierContact: '12 Oct 2023, 14:30', resultat: 'Positif', resultatDate: 'Le 12 Oct (Appel)', prochaineAction: 'Envoyer CV au client', prochaineDate: "Aujourd'hui", priorite: 'Haute', aRappeler: false },
  { id: 'c2', nom: 'Sophie Laurent', poste: 'Chef de Projet IT', type: 'Candidat', telephone: '06 98 76 54 32', ville: 'Lyon', dernierContact: '05 Oct 2023, 09:15', resultat: 'À relancer', resultatDate: 'Le 05 Oct (Email)', prochaineAction: 'Point téléphonique', prochaineDate: '15 Oct 2023', priorite: 'Normale', aRappeler: true },
  { id: 'c3', nom: 'Léa Martin', poste: 'Data Analyst', type: 'Candidat', telephone: '06 45 67 89 01', ville: 'Nantes', dernierContact: '01 Oct 2023, 11:00', resultat: 'Sans suite', resultatDate: 'Le 01 Oct (Entretien)', prochaineAction: 'Aucune action prévue', prochaineDate: '', priorite: 'Basse', aRappeler: false },
  { id: 'c4', nom: 'Youssef Amrani', poste: 'Ingénieur Cloud Senior', type: 'Candidat', telephone: '06 61 22 33 44', ville: 'Casablanca', dernierContact: '12 Oct 2023, 14:30', resultat: 'Positif', resultatDate: 'Le 12 Oct (Appel)', prochaineAction: 'Entretien technique', prochaineDate: 'Demain', priorite: 'Haute', aRappeler: true },
  { id: 'c5', nom: 'Nadia Mansouri', poste: 'UX Designer', type: 'Candidat', telephone: '06 65 88 99 00', ville: 'Marrakech', dernierContact: '10 Oct 2023, 09:15', resultat: 'À relancer', resultatDate: 'Le 10 Oct (Email)', prochaineAction: 'Relance portfolio', prochaineDate: '18 Oct 2023', priorite: 'Normale', aRappeler: true },
  { id: 'c6', nom: 'Sophie Martin', poste: 'Recruteuse Senior', type: 'Recruteur', telephone: '06 11 22 33 44', ville: 'Casablanca', dernierContact: '11 Oct 2023, 10:00', resultat: 'Positif', resultatDate: 'Le 11 Oct (Appel)', prochaineAction: 'Envoyer short-list', prochaineDate: 'Demain', priorite: 'Haute', aRappeler: false },
  { id: 'c7', nom: 'BuildIt Construction', poste: 'Compte entreprise', type: 'Entreprise', telephone: '05 22 00 00 00', ville: 'Berlin', dernierContact: '08 Oct 2023, 16:00', resultat: 'À relancer', resultatDate: 'Le 08 Oct (Email)', prochaineAction: 'Point trimestriel', prochaineDate: '20 Oct 2023', priorite: 'Normale', aRappeler: false },
];

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

export default function AmudCommercialContactsPage() {
  const [contacts, setContacts] = useState(SEED);
  const [tab, setTab] = useState<TypeContact>('Candidat');
  const [search, setSearch] = useState('');
  const [onlyRappel, setOnlyRappel] = useState(false);
  const [onlyHaute, setOnlyHaute] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [nouveauNom, setNouveauNom] = useState('');
  const [nouveauTel, setNouveauTel] = useState('');
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  function notify(msg: string) {
    setNotice(msg);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 2200);
  }

  function ajouterContact() {
    if (!nouveauNom.trim()) return;
    setContacts((prev) => [
      {
        id: `c${Date.now()}`,
        nom: nouveauNom,
        poste: '—',
        type: tab,
        telephone: nouveauTel || '—',
        ville: '—',
        dernierContact: '—',
        resultat: 'À relancer',
        resultatDate: '—',
        prochaineAction: 'Premier contact à planifier',
        prochaineDate: '—',
        priorite: 'Normale',
        aRappeler: true,
      },
      ...prev,
    ]);
    setNouveauNom('');
    setNouveauTel('');
    setFormOpen(false);
    notify('Contact ajouté.');
  }

  return (
    <div>
      {notice ? (
        <div className="mb-md flex items-center gap-2 rounded-lg border border-amud-primary-fixed-dim bg-amud-primary-fixed p-md text-body-md text-amud-on-primary-fixed">
          <span className="material-symbols-outlined">check_circle</span>
          {notice}
        </div>
      ) : null}

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="m-0 text-headline-lg text-amud-on-background">Mes contacts</h2>
          <p className="mt-1 text-amud-on-surface-variant">Gérez et suivez l&apos;évolution de votre portefeuille.</p>
        </div>
        <button
          onClick={() => setFormOpen((v) => !v)}
          className="flex w-fit shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-amud-primary px-6 py-2.5 text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-container"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Nouveau contact
        </button>
      </div>

      {formOpen ? (
        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest p-4 shadow-sm sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="contact-nouveau-nom" className="mb-1 block text-label-sm text-amud-on-surface-variant">Nom</label>
            <input id="contact-nouveau-nom" value={nouveauNom} onChange={(e) => setNouveauNom(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
          </div>
          <div className="flex-1">
            <label htmlFor="contact-nouveau-tel" className="mb-1 block text-label-sm text-amud-on-surface-variant">Téléphone</label>
            <input id="contact-nouveau-tel" value={nouveauTel} onChange={(e) => setNouveauTel(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
          </div>
          <button onClick={ajouterContact} className="rounded-lg bg-amud-primary px-4 py-2 text-label-md font-medium text-white hover:bg-amud-primary-dark">
            Ajouter
          </button>
        </div>
      ) : null}

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
            <div key={c.id} className="rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amud-primary-container font-bold text-white">
                    {c.nom
                      .split(' ')
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div>
                    <p className="text-[16px] leading-tight text-amud-on-surface">{c.nom}</p>
                    <p className="mt-0.5 text-label-sm text-amud-on-surface-variant">{c.poste}</p>
                  </div>
                </div>
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
                  onClick={() => notify(`Appel vers ${c.nom} lancé.`)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-amud-outline-variant py-2 text-label-sm text-amud-primary transition-colors hover:bg-amud-surface-container"
                >
                  <span className="material-symbols-outlined text-[18px]">call</span> Appeler
                </button>
                <button
                  onClick={() => notify('Activité ajoutée.')}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-amud-outline-variant py-2 text-label-sm text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container"
                >
                  <span className="material-symbols-outlined text-[18px]">add_task</span> Activité
                </button>
                <button
                  onClick={() => {
                    setContacts((prev) => prev.map((x) => (x.id === c.id ? { ...x, aRappeler: !x.aRappeler } : x)));
                    notify(c.aRappeler ? 'Rappel annulé.' : 'Rappel planifié.');
                  }}
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
                  <tr key={c.id} className="group transition-colors hover:bg-amud-surface-container-low">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amud-primary-container font-bold text-white">
                          {c.nom
                            .split(' ')
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div>
                          <p className="text-[16px] leading-tight text-amud-on-surface">{c.nom}</p>
                          <p className="mt-0.5 text-label-sm text-amud-on-surface-variant">{c.poste}</p>
                        </div>
                      </div>
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
                        <button onClick={() => notify(`Appel vers ${c.nom} lancé.`)} title="Appeler" className="rounded p-1.5 text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container hover:text-amud-primary">
                          <span className="material-symbols-outlined text-[20px]">call</span>
                        </button>
                        <button title="Profil" className="rounded p-1.5 text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container hover:text-amud-primary">
                          <span className="material-symbols-outlined text-[20px]">person</span>
                        </button>
                        <button onClick={() => notify('Activité ajoutée.')} title="Ajouter une activité" className="rounded p-1.5 text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container hover:text-amud-primary">
                          <span className="material-symbols-outlined text-[20px]">add_task</span>
                        </button>
                        <button
                          onClick={() => {
                            setContacts((prev) => prev.map((x) => (x.id === c.id ? { ...x, aRappeler: !x.aRappeler } : x)));
                            notify(c.aRappeler ? 'Rappel annulé.' : 'Rappel planifié.');
                          }}
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
    </div>
  );
}
