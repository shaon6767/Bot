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

  if (isLoading) return <p className="text-sm text-gray-500">Loading...</p>;

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-lg font-semibold mb-4">Page Connection</h1>

      <div className="text-sm text-gray-600 mb-4 space-y-1">
        <p>Page ID: {settings?.pageId ?? "Not set"}</p>
        <p>Instagram Account ID: {settings?.instagramAccountId ?? "Not set"}</p>
        <p>
          Access Token: {settings?.pageAccessTokenSet ? "Set ✓" : "Not set"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1" htmlFor="pageId">
            Page ID
          </label>
          <input
            id="pageId"
            type="text"
            value={pageId}
            onChange={(e) => setPageId(e.target.value)}
            placeholder="Leave blank to keep current"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm mb-1" htmlFor="pageAccessToken">
            Page Access Token
          </label>
          <input
            id="pageAccessToken"
            type="password"
            value={pageAccessToken}
            onChange={(e) => setPageAccessToken(e.target.value)}
            placeholder="Leave blank to keep current"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm mb-1" htmlFor="instagramAccountId">
            Instagram Account ID (optional)
          </label>
          <input
            id="instagramAccountId"
            type="text"
            value={instagramAccountId}
            onChange={(e) => setInstagramAccountId(e.target.value)}
            placeholder="Leave blank to keep current"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="bg-gray-900 text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}
