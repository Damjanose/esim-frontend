"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  adminTokenCookie,
  adminTokenMaxAgeSeconds,
  clearedAdminTokenCookie,
  readAdminTokenCookie
} from "@/lib/adminTokenCookie";

function isSecurePage(): boolean {
  return window.location.protocol === "https:";
}

/** Lets every useAdminSession instance on the page (page + sidebar) follow a login or logout. */
const SESSION_EVENT = "admin-session-change";

function announceSessionChange(): void {
  window.dispatchEvent(new Event(SESSION_EVENT));
}

/** Keeps the token in a cookie until it expires, so a new tab or browser restart stays signed in. */
function saveToken(token: string): void {
  const maxAge = adminTokenMaxAgeSeconds(token);
  document.cookie = maxAge > 0 ? adminTokenCookie(token, maxAge, isSecurePage()) : clearedAdminTokenCookie(isSecurePage());
  announceSessionChange();
}

function clearToken(): void {
  document.cookie = clearedAdminTokenCookie(isSecurePage());
  announceSessionChange();
}

type AdminLoginResponse = {
  status?: string;
  data?: {
    token?: string;
  };
  message?: string;
};

/**
 * Shared admin login/token state. `/xloginy` and `/xerrors` each still carry
 * their own copy of this logic (f045 in feedAI/topics/admin-dashboard-ui.json)
 * — new pages should use this instead of tripling the duplication.
 */
export function useAdminSession() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedToken = readAdminTokenCookie(document.cookie);
    if (storedToken && adminTokenMaxAgeSeconds(storedToken) > 0) setToken(storedToken);
    else if (storedToken) clearToken();

    const sync = () => {
      const current = readAdminTokenCookie(document.cookie);
      setToken(current && adminTokenMaxAgeSeconds(current) > 0 ? current : "");
    };
    window.addEventListener(SESSION_EVENT, sync);
    return () => window.removeEventListener(SESSION_EVENT, sync);
  }, []);

  const login = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<string | null> => {
      event.preventDefault();
      setIsLoggingIn(true);
      setError("");

      try {
        const response = await fetch("/bff/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const payload = (await response.json()) as AdminLoginResponse;
        const nextToken = payload.data?.token;

        if (!response.ok || payload.status !== "success" || !nextToken) {
          throw new Error(payload.message ?? "Invalid admin credentials");
        }

        saveToken(nextToken);
        setToken(nextToken);
        setPassword("");
        return nextToken;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid admin credentials");
        return null;
      } finally {
        setIsLoggingIn(false);
      }
    },
    [email, password]
  );

  const logout = useCallback(() => {
    clearToken();
    setToken("");
  }, []);

  /** Call when a request comes back 401: clears the stale token so the login form reappears. */
  const handleUnauthorized = useCallback(() => {
    clearToken();
    setToken("");
  }, []);

  return {
    token,
    email,
    setEmail,
    password,
    setPassword,
    isLoggingIn,
    error,
    setError,
    login,
    logout,
    handleUnauthorized
  };
}
