"use client";

import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export interface Business {
  id: string;
  name: string;
  email: string;
}

export function useAuth() {
  return useQuery<Business>({
    queryKey: ["me"],
    queryFn: () => api.get<Business>("/api/auth/me"),
    retry: false,
  });
}
