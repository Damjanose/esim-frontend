import { describe, expect, it } from "vitest";
import { formatCardNumber, formatExpiration, hasCardErrors, validateCard } from "./cardValidation";

describe("formatCardNumber", () => {
  it("groups digits into 4s and strips non-digits", () => {
    expect(formatCardNumber("4111 1111-1111/1111")).toBe("4111 1111 1111 1111");
  });

  it("caps at 19 digits", () => {
    expect(formatCardNumber("1".repeat(30))).toBe(
      formatCardNumber("1".repeat(19))
    );
  });
});

describe("formatExpiration", () => {
  it("inserts a slash after the month once a third digit is typed", () => {
    expect(formatExpiration("1")).toBe("1");
    expect(formatExpiration("12")).toBe("12");
    expect(formatExpiration("129")).toBe("12/9");
    expect(formatExpiration("1299")).toBe("12/99");
  });

  it("caps at MM/YY", () => {
    expect(formatExpiration("129999999")).toBe("12/99");
  });
});

describe("validateCard", () => {
  const valid = { cardNumber: "4111 1111 1111 1111", expiration: "12/99", securityCode: "123" };

  it("accepts a fully filled-in card", () => {
    expect(hasCardErrors(validateCard(valid))).toBe(false);
  });

  it("flags a card number that's too short", () => {
    const errors = validateCard({ ...valid, cardNumber: "4111 11" });
    expect(errors.cardNumber).toBe("invalid");
  });

  it("flags an expiration in the past", () => {
    const errors = validateCard({ ...valid, expiration: "01/20" });
    expect(errors.expiration).toBe("invalid");
  });

  it("flags an invalid month", () => {
    const errors = validateCard({ ...valid, expiration: "13/99" });
    expect(errors.expiration).toBe("invalid");
  });

  it("flags a CVV shorter than 3 digits", () => {
    const errors = validateCard({ ...valid, securityCode: "12" });
    expect(errors.securityCode).toBe("invalid");
  });

  it("flags every field as required when blank", () => {
    const errors = validateCard({ cardNumber: "", expiration: "", securityCode: "" });
    expect(errors.cardNumber).toBe("required");
    expect(errors.expiration).toBe("required");
    expect(errors.securityCode).toBe("required");
  });
});
