import { describe, expect, it } from "vitest";
import { normalisePendingPayments } from "./pendingPayments";

describe("normalisePendingPayments", () => {
  it("keeps valid entries and drops junk", () => {
    expect(
      normalisePendingPayments({
        pending: [
          { paymentReference: "p1", kind: "order", state: "setting_up", packageId: "x", createdAt: "t" },
          { paymentReference: "", state: "setting_up" },
          { paymentReference: "p2", state: "weird" },
          null
        ]
      })
    ).toEqual([{ paymentReference: "p1", kind: "order", state: "setting_up", packageId: "x", createdAt: "t" }]);
  });

  it("returns [] for missing data", () => {
    expect(normalisePendingPayments(undefined)).toEqual([]);
    expect(normalisePendingPayments({})).toEqual([]);
  });
});
