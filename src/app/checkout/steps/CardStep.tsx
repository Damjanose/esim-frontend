"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import Lottie from "lottie-react";
import { usePOK, type PaymentErrorResponse } from "@nebula-ltd/pok-payments-js/react";
import type { BillingAddress } from "@/app/bff/user/billing-address/route";
import { Button } from "@/app/components/Button";
import {
  formatCardNumber,
  formatExpiration,
  hasCardErrors,
  validateCard,
  type CardFieldErrors,
  type CardFormData
} from "@/lib/cardValidation";
import otpErrorAnimation from "@/../public/lottie/otp-error.json";

const INPUT_CLASSNAME =
  "mt-2 h-12 w-full rounded-[12px] border border-outline bg-mist px-4 text-sm font-medium text-brandInk outline-none transition focus:border-brandBlue disabled:opacity-60";

const EMPTY_CARD: CardFormData = { cardNumber: "", expiration: "", securityCode: "" };

function fieldErrorMessage(error: CardFieldErrors[keyof CardFieldErrors]): string | null {
  if (!error) return null;
  if (error === "required") return "This field is required.";
  return "Check this value.";
}

function genericMessageFor(type: PaymentErrorResponse["type"]): string {
  if (type === "VALIDATION_ERROR") return "Check your card details and try again.";
  if (type === "FORM_ERROR") {
    return "Something's not right with this card. Please check it and try again.";
  }
  return "We couldn't process your card. Please try again.";
}

/**
 * Deliberately not using @nebula-ltd/pok-payments-js's `GuestCheckoutForm` —
 * decompiling its bundle shows a hard `error ? <ErrorPanel/> : <Form/>`
 * ternary at its root with no reset prop or retry action, so once it hits an
 * error the card fields are gone for good. `usePOK` runs the same
 * tokenization/3DS flow (the device-collection iframe logic lives in a
 * shared internal helper, not tied to that component's rendering) without
 * taking the form away from us on failure.
 */
export function CardStep({
  paymentId,
  environment,
  billingAddress,
  onPaid
}: {
  paymentId: string;
  environment: string;
  billingAddress: BillingAddress;
  onPaid: () => void;
}) {
  const [card, setCard] = useState<CardFormData>(EMPTY_CARD);
  const [fieldErrors, setFieldErrors] = useState<CardFieldErrors>({});
  const [submitError, setSubmitError] = useState<PaymentErrorResponse | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  // Tracked ourselves rather than relying solely on usePOK's own `fetching` —
  // that flag didn't reliably flip around the processPayment call in
  // practice, so the button never showed as busy.
  const [submitting, setSubmitting] = useState(false);

  // Guards against the SDK invoking onSuccess more than once for the same
  // payment — its docs don't guarantee single-invocation, and re-provisioning
  // is safe but re-navigating the wizard forward twice is not.
  const handledRef = useRef(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(query.matches);
    const onChange = () => setReduceMotion(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // Memoized so `usePOK` (which internally opens a socket.io connection keyed
  // on these callbacks) doesn't tear down and reconnect on every keystroke —
  // the card/expiration/CVV state updates above would otherwise recreate
  // these on every render.
  const handleSuccess = useCallback(() => {
    if (handledRef.current) return;
    handledRef.current = true;
    onPaid();
  }, [onPaid]);

  const handleError = useCallback((error: PaymentErrorResponse) => {
    setSubmitting(false);
    setSubmitError(error);
  }, []);

  const { processPayment } = usePOK(
    paymentId,
    handleSuccess,
    handleError,
    environment === "production" ? "production" : "staging"
  );

  const update = (field: keyof CardFormData, format: (value: string) => string) => (value: string) => {
    setCard((current) => ({ ...current, [field]: format(value) }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const submit = async () => {
    if (submitting) return;

    const errors = validateCard(card);
    setFieldErrors(errors);
    if (hasCardErrors(errors)) return;

    setSubmitError(null);
    setSubmitting(true);
    try {
      await processPayment(card.cardNumber.replace(/\D/g, ""), card.expiration, card.securityCode, {
        holdersName: billingAddress.holdersName,
        email: billingAddress.email,
        countryCode: billingAddress.countryCode,
        address1: billingAddress.address1,
        locality: billingAddress.locality,
        administrativeArea: billingAddress.administrativeArea,
        postalCode: billingAddress.postalCode,
        phoneNumber: billingAddress.phoneNumber
      });
      // Actual outcome arrives asynchronously via handleSuccess/handleError
      // above (the SDK reports it through those callbacks, not necessarily
      // when this promise settles) — `submitting` is cleared there, not here.
    } catch {
      setSubmitting(false);
      setSubmitError({ message: "We couldn't process your card. Please try again." });
    }
  };

  return (
    <div className="mt-6">
      {submitError ? (
        <div className="mb-4 flex items-start gap-2 rounded-[12px] border border-error bg-error/5 p-3">
          <div className="h-10 w-10 shrink-0">
            <Lottie animationData={otpErrorAnimation} autoplay={!reduceMotion} loop={false} />
          </div>
          <p className="mt-2 text-sm font-medium text-error">
            {submitError.message ?? genericMessageFor(submitError.type)}
          </p>
        </div>
      ) : null}

      <label className="block text-xs font-bold uppercase tracking-[0.14em] text-onSurfaceVariant">
        Card number
        <input
          autoComplete="cc-number"
          className={INPUT_CLASSNAME}
          disabled={submitting}
          inputMode="numeric"
          onChange={(event) => update("cardNumber", formatCardNumber)(event.target.value)}
          placeholder="1234 5678 9012 3456"
          value={card.cardNumber}
        />
        {fieldErrors.cardNumber ? (
          <span className="mt-1 block text-[11px] font-medium normal-case tracking-normal text-error">
            {fieldErrorMessage(fieldErrors.cardNumber)}
          </span>
        ) : null}
      </label>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <label className="block text-xs font-bold uppercase tracking-[0.14em] text-onSurfaceVariant">
          Expiration
          <input
            autoComplete="cc-exp"
            className={INPUT_CLASSNAME}
            disabled={submitting}
            inputMode="numeric"
            onChange={(event) => update("expiration", formatExpiration)(event.target.value)}
            placeholder="MM/YY"
            value={card.expiration}
          />
          {fieldErrors.expiration ? (
            <span className="mt-1 block text-[11px] font-medium normal-case tracking-normal text-error">
              {fieldErrorMessage(fieldErrors.expiration)}
            </span>
          ) : null}
        </label>

        <label className="block text-xs font-bold uppercase tracking-[0.14em] text-onSurfaceVariant">
          CVC
          <input
            autoComplete="cc-csc"
            className={INPUT_CLASSNAME}
            disabled={submitting}
            inputMode="numeric"
            onChange={(event) =>
              update("securityCode", (value) => value.replace(/\D/g, "").slice(0, 4))(event.target.value)
            }
            placeholder="123"
            value={card.securityCode}
          />
          {fieldErrors.securityCode ? (
            <span className="mt-1 block text-[11px] font-medium normal-case tracking-normal text-error">
              {fieldErrorMessage(fieldErrors.securityCode)}
            </span>
          ) : null}
        </label>
      </div>

      <Button
        aria-busy={submitting}
        className="mt-5 flex w-full items-center justify-center gap-2"
        disabled={submitting}
        onClick={() => void submit()}
        size="lg"
      >
        {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
        {submitting ? "Processing…" : "Pay"}
      </Button>

      <p className="mt-4 text-center text-xs text-onSurfaceVariant">
        Your card is encrypted on this device before it is sent. eSim2you never sees your card details.
      </p>
    </div>
  );
}
