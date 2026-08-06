'use client';

// Page : Simulateur de salaire et migration (Stitch exact template)

import Link from 'next/link';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function SimulateurSalairePage() {
  const { t } = useLanguage();
  const [profession, setProfession] = useState('Infirmier');
  const [region, setRegion] = useState('Berlin');
  const [experience, setExperience] = useState('3');
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResults, setShowResults] = useState(true);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
      setShowResults(true);
    }, 600);
  };

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
          <h1 className="text-lg font-extrabold text-primary">Amud Skills</h1>
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
          <h2 className="text-2xl font-extrabold text-primary">{t('candidateC:shared.pageTitle')}</h2>
          <p className="text-xs leading-relaxed text-onSurface-variant">
            {t('candidateC:simulateurSalaire.subtitle')}
          </p>
        </section>

        {/* Calculator Form */}
        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-subtle">
          <form onSubmit={handleCalculate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-onSurface-variant">{t('candidateC:shared.form.profession')}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-outline" style={{ fontSize: 20 }}>
                  medical_services
                </span>
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder={t('candidateC:shared.form.professionPlaceholder')}
                  list="professions-list"
                  className="w-full rounded-pillar border border-outline-variant bg-surface-container-lowest py-3 pl-11 pr-4 text-sm font-semibold text-onSurface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
                />
                <datalist id="professions-list">
                  <option value={t('candidateC:simulateurSalaire.professions.infirmier')} />
                  <option value={t('candidateC:simulateurSalaire.professions.ingenieurLogiciel')} />
                  <option value={t('candidateC:simulateurSalaire.professions.technicienMaintenance')} />
                  <option value={t('candidateC:simulateurSalaire.professions.chauffeurPoidsLourd')} />
                </datalist>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-onSurface-variant">{t('candidateC:shared.form.region')}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-outline" style={{ fontSize: 20 }}>
                  location_on
                </span>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full appearance-none rounded-pillar border border-outline-variant bg-surface-container-lowest py-3 pl-11 pr-4 text-sm font-semibold text-onSurface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
                >
                  <option value="Berlin">{t('candidateC:shared.regions.berlin')}</option>
                  <option value="Bavière (Munich)">{t('candidateC:shared.regions.baviereMunich')}</option>
                  <option value="Bade-Wurtemberg (Stuttgart)">{t('candidateC:shared.regions.badeWurtembergStuttgart')}</option>
                  <option value="Hesse (Francfort)">{t('candidateC:shared.regions.hesseFrancfort')}</option>
                  <option value="Rhénanie-du-Nord-Westphalie">{t('candidateC:shared.regions.rhenanieNordWestphalie')}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-onSurface-variant">{t('candidateC:shared.form.experience')}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-outline" style={{ fontSize: 20 }}>
                  work_history
                </span>
                <input
                  type="number"
                  min="0"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-pillar border border-outline-variant bg-surface-container-lowest py-3 pl-11 pr-4 text-sm font-semibold text-onSurface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isCalculating}
                className="flex w-full items-center justify-center gap-2 rounded-pillar bg-primary py-3.5 text-xs font-extrabold uppercase tracking-wider text-onPrimary shadow-md transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {isCalculating ? 'sync' : 'calculate'}
                </span>
                {isCalculating ? t('candidateC:simulateurSalaire.calculatingText') : t('candidateC:shared.form.calculateButton')}
              </button>
            </div>
          </form>
        </section>

        {/* Results Section */}
        {showResults && (
          <div className="space-y-6 fade-in-entry opacity-0">
            {/* Salary Results Card */}
            <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-surface-container-lowest p-6 shadow-subtle">
              <span className="material-symbols-outlined absolute -right-3 -top-3 text-8xl text-primary/10 pointer-events-none">
                payments
              </span>

              <div className="space-y-1 mb-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary">
                  {t('candidateC:shared.grossMonthlySalary')}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-primary">3 200 €</span>
                  <span className="text-xs font-bold text-outline">{t('candidateC:shared.perMonth')}</span>
                </div>
              </div>

              <div className="mb-4 space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-onSurface-variant">
                  <span>{t('candidateC:shared.results.low', { value: '2 800' })}</span>
                  <span>{t('candidateC:shared.results.high', { value: '3 800' })}</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container">
                  <div className="h-full rounded-full bg-primary" style={{ width: '65%' }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-outline-variant/30 pt-4">
                <div>
                  <p className="text-xs font-semibold text-onSurface-variant">{t('candidateC:shared.netSalary')}</p>
                  <p className="text-xl font-black text-primary">2 150 €</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-onSurface-variant">{t('candidateC:shared.resteAVivre')}</p>
                  <p className="text-xl font-black text-primary">950 €</p>
                  <span className="text-[10px] italic text-outline">{t('candidateC:shared.afterRentCharges')}</span>
                </div>
              </div>
            </div>

            {/* Migration Costs Card */}
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-primary">{t('candidateC:simulateurSalaire.migrationTitle')}</h3>
                <span className="rounded-full bg-surface-container-low px-3 py-1 text-[10px] font-extrabold text-primary">
                  {t('candidateC:shared.estimationBadge', { year: 2024 })}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-outline-variant">
                    <tr>
                      <th className="py-2.5 font-bold text-onSurface-variant">{t('candidateC:shared.expenseLabel')}</th>
                      <th className="py-2.5 text-right font-bold text-onSurface-variant">{t('candidateC:shared.amountLabel')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    <tr>
                      <td className="py-2.5 font-medium">{t('candidateC:simulateurSalaire.migrationCosts.visa')}</td>
                      <td className="py-2.5 text-right font-bold">80 €</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium">{t('candidateC:simulateurSalaire.migrationCosts.flight')}</td>
                      <td className="py-2.5 text-right font-bold">350 €</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium">{t('candidateC:simulateurSalaire.migrationCosts.insurance')}</td>
                      <td className="py-2.5 text-right font-bold">120 €</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium">{t('candidateC:simulateurSalaire.migrationCosts.rent')}</td>
                      <td className="py-2.5 text-right font-bold">700 €</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium">{t('candidateC:simulateurSalaire.migrationCosts.translation')}</td>
                      <td className="py-2.5 text-right font-bold">150 €</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-surface-container-low font-extrabold">
                      <td className="py-3 px-2 text-primary">{t('candidateC:shared.totalCostLabel')}</td>
                      <td className="py-3 px-2 text-right text-primary">1 400 €</td>
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
                    {t('candidateC:shared.aid.prefix')} <strong>{t('candidateC:shared.aid.programName')}</strong>
                  </p>
                  <p className="text-[11px] leading-relaxed text-onSurface-variant">
                    {t('candidateC:simulateurSalaire.aidDescription')}
                  </p>
                </div>
              </div>
            </div>

            {/* Side Cards / Action Center */}
            <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-subtle">
              <div
                className="h-44 bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCM6PwKPQasCEycqFfngmxOzb1W5XxqL3iuY7abb-j8XkQArdlEq9dV0rQz26l9sMPfkFAmwB8ggZjJGQghDNealc80JFGvUThbgBz1kqy09s7jUSA36Pg8KbV7GppoEm-t1v6JEhM8WFRwEvITPKmjfZoYJkB4GGYEFOP1B39uH_kCFkH11u7mLPk7U8YG9O-1-WoCFobmPL6I7Nv-fPl_XXJDPOQpctj5xw8UmfkECKDafidRcXKT')",
                }}
              />
              <div className="p-5 space-y-3">
                <h4 className="text-base font-extrabold text-primary">{t('candidateC:shared.optimizeProfileTitle')}</h4>
                <p className="text-xs leading-relaxed text-onSurface-variant font-medium">
                  {t('candidateC:shared.optimizeProfileDescription')}
                </p>
                <Link
                  href="/cours-allemand"
                  className="flex items-center justify-center gap-2 rounded-pillar border-2 border-primary py-3 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-onPrimary"
                >
                  {t('candidateC:shared.viewLanguageCoursesLink')}
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-subtle space-y-3">
              <h4 className="text-base font-extrabold text-primary">{t('candidateC:shared.needHelpTitle')}</h4>
              <p className="text-xs leading-relaxed text-onSurface-variant font-medium">
                {t('candidateC:shared.needHelpDescription')}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-surface-container-high px-3 py-1 text-[11px] font-bold text-onSurface-variant">
                  {t('candidateC:shared.tags.housingSearch')}
                </span>
                <span className="rounded-full bg-surface-container-high px-3 py-1 text-[11px] font-bold text-onSurface-variant">
                  {t('candidateC:shared.tags.visaAssistance')}
                </span>
                <span className="rounded-full bg-surface-container-high px-3 py-1 text-[11px] font-bold text-onSurface-variant">
                  {t('candidateC:shared.tags.bankAccount')}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Action Bar */}
      <footer className="fixed bottom-0 inset-x-0 z-40 mx-auto max-w-xl border-t border-outline-variant bg-surface-container-lowest p-4 shadow-subtle flex justify-center">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-pillar bg-primary py-3.5 text-xs font-bold text-onPrimary shadow-md transition-all hover:bg-primary/90 active:scale-95"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            picture_as_pdf
          </span>
          {t('candidateC:shared.downloadPdfButton')}
        </button>
      </footer>
    </div>
  );
}
