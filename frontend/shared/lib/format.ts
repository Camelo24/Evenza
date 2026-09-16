// Client-safe formatting utilities. Never import server-only modules here.

export function formatXaf(amount: number) {
  return new Intl.NumberFormat("fr-CM", { maximumFractionDigits: 0 }).format(amount) + " FCFA";
}

export function formatRating(rating: string | number) {
  const value = Number(rating);
  return Number.isFinite(value) ? value.toFixed(1) : "0.0";
}

export function formatDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-CM", { day: "numeric", month: "long", year: "numeric" });
}

export function formatDateTime(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString("en-CM", { dateStyle: "medium", timeStyle: "short" });
}

export function daysBetween(from: Date | string, to: Date | string = new Date()) {
  const a = typeof from === "string" ? new Date(from) : from;
  const b = typeof to === "string" ? new Date(to) : to;
  return Math.max(0, Math.ceil((a.getTime() - b.getTime()) / 86_400_000));
}
