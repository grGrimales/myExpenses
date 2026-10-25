import { getInvestmentLedgersAction } from "@/actions/investments";
import InvestmentsClient from "@/components/investments/InvestmentsClient";
import {
  buildAccountTimeline,
  buildPortfolioSeries,
  computeAccountSnapshot,
  computePortfolioTotals,
} from "@/lib/investments";
import { type TimelineEntry } from "@/types/investment";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Inversiones — Mis Gastos",
  description: "Seguimiento de tus ahorros invertidos y su rentabilidad",
};

export default async function InversionesPage() {
  const result = await getInvestmentLedgersAction();
  const ledgers = result.success ? result.data : [];

  // El cálculo vive en el servidor: el cliente recibe números ya resueltos y no
  // tiene que rehacer el historial completo para pintar una tarjeta.
  // Un consorcio se paga para comprar un bien, no para que rinda: sus tasas
  // mezcladas con la cartera se leerían como una pérdida de inversión.
  const investing = ledgers.filter((l) => l.account.kind !== "consortium");
  const consortia = ledgers.filter((l) => l.account.kind === "consortium");

  const snapshots = investing.map((ledger) => computeAccountSnapshot(ledger));
  const totals = computePortfolioTotals(snapshots);
  const series = buildPortfolioSeries(investing);

  const timelines: Record<string, TimelineEntry[]> = Object.fromEntries(
    ledgers.map((ledger) => [ledger.account.id, buildAccountTimeline(ledger)])
  );

  return (
    <InvestmentsClient
      snapshots={snapshots}
      consortia={consortia.map((ledger) => computeAccountSnapshot(ledger))}
      totals={totals}
      series={series}
      timelines={timelines}
    />
  );
}
