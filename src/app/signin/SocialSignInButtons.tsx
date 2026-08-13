"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

export type LinkChallenge = { linkTicket: string; suggestedEmail: string | null };

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";
const APPLE_SERVICES_ID = process.env.NEXT_PUBLIC_APPLE_SERVICES_ID ?? "";

// `hl=en` pins the library's own locale; `renderButton` also passes locale: "en".
// Both are needed — the script picks a language at load time from the browser.
const GOOGLE_SCRIPT = "https://accounts.google.com/gsi/client?hl=en";
const APPLE_SCRIPT =
  "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";

// Google Identity Services silently clamps anything wider than this.
const GOOGLE_MAX_WIDTH = 400;

type GoogleCredentialResponse = { credential?: string };

type AppleSignInResponse = {
  authorization?: { id_token?: string };
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
    AppleID?: {
      auth: {
        init: (config: Record<string, unknown>) => void;
        signIn: () => Promise<AppleSignInResponse>;
      };
    };
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("script failed")));
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("script failed"));
    document.head.appendChild(script);
  });
}

/**
 * Google and Apple sign-in, each rendered only when its client id is configured.
 *
 * An unconfigured deploy shows email sign-in alone rather than a button that
 * fails: without the ids the backend answers 503 anyway.
 */
export function SocialSignInButtons({
  next,
  onLinkRequired
}: {
  next: string;
  onLinkRequired: (challenge: LinkChallenge) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleWidth, setGoogleWidth] = useState(0);
  const [busy, setBusy] = useState<"google" | "apple" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const completeSignIn = useCallback(
    async (path: string, body: Record<string, unknown>) => {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const payload = (await response.json().catch(() => ({}))) as {
        data?: { linkRequired?: boolean; linkTicket?: string; suggestedEmail?: string | null };
        error?: string;
      };

      if (!response.ok) {
        setBusy(null);
        setError(payload.error ?? "We could not sign you in. Please try again.");
        return;
      }

      if (payload.data?.linkRequired && payload.data.linkTicket) {
        setBusy(null);
        onLinkRequired({
          linkTicket: payload.data.linkTicket,
          suggestedEmail: payload.data.suggestedEmail ?? null
        });
        return;
      }

      // Session cookies are set by the route handler.
      window.location.assign(next);
    },
    [next, onLinkRequired]
  );

  // Google renders into an iframe of a fixed pixel width — a CSS `width: 100%`
  // on the wrapper stretches the wrapper but leaves the button itself sitting at
  // its own width on the left edge. The only way to make it span the card is to
  // measure the row and hand Google the number.
  useEffect(() => {
    const node = rowRef.current;
    if (!node || !GOOGLE_CLIENT_ID) return;

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.floor(entry.contentRect.width);
      setGoogleWidth(width > 0 ? Math.min(width, GOOGLE_MAX_WIDTH) : 0);
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    let cancelled = false;

    void loadScript(GOOGLE_SCRIPT)
      .then(() => {
        if (cancelled || !window.google) return;

        // A nonce binds the credential to this page load. Google Identity
        // Services puts it into the token verbatim, which is what the backend
        // compares against.
        const nonce = crypto.randomUUID();

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          nonce,
          callback: (response: GoogleCredentialResponse) => {
            if (!response.credential) {
              setError("Google sign-in did not return a credential.");
              return;
            }
            setBusy("google");
            setError(null);
            void completeSignIn("/bff/auth/social/google", {
              idToken: response.credential,
              nonce
            });
          }
        });

        setGoogleReady(true);
      })
      .catch(() => {
        if (!cancelled) setError("Google sign-in is unavailable right now.");
      });

    return () => {
      cancelled = true;
    };
  }, [completeSignIn]);

  // Re-rendered whenever the measured width changes, so the button keeps
  // spanning the card as the viewport resizes.
  useEffect(() => {
    if (!googleReady || !googleWidth || !googleButtonRef.current) return;
    if (!window.google) return;

    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "filled_black",
      size: "large",
      shape: "pill",
      text: "continue_with",
      width: googleWidth,
      // Without this, Google labels the button in the browser's UI language
      // ("Vazhdo me Google" on an Albanian Chrome). The rest of the site is
      // English-only, so pin the button to match.
      locale: "en"
    });
  }, [googleReady, googleWidth]);

  async function signInWithApple() {
    setBusy("apple");
    setError(null);

    try {
      await loadScript(APPLE_SCRIPT);
      if (!window.AppleID) throw new Error("Apple sign-in unavailable");

      window.AppleID.auth.init({
        clientId: APPLE_SERVICES_ID,
        scope: "name email",
        redirectURI: `${window.location.origin}/signin`,
        usePopup: true
      });

      const result = await window.AppleID.auth.signIn();
      const identityToken = result.authorization?.id_token;

      if (!identityToken) {
        setBusy(null);
        setError("Apple sign-in did not return an identity token.");
        return;
      }

      // No nonce: the web flow and the native SDK differ in whether the nonce is
      // hashed before it reaches the token, and the backend only checks a nonce
      // when one is supplied.
      await completeSignIn("/bff/auth/social/apple", { identityToken });
    } catch {
      setBusy(null);
      // A closed popup is the common case here, and is not worth an error.
      setError(null);
    }
  }

  if (!GOOGLE_CLIENT_ID && !APPLE_SERVICES_ID) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="flex items-center gap-4">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#214867]" />
        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6d849c]">
          or
        </span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#214867]" />
      </div>

      {/* Providers are a matched pair: Google's own button is 40px tall and
          cannot be resized, so Apple is built to the same height and radius
          rather than the taller house button above. */}
      <div className="mt-5 flex flex-col items-center gap-3" ref={rowRef}>
        {GOOGLE_CLIENT_ID ? (
          // No forced height: Google owns the button box, and clipping it would
          // cut the label. The measured width is what makes it span the card.
          <div className="flex w-full justify-center" ref={googleButtonRef} />
        ) : null}

        {APPLE_SERVICES_ID ? (
          <button
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-black transition hover:bg-[#e8e8e8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#42b1ff] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy !== null}
            onClick={() => void signInWithApple()}
            type="button"
          >
            {busy === "apple" ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <svg aria-hidden="true" height="16" viewBox="0 0 384 512" width="16">
                <path
                  d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
                  fill="currentColor"
                />
              </svg>
            )}
            Continue with Apple
          </button>
        ) : null}
      </div>

      {busy === "google" ? (
        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-[#8ea3ba]">
          <Loader2 className="animate-spin" size={15} />
          Signing you in…
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 text-center text-sm font-semibold text-[#ff8792]">{error}</p>
      ) : null}
    </div>
  );
}
