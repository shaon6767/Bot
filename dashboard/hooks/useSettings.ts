"use client";

import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface Settings {
  pageId: string | null;
  instagramAccountId: string | null;
  pageAccessTokenSet: boolean;
}

export function useSettings() {
  return useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: () => api.get<Settings>("/api/settings"),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      pageId?: string;
      pageAccessToken?: string;
      instagramAccountId?: string;
    }) => api.patch<Settings>("/api/settings", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });
}
