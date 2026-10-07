"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { Button } from "./components/Button";

// Loaded on first open so the homepage ships none of the composer (CWV budget).
const ReviewComposer = dynamic(() => import("./components/ReviewComposer").then((mod) => mod.ReviewComposer), {
  ssr: false
});

export function ShareExperienceButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Back from sign-in with a saved draft.
    if (new URLSearchParams(window.location.search).get("review") === "open") setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <Button onClick={() => setOpen(true)} type="button" variant="tint">
        Share your experience
      </Button>

      {open ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-brandInk/40 p-0 sm:items-center sm:p-6"
          onClick={(event) => event.target === event.currentTarget && setOpen(false)}
          role="dialog"
        >
          <div className="relative max-h-[92svh] w-full overflow-y-auto rounded-t-[24px] bg-surface p-1 sm:max-w-lg sm:rounded-[24px]">
            <button
              aria-label="Close"
              className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full text-onSurfaceVariant hover:bg-surfaceBright"
              onClick={() => setOpen(false)}
              type="button"
            >
              <X aria-hidden size={18} />
            </button>
            <ReviewComposer heading="How was your trip?" subheading="Your review helps other travelers pick a plan." />
          </div>
        </div>
      ) : null}
    </>
  );
}
