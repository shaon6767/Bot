"use client";

import { useToast } from "@/components/Toast";
import { useCreateProduct } from "@/hooks/useProducts";
import { useState } from "react";

export function ProductForm() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const { mutate, isPending, error } = useCreateProduct();
  const toast = useToast();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutate(
      { name, price: parseFloat(price) },
      {
        onSuccess: () => {
          toast.success("Product added");
          setName("");
          setPrice("");
        },
        onError: () => toast.error("Failed to add product"),
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-2 mb-6"
    >
      <input
        type="text"
        placeholder="Product name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
      />
      <input
        type="number"
        placeholder="Price (BDT)"
        required
        min="0"
        step="0.01"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="sm:w-32 rounded-md border border-border bg-white px-3 py-2 text-sm text-ink font-data focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-dark transition-colors disabled:opacity-50"
      >
        Add
      </button>
      {error && <p className="text-sm text-danger">Failed to add product</p>}
    </form>
  );
}
