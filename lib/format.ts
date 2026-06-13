export const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export const number = new Intl.NumberFormat("en-IN");

export function formatPercentDelta(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(1)}%`;
}
