'use client';

// Interface 11 — Ajout de documents & extraction du CV.
//
// L'écran pilote le pipeline du back de bout en bout : envoi du fichier,
// attente de l'analyse, puis confirmation. C'est la confirmation qui écrit sur
// le profil ; sans elle les valeurs lues resteraient dans l'extraction sans que
// rien ne les relise jamais.

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { useNetwork } from '@/context/NetworkContext';
import { DocumentViewer } from '@/components/shared/DocumentViewer';
import { Button } from '@/components/shared/Button';
import { ApiError } from '@/lib/api';
import { documentsRepository } from '@/data/documents';
import {
  DOCUMENT_TYPE_LABELS,
  STATUS_LABELS,
  fieldLabel,
  fileNameOf,
  isScanning,
  toLocalEntry,
  type BackendDocumentType,
  type CandidateDocument,
  type ExtractedFields,
  type ProfileUpdateResult,
} from '@/lib/documents';
import type { CandidateProfile, CEFRLevel } from '@/lib/types';

const DOC_TYPES: BackendDocumentType[] = ['cv', 'diploma', 'certificate'];

const LANGUAGE_NAMES: Record<string, string> = {
  fr: 'Français',
  ar: 'Arabe',
  en: 'Anglais',
  de: 'Allemand',
};

const EDUCATION_LEVELS: Record<string, string> = {
  general_school: 'Enseignement général',
  vocational: 'Formation professionnelle',
  professional_training: 'Formation qualifiante',
  bachelor: 'Licence',
  master: 'Master',
  other: 'Autre',
};

/** Le formulaire de vérification, dans l'ordre où le candidat les relit. */
type DraftKey =
  | 'full_name'
  | 'email'
  | 'phone'
  | 'profession'
  | 'specialization'
  | 'date_of_birth'
  | 'years_of_experience';

const DRAFT_FIELDS: { key: DraftKey; label: string; type?: string; placeholder?: string }[] = [
  { key: 'full_name', label: 'Nom complet' },
  { key: 'date_of_birth', label: 'Date de naissance', type: 'date' },
  { key: 'profession', label: 'Métier', placeholder: 'Infirmier, électricien…' },
  { key: 'specialization', label: 'Spécialisation', placeholder: 'Soins intensifs…' },
  { key: 'years_of_experience', label: "Années d'expérience", type: 'number' },
  { key: 'email', label: 'E-mail', type: 'email' },
  { key: 'phone', label: 'Téléphone', type: 'tel' },
];

type Draft = Record<DraftKey, string>;

function draftFrom(fields: ExtractedFields | null | undefined): Draft {
  const name = fields?.full_name || fields?.probable_name || '';
  const joined = [fields?.first_name, fields?.last_name].filter(Boolean).join(' ');

  return {
    // Gemini renvoie prénom et nom séparément, Tesseract une ligne devinée :
    // afficher celui des deux que le pipeline a réellement produit.
    full_name: name || joined,
    email: fields?.email ?? '',
    phone: fields?.phone ?? '',
    profession: fields?.profession ?? '',
    specialization: fields?.specialization ?? '',
    date_of_birth: (fields?.date_of_birth ?? '').slice(0, 10),
    years_of_experience: fields?.years_of_experience != null ? String(fields.years_of_experience) : '',
  };
}

/** Le brouillon corrigé, remis dans la forme que `review` attend. */
function fieldsFromDraft(fields: ExtractedFields | null | undefined, draft: Draft): ExtractedFields {
  const [first, ...rest] = draft.full_name.trim().split(/\s+/).filter(Boolean);

  return {
    ...(fields ?? {}),
    full_name: draft.full_name.trim(),
    // Le back sait scinder un nom complet, mais pas corriger un prénom devenu
    // faux : les deux colonnes sont réécrites depuis ce que le candidat lit.
    first_name: first ?? '',
    last_name: rest.join(' '),
    email: draft.email.trim(),
    phone: draft.phone.trim(),
    profession: draft.profession.trim(),
    specialization: draft.specialization.trim(),
    date_of_birth: draft.date_of_birth,
    years_of_experience: draft.years_of_experience === '' ? null : Number(draft.years_of_experience),
  };
}

/**
 * Le reste de la PWA lit le profil local, pas l'API. Les valeurs confirmées y
 * sont donc recopiées avec la même règle que côté serveur : on ne remplit que
 * ce qui est vide, sauf demande explicite de remplacement.
 */
function localProfilePatch(
  profile: CandidateProfile,
  fields: ExtractedFields,
  overwrite: boolean
): Partial<CandidateProfile> {
  const patch: Partial<CandidateProfile> = {};
  const [first, ...rest] = (fields.full_name ?? '').trim().split(/\s+/).filter(Boolean);
  const put = <K extends keyof CandidateProfile>(key: K, value: CandidateProfile[K] | '' | undefined) => {
    if (value === '' || value == null) return;
    if (!overwrite && profile[key]) return;
    patch[key] = value as CandidateProfile[K];
  };

  put('firstName', first);
  put('lastName', rest.join(' '));
  put('birthDate', fields.date_of_birth);
  put('jobTitle', fields.profession);
  put('sector', fields.specialization);
  if (typeof fields.years_of_experience === 'number' && fields.years_of_experience > 0) {
    if (overwrite || !profile.yearsExperience) patch.yearsExperience = fields.years_of_experience;
  }

  const extracted = (fields.languages ?? [])
    .filter((entry) => entry.language && entry.cefr_level)
    .map<CEFRLevel>((entry) => ({
      language: LANGUAGE_NAMES[entry.language as string] ?? (entry.language as string),
      level: entry.cefr_level as CEFRLevel['level'],
    }));

  if (extracted.length > 0) {
    const merged = [...profile.languages];
    for (const lang of extracted) {
      const index = merged.findIndex((l) => l.language === lang.language);
      if (index === -1) merged.push(lang);
      else if (overwrite) merged[index] = lang;
    }
    patch.languages = merged;
  }

  const initials = `${patch.firstName ?? profile.firstName} ${patch.lastName ?? profile.lastName}`
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
  if (initials) patch.avatarInitials = initials;

  return patch;
}

function messageOf(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.isNetworkFailure) return "L'API est injoignable. Vérifiez votre connexion.";
    if (error.status === 401) return 'Votre session a expiré — reconnectez-vous.';
    if (error.status === 413 || error.status === 422) return 'Fichier refusé : PDF, JPG ou PNG, 10 Mo maximum.';
    return error.message || fallback;
  }
  return fallback;
}

export default function DocumentsPage() {
  const { token } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { isOnline } = useNetwork();

  const [selectedType, setSelectedType] = useState<BackendDocumentType>('cv');
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [active, setActive] = useState<CandidateDocument | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [result, setResult] = useState<ProfileUpdateResult | null>(null);
  const [busy, setBusy] = useState<'upload' | 'review' | 'retry' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const importInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  // Le brouillon n'est initialisé qu'une fois par document : le polling
  // continue de renvoyer l'extraction, et l'écraser effacerait les corrections
  // en cours de saisie.
  const draftFor = useRef<number | null>(null);

  const refreshList = useCallback(async () => {
    if (!token) return;
    try {
      setDocuments(await documentsRepository.list(token));
    } catch {
      // La liste est secondaire : un échec ici ne doit pas masquer l'envoi.
    }
  }, [token]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  // Attente de l'analyse. Le job tourne en file d'attente côté back, donc le
  // statut ne bouge qu'entre deux requêtes — on interroge jusqu'à ce qu'il se fige.
  useEffect(() => {
    if (!token || !active || !isScanning(active.ocr_status)) return;

    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const fresh = await documentsRepository.get(active.id, token);
        if (cancelled) return;
        setActive(fresh);
        if (!isScanning(fresh.ocr_status)) void refreshList();
      } catch {
        // Un trou de réseau ne doit pas arrêter l'attente : la prochaine
        // itération réessaiera.
      }
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [token, active, refreshList]);

  // L'analyse est terminée : pré-remplir le formulaire de vérification.
  useEffect(() => {
    if (!active || isScanning(active.ocr_status) || draftFor.current === active.id) return;
    draftFor.current = active.id;
    setDraft(draftFrom(active.extraction?.extracted_fields));
  }, [active]);

  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  const startUpload = async (file: File | undefined) => {
    if (!file || !token) return;
    setBusy('upload');
    setError(null);
    setResult(null);
    setDraft(null);
    draftFor.current = null;

    try {
      const created = await documentsRepository.upload(file, selectedType, token);
      setActive(created);
      updateProfile({ documents: [...profile.documents, toLocalEntry(created, file.name)] });
      void refreshList();
    } catch (cause) {
      setError(messageOf(cause, "L'envoi a échoué. Réessayez."));
    } finally {
      setBusy(null);
    }
  };

  const confirm = async (overwrite: boolean) => {
    if (!active || !draft || !token) return;
    setBusy('review');
    setError(null);

    const fields = fieldsFromDraft(active.extraction?.extracted_fields, draft);

    try {
      const response = await documentsRepository.review(active.id, fields, token, overwrite);
      setResult(response.profile_update);
      updateProfile(localProfilePatch(profile, fields, overwrite));
      void refreshList();
      notify(
        response.profile_update.applied.length > 0
          ? `Profil complété : ${response.profile_update.applied.map(fieldLabel).join(', ')}.`
          : 'Document enregistré — rien de nouveau à ajouter au profil.'
      );
    } catch (cause) {
      setError(messageOf(cause, "Impossible d'appliquer ces informations à votre profil."));
    } finally {
      setBusy(null);
    }
  };

  const relaunch = async () => {
    if (!active || !token) return;
    setBusy('retry');
    setError(null);

    try {
      setActive(await documentsRepository.retry(active.id, token));
      draftFor.current = null;
    } catch (cause) {
      setError(messageOf(cause, 'La nouvelle analyse n\'a pas pu démarrer.'));
    } finally {
      setBusy(null);
    }
  };

  const replace = async (file: File | undefined) => {
    if (!file || !active || !token) return;
    setBusy('retry');
    setError(null);

    try {
      setActive(await documentsRepository.rescan(active.id, file, token));
      draftFor.current = null;
      setDraft(null);
      void refreshList();
    } catch (cause) {
      setError(messageOf(cause, 'Le remplacement a échoué.'));
    } finally {
      setBusy(null);
    }
  };

  const reset = () => {
    setActive(null);
    setDraft(null);
    setResult(null);
    setError(null);
    draftFor.current = null;
  };

  const fields = active?.extraction?.extracted_fields;
  const scanning = active != null && isScanning(active.ocr_status);
  const uploadDisabled = !token || !isOnline || busy !== null;

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-outline-variant/30 bg-surface/90 px-6 py-4 backdrop-blur-md lg:px-10">
        <Link href="/dashboard" className="text-primary-dark transition-opacity hover:opacity-80">
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
        </Link>
        <h1 className="text-lg font-bold text-primary-dark">Ajouter un document</h1>
      </header>

      <main className="mx-auto max-w-xl space-y-6 px-6 pt-6 lg:max-w-3xl lg:px-10 lg:pt-8">
        {!token && (
          <p className="rounded-xl bg-error-light p-3 text-sm font-medium text-onError-container">
            Connectez-vous pour envoyer un document et faire remplir votre profil automatiquement.
          </p>
        )}
        {token && !isOnline && (
          <p className="rounded-xl bg-secondary-light p-3 text-sm font-medium text-onSecondary-container">
            Hors ligne — l&apos;analyse d&apos;un document demande une connexion. Réessayez une fois reconnecté.
          </p>
        )}

        <section>
          <div className="flex justify-between gap-1 overflow-x-auto rounded-xl bg-surface-container p-1">
            {DOC_TYPES.map((type) => (
              <Button
                key={type}
                variant={selectedType === type ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedType(type)}
                disabled={active != null}
                aria-pressed={selectedType === type}
                className="flex-1 whitespace-nowrap"
              >
                {DOCUMENT_TYPE_LABELS[type]}
              </Button>
            ))}
          </div>
        </section>

        <input
          ref={importInput}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          className="hidden"
          onChange={(e) => {
            void startUpload(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            void startUpload(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <input
          ref={replaceInput}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          className="hidden"
          onChange={(e) => {
            void replace(e.target.files?.[0]);
            e.target.value = '';
          }}
        />

        {!active && (
          <section>
            <button
              type="button"
              onClick={() => importInput.current?.click()}
              disabled={uploadDisabled}
              className="group flex w-full flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-lowest p-10 text-center transition-colors hover:border-primary-container hover:bg-surface-container-low disabled:opacity-50"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container text-primary-container transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined" style={{ fontSize: 30 }}>
                  {busy === 'upload' ? 'hourglass_top' : 'upload_file'}
                </span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-onSurface">
                  {busy === 'upload' ? 'Envoi en cours…' : 'Prenez une photo ou importez un fichier'}
                </h3>
                <p className="text-sm text-outline">PDF, JPG, PNG — Max 10 Mo</p>
                {selectedType === 'cv' && (
                  <p className="mt-2 text-sm text-onSurface-variant">
                    Votre CV remplit tout seul votre nom, votre métier, vos formations et vos langues.
                  </p>
                )}
              </div>
            </button>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => cameraInput.current?.click()}
                disabled={uploadDisabled}
                leadingIcon={
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    photo_camera
                  </span>
                }
              >
                Prendre une photo
              </Button>
              <Button
                variant="outline"
                onClick={() => importInput.current?.click()}
                disabled={uploadDisabled}
                leadingIcon={
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    image
                  </span>
                }
              >
                Importer
              </Button>
            </div>
          </section>
        )}

        {scanning && (
          <section className="space-y-4">
            <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-lg">
              <div className="absolute inset-x-0 top-0 h-1 animate-[scan_1.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-primary-container to-transparent shadow-[0_0_15px_2px_rgba(27,94,55,0.5)]" />
              <div className="absolute inset-0 flex items-center justify-center bg-primary-container/10">
                <div className="rounded-full bg-surface-container-lowest/90 px-6 py-2 shadow-sm backdrop-blur-sm">
                  <span className="font-medium text-primary-container">{STATUS_LABELS[active.ocr_status]}</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 text-primary-container">
                <span className="material-symbols-outlined animate-pulse" style={{ fontSize: 40 }}>document_scanner</span>
              </div>
            </div>
            <p className="text-center text-sm text-onSurface-variant">
              La lecture demande une quinzaine de secondes. Vous pouvez laisser cet écran ouvert.
            </p>
          </section>
        )}

        {active?.ocr_status === 'failed' && (
          <section className="space-y-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-soft">
            <div className="flex items-center gap-2 text-error">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
              <span className="text-sm font-bold">{STATUS_LABELS.failed}</span>
            </div>
            <p className="text-sm text-onSurface-variant">
              Rien de lisible n&apos;est ressorti de cette page. Une nouvelle photo suffit le plus souvent :
              posez le document à plat, cadrez-le entièrement, évitez les ombres et le flash.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => void relaunch()} disabled={busy !== null}>
                Relancer l&apos;analyse
              </Button>
              <Button onClick={() => replaceInput.current?.click()} disabled={busy !== null}>
                Remplacer le fichier
              </Button>
            </div>
          </section>
        )}

        {active && draft && (active.ocr_status === 'completed' || active.ocr_status === 'needs_review') && (
          <section className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-6 shadow-soft">
            <div className="mb-6 flex items-center justify-between">
              <span className="flex items-center gap-1 rounded-full bg-primary-container/10 px-3 py-1 text-xs font-bold text-primary-container">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                {active.ocr_status === 'completed' ? 'Analyse terminée' : 'À vérifier'}
              </span>
              {active.extraction?.confidence != null && (
                <span className="text-xs text-outline">Fiabilité {active.extraction.confidence}%</span>
              )}
            </div>

            {active.ocr_status === 'needs_review' && (
              <p className="mb-4 rounded-xl bg-secondary-light p-3 text-xs font-medium text-onSecondary-container">
                Une partie du document était difficile à lire. Corrigez ce qui est faux et complétez ce qui
                manque : ce que vous confirmez ici est ce qui sera enregistré sur votre profil.
              </p>
            )}

            <div className="space-y-4">
              {DRAFT_FIELDS.map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-outline">{label}</label>
                  <input
                    value={draft[key]}
                    type={type ?? 'text'}
                    placeholder={placeholder}
                    onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                    className="w-full rounded-xl border border-outline bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary-container"
                  />
                </div>
              ))}
            </div>

            {(fields?.educations?.length ?? 0) > 0 && (
              <div className="mt-5">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-outline">Formations lues</h4>
                <ul className="space-y-1.5">
                  {fields?.educations?.map((education, index) => (
                    <li key={index} className="rounded-xl bg-surface-container p-3 text-sm text-onSurface">
                      <span className="font-semibold">{EDUCATION_LEVELS[education.level ?? ''] ?? education.level}</span>
                      {education.field ? ` — ${education.field}` : ''}
                      {education.institution ? (
                        <span className="block text-xs text-onSurface-variant">{education.institution}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(fields?.languages?.length ?? 0) > 0 && (
              <div className="mt-5">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-outline">Langues lues</h4>
                <div className="flex flex-wrap gap-2">
                  {fields?.languages?.map((language, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-primary-light px-3 py-1 text-xs font-bold text-onPrimary-container"
                    >
                      {LANGUAGE_NAMES[language.language ?? ''] ?? language.language}
                      {language.cefr_level ? ` · ${language.cefr_level}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result ? (
              <div className="mt-6 space-y-3">
                <p className="rounded-xl bg-primary-light p-3 text-sm font-medium text-onPrimary-container">
                  {result.applied.length > 0
                    ? `Ajouté à votre profil : ${result.applied.map(fieldLabel).join(', ')}.`
                    : 'Document enregistré. Votre profil contenait déjà ces informations.'}
                </p>
                {result.skipped.length > 0 && (
                  <div className="space-y-2 rounded-xl bg-secondary-light p-3">
                    <p className="text-xs font-medium text-onSecondary-container">
                      Conservé tel que vous l&apos;aviez saisi : {result.skipped.map(fieldLabel).join(', ')}. Le
                      document indique autre chose.
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="underline"
                      onClick={() => void confirm(true)}
                      disabled={busy !== null}
                    >
                      Utiliser plutôt les valeurs du document
                    </Button>
                  </div>
                )}
                <Button variant="outline" fullWidth onClick={reset}>
                  Ajouter un autre document
                </Button>
              </div>
            ) : (
              <Button
                size="lg"
                fullWidth
                className="mt-6 shadow-sm"
                onClick={() => void confirm(false)}
                disabled={busy !== null}
                isLoading={busy === 'review'}
                loadingLabel="Enregistrement…"
              >
                Confirmer et compléter mon profil
              </Button>
            )}
          </section>
        )}

        {error && (
          <p className="rounded-xl bg-error-light p-3 text-sm font-medium text-onError-container">{error}</p>
        )}

        {toast && (
          <div className="flex items-center gap-2 rounded-xl bg-primary-container/10 p-3 text-xs font-semibold text-primary-container">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
            {toast}
          </div>
        )}

        <section className="space-y-3 pb-6">
          <h2 className="px-1 text-lg font-bold text-onSurface">Documents importés ({documents.length})</h2>
          {documents.length === 0 ? (
            <p className="rounded-xl bg-surface-container p-4 text-center text-sm text-onSurface-variant">
              Aucun document pour le moment.
            </p>
          ) : (
            <div className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
              {documents.map((document) => (
                <div key={document.id} className="space-y-1">
                  <DocumentViewer document={toLocalEntry(document, fileNameOf(document))} previewUrl={document.url} />
                  <div className="flex items-center justify-between px-1 text-xs text-onSurface-variant">
                    <span>
                      {DOCUMENT_TYPE_LABELS[document.type]} — {STATUS_LABELS[document.ocr_status]}
                    </span>
                    {active?.id !== document.id && !isScanning(document.ocr_status) && document.extraction && (
                      <Button
                        variant="link"
                        onClick={() => {
                          draftFor.current = null;
                          setResult(null);
                          setError(null);
                          setActive(document);
                        }}
                      >
                        Vérifier
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
