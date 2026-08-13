import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendFetch, type BackendResult } from "./backend";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./session";

/**
 * Server Components cannot write cookies, so they cannot refresh a session
 * themselves. When the access token is missing or rejected we bounce through
 * the refresh route handler, which can rotate the cookies and send the visitor
 * straight back here.
 */
export async function fetchForPage<T>(
  path: string,
  currentPath: string
): Promise<BackendResult<T>> {
  const jar = await cookies();
  const accessToken = jar.get(ACCESS_COOKIE)?.value;
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;

  const recover = () => {
    if (refreshToken) {
      redirect(`/bff/auth/refresh?next=${encodeURIComponent(currentPath)}`);
    }
    redirect(`/signin?next=${encodeURIComponent(currentPath)}`);
  };

  if (!accessToken) {
    recover();
  }

  const result = await backendFetch<T>(path, { token: accessToken });

  if (!result.ok && result.status === 401) {
    recover();
  }

  return result;
}
