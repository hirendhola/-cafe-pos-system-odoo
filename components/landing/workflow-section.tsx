import { ChefHat, Receipt, ShoppingCart, Table2 } from "lucide-react"

const steps = [
  {
    icon: Table2,
    title: "Seat the table",
    description: "Pick a table from the floor plan to open a fresh order, or start a takeaway order on the fly.",
  },
  {
    icon: ShoppingCart,
    title: "Build the order",
    description: "Search the menu, add items, and watch discounts, coupons, and promotions apply automatically.",
  },
  {
    icon: ChefHat,
    title: "Fire to the kitchen",
    description: "Every item lands on the Kitchen Display System the moment it's added — no shouting across the counter.",
  },
  {
    icon: Receipt,
    title: "Get paid & reconcile",
    description: "Take payment, print or email the receipt, and watch the sale land in your live reports.",
  },
]

export function WorkflowSection() {
  return (
    <section id="workflow" className="border-y bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">From order to receipt in seconds</h2>
          <p className="mt-4 text-muted-foreground">
            One streamlined flow keeps your front of house and kitchen perfectly in sync, every single order.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.title} className="relative flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <step.icon className="size-5" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Step {index + 1}</span>
              </div>
              <h3 className="font-medium">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
