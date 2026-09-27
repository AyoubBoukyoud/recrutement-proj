"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  readStorage,
  writeStorage,
  removeStorage,
  STORAGE_KEYS,
} from "@/lib/storage";
import { setCookie, deleteCookie } from "@/lib/cookies";
import { isProtectedPath } from "@/lib/protectedRoutes";
import { ApiError } from "@/lib/api";
import { authRepository, type OtpVerifyResponse } from "@/data/auth";
import type { AuthUser, UserRole } from "@/lib/types";

/**
 * Pourquoi une étape d'authentification a échoué, dans les termes de l'écran
 * plutôt que ceux d'HTTP : chaque page traduit ces cas en message localisé.
 */
export type AuthFailure =
  | "invalid"
  | "expired"
  | "too_many_attempts"
  | "throttled"
  | "delivery"
  | "network"
  /** Compte bloqué ou désactivé côté back : réessayer n'y changera rien. */
  | "blocked"
  | "unknown";

type Failure = { ok: false; reason: AuthFailure; retryAfter?: number };

/** Delivery details are retained so local development can display the code
 * returned by Laravel's log channel. Real WhatsApp/SMS responses never carry
 * a debug code, and production is additionally blocked server-side. */
export type OtpDispatch = {
  debugCode: string | null;
  channel: string;
  resendAvailableIn: number;
  expiresIn: number;
};

export type AuthResult = ({ ok: true } & OtpDispatch) | Failure;

/** Le rôle est connu dès la vérification réussie — inutile d'attendre le
 *  prochain rendu pour savoir où envoyer l'appelant. */
export type VerifyResult =
  | {
      ok: true;
      role: UserRole;
      deletionPending: boolean;
      /** Issue du rattachement Google demandé avec ce code, s'il y en avait un. */
      googleLink: OtpVerifyResponse["google_link"];
    }
  | Failure;

/** Le compte réellement consulté pendant une session empruntée. */
export type Impersonation = {
  token: string;
  user: AuthUser;
};

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  pendingPhone: string | null;
  /** L'administrateur mis de côté, non nul uniquement pendant un emprunt. */
  impersonator: AuthUser | null;
  /** Ouvre la session de quelqu'un d'autre en gardant la sienne de côté. */
  impersonate: (token: string, user: AuthUser) => void;
  /** Rend la session empruntée et restaure celle de l'administrateur. */
  stopImpersonating: () => void;
  /** Secondes avant de pouvoir redemander un code, telles qu'annoncées par l'API. */
  resendAvailableIn: number | null;
  requestOtp: (phone: string, referralToken?: string) => Promise<AuthResult>;
  /** `phone` prime sur `pendingPhone` : l'écran OTP le tient de son URL et
   *  survit donc à un rechargement de la PWA. */
  verifyOtp: (
    code: string,
    phone?: string,
    googleLinkTicket?: string,
  ) => Promise<VerifyResult>;
  /** Termine « Continuer avec Google » : même session qu'après un code OTP. */
  signInWithGoogleCode: (code: string) => Promise<VerifyResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Les rôles Spatie du back, traduits dans le vocabulaire de l'application. */
const ROLE_BY_BACKEND_NAME: Record<string, UserRole> = {
  Administrator: "admin",
  Company: "employer",
  "Commercial Agent": "agent",
  User: "candidate",
};

const DEFAULT_NAME_BY_ROLE: Record<UserRole, string> = {
  candidate: "Nouveau Candidat",
  employer: "Espace Employeur",
  admin: "Administrateur",
  agent: "Agent commercial",
};

function roleFrom(roles: string[]): UserRole {
  // Administrator l'emporte : un compte qui cumule les rôles doit atterrir sur
  // l'espace le plus large, pas sur le premier renvoyé par la base.
  for (const name of ["Administrator", "Company", "Commercial Agent", "User"]) {
    if (roles.includes(name)) return ROLE_BY_BACKEND_NAME[name];
  }
  return "candidate";
}

/**
 * Traduit un échec HTTP en cause métier. Le `reason` renvoyé par le back est
 * la source la plus précise ; le status ne sert que lorsqu'il est absent.
 */
function failureFrom(error: unknown): Failure {
  if (!(error instanceof ApiError)) {
    return { ok: false, reason: "unknown" };
  }

  if (error.isNetworkFailure) {
    return { ok: false, reason: "network" };
  }

  const retryAfter = error.retryAfter ?? undefined;
  const reason =
    typeof error.payload.reason === "string" ? error.payload.reason : null;

  switch (reason) {
    case "expired":
    case "not_requested":
      return { ok: false, reason: "expired" };
    case "invalid":
      return { ok: false, reason: "invalid" };
    case "too_many_attempts":
      return { ok: false, reason: "too_many_attempts" };
    case "cooldown":
    case "send_limit":
      return { ok: false, reason: "throttled", retryAfter };
  }

  if (error.status === 429)
    return { ok: false, reason: "throttled", retryAfter };
  // 403 sur requestOtp/verifyOtp : « This account cannot sign in. »
  if (error.status === 403) return { ok: false, reason: "blocked" };
  // 502 : la chaîne WhatsApp/SMS n'a pas pu livrer le code.
  if (error.status === 502 || error.status === 503)
    return { ok: false, reason: "delivery" };
  if (error.status === 422) return { ok: false, reason: "invalid" };

  return { ok: false, reason: "unknown" };
}

function persistUser(user: AuthUser | null) {
  if (user) {
    writeStorage(STORAGE_KEYS.auth, user);
    setCookie("as_role", user.role);
    setCookie("as_uid", user.id);
  } else {
    removeStorage(STORAGE_KEYS.auth);
    deleteCookie("as_role");
    deleteCookie("as_uid");
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [impersonator, setImpersonator] = useState<AuthUser | null>(null);
  const [resendAvailableIn, setResendAvailableIn] = useState<number | null>(
    null,
  );

  useEffect(() => {
    let storedUser = readStorage<AuthUser | null>(STORAGE_KEYS.auth, null);
    let storedToken = readStorage<string | null>(STORAGE_KEYS.token, null);

    /*
     * Prototype maquette : la première visite sans session ouvre le même
     * compte candidat de démo que /auth-phone produirait (+212600000001,
     * id 101 — voir data/fixtures/auth.ts) plutôt que de rester déconnecté.
     * `proxy.ts` pose déjà le cookie côté serveur pour ce même compte ;
     * ceci sème le localStorage que lit le reste de l'app (token, useAuth().user).
     */
    if (!storedUser && process.env.NEXT_PUBLIC_USE_MOCKS === "1") {
      storedUser = {
        id: "101",
        role: "candidate",
        name: "Youssef Amrani",
        phone: "+212600000001",
        roles: ["User"],
      };
      storedToken = "mock-token-candidate-101";
      writeStorage(STORAGE_KEYS.token, storedToken);
      persistUser(storedUser);
    }

    /*
     * Le cookie de rôle (lu par proxy.ts) et le jeton (localStorage) peuvent
     * diverger : cookie expiré au bout de 30 jours alors que le jeton vit
     * encore, ou stockage vidé par le navigateur alors que le cookie reste.
     * Dans le second cas, le proxy laissait entrer sur une page protégée dont
     * chaque requête partait sans jeton — des 401 que rien ne rattrapait,
     * puisque `recoverFromUnauthorized` n'agit que si un jeton était envoyé.
     * La session locale fait foi : on réaligne le cookie sur elle.
     */
    if (storedUser && storedToken) {
      persistUser(storedUser);
    } else {
      storedUser = null;
      storedToken = null;
      persistUser(null);
      removeStorage(STORAGE_KEYS.token);
      if (isProtectedPath(window.location.pathname)) {
        window.location.replace("/auth-phone");
        return;
      }
    }

    setUser(storedUser);
    setToken(storedToken);
    setImpersonator(readStorage<AuthUser | null>(STORAGE_KEYS.impersonatorUser, null));
    setIsLoading(false);

    /*
     * Un jeton restauré n'est qu'une présomption : il a pu être révoqué depuis
     * un autre appareil (« déconnecter les autres sessions ») ou par un
     * administrateur. On le confirme en arrière-plan, sans bloquer le rendu —
     * l'app reste utilisable hors-ligne, où une erreur réseau ne prouve rien.
     */
    if (!storedToken) return;
    const restoredToken = storedToken;
    authRepository.validateSession(restoredToken).catch((error: unknown) => {
      if (!(error instanceof ApiError) || error.status !== 401) return;
      // Un autre flux a pu remplacer le jeton entre-temps (nouvelle connexion).
      if (readStorage<string | null>(STORAGE_KEYS.token, null) !== restoredToken) return;
      removeStorage(STORAGE_KEYS.token);
      removeStorage(STORAGE_KEYS.impersonatorToken);
      removeStorage(STORAGE_KEYS.impersonatorUser);
      persistUser(null);
      setUser(null);
      setToken(null);
      setImpersonator(null);
      if (isProtectedPath(window.location.pathname)) {
        window.location.replace("/auth-phone?reason=session_expired");
      }
    });
  }, []);

  /*
   * Emprunt de session. La session de l'administrateur est mise de côté plutôt
   * qu'écrasée : sans elle, revenir à son propre compte demanderait de
   * redemander un code par WhatsApp, et l'écran d'où l'on vient exige déjà le
   * rôle qu'on vient de quitter.
   */
  const impersonate = useCallback(
    (nextToken: string, nextUser: AuthUser) => {
      if (!user || !token) return;

      writeStorage(STORAGE_KEYS.impersonatorToken, token);
      writeStorage(STORAGE_KEYS.impersonatorUser, user);
      setImpersonator(user);

      setToken(nextToken);
      writeStorage(STORAGE_KEYS.token, nextToken);
      setUser(nextUser);
      persistUser(nextUser);
    },
    [token, user],
  );

  const stopImpersonating = useCallback(() => {
    const adminToken = readStorage<string | null>(STORAGE_KEYS.impersonatorToken, null);
    const adminUser = readStorage<AuthUser | null>(STORAGE_KEYS.impersonatorUser, null);

    removeStorage(STORAGE_KEYS.impersonatorToken);
    removeStorage(STORAGE_KEYS.impersonatorUser);
    setImpersonator(null);

    // Rien à restaurer : mieux vaut une session fermée qu'une session empruntée
    // qu'on ne sait plus quitter.
    if (!adminToken || !adminUser) {
      setUser(null);
      setToken(null);
      persistUser(null);
      removeStorage(STORAGE_KEYS.token);
      return;
    }

    setToken(adminToken);
    writeStorage(STORAGE_KEYS.token, adminToken);
    setUser(adminUser);
    persistUser(adminUser);
  }, []);

  const requestOtp = useCallback(
    async (phone: string, referralToken?: string): Promise<AuthResult> => {
      // Retenu avant l'appel : l'écran OTP affiche le numéro même si l'envoi
      // échoue et que le candidat relance depuis « Renvoyer le code ».
      setPendingPhone(phone);

      try {
        const data = await authRepository.requestOtp(phone, referralToken);
        const dispatch: OtpDispatch = {
          debugCode: data.debug_otp_code ?? null,
          channel: data.channel ?? "unknown",
          resendAvailableIn: data.resend_available_in ?? 60,
          expiresIn: data.expires_in ?? 600,
        };

        setResendAvailableIn(dispatch.resendAvailableIn);

        return { ok: true, ...dispatch };
      } catch (error) {
        const failure = failureFrom(error);
        if (!failure.ok && failure.retryAfter)
          setResendAvailableIn(failure.retryAfter);

        return failure;
      }
    },
    [],
  );

  /*
   * La seule façon d'ouvrir une session, quelle que soit la preuve d'identité
   * (code OTP ou Google) : même jeton Sanctum, même stockage, mêmes cookies
   * de rôle pour proxy.ts. Rien de propre à Google n'existe au-delà.
   */
  const openSession = useCallback(
    (data: OtpVerifyResponse): VerifyResult => {
      const role = roleFrom(data.user.roles ?? []);

      const authUser: AuthUser = {
        id: String(data.user.id),
        role,
        // Le back ne renvoie pas de nom à ce stade : le profil candidat, qui
        // le porte, est chargé juste après par ProfileContext. Les autres
        // rôles n'ont pas cette étape, donc un nom de repli leur suffit.
        name: user?.name ?? DEFAULT_NAME_BY_ROLE[role],
        phone: data.user.phone,
        roles: data.user.roles ?? [],
      };

      setToken(data.token);
      writeStorage(STORAGE_KEYS.token, data.token);
      setUser(authUser);
      persistUser(authUser);
      setResendAvailableIn(null);

      return {
        ok: true,
        role,
        deletionPending: data.deletion_pending ?? false,
        googleLink: data.google_link ?? null,
      };
    },
    [user?.name],
  );

  const verifyOtp = useCallback(
    async (
      code: string,
      phone?: string,
      googleLinkTicket?: string,
    ): Promise<VerifyResult> => {
      const target = phone ?? pendingPhone;

      if (!target) return { ok: false, reason: "expired" };

      try {
        return openSession(
          await authRepository.verifyOtp(target, code, googleLinkTicket),
        );
      } catch (error) {
        return failureFrom(error);
      }
    },
    [pendingPhone, openSession],
  );

  const signInWithGoogleCode = useCallback(
    async (code: string): Promise<VerifyResult> => {
      try {
        return openSession(await authRepository.exchangeGoogleCode(code));
      } catch (error) {
        return failureFrom(error);
      }
    },
    [openSession],
  );

  const logout = useCallback(() => {
    // Révocation au mieux : la session locale est fermée quoi qu'il arrive,
    // sinon une déconnexion hors-ligne laisserait l'appareil connecté.
    if (token) {
      void authRepository.logout(token).catch(() => undefined);
    }

    setUser(null);
    setToken(null);
    setPendingPhone(null);
    setResendAvailableIn(null);
    setImpersonator(null);
    persistUser(null);
    removeStorage(STORAGE_KEYS.token);
    removeStorage(STORAGE_KEYS.impersonatorToken);
    removeStorage(STORAGE_KEYS.impersonatorUser);
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      pendingPhone,
      resendAvailableIn,
      impersonator,
      impersonate,
      stopImpersonating,
      requestOtp,
      verifyOtp,
      signInWithGoogleCode,
      logout,
    }),
    [
      user,
      token,
      isLoading,
      pendingPhone,
      resendAvailableIn,
      impersonator,
      impersonate,
      stopImpersonating,
      requestOtp,
      verifyOtp,
      signInWithGoogleCode,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error(
      "useAuth doit être utilisé à l'intérieur de <AuthProvider>",
    );
  return ctx;
}
