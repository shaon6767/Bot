"use client";

import { useToast } from "@/components/Toast";
import type { Order } from "@/hooks/useOrders";
import { useOrders, useUpdateOrderStatus } from "@/hooks/useOrders";

const STATUSES: Order["status"][] = [
  "new",
  "confirmed",
  "shipped",
  "cancelled",
];

function StatusDot({ status }: { status: Order["status"] }) {
  if (status === "new") {
    return (
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-60" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal" />
      </span>
    );
  }
  if (status === "confirmed") {
    return <span className="inline-flex h-2.5 w-2.5 rounded-full bg-success" />;
  }
  if (status === "shipped") {
    return (
      <span className="inline-flex h-2.5 w-2.5 rounded-full border-2 border-slate" />
    );
  }
  return <span className="inline-flex h-2.5 w-2.5 rounded-full bg-border" />;
}

export function OrderList() {
  const { data: orders, isLoading } = useOrders();
  const { mutate: updateStatus } = useUpdateOrderStatus();
  const toast = useToast();

  if (isLoading) return <p className="text-sm text-slate">Loading orders...</p>;
  if (!orders?.length)
    return <p className="text-sm text-slate">No orders yet.</p>;

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order._id}
          className="rounded-lg border border-border bg-white p-4"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <StatusDot status={order.status} />
              <div>
                <p className="text-sm font-medium text-ink">
                  {order.channel} · {order.customerId}
                </p>
                <p className="text-xs text-slate">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <select
              value={order.status}
              onChange={(e) =>
                updateStatus(
                  {
                    id: order._id,
                    status: e.target.value as Order["status"],
                  },
                  {
                    onSuccess: () => toast.success("Order status updated"),
                    onError: () => toast.error("Failed to update order"),
                  },
                )
              }
              className="rounded-md border border-border bg-white px-2 py-1 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-teal/40"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <ul className="text-sm text-slate space-y-0.5">
            {order.items.map((item, i) => (
              <li key={i}>
                {item.quantity} x {item.name} —{" "}
                <span className="font-data">
                  {item.price * item.quantity} BDT
                </span>
              </li>
            ))}
          </ul>
          <p className="text-sm font-medium text-ink mt-2 font-data">
            Total: {order.total} BDT
          </p>
        </div>
      ))}
    </div>
  );
}
