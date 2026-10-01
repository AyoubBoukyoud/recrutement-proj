/**
 * Accès aux données d'authentification, en maquette ou via l'API Laravel.
 *
 * Les deux implémentations partagent la signature *et* la façon d'échouer :
 * la maquette rejette avec une `ApiError` portant le même `reason` que le
 * back. `AuthContext` traduit ces causes en messages d'écran sans savoir
 * laquelle des deux lui a répondu.
 */
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { fakeLatency, fakeFailure } from "./config";
import { MOCK_OTP_CODE, findMockAccount } from "./fixtures/auth";

export interface OtpRequestResponse {
  channel?: string;
  expires_in?: number;
  resend_available_in?: number;
  debug_otp_code?: string | null;
}

export interface OtpVerifyResponse {
  token: string;
  user: { id: number | string; phone: string | null; roles: string[] };
  deletion_pending?: boolean;
  /** Présent quand le code finit un « Continuer avec Google » à rattacher. */
  google_link?: "linked" | "expired" | "conflict" | null;
}

/** Le vocabulaire de rôles de Spatie, côté back — l'inverse de `roleFrom`. */
const BACKEND_ROLE_NAME = {
  admin: "Administrator",
  employer: "Company",
  agent: "Commercial Agent",
  candidate: "User",
} as const;

export interface AuthRepository {
  requestOtp(
    phone: string,
    referralToken?: string,
  ): Promise<OtpRequestResponse>;
  /** `googleLinkTicket` rattache le compte Google vérifié juste avant. */
  verifyOtp(
    phone: string,
    code: string,
    googleLinkTicket?: string,
  ): Promise<OtpVerifyResponse>;
  /**
   * Échange le code à usage unique du retour Google contre la même session
   * Sanctum qu'une vérification OTP — même forme de réponse.
   */
  exchangeGoogleCode(code: string): Promise<OtpVerifyResponse>;
  /** Révocation au mieux : l'appelant ferme sa session locale quoi qu'il arrive. */
  logout(token: string): Promise<void>;
  /**
   * Confirme qu'un jeton restauré du stockage est toujours accepté. Rejette
   * avec une `ApiError` 401 s'il a été révoqué ou a expiré ; l'appelant décide
   * de la suite (aucune redirection automatique).
   */
  validateSession(token: string): Promise<void>;
}

const DEVICE_NAME = "Amud Skills PWA";

const httpAuth: AuthRepository = {
  requestOtp: (phone, referralToken) =>
    apiPost<OtpRequestResponse>("/auth/otp/request", {
      phone,
      ...(referralToken ? { referral_token: referralToken } : {}),
    }),

  verifyOtp: (phone, code, googleLinkTicket) =>
    apiPost<OtpVerifyResponse>("/auth/otp/verify", {
      phone,
      code,
      // Nomme le jeton Sanctum côté back, dans la liste des appareils du compte.
      device_name: DEVICE_NAME,
      ...(googleLinkTicket ? { google_link_ticket: googleLinkTicket } : {}),
    }),

  exchangeGoogleCode: (code) =>
    apiPost<OtpVerifyResponse>("/auth/google/exchange", {
      code,
      device_name: DEVICE_NAME,
    }),

  logout: (token) =>
    apiPost<void>("/auth/logout", {}, token).then(() => undefined),

  validateSession: (token) =>
    apiGet<unknown>("/auth/me", token, { handleUnauthorized: true }).then(() => undefined),
};

const mockAuth: AuthRepository = {
  requestOtp: (phone) => {
    if (phone.replace(/\D/g, "").length < 9) {
      return fakeFailure(
        new ApiError(422, "Numéro invalide", { reason: "invalid" }),
      );
    }
    return fakeLatency<OtpRequestResponse>({
      channel: "whatsapp",
      expires_in: 600,
      resend_available_in: 30,
      // Le back n'expose ce champ qu'en développement ; la maquette fait pareil,
      // c'est ce qui permet de se connecter sans lire de SMS.
      debug_otp_code: MOCK_OTP_CODE,
    });
  },

  verifyOtp: (phone, code) => {
    if (code !== MOCK_OTP_CODE) {
      return fakeFailure(
        new ApiError(422, "Code incorrect", { reason: "invalid" }),
      );
    }

    const account = findMockAccount(phone);
    return fakeLatency<OtpVerifyResponse>({
      token: `mock-token-${account.role}-${account.id}`,
      deletion_pending: false,
      user: {
        id: account.id,
        phone: account.phone,
        roles: [BACKEND_ROLE_NAME[account.role]],
      },
    });
  },

  // Google passe par Laravel : la maquette n'a rien à imiter (le bouton est
  // masqué en mode maquette, voir lib/googleAuth.ts).
  exchangeGoogleCode: () =>
    fakeFailure(new ApiError(503, "Google indisponible en maquette")),

  // Rien à révoquer : le jeton de maquette n'existe que dans cet onglet.
  logout: () => Promise.resolve(),

  validateSession: () => Promise.resolve(),
};

export const authRepository: AuthRepository =
  process.env.NEXT_PUBLIC_USE_MOCKS === "1" ? mockAuth : httpAuth;
