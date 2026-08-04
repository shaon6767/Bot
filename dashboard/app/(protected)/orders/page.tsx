import { OrderList } from "@/components/OrderList";

export default function OrdersPage() {
  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-ink mb-6">
        Orders
      </h1>
      <OrderList />
    </div>
  );
}
