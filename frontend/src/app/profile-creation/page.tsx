'use client';

// Interfaces 5 à 9 — Création de profil en 6 étapes (state interne + paramètre d'URL `step`).
//
// Chaque étape écrit directement sur l'API Laravel au moment de « Continuer » :
// il n'y a plus de brouillon local silencieux qui ne serait envoyé qu'à la fin.
// La visibilité recruteur démarre dès que les deux consentements (étape 6) sont
// enregistrés — pas à la soumission finale, qui ne fait que déclarer le dossier
// prêt (et qualifie un parrainage en attente).

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNetwork } from '@/context/NetworkContext';
import { CEFRGauge } from '@/components/shared/CEFRGauge';
import { SECTORS } from '@/lib/referenceData';
import { Button, IconButton } from '@/components/shared/Button';
import { AuthShell } from '@/components/AuthShell';
import { ApiError } from '@/lib/api';
import { candidateProfileRepository } from '@/data/candidateProfile';
import { useCandidateProfile, useInvalidateCandidateProfile } from '@/lib/useCandidateProfile';
import {
  AVAILABILITY_LABELS,
  EDUCATION_LEVEL_LABELS,
  LANGUAGE_LABELS,
  type AvailabilityStatus,
  type CefrLevel,
  type EducationLevel,
  type LanguageCode,
} from '@/lib/candidateProfile';

type Step = 1 | 2 | 3 | 4 | 5 | 6;
const STEPS: Step[] = [1, 2, 3, 4, 5, 6];

const STEP_TITLES: Record<Step, { title: string; arabic: string; subtitle: string }> = {
  1: { title: 'Vos informations personnelles', arabic: 'معلوماتك الشخصية', subtitle: 'Ces informations permettent aux employeurs de vous identifier et de vous contacter facilement.' },
  2: { title: 'Votre métier', arabic: 'مهنتي', subtitle: 'Choisissez le domaine qui correspond le mieux à vos compétences.' },
  3: { title: 'Votre formation', arabic: 'تكويني', subtitle: 'Le niveau de formation le plus élevé que vous avez obtenu.' },
  4: { title: 'Vos compétences linguistiques', arabic: 'مهاراتي اللغوية', subtitle: 'Indiquez votre niveau dans chaque langue.' },
  5: { title: 'Quand êtes-vous disponible ?', arabic: 'متى أنت متاح؟', subtitle: 'Les employeurs allemands préfèrent les candidats disponibles rapidement.' },
  6: { title: 'Presque terminé !', arabic: 'على وشك الانتهاء!', subtitle: 'Pour finaliser votre inscription, veuillez accepter les conditions suivantes.' },
};

const LANGUAGE_CODES: LanguageCode[] = ['fr', 'ar', 'en', 'de'];

const SECTOR_ICONS: Record<string, string> = {
  IT: 'computer',
  Santé: 'medical_services',
  BTP: 'construction',
  Artisanat: 'handyman',
  Hôtellerie: 'restaurant',
  Logistique: 'local_shipping',
};

const EDUCATION_LEVELS: EducationLevel[] = [
  'general_school',
  'vocational',
  'professional_training',
  'bachelor',
  'master',
  'other',
];

const AVAILABILITY_OPTIONS: { key: AvailabilityStatus; icon: string; badge: string }[] = [
  { key: 'immediate', icon: 'bolt', badge: 'Immédiat' },
  { key: 'within_1_month', icon: 'schedule', badge: 'Sous 30 jours' },
  { key: 'within_2_months', icon: 'event', badge: 'Sous 60 jours' },
];

function messageOf(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.isNetworkFailure) return "L'API est injoignable. Vérifiez votre connexion.";
    if (error.status === 401) return 'Votre session a expiré — reconnectez-vous.';
    return error.message || fallback;
  }
  return fallback;
}

function ProfileCreationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuth();
  const { isOnline } = useNetwork();
  const { data: profile, isLoading: profileLoading } = useCandidateProfile();
  const invalidateProfile = useInvalidateCandidateProfile();

  const stepParam = Number(searchParams.get('step') ?? '1');
  const step = (stepParam >= 1 && stepParam <= 6 ? stepParam : 1) as Step;

  // Étape 1
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  // Étape 2
  const [profession, setProfession] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [yearsExperience, setYearsExperience] = useState(0);
  // Étape 3
  const [educationLevel, setEducationLevel] = useState<EducationLevel | ''>('');
  const [educationField, setEducationField] = useState('');
  const [educationInstitution, setEducationInstitution] = useState('');
  // Étape 4
  const [languageLevels, setLanguageLevels] = useState<Record<LanguageCode, CefrLevel | null>>({
    fr: null,
    ar: null,
    en: null,
    de: null,
  });
  // Étape 5
  const [availability, setAvailability] = useState<AvailabilityStatus | ''>('');
  // Étape 6
  const [consents, setConsents] = useState({ cgu: false, privacy: false });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Le formulaire se pré-remplit avec ce qui existe déjà, une fois par visite
  // de l'étape — pas à chaque frappe, sinon la saisie en cours serait effacée
  // par le prochain rafraîchissement de la requête.
  useEffect(() => {
    if (!profile) return;
    setFirstName((v) => v || profile.first_name || '');
    setLastName((v) => v || profile.last_name || '');
    setBirthDate((v) => v || profile.date_of_birth || '');
    setProfession((v) => v || profile.profession || '');
    setSpecialization((v) => v || profile.specialization || '');
    setYearsExperience((v) => v || profile.years_of_experience || 0);
    setAvailability((v) => v || profile.availability_status || '');

    const existingEducation = profile.educations[0];
    if (existingEducation) {
      setEducationLevel((v) => v || existingEducation.level);
      setEducationField((v) => v || existingEducation.field || '');
      setEducationInstitution((v) => v || existingEducation.institution || '');
    }

    if (profile.languages.length > 0) {
      setLanguageLevels((prev) => {
        const next = { ...prev };
        for (const lang of profile.languages) {
          if (next[lang.language] === null) next[lang.language] = lang.cefr_level;
        }
        return next;
      });
    }

    setConsents((prev) => ({
      cgu: prev.cgu || Boolean(profile.terms_consent_at),
      privacy: prev.privacy || Boolean(profile.cndp_consent_at),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const goToStep = (target: number) => router.push(`/profile-creation?step=${target}`);

  const validateStep = (): string | null => {
    if (step === 1) {
      if (!firstName || !lastName || !birthDate) return 'Merci de remplir tous les champs requis.';
    }
    if (step === 3) {
      if (!educationLevel) return 'Merci de sélectionner votre niveau de formation.';
    }
    if (step === 4) {
      if (!LANGUAGE_CODES.some((code) => languageLevels[code])) {
        return 'Merci de renseigner un niveau pour au moins une langue.';
      }
    }
    if (step === 5) {
      if (!availability) return "Merci d'indiquer votre disponibilité.";
    }
    if (step === 6) {
      if (!consents.cgu || !consents.privacy) return 'Merci d\'accepter les conditions requises pour continuer.';
    }
    return null;
  };

  const saveStep = async (): Promise<void> => {
    if (!token) return;

    if (step === 1) {
      await candidateProfileRepository.update(
        { first_name: firstName, last_name: lastName, date_of_birth: birthDate },
        token
      );
    }
    if (step === 2) {
      await candidateProfileRepository.update(
        {
          profession: profession || null,
          specialization: specialization || null,
          years_of_experience: yearsExperience || null,
        },
        token
      );
    }
    if (step === 3 && educationLevel) {
      const existing = profile?.educations[0];
      if (existing) {
        await candidateProfileRepository.updateEducation(
          existing.id,
          { level: educationLevel, field: educationField || null, institution: educationInstitution || null },
          token
        );
      } else {
        await candidateProfileRepository.createEducation(
          { level: educationLevel, field: educationField || null, institution: educationInstitution || null },
          token
        );
      }
    }
    if (step === 4) {
      for (const code of LANGUAGE_CODES) {
        const level = languageLevels[code];
        const existing = profile?.languages.find((l) => l.language === code);
        // N'écrit que ce qui a changé — éviter cinq requêtes pour une langue.
        if (level !== (existing?.cefr_level ?? null)) {
          await candidateProfileRepository.upsertLanguage(code, level, token);
        }
      }
    }
    if (step === 5 && availability) {
      await candidateProfileRepository.update({ availability_status: availability }, token);
    }
    if (step === 6) {
      await candidateProfileRepository.update(
        { terms_accepted: consents.cgu, cndp_accepted: consents.privacy },
        token
      );
      await candidateProfileRepository.submit(token);
    }

    await invalidateProfile();
  };

  const handleContinue = async () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      await saveStep();
      if (step < 6) {
        goToStep(step + 1);
      } else {
        router.replace('/dashboard');
      }
    } catch (cause) {
      setError(messageOf(cause, "L'enregistrement a échoué. Réessayez."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const { title, arabic, subtitle } = STEP_TITLES[step];
  const isLastStep = step === 6;

  if (profileLoading) {
    return (
      <AuthShell flush>
        <main className="mx-auto flex min-h-screen max-w-md items-center justify-center bg-surface">
          <p className="helper-text">Chargement…</p>
        </main>
      </AuthShell>
    );
  }

  return (
    <AuthShell flush>
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
            <span className="text-xs font-bold uppercase tracking-wider text-onSurface-variant">Étape {step}/6</span>
            <span className="text-xs font-extrabold text-primary">{Math.round((step / 6) * 100)}% complété</span>
          </div>
          <div className="flex gap-1.5">
            {STEPS.map((s) => (
              <div key={s} className={`h-2 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-primary' : 'bg-surface-container-high'}`} />
            ))}
          </div>
        </div>

        {step === 5 ? (
          <div className="fade-in-entry opacity-0 mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-low text-primary shadow-subtle">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 36 }}>
                rocket_launch
              </span>
            </div>
            <h2 className="text-[22px] font-extrabold text-primary">{title}</h2>
            <p className="text-base font-bold text-onSurface-variant" dir="rtl">{arabic}</p>
          </div>
        ) : step === 6 ? (
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

        {/* Étape 1 — informations personnelles */}
        {step === 1 && (
          <div className="fade-in-entry stagger-1 opacity-0 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="Prénom" value={firstName} onChange={setFirstName} />
              <TextField label="Nom" value={lastName} onChange={setLastName} />
            </div>
            <TextField label="Date de naissance" type="date" value={birthDate} onChange={setBirthDate} />
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
          </div>
        )}

        {/* Étape 2 — métier */}
        {step === 2 && (
          <div className="fade-in-entry stagger-1 opacity-0 space-y-6">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-primary">Secteur d&apos;activité</label>
              <div className="grid grid-cols-2 gap-3">
                {SECTORS.map((sector) => {
                  const isActive = profession === sector;
                  return (
                    <button
                      key={sector}
                      type="button"
                      onClick={() => setProfession(sector)}
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
            <TextField label="Spécialisation" value={specialization} onChange={setSpecialization} placeholder="ex: Électricien industriel, Infirmier…" />
            <div className="flex items-center justify-between rounded-pillar border border-outline-variant bg-surface-container-lowest p-4 shadow-subtle">
              <div>
                <h3 className="text-sm font-bold text-primary">Années d&apos;expérience</h3>
                <p className="text-xs text-onSurface-variant">Pratique réelle du métier</p>
              </div>
              <div className="flex items-center gap-3">
                <IconButton
                  variant="surface"
                  aria-label="Retirer une année d'expérience"
                  onClick={() => setYearsExperience((v) => Math.max(0, v - 1))}
                  className="border border-outline-variant"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>remove</span>
                </IconButton>
                <span className="w-6 text-center text-lg font-extrabold text-primary">{yearsExperience}</span>
                <IconButton
                  variant="surface"
                  aria-label="Ajouter une année d'expérience"
                  onClick={() => setYearsExperience((v) => v + 1)}
                  className="border border-outline-variant"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                </IconButton>
              </div>
            </div>
          </div>
        )}

        {/* Étape 3 — formation */}
        {step === 3 && (
          <div className="fade-in-entry stagger-1 opacity-0 space-y-4">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-primary">Niveau de formation</label>
              <div className="grid grid-cols-1 gap-2.5">
                {EDUCATION_LEVELS.map((level) => {
                  const isActive = educationLevel === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setEducationLevel(level)}
                      className={`flex items-center justify-between rounded-pillar border-2 p-4 text-left transition-all duration-200 active:scale-[0.98] ${
                        isActive
                          ? 'border-primary bg-surface-container-low shadow-sm'
                          : 'border-outline-variant bg-surface-container-lowest hover:border-primary/50 hover:bg-surface-container-low/50'
                      }`}
                    >
                      <span className="text-sm font-bold text-onSurface">{EDUCATION_LEVEL_LABELS[level]}</span>
                      {isActive && (
                        <span className="material-symbols-outlined fill text-primary" style={{ fontSize: 22 }}>
                          check_circle
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <TextField label="Filière / domaine (optionnel)" value={educationField} onChange={setEducationField} placeholder="ex: Soins infirmiers, Électrotechnique…" />
            <TextField label="Établissement (optionnel)" value={educationInstitution} onChange={setEducationInstitution} placeholder="ex: ISTA Casablanca…" />
          </div>
        )}

        {/* Étape 4 — compétences linguistiques */}
        {step === 4 && (
          <div className="fade-in-entry stagger-1 opacity-0 space-y-4">
            {LANGUAGE_CODES.map((code) => (
              <div key={code} className="rounded-pillar border border-outline-variant bg-surface-container-lowest p-4 shadow-subtle">
                <CEFRGauge
                  label={LANGUAGE_LABELS[code]}
                  level={languageLevels[code]}
                  interactive
                  onChange={(level) => setLanguageLevels((prev) => ({ ...prev, [code]: level }))}
                />
              </div>
            ))}
          </div>
        )}

        {/* Étape 5 — disponibilités */}
        {step === 5 && (
          <div className="fade-in-entry stagger-1 opacity-0 space-y-5">
            <div className="space-y-3">
              {AVAILABILITY_OPTIONS.map((option) => {
                const isActive = availability === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setAvailability(option.key)}
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
                      <p className="text-sm font-bold text-onSurface">{AVAILABILITY_LABELS[option.key]}</p>
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

            <div className="flex gap-3 rounded-pillar border border-primary/20 bg-surface-container-low p-4">
              <span className="material-symbols-outlined shrink-0 text-primary" style={{ fontSize: 20 }}>info</span>
              <p className="text-xs leading-relaxed text-primary font-medium">
                Les employeurs allemands préfèrent les candidats disponibles rapidement. Si vous êtes flexible, indiquez
                {' '}<strong>&apos;Immédiatement&apos;</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Étape 6 — consentements */}
        {step === 6 && (
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
          </div>
        )}

        {error && <p className="fade-in-entry opacity-0 mt-4 text-xs font-bold text-error">{error}</p>}
        {!isOnline && (
          <p className="fade-in-entry opacity-0 mt-4 text-xs font-bold text-tertiary">
            Hors ligne — la sauvegarde demande une connexion. Réessayez une fois reconnecté.
          </p>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t border-outline-variant bg-surface-container-lowest px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 shadow-subtle">
        <Button
          size="lg"
          fullWidth
          className="shadow-sm"
          onClick={handleContinue}
          disabled={isSubmitting || !isOnline}
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
    </AuthShell>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-onSurface">{label}</label>
      <input
        type={type}
        value={value}
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
