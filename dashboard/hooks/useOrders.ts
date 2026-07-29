"use client";

import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  _id: string;
  channel: "messenger" | "instagram";
  customerId: string;
  items: OrderItem[];
  total: number;
  status: "new" | "confirmed" | "shipped" | "cancelled";
  createdAt: string;
}

export function useOrders() {
  return useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: () => api.get<Order[]>("/api/orders"),
    refetchInterval: 30 * 1000,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Order["status"] }) =>
      api.patch<Order>(`/api/orders/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
}
