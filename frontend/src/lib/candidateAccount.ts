// Candidate account, session and privacy endpoints.

import { apiDelete, apiGet, apiPost } from "./api";

export interface DeviceSession {
  id: number;
  device_name: string;
  last_used_at: string | null;
  created_at: string;
  current: boolean;
}

export interface CandidateAccountStatus {
  deletion_requested_at: string | null;
  deletion_pending: boolean;
}

export const accountApi = {
  status: (token: string) =>
    apiGet<CandidateAccountStatus>("/candidate/account", token),
  sessions: (token: string) =>
    apiGet<{ sessions: DeviceSession[] }>("/auth/sessions", token),
  revoke: (id: number, token: string) =>
    apiDelete<{ was_current: boolean }>(`/auth/sessions/${id}`, token),
  revokeOthers: (token: string) =>
    apiDelete<{ revoked: number }>("/auth/sessions/others", token),
  requestPhone: (phone: string, token: string) =>
    apiPost<{ debug_otp_code?: string; resend_available_in: number }>(
      "/auth/phone/change",
      { phone },
      token,
    ),
  confirmPhone: (phone: string, code: string, token: string) =>
    apiPost("/auth/phone/change/confirm", { phone, code }, token),
  exportData: (token: string) =>
    apiGet<Record<string, unknown>>("/candidate/account/export", token),
  deleteAccount: (token: string) =>
    apiDelete<{ deletion_scheduled_at: string }>("/candidate/account", token),
  cancelDeletion: (token: string) =>
    apiPost<{ cancelled: boolean }>(
      "/candidate/account/cancel-deletion",
      {},
      token,
    ),
};
