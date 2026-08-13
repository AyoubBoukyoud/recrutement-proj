'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { readStorage, writeStorage, removeStorage, STORAGE_KEYS } from '@/lib/storage';
import { setCookie, deleteCookie } from '@/lib/cookies';
import { ApiError } from '@/lib/api';
import { authRepository } from '@/data/auth';
import type { AuthUser, UserRole } from '@/lib/types';

/**
 * Pourquoi une étape d'authentification a échoué, dans les termes de l'écran
 * plutôt que ceux d'HTTP : chaque page traduit ces cas en message localisé.
 */
export type AuthFailure =
  | 'invalid'
  | 'expired'
  | 'too_many_attempts'
  | 'throttled'
  | 'delivery'
  | 'network'
  | 'unknown';

type Failure = { ok: false; reason: AuthFailure; retryAfter?: number };

export type AuthResult = { ok: true } | Failure;

/** Le rôle est connu dès la vérification réussie — inutile d'attendre le
 *  prochain rendu pour savoir où envoyer l'appelant. */
export type VerifyResult = { ok: true; role: UserRole } | Failure;

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  pendingPhone: string | null;
  /** Secondes avant de pouvoir redemander un code, telles qu'annoncées par l'API. */
  resendAvailableIn: number | null;
  requestOtp: (phone: string, referralToken?: string) => Promise<AuthResult>;
  /** `phone` prime sur `pendingPhone` : l'écran OTP le tient de son URL et
   *  survit donc à un rechargement de la PWA. */
  verifyOtp: (code: string, phone?: string) => Promise<VerifyResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Les rôles Spatie du back, traduits dans le vocabulaire de l'application. */
const ROLE_BY_BACKEND_NAME: Record<string, UserRole> = {
  Administrator: 'admin',
  Company: 'employer',
  'Commercial Agent': 'agent',
  User: 'candidate',
};

const DEFAULT_NAME_BY_ROLE: Record<UserRole, string> = {
  candidate: 'Nouveau Candidat',
  employer: 'Espace Employeur',
  admin: 'Administrateur',
  agent: 'Agent commercial',
};

function roleFrom(roles: string[]): UserRole {
  // Administrator l'emporte : un compte qui cumule les rôles doit atterrir sur
  // l'espace le plus large, pas sur le premier renvoyé par la base.
  for (const name of ['Administrator', 'Company', 'Commercial Agent', 'User']) {
    if (roles.includes(name)) return ROLE_BY_BACKEND_NAME[name];
  }
  return 'candidate';
}

/**
 * Traduit un échec HTTP en cause métier. Le `reason` renvoyé par le back est
 * la source la plus précise ; le status ne sert que lorsqu'il est absent.
 */
function failureFrom(error: unknown): Failure {
  if (!(error instanceof ApiError)) {
    return { ok: false, reason: 'unknown' };
  }

  if (error.isNetworkFailure) {
    return { ok: false, reason: 'network' };
  }

  const retryAfter = error.retryAfter ?? undefined;
  const reason = typeof error.payload.reason === 'string' ? error.payload.reason : null;

  switch (reason) {
    case 'expired':
    case 'not_requested':
      return { ok: false, reason: 'expired' };
    case 'invalid':
      return { ok: false, reason: 'invalid' };
    case 'too_many_attempts':
      return { ok: false, reason: 'too_many_attempts' };
    case 'cooldown':
    case 'send_limit':
      return { ok: false, reason: 'throttled', retryAfter };
  }

  if (error.status === 429) return { ok: false, reason: 'throttled', retryAfter };
  // 502 : la chaîne WhatsApp/SMS n'a pas pu livrer le code.
  if (error.status === 502 || error.status === 503) return { ok: false, reason: 'delivery' };
  if (error.status === 422) return { ok: false, reason: 'invalid' };

  return { ok: false, reason: 'unknown' };
}

function persistUser(user: AuthUser | null) {
  if (user) {
    writeStorage(STORAGE_KEYS.auth, user);
    setCookie('as_role', user.role);
    setCookie('as_uid', user.id);
  } else {
    removeStorage(STORAGE_KEYS.auth);
    deleteCookie('as_role');
    deleteCookie('as_uid');
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [resendAvailableIn, setResendAvailableIn] = useState<number | null>(null);

  useEffect(() => {
    setUser(readStorage<AuthUser | null>(STORAGE_KEYS.auth, null));
    setToken(readStorage<string | null>(STORAGE_KEYS.token, null));
    setIsLoading(false);
  }, []);

  const requestOtp = useCallback(async (phone: string, referralToken?: string): Promise<AuthResult> => {
    // Retenu avant l'appel : l'écran OTP affiche le numéro même si l'envoi
    // échoue et que le candidat relance depuis « Renvoyer le code ».
    setPendingPhone(phone);

    try {
      const data = await authRepository.requestOtp(phone, referralToken);

      setResendAvailableIn(data.resend_available_in ?? null);

      return { ok: true };
    } catch (error) {
      const failure = failureFrom(error);
      if (!failure.ok && failure.retryAfter) setResendAvailableIn(failure.retryAfter);

      return failure;
    }
  }, []);

  const verifyOtp = useCallback(
    async (code: string, phone?: string): Promise<VerifyResult> => {
      const target = phone ?? pendingPhone;

      if (!target) return { ok: false, reason: 'expired' };

      try {
        const data = await authRepository.verifyOtp(target, code);

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

        return { ok: true, role };
      } catch (error) {
        return failureFrom(error);
      }
    },
    [pendingPhone, user?.name]
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
    persistUser(null);
    removeStorage(STORAGE_KEYS.token);
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      pendingPhone,
      resendAvailableIn,
      requestOtp,
      verifyOtp,
      logout,
    }),
    [user, token, isLoading, pendingPhone, resendAvailableIn, requestOtp, verifyOtp, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé à l\'intérieur de <AuthProvider>');
  return ctx;
}
