/**
 * Order codes come from the backend (Airalo order codes). We never trust the URL
 * segment as-is: anything outside this shape is a 404 before any backend call.
 */
const ORDER_CODE = /^[A-Za-z0-9_-]{1,64}$/;

export function isOrderCode(value: string): boolean {
  return ORDER_CODE.test(value);
}

/** Same-origin BFF URL that downloads the receipt PDF for an order code. */
export function receiptDownloadPath(code: string): string {
  return `/bff/orders/${encodeURIComponent(code)}/receipt`;
}
