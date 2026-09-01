import { Sparkles } from "lucide-react";

/**
 * Shown for a couple of seconds before the "Help me choose" wizard
 * auto-opens on the homepage, so the wizard doesn't just snap open the
 * instant the page loads. Purely presentational — how long it stays on
 * screen is controlled by the parent (DestinationBrowse).
 */
export function WizardWelcomeIntro() {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-midnight/60 backdrop-blur-sm">
      <div
        className="flex flex-col items-center gap-4 rounded-[28px] border border-outline bg-surface px-10 py-12 text-center shadow-brandCard"
        style={{ animation: "welcome-fade-scale 0.5s ease-out" }}
      >
        <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brandBlue to-brandTeal text-white shadow-brandGlow">
          <Sparkles aria-hidden="true" size={28} />
        </span>

        <h2 className="font-display text-2xl font-black text-brandInk">
          Let&apos;s find your perfect eSIM
        </h2>

        <p className="max-w-xs text-sm text-onSurfaceVariant">
          Answer three quick questions and we&apos;ll match you with the
          right plan.
        </p>

        <div className="mt-2 flex gap-1.5" role="status" aria-label="Loading">
          {[0, 150, 300].map((delayMs) => (
            <span
              className="h-2 w-2 animate-pulse rounded-full bg-brandBlue"
              key={delayMs}
              style={{ animationDelay: `${delayMs}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
