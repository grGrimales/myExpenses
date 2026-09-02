"use client";

import { useMoney } from "@/lib/currency-context";
import { type PortfolioPoint } from "@/types/investment";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface PortfolioChartProps {
  series: PortfolioPoint[];
}

const SERIES = [
  {
    key: "invested" as const,
    name: "Capital puesto",
    color: "var(--series-invested)",
  },
  {
    key: "value" as const,
    name: "Valor de la cartera",
    color: "var(--series-value)",
  },
];

interface TooltipEntry {
  dataKey?: string | number;
  value?: number;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: TooltipEntry[];
}

function ChartTooltip({ active, label, payload }: ChartTooltipProps) {
  const money = useMoney();

  if (!active || !payload?.length) return null;

  const byKey = new Map(payload.map((p) => [String(p.dataKey), p.value ?? 0]));
  const invested = byKey.get("invested") ?? 0;
  const value = byKey.get("value") ?? 0;
  const gain = value - invested;

  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-card-foreground shadow-sm">
      <div className="mb-1.5 text-xs font-medium">{label}</div>
      <div className="space-y-1">
        {SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-3 text-xs">
            <span
              className="h-2 w-2 shrink-0 rounded-sm"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-muted-foreground">{s.name}</span>
            <span className="ml-auto tabular-nums">
              {money.format(byKey.get(s.key) ?? 0)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex items-center gap-3 border-t pt-1.5 text-xs font-medium">
        <span>Ganancia</span>
        <span className="ml-auto tabular-nums">
          {gain >= 0 ? "+" : ""}
          {money.format(gain)}
        </span>
      </div>
    </div>
  );
}

export default function PortfolioChart({ series }: PortfolioChartProps) {
  const money = useMoney();

  const data = series.map((point) => ({
    ...point,
    label: format(parseISO(`${point.month}-01`), "MMM yy", { locale: es }),
  }));

  const last = series.at(-1);

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
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
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            content={<ChartTooltip />}
          />
          {SERIES.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* La distancia entre las dos líneas es la ganancia; la leyenda lleva el
          último valor de cada una para poder leerla sin pasar el mouse. */}
      <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
        {SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-muted-foreground">{s.name}</span>
            <span className="tabular-nums text-foreground">
              {money.format(last ? last[s.key] : 0)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
