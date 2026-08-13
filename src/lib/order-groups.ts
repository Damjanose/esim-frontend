export type LifecycleStatus = "ready" | "active" | "expired";

export type OrderSummary = {
  id: number;
  code: string;
  status: string;
  lifecycle_status: LifecycleStatus;
  package_id: string;
  created_at: string;
  expires_at: string | null;
};

export type OrderGroups = {
  /** The backend allows a single active plan at a time. */
  active: OrderSummary | null;
  ready: OrderSummary[];
  history: OrderSummary[];
};

function purchasedAt(order: OrderSummary): number {
  const parsed = new Date(order.created_at).getTime();
  // Unparseable dates sort last rather than poisoning the comparison with NaN.
  return Number.isNaN(parsed) ? -Infinity : parsed;
}

function newestFirst(a: OrderSummary, b: OrderSummary): number {
  return purchasedAt(b) - purchasedAt(a);
}

/**
 * Splits the order list the way the mobile app does: the plan currently burning
 * data, the plans bought but not started, and everything finished.
 *
 * An unrecognised lifecycle is shown as ready. A plan the visitor paid for must
 * never vanish from the page just because the backend grew a new status.
 */
export function groupOrdersByLifecycle(orders: OrderSummary[]): OrderGroups {
  const active: OrderSummary[] = [];
  const ready: OrderSummary[] = [];
  const history: OrderSummary[] = [];

  for (const order of orders) {
    if (order.lifecycle_status === "active") {
      active.push(order);
    } else if (order.lifecycle_status === "expired") {
      history.push(order);
    } else {
      ready.push(order);
    }
  }

  active.sort(newestFirst);
  const [current, ...surplus] = active;

  return {
    active: current ?? null,
    ready: [...ready, ...surplus].sort(newestFirst),
    history: history.sort(newestFirst)
  };
}

/**
 * Reconciles the order list with a dedicated `/orders/active` lookup.
 *
 * That endpoint checks remaining data and expires a depleted plan as a side
 * effect, so it is the authority on what is live — the list may still describe a
 * plan it just expired as active. `undefined` means the lookup did not answer,
 * in which case the list grouping stands on its own.
 */
export function resolveOrderSections(
  orders: OrderSummary[],
  authoritativeActive: OrderSummary | null | undefined
): OrderGroups {
  const groups = groupOrdersByLifecycle(orders);

  if (authoritativeActive === undefined) {
    return groups;
  }

  const activeId = authoritativeActive?.id ?? null;
  const demoted = groups.active && groups.active.id !== activeId ? [groups.active] : [];
  const promotedFromReady = groups.ready.filter((row) => row.id !== activeId);

  return {
    active: authoritativeActive,
    ready: promotedFromReady,
    history: [...demoted, ...groups.history].sort(newestFirst)
  };
}
