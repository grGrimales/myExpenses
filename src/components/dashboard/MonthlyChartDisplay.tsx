"use client";

import { formatCurrency } from "@/lib/utils/format";
import { type MonthlyTrend } from "@/types/expense";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface MonthlyChartDisplayProps {
  data: MonthlyTrend[];
}

export default function MonthlyChartDisplay({ data }: MonthlyChartDisplayProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
        No hay datos para mostrar
      </div>
    );
  }

  const chartData = data.map((item) => ({
    mes: format(parseISO(`${item.month}-01`), "MMM yy", { locale: es }),
    Ingresos: item.income,
    Gastos: item.expense,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="mes"
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
          formatter={(value, name) => [
            typeof value === "number" ? formatCurrency(value) : String(value),
            name,
          ]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--card-foreground)",
          }}
        />
        <Legend iconType="circle" iconSize={8} />
        <Area
          type="monotone"
          dataKey="Ingresos"
          stroke="#22c55e"
          strokeWidth={2}
          fill="url(#colorIngresos)"
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Area
          type="monotone"
          dataKey="Gastos"
          stroke="#ef4444"
          strokeWidth={2}
          fill="url(#colorGastos)"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
