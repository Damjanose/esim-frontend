"use client";

import { useEffect, useRef, useState } from "react";
import type { InsightsFilters } from "@/lib/insights/query";
import type { ChartNote } from "@/lib/insights/types";

export type ChartNotesOptions = { onUnauthorized?: () => void; refreshKey?: number };

/**
 * Loads the chart notes for the range, including the built-in holidays. Refetches when the range
 * changes or when `retry` is called (the marketing tools bump it after a save).
 */
export function useChartNotes(token: string, filters: InsightsFilters, options: ChartNotesOptions = {}) {
  const [state, setState] = useState<"loading" | "error" | "ready">("loading");
  const [notes, setNotes] = useState<ChartNote[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const unauthorized = useRef(options.onUnauthorized);
  unauthorized.current = options.onUnauthorized;

  const { from, to } = filters;
  const refreshKey = options.refreshKey;

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setState("loading");
    setError(null);

    fetch(`/bff/admin/insights/chart-notes?${new URLSearchParams({ from, to }).toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: controller.signal
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | { status?: string; data?: { notes: ChartNote[] }; message?: string }
          | null;
        if (response.status === 401) {
          unauthorized.current?.();
          throw new Error("Session expired. Sign in again.");
        }
        if (!response.ok || payload?.status !== "success" || !payload.data) {
          throw new Error(payload?.message ?? "Could not load the chart notes.");
        }
        setNotes(payload.data.notes);
        setState("ready");
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : "Could not load the chart notes.");
        setState("error");
      });

    return () => controller.abort();
  }, [token, from, to, attempt, refreshKey]);

  return { state, notes, error, retry: () => setAttempt((count) => count + 1) };
}
