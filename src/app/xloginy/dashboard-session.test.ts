import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import AdminDashboardPage from "./page";
import { AdminNav } from "../AdminNav";
import { useAdminSession } from "../useAdminSession";

vi.mock("../useAdminSession", () => ({ useAdminSession: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/xloginy" }));
afterEach(() => vi.resetAllMocks());

it("keeps logout available when the dashboard signs in after navigation mounted", () => {
  const session = {
    token: "current-admin", email: "", password: "", error: "", isLoggingIn: false,
    logout: vi.fn(), handleUnauthorized: vi.fn(), login: vi.fn(),
    setEmail: vi.fn(), setPassword: vi.fn(), setError: vi.fn(),
  };
  // These hooks own separate state: the page just signed in, the nav mounted signed out.
  vi.mocked(useAdminSession)
    .mockReturnValueOnce(session)
    .mockReturnValue({ ...session, token: "" });
  const html = renderToStaticMarkup(React.createElement(AdminDashboardPage));
  expect(html).toContain('aria-label="Logout"');
});

it("routes navigation logout to the dashboard session that owns the loaded data", () => {
  let dashboardToken = "dashboard-session";
  let navigationToken = "older-navigation-session";
  vi.mocked(useAdminSession).mockReturnValue({
    token: navigationToken, logout: () => { navigationToken = ""; },
  } as ReturnType<typeof useAdminSession>);
  const nav = AdminNav({ session: {
    token: dashboardToken, logout: () => { dashboardToken = ""; },
  } });
  const button = React.Children.toArray(nav.props.children).find((child) =>
    React.isValidElement(child) && (child.props as { "aria-label"?: string })["aria-label"] === "Logout",
  ) as React.ReactElement<{ onClick: () => void }>;
  button.props.onClick();
  expect(dashboardToken).toBe("");
  expect(navigationToken).toBe("older-navigation-session");
});
