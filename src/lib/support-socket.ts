/**
 * Public Socket.IO origin for the admin support inbox.
 *
 * REST still goes through `/bff/admin/support/*`. The browser opens a Socket.IO
 * connection to the Express API host so unread badges and messages update live.
 * Override with NEXT_PUBLIC_SOCKET_URL for local backends.
 */
export function getPublicSocketUrl(): string {
  const explicit = (process.env.NEXT_PUBLIC_SOCKET_URL ?? "").trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const api = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();
  if (api) {
    return api.replace(/\/api\/?$/, "").replace(/\/$/, "");
  }

  return "https://esim.uplisoft.com";
}
