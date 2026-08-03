"use client";

import { useToast } from "@/components/Toast";
import { useDeleteProduct, useProducts } from "@/hooks/useProducts";

export function ProductList() {
  const { data: products, isLoading } = useProducts();
  const { mutate: deleteProduct } = useDeleteProduct();
  const toast = useToast();

  if (isLoading)
    return <p className="text-sm text-gray-500">Loading products...</p>;
  if (!products?.length)
    return <p className="text-sm text-gray-500">No products yet.</p>;

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="text-left border-b">
          <th className="py-2">Name</th>
          <th className="py-2">Price (BDT)</th>
          <th className="py-2"></th>
        </tr>
      </thead>
      <tbody>
        {products.map((p) => (
          <tr key={p._id} className="border-b">
            <td className="py-2">{p.name}</td>
            <td className="py-2">{p.price}</td>
            <td className="py-2 text-right">
              <button
                onClick={() =>
                  deleteProduct(p._id, {
                    onSuccess: () => toast.success("Product deleted"),
                    onError: () => toast.error("Failed to delete product"),
                  })
                }
                className="text-red-600 underline"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
