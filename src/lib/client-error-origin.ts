import { canonicalHost } from "./site-host";

/** Reject only a browser Origin that is clearly not ours; a missing Origin (curl, server calls) passes. */
export function isAllowedClientErrorOrigin(origin: string | null, requestHost: string | null): boolean {
  if (!origin) return true;
  let host: string;
  try {
    host = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }
  const bare = host.replace(/:\d+$/, "");
  const requestBare = (requestHost ?? "").toLowerCase().replace(/:\d+$/, "");
  return (
    bare === canonicalHost ||
    bare === `www.${canonicalHost}` ||
    bare === "localhost" ||
    bare === "127.0.0.1" ||
    (requestBare !== "" && bare === requestBare)
  );
}
