import { describe, expect, it } from "vitest";
import {
  groupOrdersByLifecycle,
  resolveOrderSections,
  type OrderSummary
} from "./order-groups";

function order(overrides: Partial<OrderSummary> & { id: number }): OrderSummary {
  return {
    code: `ORD-${overrides.id}`,
    status: "completed",
    lifecycle_status: "ready",
    package_id: "hej-telecom-in-30days-20gb",
    created_at: "2026-08-01T10:00:00.000Z",
    expires_at: null,
    ...overrides
  };
}

describe("groupOrdersByLifecycle", () => {
  it("splits orders into the active plan, ready plans, and history", () => {
    const groups = groupOrdersByLifecycle([
      order({ id: 1, lifecycle_status: "expired" }),
      order({ id: 2, lifecycle_status: "active" }),
      order({ id: 3, lifecycle_status: "ready" })
    ]);

    expect(groups.active?.id).toBe(2);
    expect(groups.ready.map((row) => row.id)).toEqual([3]);
    expect(groups.history.map((row) => row.id)).toEqual([1]);
  });

  it("sorts every group newest first", () => {
    const groups = groupOrdersByLifecycle([
      order({ id: 1, lifecycle_status: "ready", created_at: "2026-01-01T00:00:00.000Z" }),
      order({ id: 2, lifecycle_status: "ready", created_at: "2026-08-01T00:00:00.000Z" }),
      order({ id: 3, lifecycle_status: "expired", created_at: "2026-02-01T00:00:00.000Z" }),
      order({ id: 4, lifecycle_status: "expired", created_at: "2026-07-01T00:00:00.000Z" })
    ]);

    expect(groups.ready.map((row) => row.id)).toEqual([2, 1]);
    expect(groups.history.map((row) => row.id)).toEqual([4, 3]);
  });

  it("keeps the newest active plan when the backend reports more than one", () => {
    // Only one plan can be active, but the page must not drop data if that
    // invariant is ever broken upstream.
    const groups = groupOrdersByLifecycle([
      order({ id: 1, lifecycle_status: "active", created_at: "2026-01-01T00:00:00.000Z" }),
      order({ id: 2, lifecycle_status: "active", created_at: "2026-08-01T00:00:00.000Z" })
    ]);

    expect(groups.active?.id).toBe(2);
    expect(groups.ready.map((row) => row.id)).toEqual([1]);
  });

  it("treats an unrecognised lifecycle as ready rather than hiding the plan", () => {
    const groups = groupOrdersByLifecycle([
      order({ id: 1, lifecycle_status: "something-new" as OrderSummary["lifecycle_status"] })
    ]);

    expect(groups.ready.map((row) => row.id)).toEqual([1]);
    expect(groups.active).toBeNull();
    expect(groups.history).toEqual([]);
  });

  it("orders with an unreadable purchase date sort last instead of breaking the sort", () => {
    const groups = groupOrdersByLifecycle([
      order({ id: 1, lifecycle_status: "ready", created_at: "not-a-date" }),
      order({ id: 2, lifecycle_status: "ready", created_at: "2026-08-01T00:00:00.000Z" })
    ]);

    expect(groups.ready.map((row) => row.id)).toEqual([2, 1]);
  });

  it("handles an empty list", () => {
    expect(groupOrdersByLifecycle([])).toEqual({ active: null, ready: [], history: [] });
  });
});

describe("resolveOrderSections", () => {
  const live = order({ id: 2, lifecycle_status: "active" });
  const list = [order({ id: 1, lifecycle_status: "expired" }), live];

  it("uses the list grouping when the active lookup agrees", () => {
    const sections = resolveOrderSections(list, live);

    expect(sections.active?.id).toBe(2);
    expect(sections.history.map((row) => row.id)).toEqual([1]);
  });

  it("moves a just-expired plan to history when the active lookup says nothing is live", () => {
    // /orders/active expires depleted plans as a side effect, so it knows about
    // an expiry that the already-fetched /orders list still describes as active.
    const sections = resolveOrderSections(list, null);

    expect(sections.active).toBeNull();
    expect(sections.history.map((row) => row.id)).toEqual([2, 1]);
    expect(sections.ready).toEqual([]);
  });

  it("prefers the fresher active record over the one in the list", () => {
    const fresher = { ...live, package_id: "renamed-after-refresh" };
    const sections = resolveOrderSections(list, fresher);

    expect(sections.active?.package_id).toBe("renamed-after-refresh");
    expect(sections.ready).toEqual([]);
    expect(sections.history.map((row) => row.id)).toEqual([1]);
  });

  it("falls back to the list grouping when the active lookup failed", () => {
    const sections = resolveOrderSections(list, undefined);

    expect(sections.active?.id).toBe(2);
    expect(sections.history.map((row) => row.id)).toEqual([1]);
  });

  it("promotes a plan the list has not caught up with yet", () => {
    const sections = resolveOrderSections([order({ id: 3, lifecycle_status: "ready" })], {
      ...order({ id: 3 }),
      lifecycle_status: "active"
    });

    expect(sections.active?.id).toBe(3);
    expect(sections.ready).toEqual([]);
  });
});
