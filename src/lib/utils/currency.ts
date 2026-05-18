export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  locale: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: "CLP", name: "Peso chileno", symbol: "$", locale: "es-CL" },
  { code: "USD", name: "Dólar estadounidense", symbol: "$", locale: "en-US" },
  { code: "EUR", name: "Euro", symbol: "€", locale: "es-ES" },
  { code: "ARS", name: "Peso argentino", symbol: "$", locale: "es-AR" },
  { code: "MXN", name: "Peso mexicano", symbol: "$", locale: "es-MX" },
  { code: "COP", name: "Peso colombiano", symbol: "$", locale: "es-CO" },
  { code: "PEN", name: "Sol peruano", symbol: "S/", locale: "es-PE" },
  { code: "BRL", name: "Real brasileño", symbol: "R$", locale: "pt-BR" },
  { code: "GBP", name: "Libra esterlina", symbol: "£", locale: "en-GB" },
];

export function getCurrencyLocale(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.locale ?? "es-CL";
}

export const VALID_CURRENCIES = CURRENCIES.map((c) => c.code);
