'use client';

// Interfaces 5 à 9 — Création de profil en 5 étapes (state interne + paramètre d'URL `step`).

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { useNetwork } from '@/context/NetworkContext';
import { useLanguage } from '@/context/LanguageContext';
import { CEFRGauge } from '@/components/shared/CEFRGauge';
import { SECTORS, SECTOR_DATABASE } from '@/lib/mockData';
import type { CEFRLevel, ProfileStep } from '@/lib/types';

// Libellé arabe fixe (bilingue FR/AR) affiché sous le titre de chaque étape, indépendamment de la langue d'interface.
const STEP_ARABIC: Record<ProfileStep, string> = {
  1: 'معلوماتك الشخصية',
  2: 'مجال عملي',
  3: 'مهاراتي اللغوية',
  4: 'متى أنت متاح؟',
  5: 'على وشك الانتهاء!',
};

const LANGUAGE_NAMES = ['Allemand', 'Anglais', 'Français'];
const ADDITIONAL_LANGUAGE_OPTIONS = ['Arabe', 'Espagnol', 'Italien', 'Néerlandais', 'Portugais', 'Turc', 'Autre'];

const REGIONS = [
  'Casablanca-Settat',
  'Rabat-Salé-Kénitra',
  'Marrakech-Safi',
  'Tanger-Tétouan-Al Hoceïma',
  'Fès-Meknès',
  'Souss-Massa',
  'Béni Mellal-Khénifra',
  "L'Oriental",
  'Drâa-Tafilalet',
];

const SECTOR_ICONS: Record<string, string> = {
  IT: 'computer',
  Santé: 'medical_services',
  BTP: 'construction',
  Artisanat: 'handyman',
  Hôtellerie: 'restaurant',
  Logistique: 'local_shipping',
};

const AVAILABILITY_OPTIONS = [
  { key: 'immediate', label: 'Prêt à déménager immédiatement', badge: 'Immédiat', icon: 'bolt', startInWeeks: 0, notice: 0 },
  { key: '1m', label: 'Disponible dans 1 mois', badge: 'Sous 30 jours', icon: 'schedule', startInWeeks: 4, notice: 4 },
  { key: '2m', label: 'Disponible dans 2 mois', badge: 'Sous 60 jours', icon: 'event', startInWeeks: 8, notice: 8 },
] as const;

function addWeeks(weeks: number): string {
  const d = new Date();
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

function ProfileCreationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { profile, updateProfile, markStepComplete } = useProfile();
  const { isOnline, queueAction } = useNetwork();
  const { t } = useLanguage();

  const stepParam = Number(searchParams.get('step') ?? '1');
  const step = (stepParam >= 1 && stepParam <= 5 ? stepParam : 1) as ProfileStep;

  const [form, setForm] = useState(profile);
  const [arabicName, setArabicName] = useState('');
  const [email, setEmail] = useState('');
  const [wantsTraining, setWantsTraining] = useState(false);
  const [consents, setConsents] = useState({ cgu: false, privacy: false, whatsapp: false, certify: false });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [languageToAdd, setLanguageToAdd] = useState('');
  const [customLanguage, setCustomLanguage] = useState('');
  const [sectorQuery, setSectorQuery] = useState('');
  const [isSectorSearchFocused, setIsSectorSearchFocused] = useState(false);

  useEffect(() => {
    setForm(profile);
  }, [profile]);

  const goToStep = (target: number) => router.push(`/profile-creation?step=${target}`);

  const setLanguageLevel = (language: string, level: CEFRLevel['level']) => {
    setForm((prev) => {
      const existing = prev.languages.filter((l) => l.language !== language);
      return { ...prev, languages: [...existing, { language, level }] };
    });
  };

  const extraLanguages = form.languages.map((l) => l.language).filter((name) => !LANGUAGE_NAMES.includes(name));
  const availableLanguagesToAdd = ADDITIONAL_LANGUAGE_OPTIONS.filter((name) => !extraLanguages.includes(name));

  const addLanguage = (language: string) => {
    if (!language) return;
    setForm((prev) =>
      prev.languages.some((l) => l.language === language)
        ? prev
        : { ...prev, languages: [...prev.languages, { language, level: null }] },
    );
    setLanguageToAdd('');
  };

  const removeLanguage = (language: string) => {
    setForm((prev) => ({ ...prev, languages: prev.languages.filter((l) => l.language !== language) }));
  };

  const handleAddLanguage = () => {
    const name = languageToAdd === 'Autre' ? customLanguage.trim() : languageToAdd;
    if (!name) return;
    addLanguage(name);
    setCustomLanguage('');
  };

  const sectorMatches =
    sectorQuery.trim().length > 0
      ? SECTOR_DATABASE.filter((s) => s.toLowerCase().includes(sectorQuery.trim().toLowerCase())).slice(0, 8)
      : [];

  const selectSector = (sector: string) => {
    setForm((p) => ({ ...p, sector }));
    setSectorQuery(sector);
    setIsSectorSearchFocused(false);
  };

  const selectedAvailability = AVAILABILITY_OPTIONS.find((o) => o.notice === form.noticePeriodWeeks)?.key ?? 'immediate';

  const selectAvailability = (option: (typeof AVAILABILITY_OPTIONS)[number]) => {
    setForm((prev) => ({ ...prev, desiredStartDate: addWeeks(option.startInWeeks), noticePeriodWeeks: option.notice }));
  };

  const validateStep = (): string | null => {
    if (step === 1) {
      if (!form.firstName || !form.lastName || !form.birthDate || !form.city) {
        return t('candidateA:profileCreation.validation.step1');
      }
    }
    if (step === 2) {
      if (!form.sector || !form.jobTitle) return t('candidateA:profileCreation.validation.step2');
    }
    if (step === 3) {
      if (form.languages.length < LANGUAGE_NAMES.length || form.languages.some((l) => !l.level)) {
        return t('candidateA:profileCreation.validation.step3');
      }
    }
    if (step === 4) {
      if (!form.desiredStartDate) return t('candidateA:profileCreation.validation.step4');
    }
    if (step === 5) {
      if (!consents.cgu || !consents.privacy || !consents.certify) {
        return t('candidateA:profileCreation.validation.step5');
      }
    }
    return null;
  };

  const handleContinue = async () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 350));

    const avatarInitials = `${form.firstName[0] ?? ''}${form.lastName[0] ?? ''}`.toUpperCase();
    updateProfile({ ...form, avatarInitials });
    markStepComplete(step);

    if (!isOnline) {
      queueAction('submit_profile', { step, data: form });
    }

    setIsSubmitting(false);

    if (step < 5) {
      goToStep(step + 1);
    } else {
      router.replace('/dashboard');
    }
  };

  const title = t(`candidateA:profileCreation.steps.${step}.title`);
  const subtitle = t(`candidateA:profileCreation.steps.${step}.subtitle`);
  const arabic = STEP_ARABIC[step];
  const isLastStep = step === 5;

  return (
    <main className="mx-auto min-h-screen w-full max-w-md md:max-w-2xl bg-surface pb-32 shadow-subtle flex flex-col">
      <header className="sticky top-0 z-10 border-b border-surface-container-high bg-surface px-6 py-4">
        <div className="flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => goToStep(step - 1)}
              className="flex items-center gap-1 text-sm font-bold text-primary transition-opacity hover:opacity-80"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                arrow_back
              </span>
              {t('candidateA:profileCreation.back')}
            </button>
          ) : (
            <span />
          )}
          <h1 className="text-base font-extrabold text-primary">Amud Skills</h1>
          <span className="w-12" />
        </div>
      </header>

      <div className="flex-1 px-6 pt-6">
        <div className="mb-6 fade-in-entry opacity-0">
          <div className="mb-2 flex items-end justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-onSurface-variant">{t('candidateA:profileCreation.stepIndicator', { step, total: 5 })}</span>
            <span className="text-xs font-extrabold text-primary">{t('candidateA:profileCreation.percentComplete', { percent: Math.round((step / 5) * 100) })}</span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className={`h-2 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-primary' : 'bg-surface-container-high'}`} />
            ))}
          </div>
        </div>

        {step === 4 ? (
          <div className="fade-in-entry opacity-0 mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-low text-primary shadow-subtle">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 36 }}>
                rocket_launch
              </span>
            </div>
            <h2 className="text-[22px] font-extrabold text-primary">{title}</h2>
            <p className="text-base font-bold text-onSurface-variant" dir="rtl">{arabic}</p>
          </div>
        ) : step === 5 ? (
          <div className="fade-in-entry opacity-0 mb-6 flex flex-col items-center text-center">
            <div className="relative mb-3 flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 animate-pulse rounded-full bg-primary/10" />
              <div className="relative rounded-full bg-surface-container-lowest p-3 shadow-subtle">
                <span className="material-symbols-outlined fill text-primary" style={{ fontSize: 44 }}>
                  verified_user
                </span>
              </div>
            </div>
            <h2 className="text-2xl font-extrabold text-onSurface">{title}</h2>
            <p className="mt-1 text-lg font-bold text-primary" dir="rtl">{arabic}</p>
            <p className="mx-auto mt-2 max-w-md md:max-w-lg text-sm leading-relaxed text-onSurface-variant">{subtitle}</p>
          </div>
        ) : (
          <div className="fade-in-entry opacity-0 mb-6">
            <h2 className="text-[22px] font-extrabold leading-tight text-primary">
              {title}
              <br />
              <span className="text-base font-semibold text-primary/70" dir="rtl">{arabic}</span>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-onSurface-variant">{subtitle}</p>
          </div>
        )}

        {/* Step 1 — informations personnelles */}
        {step === 1 && (
          <div className="fade-in-entry stagger-1 opacity-0 space-y-4">
            <TextField label={t('candidateA:profileCreation.step1.arabicNameLabel')} value={arabicName} onChange={setArabicName} dir="rtl" placeholder="الاسم الكامل بالعربية" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label={t('candidateA:profileCreation.step1.firstNameLabel')} value={form.firstName} onChange={(v) => setForm((p) => ({ ...p, firstName: v }))} />
              <TextField label={t('candidateA:profileCreation.step1.lastNameLabel')} value={form.lastName} onChange={(v) => setForm((p) => ({ ...p, lastName: v }))} />
            </div>
            <TextField label={t('candidateA:profileCreation.step1.birthDateLabel')} type="date" value={form.birthDate} onChange={(v) => setForm((p) => ({ ...p, birthDate: v }))} />
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-onSurface">{t('candidateA:profileCreation.step1.regionLabel')}</label>
              <select
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                className="w-full rounded-pillar border border-outline-variant bg-surface-container-lowest px-4 py-3.5 text-sm font-semibold text-onSurface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
              >
                <option value="" disabled>{t('candidateA:profileCreation.step1.regionPlaceholder')}</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{t(`candidateA:profileCreation.regions.${r}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-onSurface">{t('candidateA:profileCreation.step1.whatsappLabel')}</label>
              <div className="relative">
                <input
                  disabled
                  dir="ltr"
                  value={user?.phone ?? '+212 6XX-XXXXXX'}
                  className="w-full cursor-not-allowed rounded-pillar border border-outline-variant bg-surface-container-low px-4 py-3.5 text-sm font-bold text-onSurface-variant"
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: 18 }}>
                  lock
                </span>
              </div>
              <p className="mt-1 px-1 text-[11px] text-onSurface-variant">{t('candidateA:profileCreation.step1.whatsappVerifiedNote')}</p>
            </div>
            <TextField label={t('candidateA:profileCreation.step1.emailLabel')} type="email" value={email} onChange={setEmail} placeholder={t('candidateA:profileCreation.step1.emailPlaceholder')} />
          </div>
        )}

        {/* Step 2 — secteur d'activité */}
        {step === 2 && (
          <div className="fade-in-entry stagger-1 opacity-0 space-y-6">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-primary">{t('candidateA:profileCreation.step2.sectorLabel')}</label>
              <div className="grid grid-cols-2 gap-3">
                {SECTORS.map((sector) => {
                  const isActive = form.sector === sector;
                  return (
                    <button
                      key={sector}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, sector }))}
                      className={`flex flex-col items-center gap-2 rounded-pillar border-2 p-4 text-center transition-all duration-200 active:scale-[0.98] ${
                        isActive
                          ? 'border-primary bg-surface-container-low shadow-sm'
                          : 'border-outline-variant bg-surface-container-lowest hover:border-primary/50 hover:bg-surface-container-low/50'
                      }`}
                    >
                      <span className={`material-symbols-outlined ${isActive ? 'fill text-primary' : 'text-primary/70'}`} style={{ fontSize: 28 }}>
                        {SECTOR_ICONS[sector] ?? 'work'}
                      </span>
                      <span className="text-sm font-extrabold text-primary">{sector}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="relative">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-onSurface">{t('candidateA:profileCreation.step2.searchSectorLabel')}</label>
              <div className="relative">
                <input
                  type="text"
                  value={sectorQuery}
                  onChange={(e) => setSectorQuery(e.target.value)}
                  onFocus={() => setIsSectorSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSectorSearchFocused(false), 150)}
                  placeholder={t('candidateA:profileCreation.step2.searchSectorPlaceholder')}
                  className="w-full rounded-pillar border border-outline-variant bg-surface-container-lowest px-4 py-3.5 pr-10 text-sm font-semibold text-onSurface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: 18 }}>
                  search
                </span>
              </div>
              {isSectorSearchFocused && sectorMatches.length > 0 && (
                <ul className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-lg">
                  {sectorMatches.map((sector) => (
                    <li key={sector}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectSector(sector)}
                        className="flex w-full items-center px-4 py-2.5 text-left text-sm font-semibold text-onSurface transition hover:bg-surface-container-low"
                      >
                        {sector}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {form.sector && !SECTORS.includes(form.sector) && (
                <p className="mt-1.5 px-1 text-[11px] font-bold text-primary">{t('candidateA:profileCreation.step2.selectedSectorPrefix', { sector: form.sector })}</p>
              )}
            </div>
            <TextField label={t('candidateA:profileCreation.step2.jobTitleLabel')} value={form.jobTitle} onChange={(v) => setForm((p) => ({ ...p, jobTitle: v }))} placeholder={t('candidateA:profileCreation.step2.jobTitlePlaceholder')} />
            <div className="flex items-center justify-between rounded-pillar border border-outline-variant bg-surface-container-lowest p-4 shadow-subtle">
              <div>
                <h3 className="text-sm font-bold text-primary">{t('candidateA:profileCreation.step2.experienceTitle')}</h3>
                <p className="text-xs text-onSurface-variant">{t('candidateA:profileCreation.step2.experienceSubtitle')}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, yearsExperience: Math.max(0, p.yearsExperience - 1) }))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant text-primary transition hover:bg-surface-container-low active:scale-95 shadow-sm"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>remove</span>
                </button>
                <span className="w-6 text-center text-lg font-extrabold text-primary">{form.yearsExperience}</span>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, yearsExperience: p.yearsExperience + 1 }))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant text-primary transition hover:bg-surface-container-low active:scale-95 shadow-sm"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — compétences linguistiques */}
        {step === 3 && (
          <div className="fade-in-entry stagger-1 opacity-0 space-y-4">
            {[...LANGUAGE_NAMES, ...extraLanguages].map((langName) => {
              const current = form.languages.find((l) => l.language === langName)?.level ?? null;
              const isCore = LANGUAGE_NAMES.includes(langName);
              const displayName = t(`candidateA:profileCreation.languageNames.${langName}`, { defaultValue: langName });
              return (
                <div key={langName} className="flex items-start gap-2 rounded-pillar border border-outline-variant bg-surface-container-lowest p-4 shadow-subtle">
                  <div className="flex-1">
                    <CEFRGauge label={displayName} level={current} interactive onChange={(level) => setLanguageLevel(langName, level)} />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLanguage(langName)}
                    aria-label={isCore ? t('candidateA:profileCreation.step3.resetLanguageAria', { language: displayName }) : t('candidateA:profileCreation.step3.removeLanguageAria', { language: displayName })}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-outline transition hover:bg-surface-container-high hover:text-error"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                  </button>
                </div>
              );
            })}

            {availableLanguagesToAdd.length > 0 && (
              <div className="space-y-2 rounded-pillar border border-dashed border-outline-variant bg-surface-container-lowest p-3">
                <div className="flex items-center gap-2">
                  <select
                    value={languageToAdd}
                    onChange={(e) => {
                      setLanguageToAdd(e.target.value);
                      setCustomLanguage('');
                    }}
                    className="flex-1 rounded-pillar border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm font-semibold text-onSurface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">{t('candidateA:profileCreation.step3.addLanguagePlaceholder')}</option>
                    {availableLanguagesToAdd.map((name) => (
                      <option key={name} value={name}>{t(`candidateA:profileCreation.languageNames.${name}`, { defaultValue: name })}</option>
                    ))}
                  </select>
                  {languageToAdd !== 'Autre' && (
                    <button
                      type="button"
                      onClick={handleAddLanguage}
                      disabled={!languageToAdd}
                      aria-label={t('candidateA:profileCreation.step3.addLanguageAria')}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-onPrimary shadow-sm transition-all active:scale-95 disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
                    </button>
                  )}
                </div>
                {languageToAdd === 'Autre' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customLanguage}
                      onChange={(e) => setCustomLanguage(e.target.value)}
                      placeholder={t('candidateA:profileCreation.step3.customLanguagePlaceholder')}
                      className="flex-1 rounded-pillar border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm font-semibold text-onSurface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={handleAddLanguage}
                      disabled={!customLanguage.trim()}
                      aria-label={t('candidateA:profileCreation.step3.addLanguageAria')}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-onPrimary shadow-sm transition-all active:scale-95 disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4 — disponibilités */}
        {step === 4 && (
          <div className="fade-in-entry stagger-1 opacity-0 space-y-5">
            <div className="space-y-3">
              {AVAILABILITY_OPTIONS.map((option) => {
                const isActive = selectedAvailability === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => selectAvailability(option)}
                    className={`flex w-full items-center rounded-pillar border-2 p-4 text-left transition-all duration-200 active:scale-[0.98] ${
                      isActive
                        ? 'border-primary bg-surface-container-low shadow-sm'
                        : 'border-outline-variant bg-surface-container-lowest hover:border-primary/50 hover:bg-surface-container-low/50'
                    }`}
                  >
                    <div className={`mr-3 rounded-pillar p-3 ${isActive ? 'bg-primary text-onPrimary' : 'bg-surface-container text-primary'}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: 24 }}>{option.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-onSurface">{t(`candidateA:profileCreation.step4.availability.${option.key}.label`)}</p>
                      <span className="mt-1 inline-flex items-center rounded px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-surface-container text-primary">
                        {t(`candidateA:profileCreation.step4.availability.${option.key}.badge`)}
                      </span>
                    </div>
                    {isActive && (
                      <span className="material-symbols-outlined fill text-primary" style={{ fontSize: 26 }}>
                        check_circle
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <label className="flex items-start gap-3 rounded-pillar border border-outline-variant bg-surface-container-lowest p-4 shadow-subtle cursor-pointer">
              <input
                type="checkbox"
                checked={wantsTraining}
                onChange={(e) => setWantsTraining(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary/30"
              />
              <span className="text-xs leading-relaxed text-onSurface font-medium">
                {t('candidateA:profileCreation.step4.trainingOptIn')}
              </span>
            </label>

            <div className="flex gap-3 rounded-pillar border border-primary/20 bg-surface-container-low p-4">
              <span className="material-symbols-outlined shrink-0 text-primary" style={{ fontSize: 20 }}>info</span>
              <p className="text-xs leading-relaxed text-primary font-medium">
                {t('candidateA:profileCreation.step4.infoTextPrefix')}
                {' '}<strong>&apos;{t('candidateA:profileCreation.step4.availability.immediate.badge')}&apos;</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Step 5 — consentements */}
        {step === 5 && (
          <div className="fade-in-entry stagger-1 opacity-0 space-y-4">
            <ConsentRow
              label={t('candidateA:profileCreation.step5.cgu')}
              required
              checked={consents.cgu}
              onChange={(v) => setConsents((p) => ({ ...p, cgu: v }))}
            />
            <ConsentRow
              label={t('candidateA:profileCreation.step5.privacy')}
              required
              checked={consents.privacy}
              onChange={(v) => setConsents((p) => ({ ...p, privacy: v }))}
            />
            <ConsentRow
              label={t('candidateA:profileCreation.step5.whatsapp')}
              checked={consents.whatsapp}
              onChange={(v) => setConsents((p) => ({ ...p, whatsapp: v }))}
            />
            <ConsentRow
              label={t('candidateA:profileCreation.step5.certify')}
              required
              checked={consents.certify}
              onChange={(v) => setConsents((p) => ({ ...p, certify: v }))}
            />
          </div>
        )}

        {error && <p className="mt-4 text-xs font-bold text-error animate-bounce">{error}</p>}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-md md:max-w-2xl border-t border-outline-variant bg-surface-container-lowest p-6 shadow-subtle">
        <button
          type="button"
          onClick={handleContinue}
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-pillar bg-primary py-4 text-sm font-bold text-onPrimary shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-40"
        >
          {isSubmitting
            ? t('candidateA:profileCreation.footer.saving')
            : isLastStep
              ? t('candidateA:profileCreation.footer.finish')
              : t('candidateA:profileCreation.footer.continueCta')}
          {!isLastStep && (
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
          )}
        </button>
      </div>
    </main>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  dir,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  dir?: 'rtl' | 'ltr';
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-onSurface">{label}</label>
      <input
        type={type}
        value={value}
        dir={dir}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-pillar border border-outline-variant bg-surface-container-lowest px-4 py-3.5 text-sm font-semibold text-onSurface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
      />
    </div>
  );
}

function ConsentRow({
  label,
  required = false,
  checked,
  onChange,
}: {
  label: string;
  required?: boolean;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const { t } = useLanguage();
  return (
    <label
      className={`flex items-start gap-4 rounded-pillar border p-4 shadow-subtle cursor-pointer transition-all ${
        checked ? 'border-green-500 bg-green-500/30' : 'border-outline-variant bg-surface-container-lowest hover:border-primary/50'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 rounded border-outline-variant accent-primary focus:ring-primary/30"
      />
      <div className="flex-1">
        <p className="text-xs font-medium text-onSurface leading-relaxed">{label}</p>
        {required ? (
          <span className="mt-1 block text-[10px] font-extrabold uppercase tracking-wider text-tertiary">{t('candidateA:profileCreation.step5.requiredBadge')}</span>
        ) : (
          <span className="mt-1 block text-[10px] italic text-onSurface-variant">{t('candidateA:profileCreation.step5.optionalBadge')}</span>
        )}
      </div>
    </label>
  );
}

export default function ProfileCreationPage() {
  return (
    <Suspense fallback={null}>
      <ProfileCreationContent />
    </Suspense>
  );
}

