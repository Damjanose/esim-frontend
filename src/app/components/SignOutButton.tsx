"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "./Button";
import { SETTINGS_ICON_TILE_CLASSES } from "./SettingsGroup";

/**
 * - "button": the old full-width CTA (until /profile moves to the grouped list).
 * - "nav": a sidebar entry, the footer of AccountShell at lg+.
 * - "row": a settings row inside a SettingsGroup card (phones/tablets).
 */
type Appearance = "button" | "nav" | "row";

const CLASSES: Record<Exclude<Appearance, "button">, string> = {
  nav:
    "flex min-h-11 w-full items-center gap-3 rounded-[12px] px-3 text-left text-sm font-semibold text-onSurfaceVariant transition hover:bg-surfaceBright hover:text-brandInk disabled:cursor-not-allowed disabled:opacity-60",
  row:
    "flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left text-sm font-semibold text-brandInk transition hover:bg-surfaceBright disabled:cursor-not-allowed disabled:opacity-60"
};

export function SignOutButton({ appearance = "button" }: { appearance?: Appearance }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await fetch("/bff/auth/signout", { method: "POST" }).catch(() => undefined);
    router.replace("/");
    router.refresh();
  }

  if (appearance === "button") {
    return (
      <Button className="w-full" disabled={busy} onClick={() => void signOut()} type="button">
        <LogOut size={17} />
        Sign out
      </Button>
    );
  }

  return (
    <button className={CLASSES[appearance]} disabled={busy} onClick={() => void signOut()} type="button">
      {appearance === "row" ? (
        <span className={SETTINGS_ICON_TILE_CLASSES}>
          <LogOut aria-hidden="true" size={18} />
        </span>
      ) : (
        <LogOut aria-hidden="true" className="shrink-0" size={18} />
      )}
      Sign out
    </button>
  );
}
