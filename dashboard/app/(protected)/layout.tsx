"use client";

import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { LogOut, Package, Settings, ShoppingBag } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const NAV_ITEMS = [
  { href: "/products", label: "Products", icon: Package },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
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
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="text-sm text-slate">Loading...</p>
      </div>
    );
  }

  if (isError) {
    return null;
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-white">
        <div className="px-6 py-6">
          <p className="font-display text-lg font-semibold text-ink">
            Chat Commerce
          </p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <a
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-teal/10 text-teal-dark"
                    : "text-slate hover:bg-paper hover:text-ink"
                }`}
              >
                <Icon size={18} strokeWidth={2} />
                {label}
              </a>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-border">
          <p className="px-3 text-xs text-slate mb-2 truncate">
            {business?.name}
          </p>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate hover:bg-paper hover:text-danger transition-colors"
          >
            <LogOut size={18} strokeWidth={2} />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between border-b border-border bg-white px-4 py-3 sticky top-0 z-40">
        <p className="font-display text-base font-semibold text-ink">
          Chat Commerce
        </p>
        <button
          onClick={handleLogout}
          className="text-slate"
          aria-label="Log out"
        >
          <LogOut size={20} strokeWidth={2} />
        </button>
      </header>

      {/* Content */}
      <main className="md:pl-60 pb-20 md:pb-0">
        <div className="max-w-3xl mx-auto px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex border-t border-border bg-white">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <a
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium ${
                active ? "text-teal-dark" : "text-slate"
              }`}
            >
              <Icon size={20} strokeWidth={2} />
              {label}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
