import Link from "next/link"
import { Fraunces } from "next/font/google"

const fraunces = Fraunces({ subsets: ["latin"], weight: ["600"] })

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[oklch(0.985_0.006_83)] px-6 text-center">
      <p className="text-xs font-medium tracking-[0.22em] text-[oklch(0.62_0.11_45)] uppercase">
        The Collection
      </p>
      <h1
        className={`${fraunces.className} mt-3 text-4xl font-semibold text-balance tracking-tight text-stone-900 sm:text-5xl`}
      >
        Youleap Store
      </h1>
      <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-stone-500">
        Thoughtfully designed products for work, home, and life — crafted from
        considered materials and built to last.
      </p>
      <Link
        href="/products"
        className="mt-8 inline-flex h-12 cursor-pointer items-center justify-center rounded-full bg-[oklch(0.26_0.014_55)] px-6 text-sm font-medium text-[oklch(0.98_0.006_83)] transition-colors hover:bg-[oklch(0.62_0.11_45)] hover:text-[oklch(0.99_0.006_83)] focus-visible:ring-2 focus-visible:ring-[oklch(0.62_0.11_45)] focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        Browse Products
      </Link>
    </main>
  )
}
