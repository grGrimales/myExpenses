"use client";

import { useMoney } from "@/lib/currency-context";
import { type PortfolioPoint } from "@/types/investment";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface MonthlyGainChartProps {
  series: PortfolioPoint[];
}

type ChartRow = PortfolioPoint & { label: string };

function formatPct(value: number | null): string {
  if (value === null) return "—";
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
}

function signed(text: string, amount: number): string {
  return amount >= 0 ? `+${text}` : text;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: ChartRow }>;
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  const money = useMoney();
  const row = payload?.[0]?.payload;

  if (!active || !row) return null;

  return (
    <div className="min-w-48 rounded-lg border bg-card px-3 py-2 text-card-foreground shadow-sm">
      <div className="mb-1.5 text-xs font-medium capitalize">{row.label}</div>
      {row.byAccount.length > 0 && (
        <div className="space-y-1">
          {row.byAccount.map((a) => (
            <div key={a.accountId} className="flex items-center gap-3 text-xs">
              <span
                className="h-2 w-2 shrink-0 rounded-sm"
                style={{ backgroundColor: a.color }}
              />
              <span className="text-muted-foreground">{a.name}</span>
              <span className="ml-auto tabular-nums">
                {signed(money.format(a.gain), a.gain)}
              </span>
            </div>
          ))}
        </div>
      )}
      {Math.abs(row.netContribution) >= 0.005 && (
        <div className="mt-1.5 flex items-center gap-3 border-t pt-1.5 text-xs">
          <span className="text-muted-foreground">
            {row.netContribution >= 0 ? "Aportaste" : "Retiraste"}
          </span>
          <span className="ml-auto tabular-nums">
            {money.format(Math.abs(row.netContribution))}
          </span>
        </div>
      )}
      <div className="mt-1.5 flex items-center gap-3 border-t pt-1.5 text-xs font-medium">
        <span>Total del mes</span>
        <span className="ml-auto tabular-nums">
          {signed(money.format(row.monthGain), row.monthGain)}
          <span className="ml-1 font-normal text-muted-foreground">
            {formatPct(row.monthReturnPct)}
          </span>
        </span>
      </div>
    </div>
  );
}

/**
 * Lo que rindió la cartera cada mes. Barras y no línea: cada mes es un monto
 * propio, no un nivel que se arrastra, y un mes en rojo tiene que saltar a la
 * vista. Debajo va la tabla con los mismos números para leerlos sin el mouse.
 */
export default function MonthlyGainChart({ series }: MonthlyGainChartProps) {
  const money = useMoney();

  const data: ChartRow[] = series.map((point) => ({
    ...point,
    label: format(parseISO(`${point.month}-01`), "MMM yy", { locale: es }),
  }));

  const total = series.reduce((sum, p) => sum + p.monthGain, 0);
  const average = series.length > 0 ? total / series.length : 0;

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
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
          <ReferenceLine y={0} stroke="var(--muted-foreground)" />
          <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltip />} />
          <Bar dataKey="monthGain" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((row) => (
              <Cell
                key={row.month}
                fill={
                  row.monthGain >= 0 ? "var(--series-gain)" : "var(--series-loss)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
        <span className="text-muted-foreground">
          Total del período{" "}
          <span
            className={`tabular-nums font-medium ${
              total >= 0 ? "text-green-600" : "text-destructive"
            }`}
          >
            {signed(money.format(total), total)}
          </span>
        </span>
        <span className="text-muted-foreground">
          Promedio mensual{" "}
          <span className="tabular-nums font-medium text-foreground">
            {signed(money.format(average), average)}
          </span>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th className="py-2 text-left font-medium">Mes</th>
              <th className="py-2 text-right font-medium">Rendimiento</th>
              <th className="py-2 text-right font-medium">%</th>
              <th className="py-2 text-right font-medium">Aportes / retiros</th>
              <th className="py-2 text-right font-medium">Valor al cierre</th>
            </tr>
          </thead>
          <tbody>
            {[...data].reverse().map((row) => (
              <tr key={row.month} className="border-b last:border-0">
                <td className="py-2 capitalize">{row.label}</td>
                <td
                  className={`py-2 text-right tabular-nums ${
                    row.monthGain >= 0 ? "text-green-600" : "text-destructive"
                  }`}
                >
                  {signed(money.format(row.monthGain), row.monthGain)}
                </td>
                <td className="py-2 text-right tabular-nums text-muted-foreground">
                  {formatPct(row.monthReturnPct)}
                </td>
                {/* Va al lado del rendimiento para que un mes con el valor en
                    caída se entienda: salió plata, no se perdió. */}
                <td className="py-2 text-right tabular-nums">
                  {Math.abs(row.netContribution) < 0.005
                    ? "—"
                    : signed(money.format(row.netContribution), row.netContribution)}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {money.format(row.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
