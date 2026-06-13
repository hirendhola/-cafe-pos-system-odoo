import Link from "next/link"

import { UtensilsCrossed } from "lucide-react"

import { Kbd, KbdGroup } from "@/components/ui/kbd"

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <UtensilsCrossed className="size-4" />
          </span>
          Cafe POS
        </Link>

        <p className="flex flex-wrap items-center justify-center gap-1.5 text-sm text-muted-foreground">
          Tip: toggle light &amp; dark mode anytime with
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd>D</Kbd>
          </KbdGroup>
        </p>

        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Cafe POS. All rights reserved.</p>
      </div>
    </footer>
  )
}
