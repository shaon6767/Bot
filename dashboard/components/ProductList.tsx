"use client";

import { useToast } from "@/components/Toast";
import { useDeleteProduct, useProducts } from "@/hooks/useProducts";

export function ProductList() {
  const { data: products, isLoading } = useProducts();
  const { mutate: deleteProduct } = useDeleteProduct();
  const toast = useToast();

  if (isLoading)
    return <p className="text-sm text-slate">Loading products...</p>;
  if (!products?.length)
    return (
      <p className="text-sm text-slate">
        No products yet — add your first one above.
      </p>
    );

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-border">
            <th className="py-3 px-4 font-medium text-slate">Name</th>
            <th className="py-3 px-4 font-medium text-slate">Price (BDT)</th>
            <th className="py-3 px-4"></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p._id} className="border-b border-border last:border-0">
              <td className="py-3 px-4 text-ink">{p.name}</td>
              <td className="py-3 px-4 font-data text-ink">{p.price}</td>
              <td className="py-3 px-4 text-right">
                <button
                  onClick={() =>
                    deleteProduct(p._id, {
                      onSuccess: () => toast.success("Product deleted"),
                      onError: () => toast.error("Failed to delete product"),
                    })
                  }
                  className="text-danger text-sm hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
