export type CardField = "cardNumber" | "expiration" | "securityCode";
export type CardFieldError = "required" | "invalid";
export type CardFieldErrors = Partial<Record<CardField, CardFieldError>>;

export type CardFormData = {
  cardNumber: string;
  expiration: string;
  securityCode: string;
};

export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function formatExpiration(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function isExpirationInFuture(month: number, year: number): boolean {
  const expiry = new Date(year, month, 1);
  const now = new Date();
  now.setDate(1);
  now.setHours(0, 0, 0, 0);
  return expiry > now;
}

export function validateCard(data: CardFormData): CardFieldErrors {
  const errors: CardFieldErrors = {};

  const cardDigits = data.cardNumber.replace(/\D/g, "");
  if (!cardDigits) {
    errors.cardNumber = "required";
  } else if (cardDigits.length < 13 || cardDigits.length > 19) {
    errors.cardNumber = "invalid";
  }

  const expirationDigits = data.expiration.replace(/\D/g, "");
  if (!expirationDigits) {
    errors.expiration = "required";
  } else if (expirationDigits.length !== 4) {
    errors.expiration = "invalid";
  } else {
    const month = parseInt(expirationDigits.slice(0, 2), 10);
    const year = 2000 + parseInt(expirationDigits.slice(2), 10);
    if (month < 1 || month > 12 || !isExpirationInFuture(month, year)) {
      errors.expiration = "invalid";
    }
  }

  const cvvDigits = data.securityCode.replace(/\D/g, "");
  if (!cvvDigits) {
    errors.securityCode = "required";
  } else if (cvvDigits.length < 3 || cvvDigits.length > 4) {
    errors.securityCode = "invalid";
  }

  return errors;
}

export function hasCardErrors(errors: CardFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
