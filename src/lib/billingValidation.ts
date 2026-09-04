import type { BillingAddress } from "@/app/bff/user/billing-address/route";

export type BillingFieldError = "required" | "invalid" | "tooShort";
export type BillingFieldErrors = Partial<Record<keyof BillingAddress, BillingFieldError>>;

export const BILLING_FIELDS: { autoComplete: string; key: keyof BillingAddress; label: string }[] = [
  { autoComplete: "name", key: "holdersName", label: "Full name" },
  { autoComplete: "email", key: "email", label: "Email" },
  { autoComplete: "street-address", key: "address1", label: "Address" },
  { autoComplete: "postal-code", key: "postalCode", label: "Postal code" },
  { autoComplete: "address-level2", key: "locality", label: "City" },
  { autoComplete: "address-level1", key: "administrativeArea", label: "State / region" },
  { autoComplete: "country", key: "countryCode", label: "Country code" },
  { autoComplete: "tel", key: "phoneNumber", label: "Phone number" }
];

export const BILLING_FIELD_ORDER: (keyof BillingAddress)[] = BILLING_FIELDS.map((field) => field.key);

export function validateBillingAddress(address: BillingAddress): BillingFieldErrors {
  const errors: BillingFieldErrors = {};
  const trimmed = (value: string) => (value ?? "").trim();

  for (const field of BILLING_FIELD_ORDER) {
    if (!trimmed(address[field])) errors[field] = "required";
  }

  if (!errors.holdersName && trimmed(address.holdersName).length < 2) {
    errors.holdersName = "tooShort";
  }
  if (!errors.countryCode && !/^[A-Za-z]{2}$/.test(trimmed(address.countryCode))) {
    errors.countryCode = "invalid";
  }
  if (!errors.phoneNumber && trimmed(address.phoneNumber).replace(/\D/g, "").length < 6) {
    errors.phoneNumber = "invalid";
  }
  if (!errors.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed(address.email))) {
    errors.email = "invalid";
  }

  return errors;
}

export function hasBillingErrors(errors: BillingFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function normalizeBillingAddress(address: BillingAddress): BillingAddress {
  return {
    holdersName: address.holdersName.trim(),
    email: address.email.trim(),
    countryCode: address.countryCode.trim().toUpperCase(),
    administrativeArea: address.administrativeArea.trim(),
    locality: address.locality.trim(),
    address1: address.address1.trim(),
    postalCode: address.postalCode.trim(),
    phoneNumber: address.phoneNumber.trim()
  };
}

export const EMPTY_BILLING_ADDRESS: BillingAddress = {
  holdersName: "",
  email: "",
  countryCode: "",
  administrativeArea: "",
  locality: "",
  address1: "",
  postalCode: "",
  phoneNumber: ""
};
