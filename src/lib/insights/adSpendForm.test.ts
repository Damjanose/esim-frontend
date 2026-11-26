import { describe, expect, it } from "vitest";
import { entryToFormInput, parseMoneyToCents, validateAdSpendForm, type AdSpendFormInput } from "./adSpendForm";

const valid: AdSpendFormInput = {
  source: "Google",
  medium: "CPC",
  campaign: "Fall Sale",
  from: "2026-11-01",
  to: "2026-11-10",
  amount: "12.50",
  currency: "USD",
  note: "  search ads  "
};

describe("parseMoneyToCents", () => {
  it("turns a money string into integer cents", () => {
    expect(parseMoneyToCents("12.50")).toBe(1250);
    expect(parseMoneyToCents("12")).toBe(1200);
    expect(parseMoneyToCents("0.5")).toBe(50);
    expect(parseMoneyToCents(" 3.07 ")).toBe(307);
  });

  it("rejects malformed amounts", () => {
    expect(parseMoneyToCents("")).toBeNull();
    expect(parseMoneyToCents("12.345")).toBeNull();
    expect(parseMoneyToCents("-4")).toBeNull();
    expect(parseMoneyToCents("abc")).toBeNull();
  });
});

describe("validateAdSpendForm", () => {
  it("accepts a valid entry, cleaning the UTM values and currency", () => {
    const result = validateAdSpendForm(valid);
    expect(result).toEqual({
      ok: true,
      value: {
        source: "google",
        medium: "cpc",
        campaign: "fall-sale",
        from: "2026-11-01",
        to: "2026-11-10",
        amountCents: 1250,
        currency: "usd",
        note: "search ads"
      }
    });
  });

  it("allows an empty medium and an empty note as null", () => {
    const result = validateAdSpendForm({ ...valid, medium: "", note: "" });
    expect(result.ok && result.value.medium).toBeNull();
    expect(result.ok && result.value.note).toBeNull();
  });

  it("reports a friendly message for each bad field", () => {
    const result = validateAdSpendForm({
      source: "",
      medium: "",
      campaign: "",
      from: "2026-13-01",
      to: "2026-10-01",
      amount: "0",
      currency: "dollars",
      note: "x".repeat(201)
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(["amount", "campaign", "currency", "from", "note", "source"]);
    expect(result.errors.source).toBe("Enter a source, such as google.");
    expect(result.errors.amount).toBe("Enter an amount above 0.");
  });

  it("rejects a range longer than 366 days", () => {
    const result = validateAdSpendForm({ ...valid, from: "2026-01-01", to: "2027-06-01" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.to).toBe("The range can be at most 366 days.");
  });

  it("rejects an amount above the cap", () => {
    const result = validateAdSpendForm({ ...valid, amount: "1000001" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.amount).toBeDefined();
  });
});

describe("entryToFormInput", () => {
  it("turns a saved entry back into form strings, so edit starts from the same values", () => {
    const form = entryToFormInput({
      id: "e1",
      source: "google",
      medium: null,
      campaign: "fall-sale",
      from: "2026-11-01",
      to: "2026-11-10",
      amountCents: 1250,
      currency: "usd",
      note: null
    });
    expect(form).toEqual({
      source: "google",
      medium: "",
      campaign: "fall-sale",
      from: "2026-11-01",
      to: "2026-11-10",
      amount: "12.50",
      currency: "usd",
      note: ""
    });
  });
});
