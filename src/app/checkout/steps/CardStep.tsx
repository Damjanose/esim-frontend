"use client";

import { useRef } from "react";
import { GuestCheckoutForm, type PaymentErrorResponse } from "@nebula-ltd/pok-payments-js/react";

export function CardStep({
  paymentId,
  environment,
  onPaid,
  onError
}: {
  paymentId: string;
  environment: string;
  onPaid: () => void;
  onError: (message: string) => void;
}) {
  // Guards against the SDK invoking onSuccess more than once for the same
  // payment — its docs don't guarantee single-invocation, and re-provisioning
  // is safe but re-navigating the wizard forward twice is not.
  const handledRef = useRef(false);

  const handleSuccess = () => {
    if (handledRef.current) return;
    handledRef.current = true;
    onPaid();
  };

  const handleError = (error: PaymentErrorResponse) => {
    onError(error.message ?? "The payment could not be completed. Please try again.");
  };

  return (
    <div className="mt-6 rounded-[20px] border border-outline bg-white p-6 shadow-brandCard sm:p-8">
      <GuestCheckoutForm
        orderId={paymentId}
        onSuccess={handleSuccess}
        onError={handleError}
        options={{ env: environment === "production" ? "production" : "staging" }}
      />
      <p className="mt-4 text-center text-xs text-onSurfaceVariant">
        Your card is encrypted on this device before it is sent. eSim2you never sees your card details.
      </p>
    </div>
  );
}
