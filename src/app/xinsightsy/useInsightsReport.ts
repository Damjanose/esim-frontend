"use client";

import { useEffect, useRef, useState } from "react";
import { insightsReportUrl, type InsightsExtra, type InsightsFilters } from "@/lib/insights/query";
import type { ReportName, ReportResponse } from "@/lib/insights/types";

export type InsightsReportOptions = InsightsExtra & { onUnauthorized?: () => void };

/**
 * Loads one report from the web BFF. A new filter cancels the request in flight. A 401
 * calls onUnauthorized (the page signs the admin out). `retry` loads it again.
 */
export function useInsightsReport<T>(
  report: ReportName,
  token: string,
  filters: InsightsFilters,
  options: InsightsReportOptions = {}
) {
  const [state, setState] = useState<"loading" | "error" | "ready">("loading");
  const [data, setData] = useState<ReportResponse<T> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const unauthorized = useRef(options.onUnauthorized);
  unauthorized.current = options.onUnauthorized;

  const { tz, level, basis } = options;
  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setState("loading");
    setError(null);

    fetch(insightsReportUrl(report, JSON.parse(filterKey) as InsightsFilters, { tz, level, basis }), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: controller.signal
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | { status?: string; data?: ReportResponse<T>; message?: string; error?: string }
          | null;
        if (response.status === 401) {
          unauthorized.current?.();
          throw new Error("Session expired. Sign in again.");
        }
        if (!response.ok || payload?.status !== "success" || !payload.data) {
          throw new Error(payload?.message ?? payload?.error ?? "Could not load this report.");
        }
        setData(payload.data);
        setState("ready");
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : "Could not load this report.");
        setState("error");
      });

    return () => controller.abort();
  }, [report, token, filterKey, tz, level, basis, attempt]);

  return { state, data, error, retry: () => setAttempt((count) => count + 1) };
}
