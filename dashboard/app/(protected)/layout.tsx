"use client";

import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: business, isLoading, isError } = useAuth();

  useEffect(() => {
    if (!isLoading && isError) {
      router.replace("/login");
    }
  }, [isLoading, isError, router]);

  async function handleLogout() {
    await api.post("/api/auth/logout");
    router.replace("/login");
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (isError) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex gap-4">
          <a href="/products" className="text-sm font-medium">
            Products
          </a>
          <a href="/orders" className="text-sm font-medium">
            Orders
          </a>
          <a href="/settings" className="text-sm font-medium">
            Settings
          </a>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500">{business?.name}</span>
          <button onClick={handleLogout} className="underline">
            Log out
          </button>
        </div>
      </nav>
      <main className="p-4">{children}</main>
    </div>
  );
}
