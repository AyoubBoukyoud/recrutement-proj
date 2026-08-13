'use client';

// Interfaces 5 à 9 — Création de profil en 5 étapes (state interne + paramètre d'URL `step`).

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { useNetwork } from '@/context/NetworkContext';
import { CEFRGauge } from '@/components/shared/CEFRGauge';
import { SECTORS } from '@/lib/referenceData';
import { Button, IconButton } from '@/components/shared/Button';
import type { CEFRLevel, ProfileStep } from '@/lib/types';

const STEP_TITLES: Record<ProfileStep, { title: string; arabic: string; subtitle: string }> = {
  1: { title: 'Vos informations personnelles', arabic: 'معلوماتك الشخصية', subtitle: 'Ces informations permettent aux employeurs de vous identifier et de vous contacter facilement.' },
  2: { title: "Votre secteur d'activité", arabic: 'مجال عملي', subtitle: 'Choisissez le domaine qui correspond le mieux à vos compétences.' },
  3: { title: 'Vos compétences linguistiques', arabic: 'مهاراتي اللغوية', subtitle: 'Indiquez votre niveau dans chaque langue.' },
  4: { title: 'Quand êtes-vous disponible ?', arabic: 'متى أنت متاح؟', subtitle: 'Les employeurs allemands préfèrent les candidats disponibles rapidement.' },
  5: { title: 'Presque terminé !', arabic: 'على وشك الانتهاء!', subtitle: 'Pour finaliser votre inscription, veuillez accepter les conditions suivantes.' },
};

const LANGUAGE_NAMES = ['Allemand', 'Anglais', 'Français'];
const ADDITIONAL_LANGUAGE_OPTIONS = ['Arabe', 'Espagnol', 'Italien', 'Néerlandais', 'Portugais', 'Turc'];

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

  const selectedAvailability = AVAILABILITY_OPTIONS.find((o) => o.notice === form.noticePeriodWeeks)?.key ?? 'immediate';

  const selectAvailability = (option: (typeof AVAILABILITY_OPTIONS)[number]) => {
    setForm((prev) => ({ ...prev, desiredStartDate: addWeeks(option.startInWeeks), noticePeriodWeeks: option.notice }));
  };

  const validateStep = (): string | null => {
    if (step === 1) {
      if (!form.firstName || !form.lastName || !form.birthDate || !form.city) {
        return 'Merci de remplir tous les champs requis.';
      }
    }
    if (step === 2) {
      if (!form.sector || !form.jobTitle) return 'Merci de sélectionner un secteur et un métier.';
    }
    if (step === 3) {
      if (form.languages.length < LANGUAGE_NAMES.length || form.languages.some((l) => !l.level)) {
        return 'Merci de renseigner un niveau pour chaque langue.';
      }
    }
    if (step === 4) {
      if (!form.desiredStartDate) return 'Merci d\'indiquer une date de disponibilité.';
    }
    if (step === 5) {
      if (!consents.cgu || !consents.privacy || !consents.certify) {
        return 'Merci d\'accepter les conditions requises pour continuer.';
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

  const { title, arabic, subtitle } = STEP_TITLES[step];
  const isLastStep = step === 5;

  return (
    <main className="mx-auto min-h-screen max-w-md bg-surface pb-32 shadow-subtle flex flex-col">
      <header className="sticky top-0 z-10 border-b border-surface-container-high bg-surface px-6 py-4">
        <div className="flex items-center justify-between">
          {step > 1 ? (
            <Button
              variant="link"
              onClick={() => goToStep(step - 1)}
              className="gap-1 font-bold"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                arrow_back
              </span>
              Retour
            </Button>
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
            <span className="text-xs font-bold uppercase tracking-wider text-onSurface-variant">Étape {step}/5</span>
            <span className="text-xs font-extrabold text-primary">{Math.round((step / 5) * 100)}% complété</span>
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
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-onSurface-variant">{subtitle}</p>
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
            <TextField label="Nom complet en arabe" value={arabicName} onChange={setArabicName} dir="rtl" placeholder="الاسم الكامل بالعربية" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="Prénom en français" value={form.firstName} onChange={(v) => setForm((p) => ({ ...p, firstName: v }))} />
              <TextField label="Nom en français" value={form.lastName} onChange={(v) => setForm((p) => ({ ...p, lastName: v }))} />
            </div>
            <TextField label="Date de naissance" type="date" value={form.birthDate} onChange={(v) => setForm((p) => ({ ...p, birthDate: v }))} />
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-onSurface">Région de résidence</label>
              <select
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                className="w-full rounded-pillar border border-outline bg-surface-container-lowest px-4 py-3.5 text-sm font-semibold text-onSurface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
              >
                <option value="" disabled>Sélectionnez votre région</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-onSurface">Numéro WhatsApp</label>
              <div className="relative">
                <input
                  disabled
                  value={user?.phone ?? '+212 6XX-XXXXXX'}
                  className="w-full cursor-not-allowed rounded-pillar border border-outline bg-surface-container-low px-4 py-3.5 text-sm font-bold text-onSurface-variant"
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: 18 }}>
                  lock
                </span>
              </div>
              <p className="mt-1 px-1 text-[11px] text-onSurface-variant">Vérifié lors de l&apos;inscription.</p>
            </div>
            <TextField label="Adresse Email (optionnel)" type="email" value={email} onChange={setEmail} placeholder="exemple@email.com" />
          </div>
        )}

        {/* Step 2 — secteur d'activité */}
        {step === 2 && (
          <div className="fade-in-entry stagger-1 opacity-0 space-y-6">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-primary">Secteur d&apos;activité</label>
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
            <TextField label="Intitulé du poste" value={form.jobTitle} onChange={(v) => setForm((p) => ({ ...p, jobTitle: v }))} placeholder="ex: Électricien industriel, Infirmier…" />
            <div className="flex items-center justify-between rounded-pillar border border-outline-variant bg-surface-container-lowest p-4 shadow-subtle">
              <div>
                <h3 className="text-sm font-bold text-primary">Années d&apos;expérience</h3>
                <p className="text-xs text-onSurface-variant">Pratique réelle du métier</p>
              </div>
              <div className="flex items-center gap-3">
                <IconButton
                  variant="surface"
                  aria-label="Retirer une année d'expérience"
                  onClick={() => setForm((p) => ({ ...p, yearsExperience: Math.max(0, p.yearsExperience - 1) }))}
                  className="border border-outline-variant"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>remove</span>
                </IconButton>
                <span className="w-6 text-center text-lg font-extrabold text-primary">{form.yearsExperience}</span>
                <IconButton
                  variant="surface"
                  aria-label="Ajouter une année d'expérience"
                  onClick={() => setForm((p) => ({ ...p, yearsExperience: p.yearsExperience + 1 }))}
                  className="border border-outline-variant"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                </IconButton>
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
              return (
                <div key={langName} className="flex items-start gap-2 rounded-pillar border border-outline-variant bg-surface-container-lowest p-4 shadow-subtle">
                  <div className="flex-1">
                    <CEFRGauge label={langName} level={current} interactive onChange={(level) => setLanguageLevel(langName, level)} />
                  </div>
                  {!isCore && (
                    <IconButton
                      variant="destructive-ghost"
                      size="sm"
                      onClick={() => removeLanguage(langName)}
                      aria-label={`Retirer ${langName}`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                    </IconButton>
                  )}
                </div>
              );
            })}

            {availableLanguagesToAdd.length > 0 && (
              <div className="flex items-center gap-2 rounded-pillar border border-dashed border-outline-variant bg-surface-container-lowest p-3">
                <select
                  value={languageToAdd}
                  onChange={(e) => setLanguageToAdd(e.target.value)}
                  className="flex-1 rounded-pillar border border-outline bg-surface-container-lowest px-3 py-2.5 text-sm font-semibold text-onSurface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Ajouter une autre langue…</option>
                  {availableLanguagesToAdd.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <IconButton
                  variant="primary"
                  onClick={() => addLanguage(languageToAdd)}
                  disabled={!languageToAdd}
                  aria-label="Ajouter la langue"
                  className="shadow-sm"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
                </IconButton>
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
                      <p className="text-sm font-bold text-onSurface">{option.label}</p>
                      <span className="mt-1 inline-flex items-center rounded px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-surface-container text-primary">
                        {option.badge}
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
                className="mt-0.5 h-5 w-5 rounded border-outline text-primary focus:ring-primary/30"
              />
              <span className="text-xs leading-relaxed text-onSurface font-medium">
                Je suis intéressé par une formation en allemand avant mon départ (cours en ligne gratuits proposés par nos partenaires).
              </span>
            </label>

            <div className="flex gap-3 rounded-pillar border border-primary/20 bg-surface-container-low p-4">
              <span className="material-symbols-outlined shrink-0 text-primary" style={{ fontSize: 20 }}>info</span>
              <p className="text-xs leading-relaxed text-primary font-medium">
                Les employeurs allemands préfèrent les candidats disponibles rapidement. Si vous êtes flexible, indiquez
                {' '}<strong>&apos;Immédiat&apos;</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Step 5 — consentements */}
        {step === 5 && (
          <div className="fade-in-entry stagger-1 opacity-0 space-y-4">
            <ConsentRow
              label="J'accepte les Conditions Générales d'Utilisation d'Amud Skills"
              required
              checked={consents.cgu}
              onChange={(v) => setConsents((p) => ({ ...p, cgu: v }))}
            />
            <ConsentRow
              label="Je consens au traitement de mes données personnelles conformément à la loi marocaine (CNDP) et au règlement européen (RGPD/DSGVO)."
              required
              checked={consents.privacy}
              onChange={(v) => setConsents((p) => ({ ...p, privacy: v }))}
            />
            <ConsentRow
              label="J'accepte de recevoir des offres d'emploi et des communications par WhatsApp."
              checked={consents.whatsapp}
              onChange={(v) => setConsents((p) => ({ ...p, whatsapp: v }))}
            />
            <ConsentRow
              label="Je certifie que les informations fournies sont exactes et véridiques au mieux de ma connaissance."
              required
              checked={consents.certify}
              onChange={(v) => setConsents((p) => ({ ...p, certify: v }))}
            />
          </div>
        )}

        {error && <p className="mt-4 text-xs font-bold text-error animate-bounce">{error}</p>}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t border-outline-variant bg-surface-container-lowest p-6 shadow-subtle">
        <Button
          size="lg"
          fullWidth
          className="shadow-sm"
          onClick={handleContinue}
          disabled={isSubmitting}
          isLoading={isSubmitting}
          loadingLabel="Enregistrement…"
          trailingIcon={
            !isLastStep ? (
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                arrow_forward
              </span>
            ) : undefined
          }
        >
          {isLastStep ? 'Finaliser mon inscription' : 'Continuer'}
        </Button>
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
        className="w-full rounded-pillar border border-outline bg-surface-container-lowest px-4 py-3.5 text-sm font-semibold text-onSurface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
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
  return (
    <label className="flex items-start gap-4 rounded-pillar border border-outline-variant bg-surface-container-lowest p-4 shadow-subtle cursor-pointer transition-all hover:border-primary/50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 rounded border-outline accent-primary focus:ring-primary/30"
      />
      <div className="flex-1">
        <p className="text-xs font-medium text-onSurface leading-relaxed">{label}</p>
        {required ? (
          <span className="mt-1 block text-[10px] font-extrabold uppercase tracking-wider text-tertiary">Requis</span>
        ) : (
          <span className="mt-1 block text-[10px] italic text-onSurface-variant">(Optionnel)</span>
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

