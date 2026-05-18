import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Informes — Mis Gastos",
  description: "Análisis detallado y reportes de tus finanzas personales",
};

import { getCategoriesAction } from "@/actions/categories";
import {
  getDailyExpensesAction,
  getExpensesByCategoryAction,
  getExpenseSummaryAction,
} from "@/actions/expenses";
import BarChart from "@/components/dashboard/BarChart";
import CategoryBreakdown from "@/components/dashboard/CategoryBreakdown";
import ExpenseHeatmap from "@/components/dashboard/ExpenseHeatmap";
import InformesFilters from "@/components/dashboard/InformesFilters";
import { type DatePreset, getDateRangeForPreset } from "@/lib/date-range";
import { Suspense } from "react";

function SectionSkeleton({ height = "h-[360px]" }: { height?: string }) {
  return (
    <div className={`${height} animate-pulse rounded-xl border bg-muted/30`} />
  );
}

export default async function InformesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const preset = ((params.preset as string) || "current-month") as DatePreset;
  const { dateFrom, dateTo } = getDateRangeForPreset(
    preset,
    params.dateFrom as string | undefined,
    params.dateTo as string | undefined
  );

  const [catResult, categoriesResult, dailyResult, summaryResult] =
    await Promise.all([
      getExpensesByCategoryAction(dateFrom, dateTo),
      getCategoriesAction(),
      getDailyExpensesAction(dateFrom, dateTo),
      getExpenseSummaryAction(dateFrom, dateTo),
    ]);

  const categoryData = catResult.success ? catResult.data : [];
  const categories = categoriesResult.success ? categoriesResult.data : [];
  const dailyData = dailyResult.success ? dailyResult.data : [];
  const totalExpense = summaryResult.success ? summaryResult.data.expense : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Informes</h1>
        <p className="text-muted-foreground">
          Análisis detallado de tus finanzas
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Left: Filters */}
        <Suspense>
          <InformesFilters
            currentPreset={preset}
            dateFrom={dateFrom}
            dateTo={dateTo}
            categories={categories}
          />
        </Suspense>

        {/* Right: Charts & breakdown */}
        <div className="space-y-6">
          <Suspense fallback={<SectionSkeleton height="h-64" />}>
            <CategoryBreakdown
              data={categoryData}
              categories={categories}
              total={totalExpense}
            />
          </Suspense>

          <Suspense fallback={<SectionSkeleton />}>
            <BarChart dailyData={dailyData} />
          </Suspense>

          <Suspense fallback={<SectionSkeleton height="h-48" />}>
            <ExpenseHeatmap
              dailyData={dailyData}
              dateFrom={dateFrom}
              dateTo={dateTo}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
