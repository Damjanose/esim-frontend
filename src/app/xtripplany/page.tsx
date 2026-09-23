"use client";

import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { AdminNav } from "../AdminNav";
import { AdminLoginCard } from "../AdminLoginCard";
import { useAdminSession } from "../useAdminSession";

type Settings = {
  provider: string;
  apiKeySet: boolean;
  generationLimit: number;
  windowDays: number;
  priceAmount: number;
  priceCurrency: string;
};

type Payload = {
  status?: string;
  data?: Settings;
  message?: string;
};

const PROVIDERS = ["openai", "anthropic", "gemini"] as const;

const fieldClass =
  "mt-1 h-10 w-full rounded-xl border border-line px-3 text-sm font-normal text-midnight outline-none focus:border-cyan";

export default function AdminTripPlanPage() {
  const session = useAdminSession();
  const { token, handleUnauthorized } = session;

  const [settings, setSettings] = useState<Settings | null>(null);
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [generationLimit, setGenerationLimit] = useState("3");
  const [windowDays, setWindowDays] = useState("25");
  const [priceAmount, setPriceAmount] = useState("2");
  const [priceCurrency, setPriceCurrency] = useState("USD");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function applySettings(next: Settings) {
    setSettings(next);
    setProvider(next.provider);
    setGenerationLimit(String(next.generationLimit));
    setWindowDays(String(next.windowDays));
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
    const price = Number(priceAmount);
    if (!Number.isInteger(limit) || limit < 1 || !Number.isInteger(days) || days < 1) {
      setError("Limit and window must be whole numbers above zero.");
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
          generationLimit: limit,
          windowDays: days,
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

  return (
    <div className="flex min-h-screen bg-canvas">
      <AdminNav />
      <main className="min-w-0 flex-1 px-6 py-8">
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
                  onChange={(event) => setProvider(event.target.value)}
                  value={provider}
                >
                  {PROVIDERS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-4 block text-xs font-bold text-muted">
                API key
                <input
                  autoComplete="off"
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
                <input
                  className={fieldClass}
                  maxLength={3}
                  onChange={(event) => setPriceCurrency(event.target.value.toUpperCase())}
                  value={priceCurrency}
                />
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
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
