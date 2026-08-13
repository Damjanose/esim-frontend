"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await fetch("/bff/auth/signout", { method: "POST" }).catch(() => undefined);
    router.replace("/");
    router.refresh();
  }

  return (
    <button
      className="inline-flex h-10 items-center gap-2 rounded-[11px] border border-[#214867] px-4 text-xs font-black text-[#8ea3ba] transition hover:border-[#168cff]/75 hover:text-white disabled:opacity-60"
      disabled={busy}
      onClick={() => void signOut()}
      type="button"
    >
      <LogOut size={15} />
      Sign out
    </button>
  );
}
