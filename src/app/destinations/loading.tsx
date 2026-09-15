export default function DestinationsLoading() {
  return (
    <main className="min-h-screen animate-pulse bg-surface px-5 pb-16 pt-28 lg:px-10">
      <div className="mx-auto max-w-[1440px] space-y-8">
        <div className="h-12 max-w-xl rounded-2xl bg-mist" />
        <div className="h-5 max-w-md rounded bg-mist" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div className="h-40 rounded-3xl bg-mist" key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}
