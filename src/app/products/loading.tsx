export default function ProductsLoading() {
  return (
    <main className="min-h-screen bg-[oklch(0.985_0.006_83)]">
      <div className="mx-auto max-w-7xl px-4 pt-10 pb-20 sm:px-6 sm:pt-14 lg:px-8">
        <section className="border-b border-[oklch(0.9_0.01_75)] pb-10 sm:pb-14">
          <div className="h-3 w-28 animate-pulse rounded-full bg-stone-200" />
          <div className="mt-4 h-10 w-3/4 max-w-lg animate-pulse rounded-lg bg-stone-200" />
          <div className="mt-4 h-4 w-full max-w-2xl animate-pulse rounded-full bg-stone-200" />
        </section>

        <section className="py-8">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="h-12 flex-1 animate-pulse rounded-full bg-stone-200" />
            <div className="h-12 animate-pulse rounded-full bg-stone-200 sm:w-56" />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-9 w-20 animate-pulse rounded-full bg-stone-200" />
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-stone-200 bg-white"
            >
              <div className="aspect-square animate-pulse bg-stone-100" />
              <div className="space-y-3 p-5">
                <div className="h-3 w-16 animate-pulse rounded-full bg-stone-200" />
                <div className="h-5 w-3/4 animate-pulse rounded bg-stone-200" />
                <div className="h-4 w-20 animate-pulse rounded bg-stone-200" />
                <div className="h-11 w-full animate-pulse rounded-full bg-stone-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
