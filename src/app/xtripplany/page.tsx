"use client";

import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { CURRENCY_CODES } from "@/lib/currencyCodes";
import { AdminNav } from "../AdminNav";
import { AdminLoginCard } from "../AdminLoginCard";
import { useAdminSession } from "../useAdminSession";

type Settings = {
  provider: string;
  apiKeySet: boolean;
  model: string;
  /** Empty means the server default (PLAN_TRIP_OPENAI_BASE_URL, then api.openai.com). */
  openaiBaseUrl: string;
  generationLimit: number;
  windowDays: number;
  editLimit: number;
  priceAmount: number;
  priceCurrency: string;
};

type ConnectionResult = {
  ok: boolean;
  provider: string;
  model: string;
  latencyMs: number;
  message: string;
};

type Payload = {
  status?: string;
  data?: Settings;
  message?: string;
};

const PROVIDERS = ["openai", "anthropic", "gemini"] as const;

// plan-trip always sends temperature, so only models that accept it are listed
// (Claude Sonnet 5 / Opus 5.5 and OpenAI's reasoning models reject it).
const MODEL_SUGGESTIONS: Record<string, readonly string[]> = {
  openai: ["gpt-4o-mini", "gpt-4.1-mini", "gpt-4.1"],
  anthropic: ["claude-sonnet-4-6", "claude-haiku-4-5", "claude-opus-4-6"],
  gemini: ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"]
};

const CUSTOM_MODEL = "__custom__";

// Any OpenAI-compatible endpoint works with provider "openai", e.g. Gemini with an AI Studio key.
const GEMINI_OPENAI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";

const fieldClass =
  "mt-1 h-10 w-full rounded-xl border border-line px-3 text-sm font-normal text-midnight outline-none focus:border-cyan";

export default function AdminTripPlanPage() {
  const session = useAdminSession();
  const { token, handleUnauthorized } = session;

  const [settings, setSettings] = useState<Settings | null>(null);
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState("");
  const [generationLimit, setGenerationLimit] = useState("3");
  const [windowDays, setWindowDays] = useState("25");
  const [editLimit, setEditLimit] = useState("3");
  const [priceAmount, setPriceAmount] = useState("2");
  const [priceCurrency, setPriceCurrency] = useState("USD");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionResult | null>(null);

  function applySettings(next: Settings) {
    setSettings(next);
    setProvider(next.provider);
    setModel(next.model);
    setIsCustomModel(next.model !== "" && !(MODEL_SUGGESTIONS[next.provider] ?? []).includes(next.model));
    setOpenaiBaseUrl(next.openaiBaseUrl ?? "");
    setGenerationLimit(String(next.generationLimit));
    setWindowDays(String(next.windowDays));
    setEditLimit(String(next.editLimit));
    setPriceAmount(String(next.priceAmount));
    setPriceCurrency(next.priceCurrency);
    setApiKey("");
  }

  async function load(nextToken = token) {
    if (!nextToken) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/bff/admin/itinerary-settings", {
        headers: { Authorization: `Bearer ${nextToken}` },
        cache: "no-store"
      });
      const payload = (await response.json()) as Payload;
      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success" || !payload.data) {
        throw new Error(payload.message ?? "Could not load trip plan settings");
      }
      applySettings(payload.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load trip plan settings");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (token) void load(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function save() {
    if (!token) return;
    const limit = Number(generationLimit);
    const days = Number(windowDays);
    const edits = Number(editLimit);
    const price = Number(priceAmount);
    if (!Number.isInteger(limit) || limit < 1 || !Number.isInteger(days) || days < 1) {
      setError("Limit and window must be whole numbers above zero.");
      return;
    }
    if (!Number.isInteger(edits) || edits < 0) {
      setError("Edits per plan must be a whole number, zero or more.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError("Price must be zero or more.");
      return;
    }

    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/bff/admin/itinerary-settings", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          provider,
          model: model.trim(),
          // Only the openai provider uses a base URL; switching away clears it.
          openaiBaseUrl: provider === "openai" ? openaiBaseUrl.trim() : "",
          generationLimit: limit,
          windowDays: days,
          editLimit: edits,
          priceAmount: price,
          priceCurrency: priceCurrency.trim().toUpperCase(),
          ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {})
        })
      });
      const payload = (await response.json()) as Payload;
      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success" || !payload.data) {
        throw new Error(payload.message ?? "Could not save trip plan settings");
      }
      applySettings(payload.data);
      setNotice(payload.data.apiKeySet ? "Saved. A key is stored." : "Saved. No key is stored yet.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save trip plan settings");
    } finally {
      setIsSaving(false);
    }
  }

  // Tests with current form values (unsaved edits) or saved settings if no key is being tested.
  async function testConnection() {
    if (!token) return;
    setIsTesting(true);
    setTestResult(null);
    setError("");
    try {
      const limit = Number(generationLimit);
      const days = Number(windowDays);
      const edits = Number(editLimit);
      const price = Number(priceAmount);

      // Validate form before sending to backend
      if (!Number.isInteger(limit) || limit < 1 || !Number.isInteger(days) || days < 1) {
        throw new Error("Limit and window must be whole numbers above zero.");
      }
      if (!Number.isInteger(edits) || edits < 0) {
        throw new Error("Edits per plan must be a whole number, zero or more.");
      }
      if (!Number.isFinite(price) || price < 0) {
        throw new Error("Price must be zero or more.");
      }

      // If an API key is being tested in the form, send the full payload; otherwise test saved settings
      const body = apiKey.trim()
        ? {
            provider,
            model: model.trim(),
            openaiBaseUrl: provider === "openai" ? openaiBaseUrl.trim() : "",
            apiKey: apiKey.trim()
          }
        : undefined;

      const response = await fetch("/bff/admin/itinerary-settings/test", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body ? { "Content-Type": "application/json" } : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        cache: "no-store"
      });
      const payload = (await response.json()) as { status?: string; data?: ConnectionResult; message?: string };
      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success" || !payload.data) {
        throw new Error(payload.message ?? "Could not test the provider");
      }
      setTestResult(payload.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not test the provider");
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <>
      <AdminNav />
      <main className="min-h-screen bg-canvas px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-muted">Admin</p>
            <h1 className="font-display text-2xl font-black text-midnight">Trip plans</h1>
          </div>
          {token ? (
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[11px] font-bold text-midnight"
              onClick={session.logout}
              type="button"
            >
              <LogOut aria-hidden="true" size={14} />
              Logout
            </button>
          ) : null}
        </div>

        {!token ? (
          <AdminLoginCard
            email={session.email}
            error={session.error}
            isLoggingIn={session.isLoggingIn}
            onSubmit={session.login}
            password={session.password}
            setEmail={session.setEmail}
            setPassword={session.setPassword}
          />
        ) : (
          <div className="grid gap-5">
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </div>
            ) : null}
            {notice ? (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
                {notice}
              </div>
            ) : null}

            <section className="max-w-md rounded-2xl border border-line bg-white p-5 shadow-card">
              <p className="text-xs font-semibold text-muted">
                {isLoading
                  ? "Loading..."
                  : settings?.apiKeySet
                    ? "A provider key is saved. Leave the key field empty to keep it."
                    : "No provider key is saved yet."}
              </p>

              <label className="mt-5 block text-xs font-bold text-muted">
                Provider
                <select
                  className={fieldClass}
                  onChange={(event) => {
                    // A model id belongs to one provider, so switching resets to the default.
                    setProvider(event.target.value);
                    setModel("");
                    setIsCustomModel(false);
                    setOpenaiBaseUrl("");
                  }}
                  value={provider}
                >
                  {PROVIDERS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>

              {provider === "openai" ? (
                <label className="mt-4 block text-xs font-bold text-muted">
                  Base URL
                  <input
                    autoComplete="off"
                    className={fieldClass}
                    onChange={(event) => setOpenaiBaseUrl(event.target.value)}
                    placeholder="https://api.openai.com/v1"
                    type="url"
                    value={openaiBaseUrl}
                  />
                  <span className="mt-1 block font-normal">
                    Leave empty for OpenAI. For another OpenAI-compatible API, enter its base URL (without
                    /chat/completions) and pick its model under Custom.{" "}
                    <button
                      className="font-bold text-cyan underline"
                      onClick={() => setOpenaiBaseUrl(GEMINI_OPENAI_BASE_URL)}
                      type="button"
                    >
                      Use Gemini
                    </button>
                  </span>
                </label>
              ) : null}

              <label className="mt-4 block text-xs font-bold text-muted">
                Model
                <select
                  className={fieldClass}
                  onChange={(event) => {
                    const next = event.target.value;
                    setIsCustomModel(next === CUSTOM_MODEL);
                    setModel(next === CUSTOM_MODEL ? "" : next);
                  }}
                  value={isCustomModel ? CUSTOM_MODEL : model}
                >
                  <option value="">Server default</option>
                  {(MODEL_SUGGESTIONS[provider] ?? []).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                  <option value={CUSTOM_MODEL}>Custom…</option>
                </select>
                {isCustomModel ? (
                  <input
                    autoComplete="off"
                    className={fieldClass}
                    onChange={(event) => setModel(event.target.value)}
                    placeholder="Exact model id from the provider"
                    value={model}
                  />
                ) : null}
                <span className="mt-1 block font-normal">
                  Used for trip plans, plan edits and the in-app assistant. Server default uses PLAN_TRIP_MODEL, or
                  the provider&apos;s built-in model.
                </span>
              </label>

              <label className="mt-4 block text-xs font-bold text-muted">
                API key
                <input
                  // Chrome ignores "off" on password fields and autofills a saved login,
                  // which Save/Test would then send as the provider key.
                  autoComplete="new-password"
                  className={fieldClass}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder={settings?.apiKeySet ? "Enter a new key to replace it" : "Paste the provider key"}
                  type="password"
                  value={apiKey}
                />
              </label>

              <label className="mt-4 block text-xs font-bold text-muted">
                Generations allowed
                <input
                  className={fieldClass}
                  inputMode="numeric"
                  onChange={(event) => setGenerationLimit(event.target.value)}
                  value={generationLimit}
                />
              </label>

              <label className="mt-4 block text-xs font-bold text-muted">
                Window (days)
                <input
                  className={fieldClass}
                  inputMode="numeric"
                  onChange={(event) => setWindowDays(event.target.value)}
                  value={windowDays}
                />
              </label>

              <label className="mt-4 block text-xs font-bold text-muted">
                Edits per plan
                <input
                  className={fieldClass}
                  inputMode="numeric"
                  onChange={(event) => setEditLimit(event.target.value)}
                  value={editLimit}
                />
                <span className="mt-1 block font-normal">
                  Prompt edits a user can make to each plan while it is inside the window. 0 turns editing off.
                </span>
              </label>

              <label className="mt-4 block text-xs font-bold text-muted">
                Download price
                <input
                  className={fieldClass}
                  inputMode="decimal"
                  onChange={(event) => setPriceAmount(event.target.value)}
                  value={priceAmount}
                />
              </label>

              <label className="mt-4 block text-xs font-bold text-muted">
                Price currency
                <select
                  className={fieldClass}
                  onChange={(event) => setPriceCurrency(event.target.value)}
                  value={
                    CURRENCY_CODES.includes(priceCurrency as (typeof CURRENCY_CODES)[number])
                      ? priceCurrency
                      : "USD"
                  }
                >
                  {CURRENCY_CODES.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </label>

              <p className="mt-3 text-xs font-semibold text-muted">
                Zero means the download is free. The phone charges this price in the Pokpay currency.
              </p>

              <button
                className="mt-4 h-10 w-full rounded-xl bg-gradient-to-r from-midnight to-ink text-xs font-black text-aqua shadow-glow transition hover:opacity-90 disabled:opacity-50"
                disabled={isSaving}
                onClick={() => void save()}
                type="button"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>

              <button
                className="mt-3 h-10 w-full rounded-xl border border-line bg-white text-xs font-black text-midnight transition hover:border-cyan disabled:opacity-50"
                disabled={isTesting || isSaving || (!apiKey.trim() && !settings?.apiKeySet)}
                onClick={() => void testConnection()}
                type="button"
              >
                {isTesting ? "Testing..." : "Test connection"}
              </button>
              <p className="mt-1 text-xs font-normal text-muted">
                Sends "Hello" with your current provider, base URL, key and model. Test unsaved changes without saving.
              </p>
              {testResult ? (
                <div
                  className={`mt-3 rounded-xl border px-3 py-2 text-xs font-bold ${
                    testResult.ok
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  <p>
                    {testResult.ok ? "Working" : "Not working"}: {testResult.provider} ·{" "}
                    {testResult.model || "provider default model"} · {testResult.latencyMs} ms
                  </p>
                  <p className="mt-1 break-words font-normal">{testResult.message}</p>
                </div>
              ) : null}
            </section>
          </div>
        )}
      </main>
    </>
  );
}
