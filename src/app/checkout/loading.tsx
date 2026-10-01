/**
 * Skeleton in the shape of the loaded checkout (OrderSummary + left column), so
 * nothing jumps when the page streams in: the phone summary bar on top, the
 * sticky summary panel on the right at lg.
 */
export default function CheckoutLoading() {
  return (
    <main
      aria-busy="true"
      className="min-h-screen overflow-x-clip bg-surface px-4 pb-16 pt-[92px] sm:px-6 lg:px-10 lg:pb-24 lg:pt-[108px]"
    >
      <div className="mx-auto grid w-full max-w-[1040px] gap-6 motion-safe:animate-pulse lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-12">
        <div className="h-14 rounded-[16px] bg-outline/25 lg:col-start-2 lg:row-start-1 lg:h-[520px] lg:rounded-[24px]" />
        <div className="min-w-0 space-y-4 lg:col-start-1 lg:row-start-1">
          <div className="h-7 w-36 rounded-full bg-outline/25" />
          <div className="h-10 w-2/3 rounded-[16px] bg-outline/25" />
          <div className="h-5 w-full max-w-[52ch] rounded-full bg-outline/25" />
          <div className="!mt-8 h-64 rounded-[24px] bg-outline/25" />
          <div className="h-48 rounded-[24px] bg-outline/25" />
        </div>
      </div>
    </main>
  );
}
