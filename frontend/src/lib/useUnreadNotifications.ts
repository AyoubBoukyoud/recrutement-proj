"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { marketplaceApi } from "./candidateMarketplace";

export const CANDIDATE_NOTIFICATIONS_QUERY_KEY = [
  "candidate-notifications",
] as const;

/** One shared query feeds the layout bell, dashboard bell and inbox. */
export function useUnreadNotifications() {
  const { token } = useAuth();
  const query = useQuery({
    queryKey: [...CANDIDATE_NOTIFICATIONS_QUERY_KEY, 1],
    queryFn: () => marketplaceApi.notifications(token as string, 1),
    enabled: Boolean(token),
    refetchInterval: 60_000,
  });

  return { ...query, unreadCount: query.data?.unread_count ?? 0 };
}
