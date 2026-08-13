'use client';

// Page : Préférences de matching - Candidat (Stitch exact template)

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/shared/Button';

export default function MatchingPreferencesPage() {
  const [regions, setRegions] = useState<{ [key: string]: boolean }>({
    Berlin: true,
    Bavière: false,
    Hambourg: false,
    Saxe: false,
    'Bade-Wurtemberg': false,
    Hesse: false,
  });

  const [companyType, setCompanyType] = useState('Grand groupe');

  const [sectors, setSectors] = useState<string[]>(['Santé', 'Logistique']);

  const [salary, setSalary] = useState(45000);

  const [savedToast, setSavedToast] = useState(false);

  const toggleRegion = (region: string) => {
    setRegions((prev) => ({ ...prev, [region]: !prev[region] }));
  };

  const removeSector = (sector: string) => {
    setSectors((prev) => prev.filter((s) => s !== sector));
  };

  const addSector = (sector: string) => {
    if (!sectors.includes(sector)) {
      setSectors((prev) => [...prev, sector]);
    }
  };

  const handleSave = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <div className="min-h-screen bg-background pb-32 text-onBackground font-sans">
      {/* TopAppBar */}
      <header className="sticky top-0 z-40 w-full border-b border-outline-variant bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-xl items-center justify-between px-4 lg:max-w-5xl lg:px-10">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              aria-label="Retour"
              className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container-high active:scale-95"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                arrow_back
              </span>
            </Link>
            <h1 className="text-lg font-bold text-primary">Mes préférences</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/profil"
              aria-label="Mon profil"
              className="flex h-10 w-10 items-center justify-center rounded-full text-onSurface-variant transition-colors hover:bg-surface-container-high active:scale-95"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                account_circle
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="mx-auto max-w-xl px-4 py-4 space-y-6 lg:max-w-5xl lg:px-10 lg:py-8">
        {/* Welcome Section */}
        <div className="py-2">
          <h2 className="text-2xl font-extrabold text-onSurface">Personnalisez vos opportunités</h2>
          <p className="mt-1 text-sm font-medium leading-relaxed text-onSurface-variant">
            Définissez vos critères pour que nous puissions vous proposer les meilleures offres en Allemagne.
          </p>
        </div>

        <div className="space-y-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0">
        {/* Section 1: Regions */}
        <section className="rounded-xl border border-outline-variant border-l-4 border-l-primary bg-surface-container-lowest p-6 shadow-subtle space-y-4">
          <h3 className="flex items-center gap-2 text-base font-extrabold text-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              map
            </span>
            Région souhaitée en Allemagne
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {Object.keys(regions).map((regionName) => (
              <label
                key={regionName}
                className="group flex cursor-pointer items-center justify-between rounded-lg border border-outline-variant p-3.5 transition-colors hover:bg-surface-container-low"
              >
                <span className="text-sm font-semibold text-onSurface">{regionName}</span>
                <input
                  type="checkbox"
                  checked={regions[regionName]}
                  onChange={() => toggleRegion(regionName)}
                  className="h-5 w-5 rounded border-outline text-primary focus:ring-primary"
                />
              </label>
            ))}
          </div>
        </section>

        {/* Section 2: Company Type */}
        <section className="rounded-xl border border-outline-variant border-l-4 border-l-primary bg-surface-container-lowest p-6 shadow-subtle space-y-4">
          <h3 className="flex items-center gap-2 text-base font-extrabold text-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              corporate_fare
            </span>
            Type d&apos;entreprise
          </h3>
          <div className="flex flex-wrap gap-2 pt-1">
            {['Grand groupe', 'PME', 'Start-up', 'Peu importe'].map((type) => (
              <Button
                key={type}
                variant={companyType === type ? 'primary' : 'outline'}
                size="sm"
                pill
                onClick={() => setCompanyType(type)}
                aria-pressed={companyType === type}
                className="px-5"
              >
                {type}
              </Button>
            ))}
          </div>
        </section>

        {/* Section 3: Sectors */}
        <section className="rounded-xl border border-outline-variant border-l-4 border-l-primary bg-surface-container-lowest p-6 shadow-subtle space-y-4">
          <h3 className="flex items-center gap-2 text-base font-extrabold text-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              category
            </span>
            Secteurs d&apos;activité
          </h3>
          <div className="flex flex-wrap gap-2 pt-1">
            {sectors.map((sec) => (
              <div
                key={sec}
                className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-surface-container-high px-4 py-2 text-xs font-bold text-primary shadow-xs"
              >
                <span>{sec}</span>
                <span
                  onClick={() => removeSector(sec)}
                  className="material-symbols-outlined cursor-pointer hover:opacity-75"
                  style={{ fontSize: 16 }}
                >
                  close
                </span>
              </div>
            ))}
            {['Électricité', 'Hôtellerie', 'Construction']
              .filter((s) => !sectors.includes(s))
              .map((sec) => (
                <Button
                  key={sec}
                  variant="outline"
                  size="sm"
                  pill
                  onClick={() => addSector(sec)}
                  className="gap-1.5 border-outline-variant text-onSurface-variant"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    add
                  </span>
                  {sec}
                </Button>
              ))}
          </div>
        </section>

        {/* Section 4: Salary */}
        <section className="rounded-xl border border-outline-variant border-l-4 border-l-primary bg-surface-container-lowest p-6 shadow-subtle space-y-4">
          <h3 className="flex items-center gap-2 text-base font-extrabold text-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              payments
            </span>
            Salaire minimum (Annuel)
          </h3>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-base font-extrabold text-onSurface-variant">
              €
            </span>
            <input
              type="number"
              step="1000"
              value={salary}
              onChange={(e) => setSalary(Number(e.target.value))}
              placeholder="45,000"
              className="w-full rounded-lg border border-outline bg-surface py-3 pl-10 pr-4 text-xl font-extrabold text-onSurface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
            />
          </div>
          <div className="pt-2">
            <input
              type="range"
              min="30000"
              max="120000"
              step="5000"
              value={salary}
              onChange={(e) => setSalary(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface-container accent-primary"
            />
            <div className="mt-2 flex justify-between text-xs font-bold text-onSurface-variant">
              <span>30k €</span>
              <span>120k €</span>
            </div>
          </div>
        </section>
        </div>

        {/* Visual Decorative Card */}
        <div className="group relative h-48 overflow-hidden rounded-xl border border-outline-variant shadow-md">
          <div
            className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCwCan9bPpZq5iQJykrngR1JCeHtHSq-7zkccaiau4EqUMRE3H9StxL-TG7oK29kATRTb48H96JnrE_8K-slpQGJ-Uyj_-WXUW2zdokU4Ls7E9tf7vzXQsBuLPsp8-9PzYWZx8KPub9H_Kw7rgHcRZVHJk-LH-36_eAQQIECb7c8Jmn7zv1tDa8RLWT4y0DO6vVAKv-pPcq8wQRmczZWKT36CTONLDMPvcOwzqmgNF1Hh4VnVIO_47s')",
            }}
          />
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-primary/80 to-transparent p-5">
            <p className="text-sm font-semibold text-onPrimary">Découvrez votre futur chez-vous en Allemagne.</p>
          </div>
        </div>

        {savedToast && (
          <div className="flex items-center gap-2 rounded-pillar bg-primary-container p-4 text-xs font-bold text-onPrimary shadow-md animate-pulse">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              check_circle
            </span>
            Vos préférences de matching ont été enregistrées avec succès !
          </div>
        )}

        {/* Action Button Container */}
        <div className="pt-4 pb-8 flex justify-center">
          <Button size="lg" fullWidth onClick={handleSave} className="text-base font-extrabold shadow-lg lg:max-w-sm">
            <span>Enregistrer les préférences</span>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              save
            </span>
          </Button>
        </div>
      </main>
    </div>
  );
}
