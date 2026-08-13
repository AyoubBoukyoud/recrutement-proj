'use client';

// Simuler mon salaire — estimation du salaire net et des coûts de migration.

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/shared/Button';

const BASE_SALARIES: { keywords: string[]; base: number }[] = [
  { keywords: ['infirmier', 'infirmière', 'santé'], base: 3200 },
  { keywords: ['ingénieur', 'développeur', 'informatique'], base: 4200 },
  { keywords: ['technicien'], base: 2900 },
  { keywords: ['chauffeur', 'logistique'], base: 2900 },
  { keywords: ['électricien', 'artisanat'], base: 3100 },
];
const DEFAULT_BASE = 2600;

const REGIONS: { name: string; factor: number }[] = [
  { name: 'Berlin', factor: 1 },
  { name: 'Bavière (Munich)', factor: 1.08 },
  { name: 'Bade-Wurtemberg (Stuttgart)', factor: 1.1 },
  { name: 'Hesse (Francfort)', factor: 1.05 },
  { name: 'Rhénanie-du-Nord-Westphalie', factor: 1.0 },
];

const MIGRATION_COSTS = [
  { label: 'Visa de travail (Consulat)', amount: 80 },
  { label: "Billet d'avion (Casa → Allemagne)", amount: 350 },
  { label: 'Assurance voyage (90 jours)', amount: 120 },
  { label: 'Premier loyer + Caution (estimation)', amount: 700 },
  { label: 'Traduction certifiée des documents', amount: 150 },
];
const MIGRATION_TOTAL = MIGRATION_COSTS.reduce((sum, c) => sum + c.amount, 0);

function estimateBase(profession: string) {
  const q = profession.trim().toLowerCase();
  const match = BASE_SALARIES.find((entry) => entry.keywords.some((k) => q.includes(k)));
  return match?.base ?? DEFAULT_BASE;
}

export default function SalairePage() {
  const [profession, setProfession] = useState('');
  const [region, setRegion] = useState(REGIONS[0].name);
  const [experience, setExperience] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<{ low: number; mid: number; high: number; net: number; resteAVivre: number } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);
    setTimeout(() => {
      const base = estimateBase(profession);
      const regionFactor = REGIONS.find((r) => r.name === region)?.factor ?? 1;
      const expFactor = 1 + Math.min(experience, 10) * 0.02;
      const mid = Math.round((base * regionFactor * expFactor) / 10) * 10;
      const low = Math.round((mid * 0.88) / 10) * 10;
      const high = Math.round((mid * 1.18) / 10) * 10;
      const net = Math.round((mid * 0.67) / 10) * 10;
      const resteAVivre = Math.max(net - 700 - 500, 0);
      setResult({ low, mid, high, net, resteAVivre });
      setIsCalculating(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-surface pb-32">
      <header className="sticky top-0 z-20 flex w-full items-center gap-4 border-b border-outline-variant/20 bg-surface px-4 py-4 lg:px-10">
        <Link href="/dashboard" className="text-primary-dark transition-opacity hover:opacity-80">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="text-lg font-bold text-primary-dark">Simuler mon salaire</h1>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 lg:max-w-6xl lg:px-10 lg:py-8">
        <section className="space-y-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-primary-dark">Simuler mon salaire</h2>
          <p className="max-w-2xl text-sm text-onSurface-variant">
            Estimez votre futur niveau de vie en Allemagne et anticipez votre transition professionnelle.
          </p>
        </section>

        <section className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] md:p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-onSurface-variant">Profession</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: 20 }}>
                  work
                </span>
                <input
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="Ex: Infirmier"
                  className="w-full rounded-xl border border-outline py-3 pl-11 pr-3 text-sm outline-none transition-all focus:border-primary-dark focus:ring-2 focus:ring-primary-dark/10"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-onSurface-variant">Région en Allemagne</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: 20 }}>
                  location_on
                </span>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-outline py-3 pl-11 pr-3 text-sm outline-none transition-all focus:border-primary-dark focus:ring-2 focus:ring-primary-dark/10"
                >
                  {REGIONS.map((r) => (
                    <option key={r.name} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-onSurface-variant">Années d&apos;expérience</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: 20 }}>
                  work_history
                </span>
                <input
                  value={experience}
                  onChange={(e) => setExperience(Math.max(0, Number(e.target.value)))}
                  min={0}
                  type="number"
                  className="w-full rounded-xl border border-outline py-3 pl-11 pr-3 text-sm outline-none transition-all focus:border-primary-dark focus:ring-2 focus:ring-primary-dark/10"
                />
              </div>
            </div>
            <div className="flex justify-center pt-2 md:col-span-2 lg:col-span-3">
              <Button
                type="submit"
                disabled={isCalculating}
                className="bg-primary-dark px-12 shadow-lg shadow-primary-dark/20 hover:enabled:-translate-y-0.5"
              >
                <span className={`material-symbols-outlined ${isCalculating ? 'animate-spin' : ''}`}>
                  {isCalculating ? 'sync' : 'calculate'}
                </span>
                {isCalculating ? 'Calcul en cours…' : 'Calculer'}
              </Button>
            </div>
          </form>
        </section>

        {result && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-7">
              <div className="relative space-y-4 overflow-hidden rounded-2xl border border-primary-container/20 bg-surface-container-lowest p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)]">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary-dark/70">Salaire brut mensuel estimé</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-primary-dark">{result.mid.toLocaleString('fr-FR')} €</span>
                    <span className="text-xs text-outline">/ mois</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-onSurface-variant">
                    <span>Bas ({result.low.toLocaleString('fr-FR')} €)</span>
                    <span>Haut ({result.high.toLocaleString('fr-FR')} €)</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container">
                    <div className="h-full w-2/3 rounded-full bg-primary-dark" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-outline-variant/40 pt-4">
                  <div className="space-y-1">
                    <p className="text-xs text-onSurface-variant">Salaire net estimé</p>
                    <p className="text-xl font-bold text-primary-dark">{result.net.toLocaleString('fr-FR')} €</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-onSurface-variant">Reste à vivre</p>
                    <p className="text-xl font-bold text-primary-dark">{result.resteAVivre.toLocaleString('fr-FR')} €</p>
                    <span className="text-[10px] italic text-outline">Après loyer et charges</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-primary-dark">Migration : devis estimatif</h3>
                  <span className="rounded-full bg-primary-container/10 px-3 py-1 text-xs font-bold text-primary-dark">Estimation 2026</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-outline-variant/40">
                      <tr>
                        <th className="py-2 font-semibold text-onSurface-variant">Poste de dépense</th>
                        <th className="py-2 text-right font-semibold text-onSurface-variant">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {MIGRATION_COSTS.map((c) => (
                        <tr key={c.label}>
                          <td className="py-2">{c.label}</td>
                          <td className="py-2 text-right">{c.amount} €</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-surface-container-low">
                        <td className="rounded-l-lg px-2 py-3 font-bold text-primary-dark">Coût total estimé</td>
                        <td className="rounded-r-lg px-2 py-3 text-right font-bold text-primary-dark">{MIGRATION_TOTAL} €</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-gold/40 bg-gold/10 p-4">
                  <span className="material-symbols-outlined text-gold-dark">info</span>
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-onSurface">
                      Aides possibles : <strong>Programme THAMM</strong>
                    </p>
                    <p className="text-xs text-onSurface-variant">
                      Vous pourriez être éligible à un remboursement partiel de ces frais via les accords bilatéraux Maroc–Allemagne.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 lg:col-span-5">
              <div className="space-y-4 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)]">
                <h4 className="text-lg font-bold text-primary-dark">Optimisez votre profil</h4>
                <p className="text-sm text-onSurface-variant">
                  Les salaires peuvent varier de 20% selon la certification de votre niveau d&apos;allemand (B1/B2).
                </p>
                <Link
                  href="/lecon-jour"
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-primary-dark py-3 text-sm font-semibold text-primary-dark transition-all hover:bg-primary-dark hover:text-on-primary"
                >
                  Voir les cours de langue
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                </Link>
              </div>
              <div className="space-y-3 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)]">
                <h4 className="text-lg font-bold text-primary-dark">Besoin d&apos;accompagnement ?</h4>
                <p className="text-sm text-onSurface-variant">
                  Nos conseillers vous aident à préparer votre dossier de visa et à trouver votre premier logement.
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-surface-container-high px-3 py-1">Recherche de logement</span>
                  <span className="rounded-full bg-surface-container-high px-3 py-1">Assistance Visa</span>
                  <span className="rounded-full bg-surface-container-high px-3 py-1">Ouverture compte bancaire</span>
                </div>
                <Link href="/reclamation" className="block text-center text-xs font-semibold text-primary-dark hover:underline">
                  Contacter un conseiller
                </Link>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="flex justify-center pb-4 pt-2">
            <Button onClick={() => window.print()} className="bg-primary-dark px-8 shadow-md hover:enabled:opacity-90">
              <span className="material-symbols-outlined">picture_as_pdf</span>
              Télécharger l&apos;estimation (PDF)
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
