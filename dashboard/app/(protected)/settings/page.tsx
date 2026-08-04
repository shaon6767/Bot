"use client";

import { useToast } from "@/components/Toast";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { useState } from "react";

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const { mutate, isPending } = useUpdateSettings();
  const toast = useToast();

  const [pageId, setPageId] = useState("");
  const [pageAccessToken, setPageAccessToken] = useState("");
  const [instagramAccountId, setInstagramAccountId] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, string> = {};
    if (pageId.trim()) payload.pageId = pageId.trim();
    if (pageAccessToken.trim())
      payload.pageAccessToken = pageAccessToken.trim();
    if (instagramAccountId.trim())
      payload.instagramAccountId = instagramAccountId.trim();

    mutate(payload, {
      onSuccess: () => {
        toast.success("Settings saved");
        setPageAccessToken("");
      },
      onError: () => toast.error("Failed to save settings"),
    });
  }

  if (isLoading) return <p className="text-sm text-slate">Loading...</p>;

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-ink mb-6">
        Page Connection
      </h1>

      <div className="rounded-lg border border-border bg-white p-4 mb-6 text-sm space-y-1">
        <p className="text-slate">
          Page ID:{" "}
          <span className="text-ink font-data">
            {settings?.pageId ?? "Not set"}
          </span>
        </p>
        <p className="text-slate">
          Instagram Account ID:{" "}
          <span className="text-ink font-data">
            {settings?.instagramAccountId ?? "Not set"}
          </span>
        </p>
        <p className="text-slate">
          Access Token:{" "}
          <span className="text-ink">
            {settings?.pageAccessTokenSet ? "Set ✓" : "Not set"}
          </span>
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-w-md rounded-lg border border-border bg-white p-4"
      >
        <div>
          <label
            className="block text-sm font-medium text-ink mb-1.5"
            htmlFor="pageId"
          >
            Page ID
          </label>
          <input
            id="pageId"
            type="text"
            value={pageId}
            onChange={(e) => setPageId(e.target.value)}
            placeholder="Leave blank to keep current"
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium text-ink mb-1.5"
            htmlFor="pageAccessToken"
          >
            Page Access Token
          </label>
          <input
            id="pageAccessToken"
            type="password"
            value={pageAccessToken}
            onChange={(e) => setPageAccessToken(e.target.value)}
            placeholder="Leave blank to keep current"
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium text-ink mb-1.5"
            htmlFor="instagramAccountId"
          >
            Instagram Account ID (optional)
          </label>
          <input
            id="instagramAccountId"
            type="text"
            value={instagramAccountId}
            onChange={(e) => setInstagramAccountId(e.target.value)}
            placeholder="Leave blank to keep current"
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-dark transition-colors disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}
