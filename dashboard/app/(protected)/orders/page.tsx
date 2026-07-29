import { OrderList } from "@/components/OrderList";

export default function OrdersPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-lg font-semibold mb-4">Orders</h1>
      <OrderList />
    </div>
  );
}
