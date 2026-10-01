import { ArrowRight, CalendarDays, ShieldCheck, Signal, Zap } from "lucide-react";
import Link from "next/link";

/**
 * The trust points and support line that used to sit above and below the plan
 * cards (DestinationStats + PlansSupportBar). A sticky right column at lg+,
 * after the plan list on phones.
 */
export function PlansSidebar({ plansCount }: { plansCount: number }) {
  const stats = [
    {
      icon: CalendarDays,
      title: String(plansCount),
      description: plansCount === 1 ? "plan available" : "plans available",
    },
    { icon: Zap, title: "Instant activation", description: "Start using in minutes" },
    { icon: Signal, title: "Fast data", description: "Premium local networks" },
    { icon: ShieldCheck, title: "Secure checkout", description: "Encrypted and trusted" },
  ];

  return (
    <aside className="rounded-[20px] border border-outline/70 bg-surface p-5 shadow-brandCard">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        {stats.map(({ icon: Icon, title, description }) => (
          <li className="flex items-center gap-3" key={title}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-brandBlue/10 text-brandBlue">
              <Icon aria-hidden={true} size={18} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black text-brandInk">{title}</span>
              <span className="mt-0.5 block text-xs text-onSurfaceVariant">{description}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 border-t border-outline/70 pt-4">
        <p className="flex gap-3 text-sm leading-6 text-onSurfaceVariant">
          <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-brandBlue" size={18} />
          All plans include premium network access and 24/7 customer support.
        </p>
        <Link className="mt-1 inline-flex min-h-11 items-center gap-2 text-sm font-black text-brandBlue" href="/support">
          Visit Help Center
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </div>
    </aside>
  );
}
