"use client";

import {
  buildCategorySeries,
  buildDailyBreakdown,
  type CategorySeries,
} from "@/lib/daily-categories";
import { useMoney } from "@/lib/currency-context";
import { type DailyCategoryExpense } from "@/types/expense";
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
  rows: DailyCategoryExpense[];
}

type ViewMode = "monthly" | "weekly";

/** Una barra: la etiqueta del período más un monto por id de serie. */
type Bucket = { label: string } & Record<string, number | string>;

interface TooltipEntry {
  dataKey?: string | number;
  value?: number;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: TooltipEntry[];
  series: CategorySeries[];
}

function ChartTooltip({ active, label, payload, series }: ChartTooltipProps) {
  const money = useMoney();

  if (!active || !payload?.length) return null;

  const byId = new Map(series.map((s) => [s.id, s]));
  const entries = payload
    .map((entry) => ({
      series: byId.get(String(entry.dataKey)),
      value: entry.value ?? 0,
    }))
    .filter((entry) => entry.series && entry.value > 0)
    .sort((a, b) => b.value - a.value);

  if (entries.length === 0) return null;

  const total = entries.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-card-foreground shadow-sm">
      <div className="mb-1.5 text-xs font-medium">{label}</div>
      <div className="space-y-1">
        {entries.map((entry) => (
          <div
            key={entry.series!.id}
            className="flex items-center gap-2 text-xs"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-sm"
              style={{ backgroundColor: entry.series!.color }}
            />
            <span className="mr-3 text-muted-foreground">
              {entry.series!.name}
            </span>
            <span className="ml-auto tabular-nums">
              {money.format(entry.value)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex items-center gap-3 border-t pt-1.5 text-xs font-medium">
        <span>Total</span>
        <span className="ml-auto tabular-nums">{money.format(total)}</span>
      </div>
    </div>
  );
}

export default function BarChartClient({ rows }: BarChartClientProps) {
  const money = useMoney();
  const [view, setView] = useState<ViewMode>("monthly");

  const series = useMemo(() => buildCategorySeries(rows), [rows]);
  const daily = useMemo(
    () => buildDailyBreakdown(rows, series),
    [rows, series]
  );

  const chartData = useMemo<Bucket[]>(() => {
    // Cada barra agrupa varios días, así que el reparto por categoría se suma
    // dentro del período igual que el total.
    const buckets = new Map<string, Record<string, number>>();

    for (const day of daily) {
      const key =
        view === "monthly"
          ? day.date.slice(0, 7)
          : format(startOfWeek(parseISO(day.date), { weekStartsOn: 1 }), "yyyy-MM-dd");

      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = {};
        buckets.set(key, bucket);
      }
      for (const [id, amount] of Object.entries(day.bySeries)) {
        bucket[id] = (bucket[id] ?? 0) + amount;
      }
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, totals]) => ({
        label:
          view === "monthly"
            ? format(parseISO(`${key}-01`), "MMM yy", { locale: es })
            : format(parseISO(key), "d MMM", { locale: es }),
        // Recharts apila leyendo un dataKey por serie, y una serie ausente en
        // un período rompería la pila: se rellena con 0.
        ...Object.fromEntries(series.map((s) => [s.id, totals[s.id] ?? 0])),
      }));
  }, [daily, series, view]);

  const seriesTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const day of daily) {
      for (const [id, amount] of Object.entries(day.bySeries)) {
        totals.set(id, (totals.get(id) ?? 0) + amount);
      }
    }
    return totals;
  }, [daily]);

  if (rows.length === 0) {
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
          {/* Hairline sólida: el punteado se lee como umbral o proyección,
              y aquí solo es la rejilla. */}
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => money.compact(v)}
            width={55}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            content={<ChartTooltip series={series} />}
          />
          {series.map((s) => (
            <Bar
              key={s.id}
              dataKey={s.id}
              name={s.name}
              stackId="gastos"
              fill={s.color}
              // Un trazo del color de la tarjeta separa los tramos sin dibujar
              // un borde: el hueco es superficie, no una línea de contraste.
              stroke="var(--card)"
              strokeWidth={2}
              maxBarSize={40}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      {/* La leyenda lleva el total de cada categoría para que el reparto se
          pueda leer sin pasar el mouse: varios colores de categoría quedan bajo
          3:1 contra la tarjeta y el color solo no puede ser el único canal. */}
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
        {series.map((s) => (
          <li key={s.id} className="flex items-center gap-1.5 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-muted-foreground">{s.name}</span>
            <span className="tabular-nums text-foreground">
              {money.format(seriesTotals.get(s.id) ?? 0)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
