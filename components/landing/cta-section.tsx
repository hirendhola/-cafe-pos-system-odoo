import Link from "next/link"

import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"

export function CtaSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="relative overflow-hidden rounded-3xl border bg-card px-6 py-16 text-center shadow-sm ring-1 ring-foreground/5 sm:px-12">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-amber-300 via-orange-300 to-rose-300 opacity-20 blur-3xl dark:opacity-10" />
        </div>

        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Ready to speed up your counter?</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Set up your menu, invite your team, and start taking orders in minutes — Cafe POS runs on any device with a
          browser.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {isAuthenticated ? (
            <Button size="lg" asChild>
              <Link href="/pos">
                Open POS terminal <ArrowRight />
              </Link>
            </Button>
          ) : (
            <>
              <Button size="lg" asChild>
                <Link href="/signup">
                  Create your account <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
