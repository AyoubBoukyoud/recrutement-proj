'use client';

// Page : Simulateur de salaire et migration vers l'Allemagne (Calculateur Dynamique)

import Link from 'next/link';
import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/context/LanguageContext';

const PROFESSIONS_DATA: Record<string, { baseGross: number; icon: string }> = {
  'Infirmier / Soignant': { baseGross: 3300, icon: 'medical_services' },
  'Ingénieur Logiciel / IT': { baseGross: 4800, icon: 'code' },
  'Technicien Maintenance': { baseGross: 3500, icon: 'build' },
  'Chauffeur Poids Lourd': { baseGross: 3100, icon: 'local_shipping' },
  'Électricien / Artisans': { baseGross: 3400, icon: 'electrical_services' },
};

const PROFESSION_LABEL_KEYS: Record<string, string> = {
  'Infirmier / Soignant': 'simulateurSalaire.professions.infirmier',
  'Ingénieur Logiciel / IT': 'simulateurSalaire.professions.ingenieurLogiciel',
  'Technicien Maintenance': 'simulateurSalaire.professions.technicienMaintenance',
  'Chauffeur Poids Lourd': 'simulateurSalaire.professions.chauffeurPoidsLourd',
  'Électricien / Artisans': 'simulateurSalaire.professions.electricien',
};

const REGIONS_DATA: Record<string, { multiplier: number; rentEst: number }> = {
  'Berlin': { multiplier: 1.0, rentEst: 750 },
  'Bavière (Munich)': { multiplier: 1.22, rentEst: 1050 },
  'Bade-Wurtemberg (Stuttgart)': { multiplier: 1.15, rentEst: 900 },
  'Hesse (Francfort)': { multiplier: 1.18, rentEst: 950 },
  'Rhénanie-du-Nord-Westphalie': { multiplier: 0.95, rentEst: 650 },
};

const REGION_LABEL_KEYS: Record<string, string> = {
  'Berlin': 'shared.regions.berlin',
  'Bavière (Munich)': 'shared.regions.baviereMunich',
  'Bade-Wurtemberg (Stuttgart)': 'shared.regions.badeWurtembergStuttgart',
  'Hesse (Francfort)': 'shared.regions.hesseFrancfort',
  'Rhénanie-du-Nord-Westphalie': 'shared.regions.rhenanieNordWestphalie',
};

const STEUERKLASSE_LABEL_KEYS: Record<string, string> = {
  '1': 'simulateurSalaire.steuerklasse.classe1',
  '3': 'simulateurSalaire.steuerklasse.classe3',
  '4': 'simulateurSalaire.steuerklasse.classe4',
  '5': 'simulateurSalaire.steuerklasse.classe5',
};

export default function SimulateurSalairePage() {
  const { t } = useLanguage();
  const [profession, setProfession] = useState('Infirmier / Soignant');
  const [region, setRegion] = useState('Berlin');
  const [experience, setExperience] = useState('3');
  const [steuerklasse, setSteuerklasse] = useState('1'); // Tax class 1 (single) by default
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResults, setShowResults] = useState(true);

  // Calculate gross, net, taxes and living costs dynamically
  const calculatedSalary = useMemo(() => {
    const profData = PROFESSIONS_DATA[profession] || { baseGross: 3200, icon: 'work' };
    const regData = REGIONS_DATA[region] || { multiplier: 1.0, rentEst: 750 };
    const yearsExp = Math.max(0, parseInt(experience, 10) || 0);

    // Experience boost: +3% per year up to 30%
    const expFactor = 1 + Math.min(yearsExp * 0.03, 0.3);
    const gross = Math.round(profData.baseGross * regData.multiplier * expFactor);

    // German Tax & Social Security Breakdown (Approximate ~38-42% total deductions depending on Tax Class)
    let taxRate = 0.38;
    if (steuerklasse === '3') taxRate = 0.30; // Married single-earner
    if (steuerklasse === '5') taxRate = 0.45; // Second earner
    if (steuerklasse === '6') taxRate = 0.48; // Secondary job

    const net = Math.round(gross * (1 - taxRate));
    const rent = regData.rentEst;
    const livingExpenses = 550; // Food, transport, utilities
    const resteAVivre = Math.max(0, net - rent - livingExpenses);

    const minGross = Math.round(gross * 0.85);
    const maxGross = Math.round(gross * 1.2);

    return {
      gross,
      net,
      rent,
      livingExpenses,
      resteAVivre,
      minGross,
      maxGross,
      taxDeductions: gross - net,
    };
  }, [profession, region, experience, steuerklasse]);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
      setShowResults(true);
      toast.success(t('candidateC:simulateurSalaire.toasts.updated'), { icon: '💶', position: 'top-center' });
    }, 400);
  };

  const handleDownloadPdf = () => {
    toast.success(t('candidateC:simulateurSalaire.toasts.pdfGenerating'), { duration: 3000 });
  };

  const regionLabel = t(`candidateC:${REGION_LABEL_KEYS[region]}`);

  return (
    <div className="min-h-screen bg-surface text-onSurface pb-28">
      {/* Top Navigation Anchor */}
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-4 shadow-subtle">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            aria-label={t('common:actions.back')}
            className="p-2 text-primary transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              arrow_back
            </span>
          </Link>
          <h1 className="text-lg font-extrabold text-primary">{t('candidateC:simulateurSalaire.pageTitle')}</h1>
        </div>
        <button type="button" aria-label={t('candidateC:simulateurSalaire.notificationsAria')} className="p-2 text-primary">
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
            notifications
          </span>
        </button>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6 space-y-6">
        {/* Hero Section */}
        <section className="space-y-1">
          <h2 className="text-2xl font-extrabold text-primary">{t('candidateC:simulateurSalaire.heroTitle')}</h2>
          <p className="text-xs leading-relaxed text-onSurface-variant">
            {t('candidateC:simulateurSalaire.subtitle')}
          </p>
        </section>

        {/* Calculator Form */}
        <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-subtle">
          <form onSubmit={handleCalculate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-onSurface-variant">{t('candidateC:simulateurSalaire.form.profession')}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-outline" style={{ fontSize: 20 }}>
                  work
                </span>
                <select
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-outline-variant bg-surface-container-lowest py-3 pl-11 pr-4 text-sm font-bold text-onSurface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
                >
                  {Object.keys(PROFESSIONS_DATA).map((p) => (
                    <option key={p} value={p}>
                      {t(`candidateC:${PROFESSION_LABEL_KEYS[p]}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-onSurface-variant">{t('candidateC:simulateurSalaire.form.region')}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-outline" style={{ fontSize: 20 }}>
                  location_on
                </span>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-outline-variant bg-surface-container-lowest py-3 pl-11 pr-4 text-sm font-bold text-onSurface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
                >
                  {Object.keys(REGIONS_DATA).map((r) => (
                    <option key={r} value={r}>
                      {t(`candidateC:${REGION_LABEL_KEYS[r]}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-onSurface-variant">{t('candidateC:simulateurSalaire.form.experience')}</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-3.5 text-outline" style={{ fontSize: 18 }}>
                    work_history
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest py-3 pl-9 pr-3 text-sm font-bold text-onSurface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-onSurface-variant">{t('candidateC:simulateurSalaire.form.steuerklasse')}</label>
                <select
                  value={steuerklasse}
                  onChange={(e) => setSteuerklasse(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest py-3 px-3 text-xs font-bold text-onSurface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
                >
                  {Object.keys(STEUERKLASSE_LABEL_KEYS).map((k) => (
                    <option key={k} value={k}>
                      {t(`candidateC:${STEUERKLASSE_LABEL_KEYS[k]}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isCalculating}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-xs font-extrabold uppercase tracking-wider text-onPrimary shadow-md transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {isCalculating ? 'sync' : 'calculate'}
                </span>
                {isCalculating ? t('candidateC:simulateurSalaire.calculatingText') : t('candidateC:simulateurSalaire.form.recalculateButton')}
              </button>
            </div>
          </form>
        </section>

        {/* Results Section */}
        {showResults && (
          <div className="space-y-6 animate-fadeIn">
            {/* Salary Results Card */}
            <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-b from-surface-container-lowest to-surface-container-low p-6 shadow-md">
              <span className="material-symbols-outlined absolute -right-3 -top-3 text-8xl text-primary/10 pointer-events-none">
                payments
              </span>

              <div className="space-y-1 mb-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary">
                  {t('candidateC:simulateurSalaire.results.grossTitle')}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-primary">{calculatedSalary.gross.toLocaleString('fr-FR')} €</span>
                  <span className="text-xs font-bold text-outline">{t('candidateC:shared.perMonth')}</span>
                </div>
              </div>

              <div className="mb-4 space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-onSurface-variant">
                  <span>{t('candidateC:simulateurSalaire.results.rangeLow', { value: calculatedSalary.minGross.toLocaleString('fr-FR') })}</span>
                  <span>{t('candidateC:simulateurSalaire.results.rangeHigh', { value: calculatedSalary.maxGross.toLocaleString('fr-FR') })}</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div className="h-full rounded-full bg-primary" style={{ width: '62%' }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 border-t border-outline-variant/30 pt-4 text-center">
                <div>
                  <p className="text-[11px] font-semibold text-onSurface-variant">{t('candidateC:simulateurSalaire.results.netLabel')}</p>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{calculatedSalary.net.toLocaleString('fr-FR')} €</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-onSurface-variant">{t('candidateC:simulateurSalaire.results.taxesLabel')}</p>
                  <p className="text-lg font-black text-error">-{calculatedSalary.taxDeductions.toLocaleString('fr-FR')} €</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-onSurface-variant">{t('candidateC:shared.resteAVivre')}</p>
                  <p className="text-lg font-black text-primary">{calculatedSalary.resteAVivre.toLocaleString('fr-FR')} €</p>
                </div>
              </div>
            </div>

            {/* Migration Costs Card */}
            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-primary">{t('candidateC:simulateurSalaire.costs.title', { region: regionLabel })}</h3>
                <span className="rounded-full bg-surface-container-low px-3 py-1 text-[10px] font-extrabold text-primary">
                  {t('candidateC:simulateurSalaire.costs.badge', { year: 2026 })}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-outline-variant">
                    <tr>
                      <th className="py-2.5 font-bold text-onSurface-variant">{t('candidateC:shared.expenseLabel')}</th>
                      <th className="py-2.5 text-right font-bold text-onSurface-variant">{t('candidateC:simulateurSalaire.costs.amountEstimatedLabel')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    <tr>
                      <td className="py-2.5 font-medium">{t('candidateC:simulateurSalaire.costs.rentRow', { region: regionLabel })}</td>
                      <td className="py-2.5 text-right font-bold">{t('candidateC:simulateurSalaire.costs.monthlyAmount', { amount: calculatedSalary.rent })}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium">{t('candidateC:simulateurSalaire.costs.foodTransportRow')}</td>
                      <td className="py-2.5 text-right font-bold">{t('candidateC:simulateurSalaire.costs.monthlyAmount', { amount: calculatedSalary.livingExpenses })}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium">{t('candidateC:simulateurSalaire.costs.visaRow')}</td>
                      <td className="py-2.5 text-right font-bold">{t('candidateC:simulateurSalaire.costs.oneTimeAmount', { amount: 150 })}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium">{t('candidateC:simulateurSalaire.costs.healthInsuranceRow')}</td>
                      <td className="py-2.5 text-right font-bold">{t('candidateC:simulateurSalaire.costs.includedInNet')}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-surface-container-low font-extrabold">
                      <td className="py-3 px-2 text-primary">{t('candidateC:simulateurSalaire.costs.totalMonthlyLabel')}</td>
                      <td className="py-3 px-2 text-right text-primary">{t('candidateC:simulateurSalaire.costs.monthlyAmount', { amount: calculatedSalary.rent + calculatedSalary.livingExpenses })}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-secondary/30 bg-gold/15 p-4">
                <span className="material-symbols-outlined shrink-0 text-tertiary" style={{ fontSize: 20 }}>
                  info
                </span>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-tertiary">
                    {t('candidateC:simulateurSalaire.aid.title')}
                  </p>
                  <p className="text-[11px] leading-relaxed text-onSurface-variant">
                    {t('candidateC:simulateurSalaire.aid.description')}
                  </p>
                </div>
              </div>
            </div>

            {/* Language Course CTA */}
            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-subtle space-y-3">
              <h4 className="text-base font-extrabold text-primary">{t('candidateC:simulateurSalaire.languageCta.title')}</h4>
              <p className="text-xs leading-relaxed text-onSurface-variant font-medium">
                {t('candidateC:simulateurSalaire.languageCta.description')}
              </p>
              <Link
                href="/cours-allemand"
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-primary py-3 text-xs font-extrabold text-primary transition-all hover:bg-primary hover:text-onPrimary"
              >
                {t('candidateC:simulateurSalaire.languageCta.linkText')}
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Action Bar */}
      <footer className="fixed bottom-0 inset-x-0 z-40 mx-auto max-w-xl border-t border-outline-variant bg-surface-container-lowest p-4 shadow-subtle flex justify-center">
        <button
          type="button"
          onClick={handleDownloadPdf}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-xs font-extrabold text-onPrimary shadow-md transition-all hover:bg-primary/90 active:scale-95"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            picture_as_pdf
          </span>
          {t('candidateC:simulateurSalaire.footer.downloadButton')}
        </button>
      </footer>
    </div>
  );
}

