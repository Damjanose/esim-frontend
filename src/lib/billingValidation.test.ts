import { describe, expect, it } from "vitest";
import { hasBillingErrors, validateBillingAddress } from "./billingValidation";

const valid = {
  holdersName: "Alex Morgan",
  email: "alex@example.com",
  countryCode: "AL",
  administrativeArea: "Tirana",
  locality: "Tirana",
  address1: "12 Rruga e Kavajës",
  postalCode: "1001",
  phoneNumber: "+355691234567"
};

describe("validateBillingAddress", () => {
  it("accepts a fully filled-in address", () => {
    expect(hasBillingErrors(validateBillingAddress(valid))).toBe(false);
  });

  it("flags every required field as missing when blank", () => {
    const errors = validateBillingAddress({ ...valid, holdersName: "", address1: "" });
    expect(errors.holdersName).toBe("required");
    expect(errors.address1).toBe("required");
  });

  it("rejects a country code that isn't two letters", () => {
    const errors = validateBillingAddress({ ...valid, countryCode: "ALB" });
    expect(errors.countryCode).toBe("invalid");
  });

  it("rejects a phone number with fewer than 6 digits", () => {
    const errors = validateBillingAddress({ ...valid, phoneNumber: "12345" });
    expect(errors.phoneNumber).toBe("invalid");
  });

  it("flags a holder's name under 2 characters as too short, not missing", () => {
    const errors = validateBillingAddress({ ...valid, holdersName: "A" });
    expect(errors.holdersName).toBe("tooShort");
  });
});
