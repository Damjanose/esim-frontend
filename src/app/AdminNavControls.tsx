"use client";

import { usePathname } from "next/navigation";
import { ChevronDown, Menu, PanelLeft, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "esim-admin-nav";

function root(): HTMLElement {
  return document.documentElement;
}

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "collapsed";
  } catch {
    return false;
  }
}

function writeCollapsed(collapsed: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "collapsed" : "expanded");
  } catch {
    // Storage can be blocked; the sidebar still works for this page view.
  }
}

/**
 * The sidebar reads its state from attributes on <html> (see the "Admin sidebar"
 * block in globals.css), so the page offset and the sidebar stay in sync without
 * every admin page owning any state. Mount once per page.
 */
export function AdminNavState() {
  const pathname = usePathname();

  useEffect(() => {
    if (readCollapsed()) root().setAttribute("data-admin-nav", "collapsed");
    // Enable transitions only after the stored state is applied, so a saved
    // collapsed sidebar does not animate on first paint.
    const frame = requestAnimationFrame(() => root().setAttribute("data-admin-anim", ""));
    return () => {
      cancelAnimationFrame(frame);
      root().removeAttribute("data-admin-nav");
      root().removeAttribute("data-admin-anim");
      root().removeAttribute("data-admin-menu");
    };
  }, []);

  useEffect(() => {
    root().removeAttribute("data-admin-menu");
  }, [pathname]);

  return null;
}

/** Desktop: pins the sidebar open or folds it to the icon rail. */
export function AdminNavCollapseButton() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(readCollapsed());
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    writeCollapsed(next);
    if (next) root().setAttribute("data-admin-nav", "collapsed");
    else root().removeAttribute("data-admin-nav");
  }

  return (
    <button
      aria-label={collapsed ? "Pin sidebar open" : "Collapse sidebar"}
      aria-pressed={collapsed}
      className="admin-nav-fold"
      onClick={toggle}
      title={collapsed ? "Pin sidebar open" : "Collapse sidebar"}
      type="button"
    >
      <PanelLeft aria-hidden="true" size={18} />
    </button>
  );
}

/** Below 1024px the sidebar is a drawer: this renders its top bar and backdrop. */
export function AdminNavMobile({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener(ADMIN_NAV_CLOSE_EVENT, close);
    return () => window.removeEventListener(ADMIN_NAV_CLOSE_EVENT, close);
  }, []);

  useEffect(() => {
    if (open) root().setAttribute("data-admin-menu", "open");
    else root().removeAttribute("data-admin-menu");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div className="admin-nav-mobilebar">
        <button
          aria-expanded={open}
          aria-label="Open menu"
          className="admin-nav-burger"
          onClick={() => setOpen(true)}
          type="button"
        >
          <Menu aria-hidden="true" size={20} />
        </button>
        <span className="admin-nav-mobiletitle">{title}</span>
      </div>
      <button
        aria-label="Close menu"
        className="admin-nav-scrim"
        onClick={() => setOpen(false)}
        tabIndex={-1}
        type="button"
      />
    </>
  );
}

export const ADMIN_NAV_CLOSE_EVENT = "admin-nav-close";

/** Close button inside the drawer; tells AdminNavMobile to shut it. */
export function AdminNavClose() {
  return (
    <button
      aria-label="Close menu"
      className="admin-nav-close"
      onClick={() => window.dispatchEvent(new Event(ADMIN_NAV_CLOSE_EVENT))}
      type="button"
    >
      <X aria-hidden="true" size={18} />
    </button>
  );
}

/** A foldable link group. Folding is ignored while the sidebar is the icon rail. */
export function AdminNavGroup({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="admin-nav-group" data-open={open}>
      <button
        aria-expanded={open}
        className="admin-nav-group-title"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span className="admin-nav-label">{title}</span>
        <ChevronDown aria-hidden="true" className="admin-nav-chevron" size={14} />
      </button>
      <div className="admin-nav-group-body">
        <div className="admin-nav-group-items">{children}</div>
      </div>
    </div>
  );
}
