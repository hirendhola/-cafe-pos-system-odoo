import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "Is Cafe POS free to use?",
    answer: "Yes — create a staff account and start taking orders in minutes. No credit card required.",
  },
  {
    question: "Can I manage multiple floors and tables?",
    answer: "Absolutely. Set up as many floors and tables as your space needs from the admin dashboard, and see live status for each one from the order screen.",
  },
  {
    question: "Does it work on tablets and mobile devices?",
    answer: "Cafe POS is fully responsive, so your team can take orders from a tablet at the table or a desktop behind the counter.",
  },
  {
    question: "How does the kitchen stay updated?",
    answer: "The Kitchen Display System updates in real time the moment an item is added to an order — no extra hardware or apps required.",
  },
  {
    question: "Can I track sales and staff performance?",
    answer: "The admin dashboard includes live reports on sales trends, top products, category and payment breakdowns, and more.",
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-24">
      <div className="text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Frequently asked questions</h2>
        <p className="mt-4 text-muted-foreground">Everything you need to know before you bring Cafe POS to your counter.</p>
      </div>

      <Accordion type="single" collapsible className="mt-10">
        {faqs.map((faq) => (
          <AccordionItem key={faq.question} value={faq.question}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
