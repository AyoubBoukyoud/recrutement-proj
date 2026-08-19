'use client';

import { Fragment, useState } from 'react';
import { Drawer } from '@/components/amud/ui';

type StatutRdv = 'programme' | 'confirme' | 'termine' | 'annule' | 'reporte';

type Rdv = {
  id: string;
  jour: number; // 1 = Lun … 5 = Ven
  top: number;
  height: number;
  hourRow: number; // ligne de départ dans la grille (08:00 = ligne 2)
  nom: string;
  entreprise: string;
  statut: StatutRdv;
  horaire: string;
  meta?: string;
  metaIcon?: string;
  detail: { date: string; type: string; lien?: string; objectif: string; notes: string[] };
};

const STATUT_STYLE: Record<StatutRdv, { bg: string; border: string; text: string; label: string }> = {
  programme: { bg: '#e0f2fe', border: '#0284c7', text: '#0369a1', label: 'Programmé' },
  confirme: { bg: '#dcfce7', border: '#16a34a', text: '#15803d', label: 'Confirmé' },
  termine: { bg: '#f3f4f6', border: '#6b7280', text: '#374151', label: 'Terminé' },
  annule: { bg: '#fee2e2', border: '#dc2626', text: '#b91c1c', label: 'Annulé' },
  reporte: { bg: '#ffedd5', border: '#f97316', text: '#c2410c', label: 'Reporté' },
};

const RDVS: Rdv[] = [
  {
    id: 'youssef',
    jour: 2,
    top: 0,
    height: 118,
    hourRow: 3,
    nom: 'Youssef Amrani',
    entreprise: 'TechCorp',
    statut: 'confirme',
    horaire: '09:00 - 11:00',
    metaIcon: 'videocam',
    detail: {
      date: 'Mar 17 Oct, 09:00 - 11:00',
      type: 'Visioconférence',
      lien: '#',
      objectif: 'Présentation de la nouvelle offre de services "Pillar Alpha" et discussion sur les besoins d\'intégration CRM pour 2024.',
      notes: ['Revoir le contrat précédent', 'Préparer les démos modules RH', 'Vérifier dispo technique semaine 42'],
    },
  },
  {
    id: 'amina',
    jour: 4,
    top: 0,
    height: 58,
    hourRow: 4,
    nom: 'Amina Berrada',
    entreprise: 'Consulting Group',
    statut: 'termine',
    horaire: '10:00 - 10:30',
    detail: { date: 'Mer 18 Oct, 10:00 - 10:30', type: 'Sur site', objectif: 'Bilan trimestriel du partenariat.', notes: ['Préparer le récapitulatif des placements du trimestre'] },
  },
  {
    id: 'khalid',
    jour: 1,
    top: 30,
    height: 88,
    hourRow: 5,
    nom: 'Khalid El Fassi',
    entreprise: 'Logistics Pro',
    statut: 'programme',
    horaire: '11:30 - 13:00',
    metaIcon: 'call',
    detail: { date: 'Lun 16 Oct, 11:30 - 13:00', type: 'Appel téléphonique', objectif: 'Qualification du besoin logistique pour le site de Tanger.', notes: ['Envoyer la grille tarifaire avant l\'appel'] },
  },
  {
    id: 'sarah',
    jour: 3,
    top: 0,
    height: 58,
    hourRow: 8,
    nom: 'Sarah Tazi',
    entreprise: 'Design Studio',
    statut: 'annule',
    horaire: '14:00 - 14:30',
    detail: { date: 'Mer 18 Oct, 14:00 - 14:30 (annulé)', type: 'Sur site', objectif: 'Annulé par le client — à reprogrammer.', notes: [] },
  },
  {
    id: 'karim',
    jour: 4,
    top: 0,
    height: 58,
    hourRow: 9,
    nom: 'Karim Bennani',
    entreprise: 'BuildIt Sarl',
    statut: 'reporte',
    horaire: '15:00 - 15:30',
    detail: { date: 'Jeu 19 Oct, 15:00 - 15:30 (reporté)', type: 'Sur site', objectif: 'Reporté à la demande du client.', notes: [] },
  },
  {
    id: 'nadia',
    jour: 5,
    top: 30,
    height: 88,
    hourRow: 9,
    nom: 'Nadia Mansouri',
    entreprise: 'Innovate SA',
    statut: 'confirme',
    horaire: '15:30 - 17:00',
    metaIcon: 'location_on',
    meta: 'Présentiel',
    detail: {
      date: 'Ven 20 Oct, 15:30 - 17:00',
      type: 'Présentiel',
      objectif: "Signature du contrat cadre et présentation de l'équipe dédiée.",
      notes: ['Apporter les exemplaires du contrat', "Confirmer la présence du directeur commercial"],
    },
  },
];

const JOURS = [
  { label: 'Lun', date: 16, col: 1 },
  { label: 'Mar', date: 17, col: 2 },
  { label: 'Mer', date: 18, col: 3 },
  { label: 'Jeu', date: 19, col: 4 },
  { label: 'Ven', date: 20, col: 5 },
];
const HEURES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

function AppointmentStatusBadge({ rdv }: { rdv: Rdv }) {
  return (
    <div
      className="inline-flex w-fit items-center gap-1.5 rounded border-l-4 px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: STATUT_STYLE[rdv.statut].bg, borderColor: STATUT_STYLE[rdv.statut].border, color: STATUT_STYLE[rdv.statut].text }}
    >
      <div className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUT_STYLE[rdv.statut].label}
    </div>
  );
}

function AppointmentDetailBody({ rdv }: { rdv: Rdv }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded bg-amud-surface-container-low text-amud-primary">
            <span className="material-symbols-outlined">schedule</span>
          </div>
          <div>
            <p className="text-label-sm text-amud-on-surface-variant">Date et Heure</p>
            <p className="font-medium text-amud-on-background">{rdv.detail.date}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded bg-amud-surface-container-low text-amud-primary">
            <span className="material-symbols-outlined">{rdv.metaIcon ?? 'event'}</span>
          </div>
          <div>
            <p className="text-label-sm text-amud-on-surface-variant">Type</p>
            <p className="font-medium text-amud-on-background">{rdv.detail.type}</p>
            {rdv.detail.lien ? (
              <a href={rdv.detail.lien} className="mt-0.5 inline-block text-label-sm text-amud-primary hover:underline">
                Rejoindre la réunion
              </a>
            ) : null}
          </div>
        </div>
      </div>
      <div className="h-px w-full bg-amud-outline-variant" />
      <div>
        <p className="mb-2 text-label-sm text-amud-on-surface-variant">Objectif</p>
        <div className="rounded-lg border border-amud-outline-variant bg-amud-surface-container-low p-3">
          <p className="text-body-md text-amud-on-background">{rdv.detail.objectif}</p>
        </div>
      </div>
      {rdv.detail.notes.length > 0 ? (
        <div>
          <p className="mb-2 text-label-sm text-amud-on-surface-variant">Notes préparatoires</p>
          <ul className="ml-1 list-inside list-disc space-y-1 text-body-md text-amud-on-surface-variant">
            {rdv.detail.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function AppointmentDetailFooter() {
  return (
    <div className="flex flex-col gap-2">
      <button className="w-full rounded-lg bg-amud-primary px-4 py-2 text-label-md text-white shadow-sm transition-colors hover:bg-amud-primary-dark">Voir le dossier client</button>
      <div className="flex gap-2">
        <button className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-amud-outline bg-amud-surface px-2 py-2 text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-variant">
          <span className="material-symbols-outlined text-[18px]">edit</span> Modif.
        </button>
        <button className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-amud-outline bg-amud-surface px-2 py-2 text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-variant">
          <span className="material-symbols-outlined text-[18px]">event_repeat</span> Report.
        </button>
      </div>
    </div>
  );
}

export default function AmudCommercialRendezVousPage() {
  const [selectedId, setSelectedId] = useState<string | null>('youssef');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [vue, setVue] = useState<'Agenda' | 'Jour' | 'Semaine' | 'Liste'>('Semaine');
  const [semaineLabel, setSemaineLabel] = useState('Octobre 2023');

  const selected = RDVS.find((r) => r.id === selectedId) ?? null;

  function selectRdv(id: string) {
    setSelectedId(id);
    setDrawerOpen(true);
  }

  return (
    <div>
      <div className="mb-xl flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-headline-lg-mobile font-bold text-amud-on-background md:text-headline-lg">Mes rendez-vous</h2>
          <p className="mt-1 text-body-md text-amud-on-surface-variant">Gérez votre emploi du temps et vos rencontres clients.</p>
        </div>
        <div className="w-full overflow-x-auto md:w-auto">
          <div className="flex w-max rounded-lg border border-amud-outline-variant bg-amud-surface-container-low p-1">
            {(['Agenda', 'Jour', 'Semaine', 'Liste'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVue(v)}
                className={`shrink-0 rounded-md px-4 py-1.5 text-label-md transition-colors ${
                  vue === v ? 'bg-amud-surface font-semibold text-amud-primary shadow-sm' : 'text-amud-on-surface-variant hover:bg-amud-surface-variant'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {vue !== 'Semaine' ? (
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface p-xl text-center text-amud-on-surface-variant">
          La vue « {vue} » n&apos;est pas encore disponible — restez en vue Semaine pour consulter vos rendez-vous.
        </div>
      ) : (
        <div className="flex gap-lg">
          <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amud-outline-variant p-md">
              <div className="flex items-center gap-4">
                <h3 className="text-title-lg font-semibold text-amud-on-background">{semaineLabel}</h3>
                <div className="flex gap-1">
                  <button onClick={() => setSemaineLabel('Semaine précédente')} className="rounded p-1 text-amud-on-surface-variant hover:bg-amud-surface-variant">
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button onClick={() => setSemaineLabel('Semaine suivante')} className="rounded p-1 text-amud-on-surface-variant hover:bg-amud-surface-variant">
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>
              <button onClick={() => setSemaineLabel('Octobre 2023')} className="rounded-md px-3 py-1.5 text-label-md text-amud-primary transition-colors hover:bg-amud-surface-container-low">
                Aujourd&apos;hui
              </button>
            </div>
            <div className="overflow-x-auto">
              <div className="cal-grid min-w-[800px]">
                <div className="cal-header flex items-center justify-center border-b border-r border-amud-outline-variant">
                  <span className="material-symbols-outlined text-sm text-amud-on-surface-variant">schedule</span>
                </div>
                {JOURS.map((j) => (
                  <div key={j.label} className="cal-header border-b border-amud-outline-variant">
                    <div className="text-label-sm uppercase text-amud-on-surface-variant">{j.label}</div>
                    <div className={`text-title-lg font-semibold ${j.label === 'Mar' ? 'text-amud-primary' : 'text-amud-on-background'}`}>{j.date}</div>
                  </div>
                ))}

                {HEURES.map((h, hi) => (
                  <Fragment key={h}>
                    <div className="cal-cell time-label border-r border-amud-outline-variant text-label-sm text-amud-on-surface-variant">
                      {h}
                    </div>
                    {JOURS.map((j) => {
                      if (hi === 4) {
                        // 12:00 — pause
                        return j.col === 3 ? (
                          <div key={`${h}-${j.col}`} className="cal-cell flex items-center justify-center bg-amud-surface-variant/30 text-label-sm text-amud-outline">
                            Pause
                          </div>
                        ) : (
                          <div key={`${h}-${j.col}`} className="cal-cell" />
                        );
                      }
                      const rdv = RDVS.find((r) => r.jour === j.col && r.hourRow === hi + 2);
                      return (
                        <div key={`${h}-${j.col}`} className="cal-cell">
                          {rdv ? (
                            <button
                              onClick={() => selectRdv(rdv.id)}
                              className="appointment-card w-full pl-3 pr-2 text-left"
                              style={{
                                top: rdv.top,
                                height: rdv.height,
                                backgroundColor: STATUT_STYLE[rdv.statut].bg,
                                borderLeftColor: STATUT_STYLE[rdv.statut].border,
                                color: STATUT_STYLE[rdv.statut].text,
                              }}
                            >
                              <div className={`truncate text-label-sm font-semibold ${rdv.statut === 'annule' ? 'line-through' : ''}`}>{rdv.nom}</div>
                              <div className="truncate text-label-sm font-normal opacity-80">{rdv.entreprise}</div>
                              {rdv.metaIcon ? (
                                <div className="mt-1 flex items-center gap-1 text-[10px]">
                                  <span className="material-symbols-outlined text-[12px]">{rdv.metaIcon}</span> {rdv.meta ?? rdv.horaire}
                                </div>
                              ) : null}
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          </div>

          {selected ? (
            <div className="sticky top-24 hidden h-[calc(100vh-8rem)] w-80 flex-col rounded-xl border border-amud-outline-variant bg-amud-surface shadow-sm xl:flex">
              <div className="flex items-start justify-between border-b border-amud-outline-variant p-lg">
                <div>
                  <div className="mb-3">
                    <AppointmentStatusBadge rdv={selected} />
                  </div>
                  <h3 className="text-title-lg font-bold text-amud-on-background">{selected.nom}</h3>
                  <p className="mt-1 flex items-center gap-1 text-body-md text-amud-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">domain</span>
                    {selected.entreprise}
                  </p>
                </div>
                <button onClick={() => setSelectedId(null)} className="text-amud-on-surface-variant hover:text-amud-primary">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-lg">
                <AppointmentDetailBody rdv={selected} />
              </div>
              <div className="border-t border-amud-outline-variant p-md">
                <AppointmentDetailFooter />
              </div>
            </div>
          ) : null}

          <div className="xl:hidden">
            <Drawer
              open={drawerOpen && !!selected}
              onClose={() => setDrawerOpen(false)}
              title={selected?.nom ?? ''}
              subtitle={selected?.entreprise}
              footer={selected ? <AppointmentDetailFooter /> : null}
            >
              {selected ? (
                <div className="flex flex-col gap-4">
                  <AppointmentStatusBadge rdv={selected} />
                  <AppointmentDetailBody rdv={selected} />
                </div>
              ) : null}
            </Drawer>
          </div>
        </div>
      )}

      <style jsx>{`
        .cal-grid {
          display: grid;
          grid-template-columns: 60px repeat(5, 1fr);
          grid-template-rows: 40px repeat(9, 60px);
          gap: 1px;
          background-color: #c0c9bf;
        }
        .cal-header {
          background-color: #f0f3ff;
          text-align: center;
          padding: 8px;
        }
        .cal-cell {
          background-color: #f9f9ff;
          position: relative;
        }
        .time-label {
          text-align: right;
          padding-right: 8px;
          transform: translateY(-50%);
        }
        .appointment-card {
          position: absolute;
          left: 4px;
          right: 4px;
          border-radius: 4px;
          padding: 4px 8px;
          overflow: hidden;
          border-left-width: 4px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .appointment-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          z-index: 10;
        }
      `}</style>
    </div>
  );
}
