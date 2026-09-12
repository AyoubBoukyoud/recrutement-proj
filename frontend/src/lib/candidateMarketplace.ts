// Typed client for the candidate marketplace. Pagination and filters stay in
// this layer so screens never assemble query strings by hand.

import { apiDelete, apiGet, apiPatch, apiPost } from "./api";
import type { CefrLevel } from "./candidateProfile";

export type ContractType =
  "permanent" | "fixed_term" | "apprenticeship" | "temporary" | "internship";

export interface JobOffer {
  id: number;
  title: string;
  description: string;
  sector: string;
  city: string;
  country: string;
  required_cefr_level: CefrLevel | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  contract_type: ContractType;
  published_at: string;
  match_score: number | null;
  employer?: {
    id: number;
    name: string | null;
    company_profile?: { company_name?: string | null } | null;
  };
}

export interface Page<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface OfferFilters {
  q?: string;
  sector?: string;
  city?: string;
  contract_type?: ContractType;
  required_cefr_level?: CefrLevel;
  page?: number;
  per_page?: number;
}

export interface ReferralMe {
  code: string;
  registrations_count: number;
  registrations: {
    id: number;
    candidate_name: string | null;
    status: string;
    registered_at: string;
  }[];
  earnings: { owed: number; paid: number; currency: string };
}

export interface Visibility {
  visible: boolean;
  paused: boolean;
  withdrawn: boolean;
}

export interface JobApplication {
  id: number;
  status:
    | "submitted"
    | "viewed"
    | "interview"
    | "accepted"
    | "rejected"
    | "withdrawn";
  applied_at: string;
  status_changed_at: string;
  offer: JobOffer;
}

export interface CandidateNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  payload: Record<string, unknown> | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationPage extends Page<CandidateNotification> {
  unread_count: number;
}

function queryString<T extends object>(values: T): string {
  const params = new URLSearchParams();
  Object.entries(values as Record<string, string | number | undefined>).forEach(
    ([key, value]) => {
      if (value !== undefined && value !== "") params.set(key, String(value));
    },
  );
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const marketplaceApi = {
  offers: (token: string, filters: OfferFilters = {}) =>
    apiGet<Page<JobOffer>>(`/offers${queryString(filters)}`, token),
  offer: (id: number, token: string) =>
    apiGet<JobOffer>(`/offers/${id}`, token),
  apply: (id: number, token: string) =>
    apiPost<JobApplication>(`/offers/${id}/apply`, {}, token),
  applications: (token: string, page = 1, perPage = 20) =>
    apiGet<Page<JobApplication>>(
      `/candidate/applications${queryString({ page, per_page: perPage })}`,
      token,
    ),
  withdrawApplication: (id: number, token: string) =>
    apiDelete<JobApplication>(`/candidate/applications/${id}`, token),
  favorites: (token: string, page = 1, perPage = 20) =>
    apiGet<Page<JobOffer>>(
      `/candidate/favorites${queryString({ page, per_page: perPage })}`,
      token,
    ),
  favorite: (id: number, token: string) =>
    apiPost<{ favorited: boolean }>(`/offers/${id}/favorite`, {}, token),
  unfavorite: (id: number, token: string) =>
    apiDelete<void>(`/offers/${id}/favorite`, token),
  notifications: (token: string, page = 1, perPage = 20) =>
    apiGet<NotificationPage>(
      `/candidate/notifications${queryString({ page, per_page: perPage })}`,
      token,
    ),
  readNotification: (id: number, token: string) =>
    apiPatch<CandidateNotification>(
      `/candidate/notifications/${id}/read`,
      {},
      token,
    ),
  readAllNotifications: (token: string) =>
    apiPatch<{ ok: boolean }>("/candidate/notifications/read-all", {}, token),
  referral: (token: string) => apiGet<ReferralMe>("/referrals/me", token),
  visibility: (token: string) =>
    apiGet<Visibility>("/candidate/visibility", token),
  pause: (token: string) =>
    apiPost<Visibility>("/candidate/visibility/pause", {}, token),
  resume: (token: string) =>
    apiPost<Visibility>("/candidate/visibility/resume", {}, token),
  withdraw: (token: string) =>
    apiPost<Visibility>("/candidate/consent/withdraw", {}, token),
  grantConsent: (token: string) =>
    apiPost<Visibility>("/candidate/consent/grant", {}, token),
};
