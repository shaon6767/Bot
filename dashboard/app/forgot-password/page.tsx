"use client";

import { api } from "@/lib/api";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/api/auth/forgot-password", { email });
    } finally {
      setSubmitted(true);
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="w-full max-w-sm text-center space-y-2">
          <h1 className="font-display text-2xl font-semibold text-ink">
            Check your email
          </h1>
          <p className="text-sm text-slate">
            If an account exists for {email}, a reset link is on its way.
          </p>
          <a href="/login" className="text-sm text-teal-dark underline">
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Reset your password
        </h1>
        <p className="text-sm text-slate">
          Enter your account email and we&apos;ll send you a reset link.
        </p>

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

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-teal py-2.5 text-sm font-medium text-white hover:bg-teal-dark transition-colors disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>

        <p className="text-sm text-center text-slate">
          <a href="/login" className="text-teal-dark underline">
            Back to login
          </a>
        </p>
      </form>
    </div>
  );
}
