"use client";

import { formatCompact, formatCurrency } from "@/lib/utils/format";
import { createContext, useContext, useMemo } from "react";

/**
 * La moneda del usuario vive en su perfil, así que la resuelve el layout del
 * dashboard —que ya tiene la sesión— y la reparte por contexto. Sin esto cada
 * componente cliente tendría que recibirla por props hasta el último gráfico, o
 * peor, asumir una por su cuenta: eso era lo que hacía que a un usuario en
 * reales le mostráramos todo en pesos chilenos.
 */
const CurrencyContext = createContext<string>("CLP");

export function CurrencyProvider({
  currency,
  children,
}: {
  currency: string;
  children: React.ReactNode;
}) {
  return (
    <CurrencyContext.Provider value={currency}>
      {children}
    </CurrencyContext.Provider>
  );
}

interface Money {
  /** Código ISO de la moneda del usuario, ej: "BRL". */
  currency: string;
  /** Formato completo. Acepta otra moneda para montos que no están en la del usuario. */
  format: (amount: number, currency?: string) => string;
  /** Formato corto, para ejes de gráficos. */
  compact: (amount: number) => string;
}

export function useMoney(): Money {
  const currency = useContext(CurrencyContext);

  return useMemo(
    () => ({
      currency,
      format: (amount: number, override?: string) =>
        formatCurrency(amount, override ?? currency),
      compact: (amount: number) => formatCompact(amount, currency),
    }),
    [currency]
  );
}
