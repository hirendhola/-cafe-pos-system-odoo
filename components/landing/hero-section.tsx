import Link from "next/link"

import { ArrowRight, ChefHat, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const previewCategories = ["All", "Coffee", "Pastries", "Cold drinks", "Food"]

const previewProducts = [
  { name: "Espresso", price: "$3.00" },
  { name: "Cappuccino", price: "$4.50" },
  { name: "Iced Latte", price: "$5.00" },
  { name: "Croissant", price: "$3.50" },
  { name: "Blueberry Muffin", price: "$3.75" },
  { name: "Avocado Toast", price: "$7.50" },
]

const previewOrderItems = [
  { name: "Cappuccino", qty: 2, price: "$9.00" },
  { name: "Croissant", qty: 1, price: "$3.50" },
  { name: "Avocado Toast", qty: 1, price: "$7.50" },
]

export function HeroSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[-220px] -z-10 flex justify-center">
        <div className="h-[480px] w-[900px] rounded-full bg-gradient-to-br from-amber-300 via-orange-300 to-rose-300 opacity-25 blur-[120px] dark:opacity-10" />
      </div>

      <div className="mx-auto max-w-6xl px-6 pt-20 pb-24 text-center sm:pt-28">
        <Badge variant="secondary" className="mb-6">
          <Sparkles /> Built for fast-moving cafés &amp; restaurants
        </Badge>

        <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          The point of sale your counter actually deserves.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-balance">
          Take table-side orders, fire tickets to the kitchen instantly, manage your menu and promotions, and keep an
          eye on sales — all from one fast, friendly dashboard.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
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
                  Get started free <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            </>
          )}
        </div>

        <div aria-hidden className="relative mx-auto mt-16 max-w-4xl">
          <div className="rounded-3xl border bg-card p-2 text-left shadow-2xl ring-1 ring-foreground/5 sm:p-3">
            <div className="flex items-center gap-1.5 px-3 py-2">
              <span className="size-2.5 rounded-full bg-red-400/70" />
              <span className="size-2.5 rounded-full bg-amber-400/70" />
              <span className="size-2.5 rounded-full bg-emerald-400/70" />
              <span className="ml-3 text-xs text-muted-foreground">cafepos.app/pos · Table 4</span>
            </div>
            <div className="grid gap-3 rounded-2xl bg-muted/40 p-3 sm:grid-cols-[1fr_280px] sm:p-4">
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  {previewCategories.map((category, index) => (
                    <span
                      key={category}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium",
                        index === 1 ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"
                      )}
                    >
                      {category}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {previewProducts.map((product) => (
                    <div key={product.name} className="rounded-xl border bg-card p-3">
                      <div className="text-sm font-medium">{product.name}</div>
                      <div className="text-xs text-muted-foreground">{product.price}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Table 4 · Window</span>
                  <ChefHat className="size-4 text-muted-foreground" />
                </div>
                <Separator className="my-3" />
                <div className="space-y-2 text-sm">
                  {previewOrderItems.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {item.qty} × {item.name}
                      </span>
                      <span>{item.price}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-3" />
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Total</span>
                  <span>$20.00</span>
                </div>
                <div className="mt-4 flex h-9 w-full items-center justify-center rounded-2xl bg-primary text-sm font-medium text-primary-foreground">
                  Charge $20.00
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
