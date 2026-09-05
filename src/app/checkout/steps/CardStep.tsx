"use client";

import { useRef } from "react";
import { GuestCheckoutForm, type PaymentErrorResponse } from "@nebula-ltd/pok-payments-js/react";
import "@nebula-ltd/pok-payments-js/style.css";
import type { BillingAddress } from "@/app/bff/user/billing-address/route";

export function CardStep({
  paymentId,
  environment,
  accountEmail,
  billingAddress,
  onPaid,
  onError
}: {
  paymentId: string;
  environment: string;
  accountEmail: string | null;
  billingAddress: BillingAddress;
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
          The email row and the "Add billing info" checkbox (+ the address1/city/
          zip/phone/state fields it reveals) are hidden via globals.css: they
          duplicate the billing step's form exactly, and the SDK has no prop to
          omit them. The submitted values are never used anyway — payments.ts
          always charges against the already-saved billing address, never
          whatever this form submits (see purchaseDetails.service.ts). The one
          field the SDK always renders regardless of that checkbox is its own
          country select, which stays visible but is pre-filled from the saved
          address below so it's never blank. */}
      <GuestCheckoutForm
        orderId={paymentId}
        onSuccess={handleSuccess}
        onError={handleError}
        options={{
          env: environment === "production" ? "production" : "staging",
          initialState: {
            cardNumber: "",
            email: accountEmail ?? billingAddress.email,
            expiration: "",
            securityCode: "",
            holdersName: billingAddress.holdersName,
            countryCode: billingAddress.countryCode,
            address1: billingAddress.address1,
            locality: billingAddress.locality,
            administrativeArea: billingAddress.administrativeArea,
            postalCode: billingAddress.postalCode,
            phoneNumber: billingAddress.phoneNumber
          }
        }}
      />
      <p className="mt-4 text-center text-xs text-onSurfaceVariant">
        Your card is encrypted on this device before it is sent. eSim2you never sees your card details.
      </p>
    </div>
  );
}
