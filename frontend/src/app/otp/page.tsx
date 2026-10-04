"use client";

// Interface 4 — Vérification OTP : saisie automatique 6 chiffres, validation déclenche la navigation.

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { otpFailureMessage } from "@/lib/authMessages";
import { useProfile } from "@/context/ProfileContext";
import { useLanguage } from "@/context/LanguageContext";
import { destinationForRole } from "@/lib/roleDestination";
import { Button } from "@/components/shared/Button";
import { AuthShell } from "@/components/AuthShell";
import type { TranslationKey } from "@/lib/i18n";
import {
  clearPendingGoogleLink,
  readPendingGoogleLink,
} from "@/lib/googleAuth";

/** Connexion réussie, mais quelque chose est à dire avant de rediriger. */
type Notice = {
  destination: string;
  title: TranslationKey;
  body: TranslationKey;
  cta: TranslationKey;
};

const RESEND_SECONDS = 45;

function OtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";
  const intent =
    searchParams.get("intent") === "recruiter" ? "recruiter" : "job_seeker";
  const initialDebugCode = searchParams.get("debug_code");
  const { verifyOtp, requestOtp, resendAvailableIn } = useAuth();
  const { getIncompleteStep } = useProfile();
  const { t } = useLanguage();

  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(
    resendAvailableIn ?? RESEND_SECONDS,
  );
  const [debugCode, setDebugCode] = useState<string | null>(initialDebugCode);
  const [shake, setShake] = useState(false);
  // Rempli quand la connexion a réussi mais qu'il faut prévenir avant de
  // rediriger : « Je recrute » choisi par un compte qui n'est que candidat,
  // ou compte Google qui n'a pas pu être rattaché à ce numéro.
  const [notice, setNotice] = useState<Notice | null>(null);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  // « Retour » garde un rattachement Google en cours plutôt que de l'abandonner.
  const [backHref, setBackHref] = useState("/auth-phone?method=phone");

  useEffect(() => {
    inputsRef.current[0]?.focus();
    if (readPendingGoogleLink()) setBackHref("/auth-phone?google=link");
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    if (char && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
    if (next.every((d) => d !== "")) {
      submitCode(next.join(""));
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  // Chaque case a `maxLength={1}` : coller un code entier s'y tronque à un
  // seul caractère avant même que `onChange` ne le voie. Il faut donc lire
  // le presse-papiers ici et répartir les chiffres nous-mêmes.
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();

    const next = Array(6).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, 5)]?.focus();
    if (next.every((d) => d !== "")) {
      submitCode(next.join(""));
    }
  };

  const submitCode = async (code: string) => {
    setError(null);
    setIsVerifying(true);
    // Présent quand ce code termine un « Continuer avec Google ».
    const googleLink = readPendingGoogleLink();
    const result = await verifyOtp(code, phone || undefined, googleLink?.ticket);
    setIsVerifying(false);
    if (!result.ok) {
      setError(otpFailureMessage(result, t));
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setDigits(Array(6).fill(""));
      inputsRef.current[0]?.focus();
      return;
    }

    clearPendingGoogleLink();

    const destination = result.deletionPending
      ? "/compte"
      : destinationForRole(result.role, getIncompleteStep());

    // Le numéro est vérifié et la session ouverte ; seul le rattachement
    // Google a échoué — on le dit plutôt que de le taire.
    if (result.googleLink === "conflict" || result.googleLink === "expired") {
      setNotice({
        destination,
        title: "google_link_failed_title",
        body:
          result.googleLink === "conflict"
            ? "google_link_conflict_body"
            : "google_link_expired_body",
        cta: "google_link_failed_cta",
      });
      return;
    }

    // Le rôle réel décide toujours de la destination — « Je recrute » n'est
    // qu'une intention. Si le compte n'a pas d'accès recruteur, la connexion
    // reste valide (candidat) mais on le dit avant de rediriger.
    if (intent === "recruiter" && result.role === "candidate") {
      setNotice({
        destination,
        title: "recruiter_access_pending_title",
        body: "recruiter_access_pending_body",
        cta: "recruiter_access_pending_cta",
      });
      return;
    }

    router.replace(destination);
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || isResending) return;
    setIsResending(true);
    setError(null);
    const result = await requestOtp(phone);
    setIsResending(false);

    if (!result.ok) {
      setError(otpFailureMessage(result, t));
      // Un refus pour cause de quota porte son propre délai ; toute autre
      // erreur laisse le bouton disponible pour réessayer tout de suite.
      if (result.retryAfter) setSecondsLeft(result.retryAfter);
      return;
    }

    setSecondsLeft(result.resendAvailableIn);
    setDebugCode(result.debugCode);
    setDigits(Array(6).fill(""));
    inputsRef.current[0]?.focus();
  };

  if (notice) {
    return (
      <AuthShell>
        <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-surface px-6 py-10 text-center shadow-subtle outline-none">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-low text-primary shadow-subtle">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 44 }}
            >
              info
            </span>
          </div>
          <h2 className="mb-2 text-2xl font-extrabold text-onSurface">
            {t(notice.title)}
          </h2>
          <p className="mx-auto mb-8 max-w-[320px] text-sm leading-relaxed text-onSurface-variant">
            {t(notice.body)}
          </p>
          <Button
            size="lg"
            onClick={() => router.replace(notice.destination)}
            className="w-full max-w-[340px] shadow-sm"
          >
            {t(notice.cta)}
          </Button>
        </main>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-screen max-w-md flex-col bg-surface shadow-subtle outline-none">
        <header className="sticky top-0 z-10 border-b border-surface-container-high bg-surface px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={backHref}
              aria-label="Retour"
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-container-low"
            >
              <span
                className="material-symbols-outlined text-primary"
                style={{ fontSize: 22 }}
              >
                arrow_back
              </span>
            </Link>
            <h1 className="text-lg font-extrabold text-primary">
              {t("otp_screen_label")}
            </h1>
          </div>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
          <div className="fade-in-entry opacity-0 mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-low text-primary shadow-subtle">
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontSize: 44 }}
            >
              mark_email_read
            </span>
          </div>

          <div className="fade-in-entry opacity-0 text-center mb-8">
            <h2 className="text-2xl font-extrabold text-onSurface mb-2">
              {t("otp_title")}
            </h2>
            {/*
             * Un code renvoyé par l'API (`debug_otp_code`) signifie qu'il n'est
             * parti que dans le journal du serveur — local/testing uniquement,
             * quand la passerelle WhatsApp n'a pas pu l'envoyer. Dire « nous
             * avons envoyé un code » laissait attendre un message qui n'arrivait
             * jamais.
             */}
            <p className="mx-auto max-w-[320px] text-sm leading-relaxed text-onSurface-variant">
              {debugCode ? t("otp_local_subtitle_prefix") : t("otp_subtitle_prefix")}{" "}
              <span className="font-bold text-primary">{phone || "—"}</span>
            </p>
          </div>

          <form
            className="fade-in-entry stagger-1 opacity-0 flex w-full flex-col items-center gap-6"
            onSubmit={(e) => e.preventDefault()}
          >
            {debugCode && (
              <div
                role="status"
                className="flex flex-col items-center gap-1 rounded-pillar border border-primary/30 bg-primary-light px-5 py-3"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-onSurface-variant">
                  {t("otp_local_code_label")}
                </span>
                <span className="font-mono text-2xl font-bold tracking-[0.3em] text-primary">{debugCode}</span>
              </div>
            )}
            <fieldset
              className={`flex items-center justify-center gap-2 border-0 p-0 m-0 ${shake ? "animate-[shake_0.4s]" : ""}`}
            >
              <legend className="sr-only">{t("otp_title")}</legend>
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputsRef.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  aria-label={`${t("otp_digit_label")} ${index + 1}`}
                  value={digit}
                  disabled={isVerifying}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={`h-12 w-11 rounded-pillar border border-outline bg-surface-container-lowest text-center text-xl font-extrabold text-primary outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 shadow-sm ${
                    error ? "border-error ring-2 ring-error/20" : ""
                  }`}
                />
              ))}
            </fieldset>

            <div className="flex flex-col items-center gap-1.5 text-center">
              {secondsLeft > 0 ? (
                <p className="text-xs font-medium text-outline">
                  {t("otp_resend_countdown_prefix")} 0:
                  {String(secondsLeft).padStart(2, "0")}
                </p>
              ) : null}
              <Button
                variant="link"
                onClick={handleResend}
                disabled={secondsLeft > 0 || isResending}
                className="font-semibold"
              >
                {t("otp_resend_cta")}
              </Button>
            </div>

            {isVerifying && (
              <p className="text-center text-xs font-medium text-primary animate-pulse">
                {t("otp_verifying")}
              </p>
            )}
            {error && (
              <p role="alert" className="text-center text-xs font-semibold text-error">
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              onClick={() => submitCode(digits.join(""))}
              disabled={isVerifying || digits.some((d) => !d)}
              isLoading={isVerifying}
              loadingLabel={t("loading")}
              className="w-full max-w-[340px] shadow-sm"
            >
              {isVerifying ? t("loading") : t("otp_verify_cta")}
            </Button>
          </form>
        </div>

        <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
      `}</style>
      </main>
    </AuthShell>
  );
}

export default function OtpPage() {
  return (
    <Suspense fallback={null}>
      <OtpContent />
    </Suspense>
  );
}
