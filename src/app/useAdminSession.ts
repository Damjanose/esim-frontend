"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

export const ADMIN_TOKEN_STORAGE_KEY = "velocity-admin-dashboard-token";

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
    const storedToken = sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
    if (storedToken) setToken(storedToken);
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

        sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, nextToken);
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
    sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    setToken("");
  }, []);

  /** Call when a request comes back 401: clears the stale token so the login form reappears. */
  const handleUnauthorized = useCallback(() => {
    sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
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
