"use client";

import { UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Desktop navbar account slot: the profile icon when signed in, a Sign in link
 * when not. The Navbar stays static (f022), so the session is asked for here
 * and re-checked on every navigation to pick up sign-in/sign-out. Renders
 * nothing until the answer arrives, so the wrong state never flashes.
 */
export function NavbarAccount() {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/bff/auth/status", { cache: "no-store" })
      .then((response) => response.json())
      .then((body: { data?: { signedIn?: boolean } }) => {
        if (!cancelled) setSignedIn(Boolean(body.data?.signedIn));
      })
      .catch(() => {
        if (!cancelled) setSignedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (signedIn === null) return null;

  if (!signedIn) {
    return (
      <a
        className="hidden h-11 items-center rounded-full border border-outline px-4 text-sm font-semibold text-brandInk transition hover:border-brandBlue/40 hover:text-brandBlue group-data-[tone=dark]:border-white/25 group-data-[tone=dark]:text-white group-data-[tone=dark]:hover:border-white/50 lg:flex"
        href="/signin"
        rel="nofollow"
      >
        Sign in
      </a>
    );
  }

  return (
    <a
      aria-label="Your profile"
      className="hidden h-11 w-11 place-items-center rounded-full border border-outline text-brandInk transition hover:border-brandBlue/40 hover:text-brandBlue group-data-[tone=dark]:border-white/25 group-data-[tone=dark]:text-white group-data-[tone=dark]:hover:border-white/50 lg:grid"
      href="/profile"
      rel="nofollow"
    >
      <UserRound aria-hidden="true" size={19} />
    </a>
  );
}
