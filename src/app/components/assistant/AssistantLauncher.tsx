"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { t } from "@/lib/assistant/copy";
import { isAssistantVisible } from "@/lib/assistant/navigation";
import { isDockVisible } from "../dockNav";
import { assistantStore } from "./assistantStore";

// The chat (and its Lottie loader) only loads once someone opens it.
const AssistantChat = dynamic(() => import("./AssistantChat").then((module) => module.AssistantChat), {
  ssr: false
});

const TEASER_DELAY_MS = 2_000;
const TEASER_VISIBLE_MS = 3_500;

/**
 * The floating AI assistant: the web twin of the app's AssistantBubble, pinned
 * bottom-right (not draggable). Below lg it sits above the BottomDock when the
 * dock is showing. Opening it shows the chat as a card above the button from sm
 * up, and full screen on phones.
 */
export function AssistantLauncher() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // One short teaser per tab session, a moment after the first page settles.
  useEffect(() => {
    if (open) return;
    const show = setTimeout(() => {
      if (assistantStore.claimTeaser()) setTeaser(true);
    }, TEASER_DELAY_MS);
    return () => clearTimeout(show);
  }, [open]);

  useEffect(() => {
    if (!teaser) return;
    const hide = setTimeout(() => setTeaser(false), TEASER_VISIBLE_MS);
    return () => clearTimeout(hide);
  }, [teaser]);

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  if (!isAssistantVisible(pathname)) return null;

  const aboveDock = isDockVisible(pathname);

  return (
    <div
      className={[
        "fixed right-4 flex flex-col items-end sm:right-6",
        // Open, the phone chat is full screen and must cover the dock and the open-in-app banner.
        open ? "z-[60]" : "z-[45]",
        aboveDock
          ? "bottom-[calc(max(10px,env(safe-area-inset-bottom))+72px)] lg:bottom-6"
          : "bottom-[max(16px,env(safe-area-inset-bottom))] sm:bottom-6"
      ].join(" ")}
    >
      {open ? <AssistantChat onClose={close} pathname={pathname} /> : null}

      <div className="relative">
        {teaser && !open ? (
          <button
            className="absolute bottom-1/2 right-full mr-3 translate-y-1/2 whitespace-nowrap rounded-full border border-outline/70 bg-surface px-3.5 py-2 text-body-sm font-semibold text-brandInk shadow-brandCard motion-safe:animate-[assistant-teaser_240ms_ease-out]"
            onClick={() => {
              setTeaser(false);
              setOpen(true);
            }}
            type="button"
          >
            {t("assistant.teaser.needPlan")}
          </button>
        ) : null}

        <button
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={open ? t("assistant.close") : t("assistant.open")}
          className={[
            "relative grid h-14 w-14 place-items-center overflow-hidden rounded-full border-2 border-white bg-gradient-to-br from-brandBlue to-brandTeal shadow-dock transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brandBlue sm:h-16 sm:w-16",
            // On phones the open chat is full screen with its own close button.
            open ? "max-sm:hidden" : ""
          ].join(" ")}
          onClick={() => {
            setTeaser(false);
            setOpen((value) => !value);
          }}
          ref={buttonRef}
          type="button"
        >
          <Image
            alt=""
            className="h-[88%] w-[88%] object-contain"
            height={64}
            src="/images/assistant-astronaut.png"
            width={64}
          />
        </button>
      </div>
    </div>
  );
}
