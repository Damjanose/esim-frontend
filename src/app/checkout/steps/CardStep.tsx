"use client";

import { useRef } from "react";
import { GuestCheckoutForm, type PaymentErrorResponse } from "@nebula-ltd/pok-payments-js/react";
import "@nebula-ltd/pok-payments-js/style.css";

export function CardStep({
  paymentId,
  environment,
  accountEmail,
  onPaid,
  onError
}: {
  paymentId: string;
  environment: string;
  accountEmail: string | null;
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
    <div className="mt-6">
      {/* The SDK's .pok-payment-form already renders its own bordered card, so this
          wrapper only adds spacing — an outer border here would double up with it.
          The email row is hidden (see globals.css) and pre-filled from the account:
          it was already collected in the billing step, and the SDK has no prop to
          omit the field. */}
      <GuestCheckoutForm
        orderId={paymentId}
        onSuccess={handleSuccess}
        onError={handleError}
        options={{
          env: environment === "production" ? "production" : "staging",
          initialState: {
            cardNumber: "",
            email: accountEmail ?? "",
            expiration: "",
            securityCode: "",
            holdersName: "",
            countryCode: "",
            address1: "",
            locality: "",
            administrativeArea: "",
            postalCode: "",
            phoneNumber: ""
          }
        }}
      />
      <p className="mt-4 text-center text-xs text-onSurfaceVariant">
        Your card is encrypted on this device before it is sent. eSim2you never sees your card details.
      </p>
    </div>
  );
}
