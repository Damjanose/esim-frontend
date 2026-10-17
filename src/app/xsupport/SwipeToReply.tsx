"use client";

import { type PointerEvent, type ReactNode, useRef, useState } from "react";
import { Reply } from "lucide-react";
import { supportReplyDragOffset, SUPPORT_REPLY_DRAG_TRIGGER } from "@/lib/support-live";

/**
 * Swipe-to-reply, same gesture as the mobile app: drag your own bubble (right side) left
 * or the other person's bubble right, past the trigger, and let go. Works with touch and
 * mouse; vertical drags are left to page scrolling. Used by /xsupport and /profile/support.
 */
export function SwipeToReply({
  mine,
  enabled,
  onReply,
  children
}: {
  /** Your own message, on the right: it slides left. */
  mine: boolean;
  enabled: boolean;
  onReply: () => void;
  children: ReactNode;
}) {
  const [offset, setOffset] = useState(0);
  const drag = useRef<{ pointerId: number; startX: number; startY: number; active: boolean } | null>(null);
  // A drag that ends over a photo must not also open the lightbox.
  const suppressClick = useRef(false);

  function reset() {
    drag.current = null;
    setOffset(0);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!enabled || event.button !== 0) return;
    suppressClick.current = false;
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, active: false };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;
    if (!current.active) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        drag.current = null;
        return;
      }
      if (Math.abs(dx) < 8 || supportReplyDragOffset(dx, mine) === 0) return;
      current.active = true;
      suppressClick.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      window.getSelection()?.removeAllRanges();
    }
    setOffset(supportReplyDragOffset(dx, mine));
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (current.active && Math.abs(offset) >= SUPPORT_REPLY_DRAG_TRIGGER) onReply();
    reset();
  }

  const dragging = offset !== 0;
  const progress = Math.min(Math.abs(offset) / SUPPORT_REPLY_DRAG_TRIGGER, 1);
  return (
    <div
      className={`relative touch-pan-y ${dragging ? "select-none" : ""}`}
      onClickCapture={(event) => {
        if (!suppressClick.current) return;
        suppressClick.current = false;
        event.preventDefault();
        event.stopPropagation();
      }}
      onPointerCancel={reset}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <span
        aria-hidden="true"
        className={`absolute top-1/2 grid h-8 w-8 place-items-center rounded-full bg-white text-midnight shadow-sm ${
          mine ? "right-1" : "left-1"
        }`}
        style={{ opacity: progress, transform: `translateY(-50%) scale(${0.6 + progress * 0.4})` }}
      >
        <Reply size={16} />
      </span>
      <div
        className={`relative ${dragging ? "" : "transition-transform duration-150"}`}
        style={{ transform: `translateX(${offset}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
