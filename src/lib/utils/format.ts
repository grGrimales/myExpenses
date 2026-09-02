import { getCurrencyLocale } from "./currency";

/**
 * El locale sale de la moneda salvo que lo pidan distinto: un monto en reales
 * formateado a la chilena queda como "$ 1.560" en vez de "R$ 1.560,00", que es
 * justo la confusión que queremos evitar.
 */
export function formatCurrency(
  amount: number,
  currency: string = "CLP",
  locale: string = getCurrencyLocale(currency)
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(amount);
}

/** Versión corta para los ejes de los gráficos: 1,5 mil en vez de R$ 1.560,00. */
export function formatCompact(
  amount: number,
  currency: string = "CLP",
  locale: string = getCurrencyLocale(currency)
) {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }
) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-ES", options).format(d);
}

export function formatRelativeDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return "hoy";
  if (diffInDays === 1) return "ayer";
  if (diffInDays < 7) return `hace ${diffInDays} días`;
  
  return formatDate(d);
}
