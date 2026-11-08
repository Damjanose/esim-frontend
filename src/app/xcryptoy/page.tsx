"use client";

import { useEffect, useState } from "react";
import { Check, LogOut, RefreshCw, X } from "lucide-react";
import { AdminNav } from "../AdminNav";
import { AdminLoginCard } from "../AdminLoginCard";
import { useAdminSession } from "../useAdminSession";

type CryptoReview = {
  paymentId: string;
  email: string;
  status: string;
  kind: "package" | "topup";
  amountCents: number;
  currency: string;
  network: string | null;
  payAmount: string | null;
  submittedTxHash: string | null;
  note: string | null;
  createdAt: string;
  reviewUntil: string | null;
};

type ReviewsPayload = { status?: string; data?: { reviews?: CryptoReview[] }; message?: string };

const EXPLORERS: Record<string, string> = {
  "tron-usdt": "https://tronscan.org/#/transaction/",
  "bsc-usdt": "https://bscscan.com/tx/"
};

function formatTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function minutesLeft(value: string | null, now: number) {
  if (!value) return null;
  return Math.max(0, Math.round((new Date(value).getTime() - now) / 60_000));
}

export default function AdminCryptoReviewsPage() {
  const session = useAdminSession();
  const { token, handleUnauthorized } = session;
  const [reviews, setReviews] = useState<CryptoReview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(() => Date.now());

  async function load(nextToken = token) {
    if (!nextToken) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/bff/admin/crypto-reviews", {
        headers: { Authorization: `Bearer ${nextToken}` },
        cache: "no-store"
      });
      const payload = (await response.json()) as ReviewsPayload;
      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? "Could not load crypto reviews");
      }
      setReviews(payload.data?.reviews ?? []);
      setNow(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load crypto reviews");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    void load(token);
    const timer = setInterval(() => void load(token), 30_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function act(review: CryptoReview, action: "confirm" | "deny") {
    setBusyId(review.paymentId);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/bff/admin/crypto-reviews/${encodeURIComponent(review.paymentId)}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const payload = (await response.json()) as { status?: string; message?: string };
      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired. Sign in again.");
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message ?? `Could not ${action} payment`);
      }
      setNotice(
        action === "confirm"
          ? `Confirmed ${review.paymentId}; the eSIM is being provisioned.`
          : `Denied ${review.paymentId}.`
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not ${action} payment`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-cloud px-6 py-7 md:px-9">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-cyanDeep">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_8px_#00d9f5]" />
              Admin · Live
            </p>
            <h1 className="mt-1 font-display text-[26px] font-black tracking-tight text-midnight md:text-[30px]">
              Crypto payment reviews
            </h1>
            <p className="mt-1 text-sm font-semibold text-muted">
              Transfers that could not be verified automatically. Check the hash on the explorer before confirming.
              Anything not confirmed within 2 hours is denied automatically.
            </p>
          </div>
          {token ? (
            <div className="flex gap-2">
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-xs font-bold text-midnight shadow-sm transition hover:border-cyan disabled:opacity-50"
                disabled={isLoading}
                onClick={() => void load()}
                type="button"
              >
                <RefreshCw aria-hidden="true" size={14} />
                {isLoading ? "Loading..." : "Refresh"}
              </button>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-midnight to-ink px-4 text-xs font-bold text-aqua shadow-glow transition hover:opacity-90"
                onClick={session.logout}
                type="button"
              >
                <LogOut aria-hidden="true" size={14} />
                Logout
              </button>
            </div>
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
          <div className="grid gap-4">
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>
            ) : null}
            {notice ? (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">{notice}</div>
            ) : null}
            {reviews.length === 0 && !isLoading ? (
              <p className="rounded-2xl border border-line bg-white p-5 text-sm font-semibold text-muted shadow-card">
                No crypto payments waiting for review.
              </p>
            ) : null}
            {reviews.map((review) => {
              const left = minutesLeft(review.reviewUntil, now);
              const explorer = review.network ? EXPLORERS[review.network] : undefined;
              const busy = busyId === review.paymentId;
              return (
                <section className="rounded-2xl border border-line bg-white p-5 shadow-card" key={review.paymentId}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-lg font-black text-midnight">
                        {review.payAmount ?? "?"} USDT · {(review.amountCents / 100).toFixed(2)} {review.currency}
                      </p>
                      <p className="text-xs font-semibold text-muted">
                        {review.email} · {review.kind} · {review.network ?? "unknown network"} · {review.status}
                      </p>
                      <p className="text-xs font-semibold text-muted">
                        {review.paymentId} · created {formatTime(review.createdAt)}
                      </p>
                    </div>
                    <p className={`text-xs font-black ${left !== null && left < 30 ? "text-red-700" : "text-cyanDeep"}`}>
                      {left === null ? "" : left === 0 ? "Denying now" : `Auto-deny in ${Math.floor(left / 60)}h ${left % 60}m`}
                    </p>
                  </div>
                  {review.submittedTxHash ? (
                    <p className="mt-3 break-all font-mono text-xs text-midnight">
                      TX:{" "}
                      {explorer ? (
                        <a className="underline" href={`${explorer}${review.submittedTxHash}`} rel="noreferrer" target="_blank">
                          {review.submittedTxHash}
                        </a>
                      ) : (
                        review.submittedTxHash
                      )}
                    </p>
                  ) : null}
                  {review.note ? <p className="mt-2 text-xs font-semibold text-muted">{review.note}</p> : null}
                  <div className="mt-4 flex gap-2">
                    <button
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-green-600 px-4 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                      disabled={busy}
                      onClick={() => void act(review, "confirm")}
                      type="button"
                    >
                      <Check aria-hidden="true" size={14} />
                      Confirm & provision
                    </button>
                    <button
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-xs font-bold text-red-700 transition hover:border-red-400 disabled:opacity-50"
                      disabled={busy}
                      onClick={() => void act(review, "deny")}
                      type="button"
                    >
                      <X aria-hidden="true" size={14} />
                      Deny
                    </button>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
