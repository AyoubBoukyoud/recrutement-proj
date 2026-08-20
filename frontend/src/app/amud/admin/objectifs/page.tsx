'use client';

import { useState } from 'react';
import { commerciaux } from '@/data/amud/commerciaux';
import { useToast } from '@/components/amud/Toast';
import { exportCsv } from '@/lib/amud/csv';

function statutObjectif(pct: number) {
  if (pct > 100) return { label: 'Dépassé', cls: 'bg-amud-primary-container/10 text-amud-primary-container border-amud-primary-container/20' };
  if (pct === 100) return { label: 'Atteint', cls: 'bg-amud-primary/10 text-amud-primary border-amud-primary/20' };
  if (pct >= 50) return { label: 'En progression', cls: 'bg-amud-surface-container-highest text-amud-on-surface border-amud-outline-variant' };
  return { label: 'Critique', cls: 'bg-amud-secondary/10 text-amud-secondary border-amud-secondary/20' };
}

export default function AmudAdminObjectifsPage() {
  const notify = useToast();
  const [editing, setEditing] = useState(false);
  const [appelsJour, setAppelsJour] = useState(60);
  const [rdvSemaine, setRdvSemaine] = useState(15);
  const [contactsMois, setContactsMois] = useState(120);
  const [tauxConversion, setTauxConversion] = useState(8.5);

  const objectifGlobal = 5000;
  const realiseGlobal = 3850;
  const progression = Math.round((realiseGlobal / objectifGlobal) * 100);
  const atteints = commerciaux.filter((c) => c.realiseMensuel / c.objectifMensuel >= 1).length;
  const enRetard = commerciaux.filter((c) => c.realiseMensuel / c.objectifMensuel < 0.5).length;

  const circumference = 100;
  const dash = `${progression}, ${circumference}`;

  return (
    <div>
      <div className="mb-lg">
        <h1 className="text-headline-lg text-amud-on-surface">Objectifs commerciaux</h1>
        <p className="mt-xs text-body-md text-amud-on-surface-variant">Suivi des performances et gestion des cibles de l&apos;équipe commerciale.</p>
      </div>

      <div className="mb-xl grid grid-cols-2 gap-md md:grid-cols-5">
        <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-amud-surface-container-high bg-amud-surface-container-lowest p-lg shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          <div className="absolute bottom-0 left-0 top-0 w-1 bg-amud-primary" />
          <div>
            <p className="text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Objectif global</p>
            <p className="mt-sm text-headline-md text-amud-on-surface">{objectifGlobal.toLocaleString('fr-FR')}</p>
          </div>
          <p className="mt-xs flex items-center gap-xs text-label-sm text-amud-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">calendar_month</span> appels/mois
          </p>
        </div>
        <div className="flex flex-col justify-between rounded-xl border border-amud-surface-container-high bg-amud-surface-container-lowest p-lg shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          <div>
            <p className="text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Réalisé</p>
            <p className="mt-sm text-headline-md text-amud-on-surface">{realiseGlobal.toLocaleString('fr-FR')}</p>
          </div>
          <p className="mt-xs flex items-center gap-xs text-label-sm text-amud-primary-container">
            <span className="material-symbols-outlined text-[16px]">trending_up</span> En hausse
          </p>
        </div>
        <div className="col-span-2 flex flex-col items-center justify-between rounded-xl border border-amud-surface-container-high bg-amud-surface-container-lowest p-lg shadow-[0_4px_12px_rgba(0,0,0,0.02)] md:col-span-1">
          <p className="mb-sm w-full text-left text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Progression</p>
          <div className="relative flex h-20 w-20 items-center justify-center">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
              <path
                className="text-amud-surface-container-highest"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="text-amud-primary"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray={dash}
                strokeWidth="3"
              />
            </svg>
            <span className="absolute text-title-lg text-amud-primary">{progression}%</span>
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-xl border border-amud-surface-container-high bg-amud-surface-container-lowest p-lg shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          <div>
            <p className="text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Objectif atteint</p>
            <p className="mt-sm text-headline-md text-amud-primary">{atteints}</p>
          </div>
          <p className="mt-xs flex items-center gap-xs text-label-sm text-amud-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">person</span> agents
          </p>
        </div>
        <div className="flex flex-col justify-between rounded-xl border border-amud-surface-container-high bg-amud-surface-container-lowest p-lg shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          <div>
            <p className="text-label-sm uppercase tracking-wider text-amud-on-surface-variant">En retard</p>
            <p className="mt-sm text-headline-md text-amud-secondary">{enRetard}</p>
          </div>
          <p className="mt-xs flex items-center gap-xs text-label-sm text-amud-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">person</span> agents
          </p>
        </div>
      </div>

      <section className="mb-xl rounded-xl border border-amud-surface-container-high bg-amud-surface-container-lowest p-lg shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        <div className="mb-md flex flex-col items-start justify-between gap-md md:flex-row md:items-center">
          <h2 className="text-title-lg text-amud-on-surface">Configuration des objectifs standards</h2>
          <div className="flex flex-wrap gap-sm">
            {editing ? (
              <button
                onClick={() => {
                  setEditing(false);
                  notify('Objectifs standards mis à jour.');
                }}
                className="rounded-lg bg-amud-primary px-md py-sm text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark"
              >
                Enregistrer
              </button>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="rounded-lg border border-amud-outline px-md py-sm text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low"
              >
                Modifier les objectifs
              </button>
            )}
            <button
              onClick={() => notify('Objectifs assignés à toute l’équipe.')}
              className="flex items-center gap-xs rounded-lg bg-amud-primary px-md py-sm text-label-md text-white shadow-sm transition-colors hover:bg-amud-primary/90"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span> Assigner
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-md md:grid-cols-4">
          <ConfigStat icon="call" label="Appels / Jour" value={appelsJour} editing={editing} onChange={setAppelsJour} />
          <ConfigStat icon="handshake" label="Rendez-vous / Sem." value={rdvSemaine} editing={editing} onChange={setRdvSemaine} />
          <ConfigStat icon="contact_mail" label="Contacts / Mois" value={contactsMois} editing={editing} onChange={setContactsMois} />
          <ConfigStat icon="percent" label="Taux de conversion" value={tauxConversion} suffix="%" editing={editing} onChange={setTauxConversion} />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-amud-surface-container-high bg-amud-surface-container-lowest shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between border-b border-amud-outline-variant bg-amud-surface-container-low/50 p-lg">
          <h2 className="text-title-lg text-amud-on-surface">Performance Commerciale</h2>
          <button
            onClick={() => {
              exportCsv(
                'performance-commerciale',
                commerciaux.map((c) => ({
                  Commercial: `${c.prenom} ${c.nom}`,
                  Objectif: c.objectifMensuel,
                  Réalisé: c.realiseMensuel,
                  Restant: Math.max(0, c.objectifMensuel - c.realiseMensuel),
                  '% Atteinte': Math.round((c.realiseMensuel / c.objectifMensuel) * 100),
                })),
              );
              notify('Rapport exporté.');
            }}
            title="Export"
            className="rounded-full p-xs text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-high"
          >
            <span className="material-symbols-outlined">download</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead>
              <tr className="border-b border-amud-outline-variant bg-amud-surface text-label-sm uppercase tracking-wider text-amud-on-surface-variant">
                <th className="p-md font-semibold">Commercial</th>
                <th className="p-md text-right font-semibold">Objectif</th>
                <th className="p-md text-right font-semibold">Réalisé</th>
                <th className="p-md text-right font-semibold">Restant</th>
                <th className="w-48 p-md font-semibold">% Atteinte</th>
                <th className="p-md text-center font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody className="text-body-md text-amud-on-surface">
              {commerciaux.map((c) => {
                const pct = Math.round((c.realiseMensuel / c.objectifMensuel) * 100);
                const restant = Math.max(0, c.objectifMensuel - c.realiseMensuel);
                const s = statutObjectif(pct);
                return (
                  <tr key={c.id} className="border-b border-amud-outline-variant transition-colors last:border-0 hover:bg-amud-surface-container-low/30">
                    <td className="p-md">
                      <div className="flex items-center gap-sm">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amud-surface-container-highest text-xs font-bold text-amud-primary">{c.avatarInitials}</div>
                        <span className="font-medium">
                          {c.prenom} {c.nom}
                        </span>
                      </div>
                    </td>
                    <td className="p-md text-right">{c.objectifMensuel}</td>
                    <td className="p-md text-right font-medium text-amud-on-surface">{c.realiseMensuel}</td>
                    <td className="p-md text-right text-amud-on-surface-variant">{restant}</td>
                    <td className="p-md">
                      <div className="flex items-center gap-xs">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-amud-surface-container-highest">
                          <div className={`h-full ${pct >= 100 ? 'bg-amud-primary' : pct >= 50 ? 'bg-amud-tertiary-fixed-dim' : 'bg-amud-secondary'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                        <span className="w-10 text-right text-label-sm font-medium">{pct}%</span>
                      </div>
                    </td>
                    <td className="p-md text-center">
                      <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${s.cls}`}>
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                        {s.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ConfigStat({
  icon,
  label,
  value,
  suffix,
  editing,
  onChange,
}: {
  icon: string;
  label: string;
  value: number;
  suffix?: string;
  editing: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-md rounded-lg border border-amud-outline-variant bg-amud-surface p-md">
      <div className="shrink-0 rounded-full bg-amud-primary-container/10 p-sm text-amud-primary-container">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-label-sm text-amud-on-surface-variant">{label}</p>
        {editing ? (
          <input
            value={value}
            onChange={(e) => onChange(Number(e.target.value) || 0)}
            type="number"
            step={suffix === '%' ? 0.1 : 1}
            className="mt-1 w-full rounded border border-amud-outline-variant bg-amud-surface-container-lowest px-2 py-1 text-title-lg text-amud-on-surface outline-none focus:ring-2 focus:ring-amud-primary"
          />
        ) : (
          <p className="text-title-lg text-amud-on-surface">
            {value}
            {suffix ?? ''}
          </p>
        )}
      </div>
    </div>
  );
}
