import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * A flat, dividers-only settings group — deliberately not a bordered/shadowed
 * panel. Rows read as one continuous list; the label just marks where a new
 * group starts.
 */
export function SettingsSection({
  children,
  label
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <section className="mt-9 first:mt-0">
      <h2 className="mb-1 px-1 text-[13px] font-semibold text-onSurfaceVariant">{label}</h2>
      <div className="border-t border-outline/70">{children}</div>
    </section>
  );
}

export function SettingsLinkRow({
  description,
  href,
  icon: Icon,
  label,
  tone = "default"
}: {
  description?: string;
  href: string;
  icon: LucideIcon;
  label: string;
  tone?: "default" | "danger";
}) {
  const isDanger = tone === "danger";

  return (
    <Link
      className="flex items-center gap-4 border-b border-outline/70 px-1 py-4 transition hover:bg-mist/60"
      href={href}
    >
      <Icon
        aria-hidden="true"
        className={`shrink-0 ${isDanger ? "text-error" : "text-brandBlue"}`}
        size={19}
      />

      <span className="min-w-0 flex-1">
        <span
          className={`block text-sm font-semibold ${isDanger ? "text-error" : "text-brandInk"}`}
        >
          {label}
        </span>
        {description ? (
          <span className="mt-0.5 block text-xs text-onSurfaceVariant">{description}</span>
        ) : null}
      </span>

      <ChevronRight aria-hidden="true" className="shrink-0 text-onSurfaceVariant/70" size={17} />
    </Link>
  );
}
