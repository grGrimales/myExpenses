import { getExpenseSummaryAction } from "@/actions/expenses";
import { getPreviousPeriod } from "@/lib/date-range";
import { formatCurrency } from "@/lib/utils/format";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import SummaryCard from "./SummaryCard";

interface SummaryCardsProps {
  dateFrom: Date;
  dateTo: Date;
}

function trendInfo(
  current: number,
  previous: number,
  invertForExpense = false
): { trend: "up" | "down" | "neutral"; trendValue: string } {
  if (previous === 0) return { trend: "neutral", trendValue: "sin datos previos" };
  const pct = ((current - previous) / previous) * 100;
  const isPositive = pct > 0;
  const visualUp = invertForExpense ? !isPositive : isPositive;
  return {
    trend: pct === 0 ? "neutral" : visualUp ? "up" : "down",
    trendValue: `${pct > 0 ? "+" : ""}${pct.toFixed(1)}% vs período anterior`,
  };
}

export default async function SummaryCards({ dateFrom, dateTo }: SummaryCardsProps) {
  const { prevFrom, prevTo } = getPreviousPeriod(dateFrom, dateTo);

  const [current, prev] = await Promise.all([
    getExpenseSummaryAction(dateFrom, dateTo),
    getExpenseSummaryAction(prevFrom, prevTo),
  ]);

  const cur = current.success ? current.data : { income: 0, expense: 0, balance: 0 };
  const pre = prev.success ? prev.data : { income: 0, expense: 0, balance: 0 };

  const expenseTrend = trendInfo(cur.expense, pre.expense, true);
  const incomeTrend = trendInfo(cur.income, pre.income);
  const balanceTrend = trendInfo(cur.balance, pre.balance);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <SummaryCard
        title="Total Gastos"
        value={formatCurrency(cur.expense)}
        icon={<ArrowDownLeft className="h-4 w-4" />}
        iconColor="text-red-600"
        trend={expenseTrend.trend}
        trendValue={expenseTrend.trendValue}
      />
      <SummaryCard
        title="Total Ingresos"
        value={formatCurrency(cur.income)}
        icon={<ArrowUpRight className="h-4 w-4" />}
        iconColor="text-green-600"
        trend={incomeTrend.trend}
        trendValue={incomeTrend.trendValue}
      />
      <SummaryCard
        title="Balance"
        value={formatCurrency(cur.balance)}
        icon={<Wallet className="h-4 w-4" />}
        iconColor="text-primary"
        trend={balanceTrend.trend}
        trendValue={balanceTrend.trendValue}
      />
    </div>
  );
}
