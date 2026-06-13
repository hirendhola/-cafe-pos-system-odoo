import PDFDocument from "pdfkit"

// The standard PDF fonts (Helvetica, etc.) use WinAnsiEncoding, which has no glyph
// for the ₹ symbol, so amounts are rendered with an "Rs." prefix instead.
const formatAmount = (amount: number) =>
  `Rs. ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export type ReceiptPdfOrder = {
  number: string
  createdAt: Date
  paidAt: Date | null
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentType: string | null
  changeDue: number | null
  table: { number: number; floor: { name: string } } | null
  customer: { name: string; email: string | null } | null
  items: { qty: number; unitPrice: number; lineDiscount: number; product: { name: string } }[]
}

export function renderReceiptPdf(order: ReceiptPdfOrder): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 })
    const chunks: Buffer[] = []

    doc.on("data", (chunk) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    const left = doc.page.margins.left
    const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
    const valueColumnX = left + contentWidth * 0.6
    const valueColumnWidth = contentWidth * 0.4

    const text = (content: string, options: PDFKit.Mixins.TextOptions = {}) => {
      doc.text(content, left, doc.y, { width: contentWidth, ...options })
    }

    const row = (label: string, value: string, options: { bold?: boolean } = {}) => {
      doc.font(options.bold ? "Helvetica-Bold" : "Helvetica").fontSize(11)
      const y = doc.y
      doc.text(label, left, y, { width: contentWidth - valueColumnWidth })
      doc.text(value, valueColumnX, y, { width: valueColumnWidth, align: "right" })
    }

    const rule = () => {
      doc
        .moveTo(left, doc.y)
        .lineTo(left + contentWidth, doc.y)
        .strokeColor("#dddddd")
        .lineWidth(1)
        .stroke()
      doc.moveDown(0.5)
    }

    doc.font("Helvetica-Bold").fontSize(20).fillColor("#000000")
    text("Cafe POS", { align: "center" })

    doc.font("Helvetica").fontSize(11).fillColor("#666666")
    text(`Receipt for Order ${order.number}`, { align: "center" })

    const date = new Date(order.paidAt ?? order.createdAt)
    let meta = date.toLocaleString("en-IN")
    if (order.table) meta += ` · Table ${order.table.number} (${order.table.floor.name})`
    doc.fontSize(9)
    text(meta, { align: "center" })

    if (order.customer) {
      text(order.customer.name, { align: "center" })
    }

    doc.fillColor("#000000")
    doc.moveDown(1)
    rule()

    for (const item of order.items) {
      row(`${item.qty} x ${item.product.name}`, formatAmount(item.unitPrice * item.qty - item.lineDiscount))
      doc.moveDown(0.5)
    }

    rule()

    row("Subtotal", formatAmount(order.subtotal))
    doc.moveDown(0.5)
    if (order.discount > 0) {
      row("Discount", `-${formatAmount(order.discount)}`)
      doc.moveDown(0.5)
    }
    row("Tax", formatAmount(order.tax))
    doc.moveDown(0.5)
    row("Total", formatAmount(order.total), { bold: true })
    doc.moveDown(1)

    if (order.paymentType) {
      rule()
      doc.font("Helvetica").fontSize(10).fillColor("#666666")
      let paymentLine = `Paid via ${order.paymentType}`
      if (order.changeDue) paymentLine += ` · Change given: ${formatAmount(order.changeDue)}`
      text(paymentLine)
      doc.moveDown(1)
    }

    doc.fontSize(8).fillColor("#999999")
    text("Thank you for visiting!", { align: "center" })

    doc.end()
  })
}
