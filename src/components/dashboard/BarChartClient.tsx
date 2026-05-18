"use client";

import { formatCurrency } from "@/lib/utils/format";
import { type DailyExpense } from "@/types/expense";
import { format, parseISO, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface BarChartClientProps {
  dailyData: DailyExpense[];
}

type ViewMode = "monthly" | "weekly";

export default function BarChartClient({ dailyData }: BarChartClientProps) {
  const [view, setView] = useState<ViewMode>("monthly");

  const chartData = useMemo(() => {
    if (view === "monthly") {
      const monthMap = new Map<string, number>();
      for (const { date, total } of dailyData) {
        const month = date.slice(0, 7);
        monthMap.set(month, (monthMap.get(month) ?? 0) + total);
      }
      return Array.from(monthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, total]) => ({
          label: format(parseISO(`${month}-01`), "MMM yy", { locale: es }),
          Gastos: total,
        }));
    }

    const weekMap = new Map<string, number>();
    for (const { date, total } of dailyData) {
      const d = parseISO(date);
      const weekStart = format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
      weekMap.set(weekStart, (weekMap.get(weekStart) ?? 0) + total);
    }
    return Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, total]) => ({
        label: format(parseISO(week), "d MMM", { locale: es }),
        Gastos: total,
      }));
  }, [dailyData, view]);

  if (dailyData.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        No hay gastos en este período
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <div className="inline-flex rounded-md border text-sm">
          {(["monthly", "weekly"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 transition-colors first:rounded-l-md last:rounded-r-md ${
                view === v
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {v === "monthly" ? "Mensual" : "Semanal"}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) =>
              new Intl.NumberFormat("es-CL", {
                notation: "compact",
                maximumFractionDigits: 1,
              }).format(v)
            }
            width={55}
          />
          <Tooltip
            formatter={(value) => [
              typeof value === "number" ? formatCurrency(value) : String(value),
              "Gastos",
            ]}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--card))",
              color: "hsl(var(--card-foreground))",
            }}
          />
          <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
