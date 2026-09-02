import {
  type InvestmentAccount,
  type InvestmentMovement,
  type InvestmentValuation,
} from "@/db/schema/investments";

/**
 * La moneda en la que se expresan los totales es la del perfil del usuario, no
 * una constante: cada monto se guarda en la moneda de su cuenta y se convierte
 * con el fxRate del día de su propio registro.
 */

/** Una cuenta con sus registros ya cargados, lista para calcular. */
export interface AccountLedger {
  account: InvestmentAccount;
  movements: InvestmentMovement[];
  valuations: InvestmentValuation[];
}

/** Resultado del cálculo de una cuenta a una fecha. */
export interface AccountSnapshot {
  account: InvestmentAccount;
  /** Saldo en la moneda de la cuenta. */
  balance: number;
  /** Capital propio puesto: aportes menos retiros, al cambio de cada día. */
  invested: number;
  /** Saldo convertido a la moneda del usuario. */
  currentValue: number;
  /** Cambio usado para esa conversión: 1 si la cuenta ya está en esa moneda. */
  fxRate: number;
  /** currentValue menos invested: todo lo que la cuenta generó, neto de costos. */
  gain: number;
  /** gain sobre invested. null cuando no hay capital con el que comparar. */
  returnPct: number | null;
  /** Intereses registrados a mano, informativo: ya están dentro de gain. */
  interestRecorded: number;
  /** Fecha del último saldo confirmado, para avisar cuando está viejo. */
  lastValuationAt: Date | null;
}

/** Los mismos números sumados sobre todas las cuentas, en moneda base. */
export interface PortfolioTotals {
  invested: number;
  currentValue: number;
  gain: number;
  returnPct: number | null;
  interestRecorded: number;
}

/** Los cinco tipos de registro que aparecen en el historial de una cuenta. */
export type TimelineKind =
  | "valuation"
  | "contribution"
  | "withdrawal"
  | "interest"
  | "fee";

/**
 * Una línea del historial: qué se registró y cómo quedó la cuenta justo
 * después. Los campos "After" se recalculan con las mismas reglas que el
 * resumen, así que la última línea del historial coincide con la tarjeta.
 */
export interface TimelineEntry {
  id: string;
  kind: TimelineKind;
  date: Date;
  /** Monto del registro, en la moneda de la cuenta. En "valuation" es el saldo. */
  amount: number;
  fxRate: number;
  notes: string | null;
  /** Saldo de la cuenta tras este registro, en su propia moneda. */
  balanceAfter: number;
  /** Capital propio acumulado hasta aquí, en moneda del usuario. */
  investedAfter: number;
  /** Valor de la cuenta tras este registro, en moneda del usuario. */
  valueAfter: number;
  /** valueAfter menos investedAfter: si esta línea dejó la cuenta arriba o abajo. */
  gainAfter: number;
}

/** Un punto del gráfico: cuánto se había puesto y cuánto valía ese mes. */
export interface PortfolioPoint {
  month: string;
  invested: number;
  value: number;
}

export type {
  InvestmentAccount,
  InvestmentMovement,
  InvestmentValuation,
};
