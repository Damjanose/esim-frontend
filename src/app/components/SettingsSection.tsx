import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The account area repeats the same panel and row treatment across the profile,
 * the eSIM list and the eSIM detail page. These primitives hold that styling in
 * one place so the pages read as their content rather than as class strings.
 */

export function SettingsSection({
  children,
  label
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-[11px] font-black uppercase tracking-[0.12em] text-[#748aa2]">
        {label}
      </h2>
      <div className="mt-3 overflow-hidden rounded-[18px] border border-[#214867]/85 bg-[linear-gradient(150deg,#07182c,#050f1e)]">
        {children}
      </div>
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
      className="flex items-center gap-4 border-b border-[#214867]/50 px-5 py-4 transition last:border-b-0 hover:bg-[#0a1f38]/60"
      href={href}
    >
      <Icon
        aria-hidden="true"
        className={`shrink-0 ${isDanger ? "text-[#ff8792]" : "text-[#58baff]"}`}
        size={20}
      />

      <span className="min-w-0 flex-1">
        <span
          className={`block text-sm font-bold ${isDanger ? "text-[#ff8792]" : "text-white"}`}
        >
          {label}
        </span>
        {description ? (
          <span className="mt-0.5 block text-xs text-[#8ea3ba]">{description}</span>
        ) : null}
      </span>

      <ChevronRight
        aria-hidden="true"
        className="shrink-0 text-[#4a6180]"
        size={18}
      />
    </Link>
  );
}
