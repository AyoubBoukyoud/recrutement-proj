'use client';

import { Fragment, useMemo, useState } from 'react';
import { Drawer, Modal } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { STATUTS, STATUT_STYLE, TYPES, TYPE_ICON, buildSeedRdvs, type Rdv, type StatutRdv, type TypeRdv } from '@/data/amud/commercialRdv';
import { entreprisesSeed } from '@/data/amud/entreprises';
import { entreprisesCollection } from '@/lib/amud/localEntreprises';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { rendezVousCollection } from '@/lib/amud/localRendezVous';
import { addDays, dayLabel, fullDayLabel, getMonday, isoDate, minutesToTime, sameDay, timeToMinutes, weekLabel } from '@/lib/amud/weekDates';

const HEURES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
const GRID_START_HOUR = 8;

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
            <p className="font-medium text-amud-on-background">
              {fullDayLabel(new Date(`${rdv.date}T00:00:00`))}, {rdv.debut} - {rdv.fin}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded bg-amud-surface-container-low text-amud-primary">
            <span className="material-symbols-outlined">{TYPE_ICON[rdv.type]}</span>
          </div>
          <div>
            <p className="text-label-sm text-amud-on-surface-variant">Type</p>
            <p className="font-medium text-amud-on-background">{rdv.type}</p>
            {rdv.lien ? (
              <a href={rdv.lien} className="mt-0.5 inline-block text-label-sm text-amud-primary hover:underline">
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
          <p className="text-body-md text-amud-on-background">{rdv.objectif}</p>
        </div>
      </div>
      {rdv.notes.length > 0 ? (
        <div>
          <p className="mb-2 text-label-sm text-amud-on-surface-variant">Notes préparatoires</p>
          <ul className="ml-1 list-inside list-disc space-y-1 text-body-md text-amud-on-surface-variant">
            {rdv.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

type ModalMode = 'create' | 'edit' | 'reporter';

type FormState = {
  nom: string;
  entreprise: string;
  entrepriseId: string;
  date: string;
  debut: string;
  fin: string;
  type: TypeRdv;
  statut: StatutRdv;
  lien: string;
  objectif: string;
  notes: string;
};

function emptyForm(date: string, debut: string): FormState {
  return { nom: '', entreprise: '', entrepriseId: '', date, debut, fin: minutesToTime(timeToMinutes(debut) + 60), type: 'Sur site', statut: 'programme', lien: '', objectif: '', notes: '' };
}

function formFromRdv(rdv: Rdv): FormState {
  return {
    nom: rdv.nom,
    entreprise: rdv.entreprise,
    entrepriseId: rdv.entrepriseId ?? '',
    date: rdv.date,
    debut: rdv.debut,
    fin: rdv.fin,
    type: rdv.type,
    statut: rdv.statut,
    lien: rdv.lien ?? '',
    objectif: rdv.objectif,
    notes: rdv.notes.join('\n'),
  };
}

export default function AmudCommercialRendezVousPage() {
  const notify = useToast();
  const [rdvs, { replace: replaceRdvs }] = useCollection(rendezVousCollection, buildSeedRdvs());
  const [entreprises] = useCollection(entreprisesCollection, entreprisesSeed);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [vue, setVue] = useState<'Agenda' | 'Jour' | 'Semaine' | 'Liste'>('Semaine');

  const [modal, setModal] = useState<{ mode: ModalMode; editingId: string | null; form: FormState } | null>(null);

  const today = useMemo(() => new Date(), []);
  const monday = useMemo(() => addDays(getMonday(today), weekOffset * 7), [today, weekOffset]);
  const jours = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const date = addDays(monday, i);
        return { date, iso: isoDate(date), label: dayLabel(date), num: date.getDate(), isToday: sameDay(date, today) };
      }),
    [monday, today],
  );
  const rdvsSemaine = useMemo(() => rdvs.filter((r) => jours.some((j) => j.iso === r.date)), [rdvs, jours]);
  const selected = rdvs.find((r) => r.id === selectedId) ?? null;

  function persist(next: Rdv[]) {
    replaceRdvs(next);
  }

  function selectRdv(id: string) {
    setSelectedId(id);
    setDrawerOpen(true);
  }

  function openCreate(date: string, debut: string) {
    setModal({ mode: 'create', editingId: null, form: emptyForm(date, debut) });
  }
  function openEdit(rdv: Rdv) {
    setModal({ mode: 'edit', editingId: rdv.id, form: formFromRdv(rdv) });
  }
  function openReporter(rdv: Rdv) {
    setModal({ mode: 'reporter', editingId: rdv.id, form: { ...formFromRdv(rdv), statut: 'reporte' } });
  }

  function submitModal(e: React.FormEvent) {
    e.preventDefault();
    if (!modal) return;
    const f = modal.form;
    if (!f.nom.trim() || !f.entreprise.trim() || timeToMinutes(f.fin) <= timeToMinutes(f.debut)) return;
    const payload: Omit<Rdv, 'id'> = {
      entrepriseId: f.entrepriseId || undefined,
      date: f.date,
      debut: f.debut,
      fin: f.fin,
      nom: f.nom.trim(),
      entreprise: f.entreprise.trim(),
      statut: f.statut,
      type: f.type,
      lien: f.type === 'Visioconférence' ? f.lien.trim() || undefined : undefined,
      objectif: f.objectif.trim(),
      notes: f.notes
        .split('\n')
        .map((n) => n.trim())
        .filter(Boolean),
    };
    if (modal.mode === 'create') {
      const rdv: Rdv = { id: `rdv-${Date.now()}`, ...payload };
      persist([...rdvs, rdv]);
      setSelectedId(rdv.id);
      notify(`Rendez-vous avec « ${rdv.nom} » créé.`);
    } else if (modal.editingId) {
      persist(rdvs.map((r) => (r.id === modal.editingId ? { ...r, ...payload } : r)));
      notify(modal.mode === 'reporter' ? `Rendez-vous avec « ${payload.nom} » reporté.` : `Rendez-vous avec « ${payload.nom} » mis à jour.`);
    }
    setModal(null);
  }

  function removeRdv(id: string) {
    persist(rdvs.filter((r) => r.id !== id));
    if (selectedId === id) setSelectedId(null);
    setDrawerOpen(false);
    notify('Rendez-vous supprimé.', 'info');
  }

  function layout(rdv: Rdv) {
    const startMin = timeToMinutes(rdv.debut);
    const endMin = timeToMinutes(rdv.fin);
    const hourRow = Math.floor(startMin / 60) - GRID_START_HOUR + 2;
    const top = startMin % 60;
    const height = Math.max(28, endMin - startMin - 2);
    return { hourRow, top, height };
  }

  const listeSorted = useMemo(() => [...rdvsSemaine].sort((a, b) => (a.date + a.debut).localeCompare(b.date + b.debut)), [rdvsSemaine]);

  function onEntrepriseLinkChange(id: string) {
    if (!modal) return;
    const match = entreprises.find((e) => e.id === id);
    setModal({ ...modal, form: { ...modal.form, entrepriseId: id, entreprise: match ? match.nom : modal.form.entreprise } });
  }

  return (
    <div>
      <div className="mb-xl flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-headline-lg-mobile font-bold text-amud-on-background md:text-headline-lg">Mes rendez-vous</h2>
          <p className="mt-1 text-body-md text-amud-on-surface-variant">Gérez votre emploi du temps et vos rencontres clients.</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
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
          <button
            onClick={() => openCreate(isoDate(today), '09:00')}
            className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-amud-primary px-4 py-2 text-label-sm font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Nouveau rendez-vous
          </button>
        </div>
      </div>

      {vue !== 'Semaine' && vue !== 'Liste' ? (
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface p-xl text-center text-amud-on-surface-variant">
          La vue « {vue} » n&apos;est pas encore disponible — restez en vue Semaine ou Liste pour consulter vos rendez-vous.
        </div>
      ) : vue === 'Liste' ? (
        <div className="flex gap-lg">
          <div className="flex-1 overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amud-outline-variant p-md">
              <h3 className="text-title-lg font-semibold capitalize text-amud-on-background">{weekLabel(monday)}</h3>
              <WeekNav weekOffset={weekOffset} setWeekOffset={setWeekOffset} />
            </div>
            <div className="divide-y divide-amud-outline-variant">
              {listeSorted.map((r) => (
                <button
                  key={r.id}
                  onClick={() => selectRdv(r.id)}
                  className="flex w-full animate-amud-rise-in items-center gap-4 p-md text-left transition-colors hover:bg-amud-surface-container-lowest"
                >
                  <div className="w-16 shrink-0 text-label-sm text-amud-on-surface-variant">
                    <div className="font-semibold text-amud-on-background">{fullDayLabel(new Date(`${r.date}T00:00:00`))}</div>
                    <div>{r.debut}</div>
                  </div>
                  <div className="h-10 w-1 shrink-0 rounded-full" style={{ backgroundColor: STATUT_STYLE[r.statut].border }} />
                  <div className="min-w-0 flex-1">
                    <div className={`truncate font-semibold text-amud-on-background ${r.statut === 'annule' ? 'line-through opacity-60' : ''}`}>{r.nom}</div>
                    <div className="truncate text-label-sm text-amud-on-surface-variant">{r.entreprise}</div>
                  </div>
                  <AppointmentStatusBadge rdv={r} />
                </button>
              ))}
              {listeSorted.length === 0 ? <div className="p-xl text-center text-body-md text-amud-on-surface-variant">Aucun rendez-vous cette semaine.</div> : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-lg">
          <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amud-outline-variant p-md">
              <div className="flex items-center gap-4">
                <h3 className="text-title-lg font-semibold capitalize text-amud-on-background">{weekLabel(monday)}</h3>
                <WeekNav weekOffset={weekOffset} setWeekOffset={setWeekOffset} />
              </div>
              <button onClick={() => setWeekOffset(0)} className="rounded-md px-3 py-1.5 text-label-md text-amud-primary transition-colors hover:bg-amud-surface-container-low">
                Aujourd&apos;hui
              </button>
            </div>
            <div className="overflow-x-auto">
              <div className="cal-grid min-w-[800px]">
                <div className="cal-header flex items-center justify-center border-b border-r border-amud-outline-variant">
                  <span className="material-symbols-outlined text-sm text-amud-on-surface-variant">schedule</span>
                </div>
                {jours.map((j) => (
                  <div key={j.iso} className="cal-header border-b border-amud-outline-variant">
                    <div className="text-label-sm uppercase text-amud-on-surface-variant">{j.label}</div>
                    <div className={`text-title-lg font-semibold ${j.isToday ? 'text-amud-primary' : 'text-amud-on-background'}`}>{j.num}</div>
                  </div>
                ))}

                {HEURES.map((h, hi) => (
                  <Fragment key={h}>
                    <div className="cal-cell time-label border-r border-amud-outline-variant text-label-sm text-amud-on-surface-variant">{h}</div>
                    {jours.map((j, ji) => {
                      if (hi === 4) {
                        // 12:00 — pause
                        return ji === 2 ? (
                          <div key={`${h}-${j.iso}`} className="cal-cell flex items-center justify-center bg-amud-surface-variant/30 text-label-sm text-amud-outline">
                            Pause
                          </div>
                        ) : (
                          <div key={`${h}-${j.iso}`} className="cal-cell" />
                        );
                      }
                      const rdv = rdvsSemaine.find((r) => r.date === j.iso && Math.floor(timeToMinutes(r.debut) / 60) === GRID_START_HOUR + hi);
                      return (
                        <div key={`${h}-${j.iso}`} className="cal-cell">
                          {rdv ? (
                            (() => {
                              const { top, height } = layout(rdv);
                              return (
                                <button
                                  onClick={() => selectRdv(rdv.id)}
                                  className="appointment-card w-full pl-3 pr-2 text-left"
                                  style={{ top, height, backgroundColor: STATUT_STYLE[rdv.statut].bg, borderLeftColor: STATUT_STYLE[rdv.statut].border, color: STATUT_STYLE[rdv.statut].text }}
                                >
                                  <div className={`truncate text-label-sm font-semibold ${rdv.statut === 'annule' ? 'line-through' : ''}`}>{rdv.nom}</div>
                                  <div className="truncate text-label-sm font-normal opacity-80">{rdv.entreprise}</div>
                                  <div className="mt-1 flex items-center gap-1 text-[10px]">
                                    <span className="material-symbols-outlined text-[12px]">{TYPE_ICON[rdv.type]}</span> {rdv.debut}-{rdv.fin}
                                  </div>
                                </button>
                              );
                            })()
                          ) : (
                            <button
                              onClick={() => openCreate(j.iso, h)}
                              title="Ajouter un rendez-vous"
                              className="group flex h-full w-full items-center justify-center opacity-0 transition-opacity hover:opacity-100"
                            >
                              <span className="material-symbols-outlined text-amud-primary">add_circle</span>
                            </button>
                          )}
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
                <RdvActions rdv={selected} onEdit={openEdit} onReport={openReporter} onDelete={removeRdv} />
              </div>
            </div>
          ) : null}

          <div className="xl:hidden">
            <Drawer
              open={drawerOpen && !!selected}
              onClose={() => setDrawerOpen(false)}
              title={selected?.nom ?? ''}
              subtitle={selected?.entreprise}
              footer={selected ? <RdvActions rdv={selected} onEdit={openEdit} onReport={openReporter} onDelete={removeRdv} /> : null}
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

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'create' ? 'Nouveau rendez-vous' : modal?.mode === 'reporter' ? 'Reporter le rendez-vous' : 'Modifier le rendez-vous'}
        footer={
          <div className="flex justify-end gap-sm">
            <button type="button" onClick={() => setModal(null)} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
              Annuler
            </button>
            <button type="submit" form="rdv-form" className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark">
              {modal?.mode === 'create' ? 'Créer' : 'Enregistrer'}
            </button>
          </div>
        }
      >
        {modal ? (
          <form id="rdv-form" onSubmit={submitModal} className="grid grid-cols-1 gap-md sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Contact</label>
              <input
                autoFocus
                value={modal.form.nom}
                onChange={(e) => setModal({ ...modal, form: { ...modal.form, nom: e.target.value } })}
                required
                className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
                placeholder="Youssef Amrani"
                type="text"
              />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Entreprise liée (optionnel)</label>
              <select
                value={modal.form.entrepriseId}
                onChange={(e) => onEntrepriseLinkChange(e.target.value)}
                className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              >
                <option value="">Aucune fiche liée</option>
                {entreprises.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Entreprise (nom affiché)</label>
              <input
                value={modal.form.entreprise}
                onChange={(e) => setModal({ ...modal, form: { ...modal.form, entreprise: e.target.value } })}
                required
                className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
                placeholder="TechCorp"
                type="text"
              />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Date</label>
              <input
                value={modal.form.date}
                onChange={(e) => setModal({ ...modal, form: { ...modal.form, date: e.target.value } })}
                required
                className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
                type="date"
              />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Type</label>
              <select
                value={modal.form.type}
                onChange={(e) => setModal({ ...modal, form: { ...modal.form, type: e.target.value as TypeRdv } })}
                className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              >
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Début</label>
              <input
                value={modal.form.debut}
                onChange={(e) => setModal({ ...modal, form: { ...modal.form, debut: e.target.value } })}
                required
                className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
                type="time"
              />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Fin</label>
              <input
                value={modal.form.fin}
                onChange={(e) => setModal({ ...modal, form: { ...modal.form, fin: e.target.value } })}
                required
                className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
                type="time"
              />
            </div>
            <div>
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Statut</label>
              <select
                value={modal.form.statut}
                onChange={(e) => setModal({ ...modal, form: { ...modal.form, statut: e.target.value as StatutRdv } })}
                className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              >
                {STATUTS.map((s) => (
                  <option key={s} value={s}>
                    {STATUT_STYLE[s].label}
                  </option>
                ))}
              </select>
            </div>
            {modal.form.type === 'Visioconférence' ? (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-label-md text-amud-on-surface-variant">Lien de la réunion</label>
                <input
                  value={modal.form.lien}
                  onChange={(e) => setModal({ ...modal, form: { ...modal.form, lien: e.target.value } })}
                  className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
                  placeholder="https://…"
                  type="text"
                />
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Objectif</label>
              <textarea
                value={modal.form.objectif}
                onChange={(e) => setModal({ ...modal, form: { ...modal.form, objectif: e.target.value } })}
                rows={2}
                className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
                placeholder="Objet du rendez-vous…"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-label-md text-amud-on-surface-variant">Notes préparatoires (une par ligne)</label>
              <textarea
                value={modal.form.notes}
                onChange={(e) => setModal({ ...modal, form: { ...modal.form, notes: e.target.value } })}
                rows={2}
                className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              />
            </div>
          </form>
        ) : null}
      </Modal>

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

function WeekNav({ weekOffset, setWeekOffset }: { weekOffset: number; setWeekOffset: (fn: (o: number) => number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => setWeekOffset((o) => o - 1)} aria-label="Semaine précédente" className="rounded p-1 text-amud-on-surface-variant hover:bg-amud-surface-variant">
        <span className="material-symbols-outlined">chevron_left</span>
      </button>
      <button onClick={() => setWeekOffset((o) => o + 1)} aria-label="Semaine suivante" className="rounded p-1 text-amud-on-surface-variant hover:bg-amud-surface-variant">
        <span className="material-symbols-outlined">chevron_right</span>
      </button>
      {weekOffset !== 0 ? (
        <span className="px-1 text-label-sm text-amud-outline">
          ({weekOffset > 0 ? '+' : ''}
          {weekOffset} sem.)
        </span>
      ) : null}
    </div>
  );
}

function RdvActions({ rdv, onEdit, onReport, onDelete }: { rdv: Rdv; onEdit: (rdv: Rdv) => void; onReport: (rdv: Rdv) => void; onDelete: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <a
        href={`/amud/commercial/contacts?q=${encodeURIComponent(rdv.nom)}`}
        className="block w-full rounded-lg bg-amud-primary px-4 py-2 text-center text-label-md text-white shadow-sm transition-colors hover:bg-amud-primary-dark"
      >
        Voir le dossier client
      </a>
      <div className="flex gap-2">
        <button onClick={() => onEdit(rdv)} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-amud-outline bg-amud-surface px-2 py-2 text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-variant">
          <span className="material-symbols-outlined text-[18px]">edit</span> Modif.
        </button>
        <button onClick={() => onReport(rdv)} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-amud-outline bg-amud-surface px-2 py-2 text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-variant">
          <span className="material-symbols-outlined text-[18px]">event_repeat</span> Report.
        </button>
        <button
          onClick={() => onDelete(rdv.id)}
          title="Supprimer"
          className="flex items-center justify-center rounded-lg border border-amud-outline bg-amud-surface px-2 py-2 text-amud-error transition-colors hover:bg-amud-error-container"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
    </div>
  );
}
