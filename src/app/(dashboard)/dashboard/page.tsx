import { auth } from "@/auth";
import CategoryPieChart from "@/components/dashboard/CategoryPieChart";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Mis Gastos",
  description: "Resumen de tus gastos e ingresos",
};
import DateRangePicker from "@/components/dashboard/DateRangePicker";
import MonthlyChart from "@/components/dashboard/MonthlyChart";
import RecentExpenses from "@/components/dashboard/RecentExpenses";
import SummaryCards from "@/components/dashboard/SummaryCards";
import {
  type DatePreset,
  getDateRangeForPreset,
} from "@/lib/date-range";
import { Suspense } from "react";

function SectionSkeleton({ height = "h-[360px]" }: { height?: string }) {
  return (
    <div
      className={`${height} animate-pulse rounded-xl border bg-muted/30`}
    />
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [session, params] = await Promise.all([auth(), searchParams]);

  const preset = ((params.preset as string) || "current-month") as DatePreset;
  const { dateFrom, dateTo } = getDateRangeForPreset(
    preset,
    params.dateFrom as string | undefined,
    params.dateTo as string | undefined
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido,{" "}
            <span className="font-semibold text-foreground">
              {session?.user?.name}
            </span>
          </p>
        </div>
        <Suspense>
          <DateRangePicker
            currentPreset={preset}
            dateFrom={dateFrom}
            dateTo={dateTo}
          />
        </Suspense>
      </div>

      {/* Row 1: Summary cards */}
      <Suspense fallback={<SectionSkeleton height="h-28" />}>
        <SummaryCards dateFrom={dateFrom} dateTo={dateTo} />
      </Suspense>

      {/* Row 2: Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<SectionSkeleton />}>
            <MonthlyChart months={6} />
          </Suspense>
        </div>
        <div className="lg:col-span-1">
          <Suspense fallback={<SectionSkeleton />}>
            <CategoryPieChart dateFrom={dateFrom} dateTo={dateTo} />
          </Suspense>
        </div>
      </div>

      {/* Row 3: Recent expenses */}
      <Suspense fallback={<SectionSkeleton height="h-64" />}>
        <RecentExpenses dateFrom={dateFrom} dateTo={dateTo} />
      </Suspense>
    </div>
  );
}
