import { Globe2, Headphones, Wifi } from "lucide-react";
import { Button, LinkButton } from "../components/Button";

/** Same grid, bar height and row height as the loaded view, so the swap doesn't shift the page. */
export function PlansLoading({ withFilters }: { withFilters: boolean }) {
  return (
    <div aria-hidden="true" className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-8">
      <div className="min-w-0">
        {withFilters ? <div className="h-[46px] animate-pulse rounded-full bg-surfaceBright" /> : null}
        <div className="mt-4 grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="h-[106px] animate-pulse rounded-[18px] border border-outline/70 bg-surfaceBright sm:h-[114px]" key={index} />
          ))}
        </div>
      </div>
      <div className="mt-8 hidden h-[316px] animate-pulse rounded-[20px] border border-outline/70 bg-surfaceBright lg:mt-0 lg:block" />
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-2xl rounded-[20px] border border-error/30 bg-error/5 p-8 text-center">
      <Headphones aria-hidden="true" className="mx-auto text-error" size={32} />
      <h2 className="mt-4 font-display text-headline-md font-black text-brandInk">Plans are temporarily unavailable</h2>
      <p className="mt-2 text-sm leading-6 text-onSurfaceVariant">{message}</p>
    </div>
  );
}

export function EmptyFilterState({ onReset }: { onReset: () => void }) {
  return (
    <div className="mt-4 rounded-[20px] border border-outline/70 bg-surfaceBright p-8 text-center sm:p-10">
      <Wifi aria-hidden="true" className="mx-auto text-brandBlue" size={30} />
      <h2 className="mt-4 font-display text-title-sm font-black text-brandInk sm:text-xl">No plans match this filter</h2>
      <p className="mt-2 text-sm text-onSurfaceVariant">Choose another data or validity option.</p>
      <Button className="mt-5" onClick={onReset}>
        Show all plans
      </Button>
    </div>
  );
}

export function MissingDestinationState() {
  return (
    <div className="mx-auto max-w-2xl rounded-[24px] border border-outline/70 bg-surfaceBright p-9 text-center">
      <Globe2 aria-hidden="true" className="mx-auto text-brandBlue" size={34} />
      <h2 className="mt-5 font-display text-headline-md font-black text-brandInk">No plans found for this destination</h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-onSurfaceVariant">
        Search for another destination or return to the destination directory.
      </p>
      <LinkButton className="mt-6" href="/destinations">
        View all destinations
      </LinkButton>
    </div>
  );
}
