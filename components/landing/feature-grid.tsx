import { BarChart3, ChefHat, CreditCard, LayoutGrid, Package, ShieldCheck, Table2, Tag } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const secondaryFeatures = [
  {
    icon: ChefHat,
    title: "Real-time kitchen display",
    description: "Every new item appears on the KDS the second it's ordered, so the kitchen always works off the latest ticket.",
  },
  {
    icon: Table2,
    title: "Floor & table management",
    description: "See every floor and table at a glance, spot what's occupied, and jump straight into that order.",
  },
  {
    icon: Package,
    title: "Menu & inventory",
    description: "Organize products into categories, update pricing, and toggle availability the moment something sells out.",
  },
  {
    icon: Tag,
    title: "Promotions & coupons",
    description: "Run time-boxed promotions and percentage or flat discounts, then attach a regular customer for the loyalty record.",
  },
]

const bannerFeatures = [
  {
    icon: BarChart3,
    title: "Live reports & analytics",
    description: "Sales trends, top products, and category & payment breakdowns — updated as orders come in.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    description: "Admins manage the menu, staff, and settings, while staff stay focused on taking orders.",
  },
  {
    icon: CreditCard,
    title: "Flexible payment methods",
    description: "Accept cash, cards, or wallets with a payment method list you configure yourself.",
  },
]

export function FeatureGrid() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Everything your counter needs, in one place</h2>
        <p className="mt-4 text-muted-foreground">
          From the first order of the morning rush to the closing report at night, Cafe POS keeps your front of
          house, kitchen, and back office in sync.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="sm:col-span-2 lg:col-span-2">
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <LayoutGrid className="size-5" />
            </div>
            <CardTitle className="text-lg">Order taking that keeps up with the rush</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Browse the menu by category, search for items instantly, and build an order with live pricing —
              discounts, coupons, and active promotions are applied automatically as you go.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Coffee", "Pastries", "Cold drinks", "Food", "Seasonal"].map((tag) => (
                <span key={tag} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {secondaryFeatures.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <feature.icon className="size-5" />
              </div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}

        <Card className="sm:col-span-2 lg:col-span-3">
          <CardContent className="grid gap-6 sm:grid-cols-3">
            {bannerFeatures.map((feature) => (
              <div key={feature.title} className="flex flex-col gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <feature.icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-medium">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
