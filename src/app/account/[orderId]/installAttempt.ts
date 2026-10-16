/**
 * Best-effort report of an install attempt. `keepalive` lets it finish when the
 * Install link navigates away to Apple's eSIM setup.
 */
export function reportInstallAttempt(orderId: number): void {
  void fetch(`/bff/user/orders/${orderId}/install-attempt`, { method: "POST", keepalive: true }).catch(
    () => undefined
  );
}
