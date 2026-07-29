"use client";

import { useCreateProduct } from "@/hooks/useProducts";
import { useState } from "react";

export function ProductForm() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const { mutate, isPending, error } = useCreateProduct();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutate(
      { name, price: parseFloat(price) },
      {
        onSuccess: () => {
          setName("");
          setPrice("");
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
      <input
        type="text"
        placeholder="Product name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border rounded px-3 py-2 flex-1"
      />
      <input
        type="number"
        placeholder="Price (BDT)"
        required
        min="0"
        step="0.01"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="border rounded px-3 py-2 w-32"
      />
      <button
        type="submit"
        disabled={isPending}
        className="bg-gray-900 text-white rounded px-4 py-2 disabled:opacity-50"
      >
        Add
      </button>
      {error && <p className="text-sm text-red-600">Failed to add product</p>}
    </form>
  );
}
