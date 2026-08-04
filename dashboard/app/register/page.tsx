"use client";

import { useToast } from "@/components/Toast";
import { api, ApiError } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/api/auth/register", { name, email, password });
      toast.success("Account created");
      router.push("/products");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Registration failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Create your account
        </h1>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div>
          <label
            className="block text-sm font-medium text-ink mb-1.5"
            htmlFor="name"
          >
            Business name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium text-ink mb-1.5"
            htmlFor="email"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium text-ink mb-1.5"
            htmlFor="password"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-teal py-2.5 text-sm font-medium text-white hover:bg-teal-dark transition-colors disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="text-sm text-center text-slate">
          Already have an account?{" "}
          <a href="/login" className="text-teal-dark underline">
            Log in
          </a>
        </p>
      </form>
    </div>
  );
}
