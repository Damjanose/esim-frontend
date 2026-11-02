export type PendingPayment = {
  paymentReference: string;
  kind: "order" | "topup";
  state: "setting_up" | "needs_support";
  packageId: string | null;
  createdAt: string;
};

/** Tolerant parse: anything unexpected is dropped rather than breaking /account. */
export function normalisePendingPayments(data: unknown): PendingPayment[] {
  const list = (data as { pending?: unknown } | null | undefined)?.pending;
  if (!Array.isArray(list)) return [];
  return list.flatMap((item): PendingPayment[] => {
    const entry = item as Partial<PendingPayment> | null;
    if (!entry || typeof entry.paymentReference !== "string" || !entry.paymentReference) return [];
    if (entry.state !== "setting_up" && entry.state !== "needs_support") return [];
    return [
      {
        paymentReference: entry.paymentReference,
        kind: entry.kind === "topup" ? "topup" : "order",
        state: entry.state,
        packageId: typeof entry.packageId === "string" ? entry.packageId : null,
        createdAt: typeof entry.createdAt === "string" ? entry.createdAt : ""
      }
    ];
  });
}
