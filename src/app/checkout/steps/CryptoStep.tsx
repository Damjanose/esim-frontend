"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Lottie from "lottie-react";
import QRCode from "qrcode";
import { AlertTriangle, Check, Copy } from "lucide-react";
import { Button, LinkButton } from "@/app/components/Button";
import { FIELD_INPUT_CLASSES, FIELD_LABEL_CLASSES } from "@/app/components/fieldClasses";
import {
  NETWORK_COPY,
  formatCountdown,
  shouldKeepPolling,
  successPath,
  targetBody,
  type CryptoNetwork,
  type ExternalCheckoutTarget,
  type ExternalPayment
} from "@/lib/externalPayments";
import waitingAnimation from "@/../public/lottie/search-package.json";

const POLL_MS = 5000;

/**
 * USDT to our own wallet. The backend gives each invoice a unique amount; its sweep spots
 * the transfer on-chain and provisions the eSIM, while this step polls the status and
 * moves on once it is ready. The buyer can close the page: the eSIM still arrives.
 */
export function CryptoStep({
  target,
  networks,
  signInPath,
  onStarted
}: {
  target: ExternalCheckoutTarget;
  networks: Array<{ id: CryptoNetwork; label: string }>;
  signInPath: string;
  onStarted?: (payment: ExternalPayment) => void;
}) {
  const router = useRouter();
  const [network, setNetwork] = useState<CryptoNetwork>(networks[0]?.id ?? "tron-usdt");
  const [payment, setPayment] = useState<ExternalPayment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Polls since the payment completed without its eSIM yet (see shouldKeepPolling).
  const [setupPolls, setSetupPolls] = useState(0);

  async function createInvoice() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/bff/payments/crypto/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...targetBody(target), network })
      });
      if (response.status === 401) {
        window.location.assign(`/signin?next=${encodeURIComponent(signInPath)}`);
        return;
      }
      const payload = (await response.json().catch(() => ({}))) as { data?: ExternalPayment; error?: string };
      if (!response.ok || !payload.data?.crypto) {
        setError(payload.error ?? "We could not create the crypto payment. Please try again.");
        return;
      }
      setPayment(payload.data);
      setSetupPolls(0);
      onStarted?.(payload.data);
    } catch {
      setError("We could not reach the payment service. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const finish = useCallback(
    (next: ExternalPayment) => {
      setPayment(next);
      if (next.status !== "completed") return;
      if (next.order == null && next.topup == null) {
        setSetupPolls((count) => count + 1);
        return;
      }
      const path = successPath(next, target.kind === "topup" ? target.orderId : null);
      if (path) router.push(path);
    },
    [router, target]
  );

  // Poll while pending (the backend expires it), then briefly while the eSIM is set up.
  useEffect(() => {
    if (!payment || !shouldKeepPolling(payment, setupPolls)) return;
    let cancelled = false;
    const timer = window.setInterval(() => {
      void fetch(`/bff/payments/external/${encodeURIComponent(payment.paymentId)}`)
        .then((response) => (response.ok ? response.json() : null))
        .then((body: { data?: ExternalPayment } | null) => {
          if (!cancelled && body?.data) finish(body.data);
        })
        .catch(() => undefined);
    }, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [payment, setupPolls, finish]);

  if (!payment?.crypto) {
    return (
      <div className="space-y-4">
        <fieldset>
          <legend className={FIELD_LABEL_CLASSES}>Network</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {networks.map((option) => (
              <label
                className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-bold transition-colors focus-within:ring-4 focus-within:ring-brandBlue/20 ${
                  network === option.id
                    ? "border-brandBlue bg-brandBlue/5 text-brandBlue"
                    : "border-outline/70 text-onSurfaceVariant hover:border-brandBlue/50"
                }`}
                key={option.id}
              >
                <input
                  checked={network === option.id}
                  className="sr-only"
                  name="crypto-network"
                  onChange={() => setNetwork(option.id)}
                  type="radio"
                  value={option.id}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
        <p className="text-sm text-onSurfaceVariant">
          We&apos;ll show an exact USDT amount and a wallet address. Send it from any wallet or exchange, and
          your eSIM is set up automatically once the transfer confirms (usually about a minute).
        </p>
        <Button className="w-full" hero loading={busy} onClick={() => void createInvoice()} size="lg" type="button">
          Pay with USDT
        </Button>
        {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}
      </div>
    );
  }

  return (
    <CryptoInvoice
      settingUp={shouldKeepPolling(payment, setupPolls)}
      onRestart={() => setPayment(null)}
      onUpdate={finish}
      payment={{ ...payment, crypto: payment.crypto }}
    />
  );
}

function CryptoInvoice({
  payment,
  settingUp,
  onUpdate,
  onRestart
}: {
  payment: ExternalPayment & { crypto: NonNullable<ExternalPayment["crypto"]> };
  /** Completed and still waiting for the eSIM (polling continues). */
  settingUp: boolean;
  onUpdate: (payment: ExternalPayment) => void;
  onRestart: () => void;
}) {
  const { crypto } = payment;
  const copy = NETWORK_COPY[crypto.network];
  const countdown = useCountdown(crypto.expiresAt);
  const qr = useQrDataUrl(crypto.qrUri);

  if (payment.status === "completed") {
    return (
      <StatusCard tone="ok" title={settingUp ? "Payment received — setting up your eSIM" : "Payment received"}>
        {settingUp
          ? "One moment while we take you to your eSIM…"
          : "We have your payment but couldn't finish setting up the eSIM yet. It may still appear in your account in a few minutes; if not, our team will complete it. You don't need to pay again."}
        <Reference id={payment.paymentId} />
        {settingUp ? null : (
          <LinkButton className="mt-4 w-full" href="/account" variant="tint">
            Go to my eSIMs
          </LinkButton>
        )}
      </StatusCard>
    );
  }
  if (payment.status === "underpaid" || payment.status === "review") {
    return (
      <StatusCard tone="warn" title="We need to check this payment">
        {payment.status === "underpaid"
          ? "The amount we received is less than the invoice. Contact support and we'll sort it out; don't send another payment."
          : "We received a transfer we couldn't match automatically. Our team will check it shortly; don't send another payment."}
        <Reference id={payment.paymentId} />
      </StatusCard>
    );
  }
  if (payment.status !== "pending") {
    return (
      <StatusCard tone="warn" title="This payment request has closed">
        If you already sent USDT, contact support with the reference below. Otherwise start a new payment.
        <Reference id={payment.paymentId} />
        <Button className="mt-4 w-full" onClick={onRestart} type="button" variant="tint">
          Start a new crypto payment
        </Button>
      </StatusCard>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-5 rounded-[20px] border border-outline/70 bg-surface p-5 sm:flex-row sm:items-start">
        {qr ? (
          // Plain img: the QR is a data URI, which the image optimiser cannot process.
          <img alt="Wallet address QR code" className="h-[168px] w-[168px] shrink-0 rounded-[12px]" src={qr} />
        ) : (
          <div className="h-[168px] w-[168px] shrink-0 animate-pulse rounded-[12px] bg-brandBlue/10" />
        )}
        <div className="w-full min-w-0 space-y-4">
          <CopyField label={`Send exactly (USDT · ${copy.standard})`} value={crypto.payAmount} big />
          <CopyField label={`To this ${copy.chain} address`} value={crypto.address} />
          <p className="text-xs text-onSurfaceVariant">
            {countdown ? (
              <>
                Reserved for <span className="font-mono font-bold text-brandInk">{countdown}</span>
              </>
            ) : (
              "Time is up. A transfer sent just now still counts; we'll keep watching for a while."
            )}
          </p>
        </div>
      </div>

      <p className="flex gap-2 rounded-[14px] bg-error/5 px-4 py-3 text-sm text-brandInk">
        <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0 text-error" size={16} />
        <span>
          Send <strong>USDT</strong> on <strong>{copy.chain} ({copy.standard})</strong> only, and the exact amount
          including the last digits; that&apos;s how we recognise your payment. Coins sent on another network can&apos;t
          be recovered. If an exchange deducts a fee, send the amount plus the fee.
        </span>
      </p>

      <div className="flex items-center gap-3 rounded-[14px] border border-outline/70 px-4 py-3">
        <Lottie animationData={waitingAnimation} aria-hidden="true" className="h-12 w-12 shrink-0" loop />
        <p className="text-sm text-onSurfaceVariant">
          Waiting for your transfer… You can leave this page; your eSIM will appear in your account once it
          confirms.
        </p>
      </div>

      <TxHashFallback onUpdate={onUpdate} paymentId={payment.paymentId} />
      <Reference id={payment.paymentId} />
    </div>
  );
}

/** For when the wallet rounded the amount, so automatic matching can't work. */
function TxHashFallback({ paymentId, onUpdate }: { paymentId: string; onUpdate: (payment: ExternalPayment) => void }) {
  const [open, setOpen] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/bff/payments/crypto/${encodeURIComponent(paymentId)}/tx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tx_hash: txHash })
      });
      const payload = (await response.json().catch(() => ({}))) as { data?: ExternalPayment; error?: string };
      if (!response.ok || !payload.data) {
        setMessage(payload.error ?? "We couldn't check that transaction. Please try again.");
        return;
      }
      onUpdate(payload.data);
    } catch {
      setMessage("We couldn't reach the payment service. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        className="text-sm font-bold text-brandBlue underline-offset-4 hover:underline"
        onClick={() => setOpen(true)}
        type="button"
      >
        Already sent a different amount? Paste your transaction hash
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <label className={FIELD_LABEL_CLASSES} htmlFor="crypto-tx-hash">
        Transaction hash (TxID)
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          autoComplete="off"
          className={`${FIELD_INPUT_CLASSES} font-mono`}
          id="crypto-tx-hash"
          onChange={(event) => setTxHash(event.target.value)}
          placeholder="0x… or 64 characters"
          spellCheck={false}
          value={txHash}
        />
        <Button disabled={!txHash.trim()} loading={busy} onClick={() => void submit()} type="button" variant="tint">
          Check
        </Button>
      </div>
      {message ? <p className="text-sm font-semibold text-error">{message}</p> : null}
    </div>
  );
}

function CopyField({ label, value, big = false }: { label: string; value: string; big?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="text-xs font-semibold text-onSurfaceVariant">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <span
          className={`min-w-0 break-all font-mono font-bold text-brandInk ${big ? "text-2xl tracking-tight" : "text-sm"}`}
        >
          {value}
        </span>
        <button
          aria-label={`Copy ${label}`}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brandBlue/10 text-brandBlue hover:bg-brandBlue/20"
          onClick={() => {
            void navigator.clipboard?.writeText(value).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            });
          }}
          type="button"
        >
          {copied ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}
        </button>
      </div>
    </div>
  );
}

function StatusCard({ tone, title, children }: { tone: "ok" | "warn"; title: string; children: ReactNode }) {
  return (
    <div
      className={`rounded-[20px] border p-5 text-sm leading-6 text-onSurfaceVariant ${
        tone === "ok" ? "border-brandTeal/50 bg-brandTeal/5" : "border-error/30 bg-error/5"
      }`}
      role="status"
    >
      <p className="mb-1 font-display text-base font-black text-brandInk">{title}</p>
      {children}
    </div>
  );
}

function Reference({ id }: { id: string }) {
  return (
    <p className="mt-3 break-all text-xs text-onSurfaceVariant">
      Payment reference: <span className="font-mono font-bold text-brandInk">{id}</span>
    </p>
  );
}

function useCountdown(expiresAt: string): string | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return formatCountdown(expiresAt, now);
}

function useQrDataUrl(value: string): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, { margin: 1, width: 336 })
      .then((next) => {
        if (!cancelled) setUrl(next);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [value]);
  return url;
}
