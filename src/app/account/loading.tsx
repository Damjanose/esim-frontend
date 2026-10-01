/** Shaped like the loaded page: title + count, the active card, a row card (lg: sidebar + ring card). */
export default function AccountLoading() {
  return (
    <main aria-busy="true" className="min-h-screen bg-surfaceBright">
      <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-[92px] motion-safe:animate-pulse sm:px-6 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 lg:px-10 lg:pt-[108px]">
        <div className="hidden h-[340px] rounded-[20px] bg-surface lg:block" />
        <div>
          <div className="h-9 w-40 rounded-[10px] bg-outline/40" />
          <div className="mt-2 h-4 w-32 rounded-full bg-outline/30" />
          <div className="mt-10 h-[232px] rounded-[18px] bg-brandBlue/15 lg:h-[212px] lg:rounded-[20px] lg:bg-surface" />
          <div className="mt-10 h-[160px] rounded-[18px] bg-surface" />
        </div>
      </div>
    </main>
  );
}
