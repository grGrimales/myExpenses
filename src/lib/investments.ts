import { utcDayKey } from "@/lib/investment-dates";
import {
  type AccountLedger,
  type AccountSnapshot,
  type PortfolioPoint,
  type PortfolioTotals,
  type TimelineEntry,
  type TimelineKind,
} from "@/types/investment";
import { format, startOfMonth } from "date-fns";

/** Aporte y retiro mueven capital propio; interés y costo los genera la cuenta. */
const CAPITAL_IN = "contribution";
const CAPITAL_OUT = "withdrawal";

function num(value: string | number): number {
  return typeof value === "number" ? value : Number(value) || 0;
}

/**
 * Efecto de un movimiento sobre el saldo de la cuenta, en su propia moneda.
 * Un interés sube el saldo aunque no sea capital tuyo; un costo lo baja.
 */
function balanceDelta(type: string, amount: number): number {
  switch (type) {
    case CAPITAL_IN:
    case "interest":
      return amount;
    case CAPITAL_OUT:
    case "fee":
      return -amount;
    default:
      return 0;
  }
}

/**
 * Calcula una cuenta a la fecha `asOf`.
 *
 * La última valuación anterior a `asOf` es un punto de control: fija el saldo
 * de ese día, y solo los movimientos posteriores lo ajustan. Por eso registrar
 * el saldo y registrar los intereses no se cuenta doble — los intereses previos
 * al último saldo ya están dentro de él.
 *
 * Sin ninguna valuación el punto de control es cero y todos los movimientos
 * cuentan, que es el caso de una cuenta que solo se lleva por intereses.
 */
export function computeAccountSnapshot(
  ledger: AccountLedger,
  asOf: Date = new Date()
): AccountSnapshot {
  const { account } = ledger;

  const valuations = ledger.valuations
    .filter((v) => v.date <= asOf)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const movements = ledger.movements
    .filter((m) => m.date <= asOf)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const checkpoint = valuations.at(-1) ?? null;

  let balance = checkpoint ? num(checkpoint.balance) : 0;
  const checkpointDay = checkpoint ? utcDayKey(checkpoint.date) : null;
  for (const movement of movements) {
    // Un movimiento del mismo día que la valuación se considera ya reflejado en
    // ella: el saldo que muestra la institución es el del cierre del día. La
    // comparación es por día y no por marca de tiempo a propósito; con horas,
    // un interés tecleado un minuto después del saldo se sumaba encima de un
    // saldo que ya lo contenía.
    if (checkpointDay !== null && utcDayKey(movement.date) <= checkpointDay)
      continue;
    balance += balanceDelta(movement.type, num(movement.amount));
  }

  // El capital es independiente del punto de control: es todo lo que pusiste,
  // cada aporte al cambio del día en que lo hiciste.
  let invested = 0;
  let interestRecorded = 0;
  for (const movement of movements) {
    const amountInBase = num(movement.amount) * num(movement.fxRate);
    if (movement.type === CAPITAL_IN) invested += amountInBase;
    if (movement.type === CAPITAL_OUT) invested -= amountInBase;
    if (movement.type === "interest") interestRecorded += amountInBase;
  }

  // Para convertir el saldo de hoy se usa el cambio más reciente que se conozca
  // de esta cuenta, venga de una valuación o de un movimiento.
  const lastMovement = movements.at(-1);
  const latestRateSource =
    checkpoint && lastMovement
      ? checkpoint.date >= lastMovement.date
        ? checkpoint
        : lastMovement
      : (checkpoint ?? lastMovement);
  const fxRate = latestRateSource ? num(latestRateSource.fxRate) : 1;

  const currentValue = balance * fxRate;
  const gain = currentValue - invested;

  return {
    account,
    balance,
    invested,
    currentValue,
    fxRate,
    gain,
    returnPct: invested > 0 ? gain / invested : null,
    interestRecorded,
    lastValuationAt: checkpoint?.date ?? null,
  };
}

/**
 * El historial de una cuenta, del registro más nuevo al más viejo.
 *
 * Cada línea se acompaña del estado de la cuenta a esa fecha, y ese estado sale
 * de computeAccountSnapshot en vez de irse acumulando por el camino: así el
 * historial no puede contradecir al resumen, ni siquiera cuando una valuación
 * vieja anula movimientos anteriores.
 */
export function buildAccountTimeline(ledger: AccountLedger): TimelineEntry[] {
  const records: Array<{
    id: string;
    kind: TimelineKind;
    date: Date;
    amount: number;
    fxRate: number;
    notes: string | null;
  }> = [
    ...ledger.valuations.map((v) => ({
      id: v.id,
      kind: "valuation" as const,
      date: v.date,
      amount: num(v.balance),
      fxRate: num(v.fxRate),
      notes: null,
    })),
    ...ledger.movements.map((m) => ({
      id: m.id,
      kind: m.type as TimelineKind,
      date: m.date,
      amount: num(m.amount),
      fxRate: num(m.fxRate),
      notes: m.notes,
    })),
  ];

  return records
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((record) => {
      const snapshot = computeAccountSnapshot(ledger, record.date);
      return {
        ...record,
        balanceAfter: snapshot.balance,
        investedAfter: snapshot.invested,
        valueAfter: snapshot.currentValue,
        gainAfter: snapshot.gain,
      };
    })
    .reverse();
}

export function computePortfolioTotals(
  snapshots: AccountSnapshot[]
): PortfolioTotals {
  const totals = snapshots.reduce(
    (acc, s) => ({
      invested: acc.invested + s.invested,
      currentValue: acc.currentValue + s.currentValue,
      interestRecorded: acc.interestRecorded + s.interestRecorded,
    }),
    { invested: 0, currentValue: 0, interestRecorded: 0 }
  );

  const gain = totals.currentValue - totals.invested;

  return {
    ...totals,
    gain,
    returnPct: totals.invested > 0 ? gain / totals.invested : null,
  };
}

/**
 * Cierre de un mes en el formato en que se guardan los registros: medianoche
 * UTC del último día. Con endOfMonth en hora local, al oeste de Greenwich el
 * cierre de enero caía ya en el 1 de febrero UTC y un saldo anotado ese día se
 * contaba como rendimiento de enero.
 */
function utcMonthClose(year: number, month: number): Date {
  return new Date(Date.UTC(year, month + 1, 0));
}

/**
 * Serie mensual para los gráficos: capital puesto contra valor de la cartera al
 * cierre de cada mes, y lo que rindió cada mes.
 *
 * El rendimiento del mes es la diferencia entre la ganancia de un cierre y la
 * del anterior. Un aporte sube valor y capital por igual, así que no aparece
 * como rendimiento; solo queda lo que la cuenta generó, o el cambio de cotización
 * si está en otra moneda. El primer mes de la ventana se compara contra el
 * cierre previo real, no contra cero, para no presentar como rendimiento de ese
 * mes todo lo acumulado antes.
 */
export function buildPortfolioSeries(
  ledgers: AccountLedger[],
  months: number = 12
): PortfolioPoint[] {
  const dates = ledgers.flatMap((l) => [
    ...l.movements.map((m) => m.date),
    ...l.valuations.map((v) => v.date),
  ]);
  if (dates.length === 0) return [];

  const now = new Date();
  const earliest = new Date(Math.min(...dates.map((d) => d.getTime())));
  const window = startOfMonth(
    new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)
  );
  const earliestMonth = new Date(
    earliest.getUTCFullYear(),
    earliest.getUTCMonth(),
    1
  );
  const start = earliestMonth > window ? earliestMonth : window;

  const closeOf = (d: Date) => utcMonthClose(d.getFullYear(), d.getMonth());

  let previous = ledgers.map((l) =>
    computeAccountSnapshot(
      l,
      utcMonthClose(start.getFullYear(), start.getMonth() - 1)
    )
  );

  const points: PortfolioPoint[] = [];
  const cursor = new Date(start);

  while (cursor <= now) {
    const snapshots = ledgers.map((l) =>
      computeAccountSnapshot(l, closeOf(cursor))
    );
    const totals = computePortfolioTotals(snapshots);
    const previousTotals = computePortfolioTotals(previous);
    const previousGain = previousTotals.gain;
    const monthGain = totals.gain - previousGain;
    // Valor al cierre menos lo rendido = valor anterior más aportes netos.
    const base = totals.currentValue - monthGain;

    points.push({
      month: format(cursor, "yyyy-MM"),
      invested: totals.invested,
      value: totals.currentValue,
      monthGain,
      monthReturnPct: base > 0 ? monthGain / base : null,
      netContribution: totals.invested - previousTotals.invested,
      byAccount: snapshots
        .map((s, i) => ({
          accountId: s.account.id,
          name: s.account.name,
          color: s.account.color,
          gain: s.gain - previous[i].gain,
        }))
        .filter((a) => Math.abs(a.gain) >= 0.005)
        .sort((a, b) => b.gain - a.gain),
    });

    previous = snapshots;
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return points;
}
