"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { initialNavTone, navToneFor } from "./navTone";

/**
 * The navbar's fixed <header>. Exposes `data-tone="dark" | "light"` so the
 * server-rendered capsule inside styles itself with `group-data-[tone=dark]:`
 * classes: dark glass over the homepage's dark hero card, light glass after it
 * scrolls away and on every other page.
 */
export function NavbarTone({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [tone, setTone] = useState(() => initialNavTone(pathname));

  useEffect(() => {
    const hero = document.querySelector<HTMLElement>("[data-nav-dark]");
    let frame = 0;
    const update = () => {
      frame = 0;
      setTone(navToneFor(hero ? hero.getBoundingClientRect().bottom : null));
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return (
    <header className="group fixed inset-x-0 top-0 z-50 px-3 pt-3 lg:px-6" data-tone={tone}>
      {children}
    </header>
  );
}
