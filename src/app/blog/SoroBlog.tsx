"use client";

import { useEffect } from "react";

/** Soro (trysoro.com) hosts the blog; its embed renders posts into #soro-blog. */
export const SORO_EMBED_SRC = "https://app.trysoro.com/api/embed/804204c9-5cfa-4f07-af48-f91fdf26f1cc";

/**
 * The embed script reads #soro-blog once, when it executes. A plain <script> or
 * next/script runs only on the first full page load, so a client-side navigation
 * back to /blog would leave the container empty. Re-adding the script on every
 * mount re-runs it; posts open in place via /blog?post=<slug>.
 */
export function SoroBlog() {
  useEffect(() => {
    const container = document.getElementById("soro-blog");
    const script = document.createElement("script");
    script.src = SORO_EMBED_SRC;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      script.remove();
      if (container) container.innerHTML = "";
    };
  }, []);

  return <div className="mt-10 min-h-[24rem]" id="soro-blog" />;
}
