"use client";

import { Coins, CreditCard, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import type { PaymentMethod } from "@/lib/externalPayments";

const METHOD_COPY: Record<PaymentMethod, { title: string; hint: string; icon: ReactNode }> = {
  card: { title: "Card", hint: "Visa, Mastercard", icon: <CreditCard aria-hidden="true" size={18} /> },
  paypal: { title: "PayPal", hint: "Balance or linked card", icon: <Wallet aria-hidden="true" size={18} /> },
  crypto: { title: "Crypto", hint: "USDT · Tron, BNB", icon: <Coins aria-hidden="true" size={18} /> }
};

/**
 * Card / PayPal / Crypto as radio cards. Renders nothing when card is the only
 * option, so checkout looks exactly as before until another method is enabled.
 */
export function PaymentMethodPicker({
  methods,
  value,
  onChange,
  disabled = false
}: {
  methods: PaymentMethod[];
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
}) {
  if (methods.length < 2) return null;

  return (
    <fieldset className="mb-6" disabled={disabled}>
      <legend className="sr-only">Payment method</legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {methods.map((method) => {
          const copy = METHOD_COPY[method];
          const selected = method === value;
          return (
            <label
              className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-[16px] border px-4 py-3 transition-colors focus-within:ring-4 focus-within:ring-brandBlue/20 ${
                selected ? "border-brandBlue bg-brandBlue/5" : "border-outline/70 bg-surface hover:border-brandBlue/50"
              }`}
              key={method}
            >
              <input
                checked={selected}
                className="sr-only"
                name="payment-method"
                onChange={() => onChange(method)}
                type="radio"
                value={method}
              />
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                  selected ? "bg-brandBlue text-surface" : "bg-brandBlue/10 text-brandBlue"
                }`}
              >
                {copy.icon}
              </span>
              <span className="min-w-0">
                <span className="block font-display text-sm font-black text-brandInk">{copy.title}</span>
                <span className="block truncate text-xs text-onSurfaceVariant">{copy.hint}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
