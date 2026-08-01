"use client";

import type { Order } from "@/hooks/useOrders";
import { useOrders, useUpdateOrderStatus } from "@/hooks/useOrders";

const STATUSES: Order["status"][] = [
  "new",
  "confirmed",
  "shipped",
  "cancelled",
];

export function OrderList() {
  const { data: orders, isLoading } = useOrders();
  const { mutate: updateStatus } = useUpdateOrderStatus();

  if (isLoading)
    return <p className="text-sm text-gray-500">Loading orders...</p>;
  if (!orders?.length)
    return <p className="text-sm text-gray-500">No orders yet.</p>;

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div key={order._id} className="border rounded p-3">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-medium">
                {order.channel} · {order.customerId}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <select
              value={order.status}
              onChange={(e) =>
                updateStatus({
                  id: order._id,
                  status: e.target.value as Order["status"],
                })
              }
              className="border rounded-lg px-2 py-1 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <ul className="text-sm text-gray-700">
            {order.items.map((item, i) => (
              <li key={i}>
                {item.quantity} x {item.name} — {item.price * item.quantity} BDT
              </li>
            ))}
          </ul>
          <p className="text-sm font-medium mt-1">Total: {order.total} BDT</p>
        </div>
      ))}
    </div>
  );
}
