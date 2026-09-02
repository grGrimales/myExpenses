"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildCategorySeries, buildDailyBreakdown } from "@/lib/daily-categories";
import { useMoney } from "@/lib/currency-context";
import { type DailyCategoryExpense } from "@/types/expense";
import {
  eachDayOfInterval,
  endOfWeek,
  format,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { useMemo } from "react";

interface ExpenseHeatmapProps {
  rows: DailyCategoryExpense[];
  dateFrom: Date;
  dateTo: Date;
}

const WEEK_DAYS = ["L", "M", "X", "J", "V", "S", "D"];

/**
 * Codificación compuesta: el tono dice qué categoría dominó el día y la
 * intensidad cuánto se gastó. Los pasos no bajan de 40% para que el tono siga
 * siendo reconocible en una celda de 14px; por debajo todas las categorías se
 * confundirían en un mismo pastel.
 */
const INTENSITY_MIX = [0, 40, 55, 70, 85, 100];

/** Un día sin gastos usa --muted, fuera de la familia de cualquier categoría. */
const EMPTY_FILL = "var(--muted)";

function fillFor(color: string, intensity: number): string {
  if (intensity === 0) return EMPTY_FILL;
  return `color-mix(in oklab, ${color} ${INTENSITY_MIX[intensity]}%, var(--card))`;
}

function getIntensity(value: number, max: number): number {
  if (value === 0 || max === 0) return 0;
  const ratio = value / max;
  if (ratio < 0.15) return 1;
  if (ratio < 0.35) return 2;
  if (ratio < 0.55) return 3;
  if (ratio < 0.75) return 4;
  return 5;
}

export default function ExpenseHeatmap({
  rows,
  dateFrom,
  dateTo,
}: ExpenseHeatmapProps) {
  const money = useMoney();
  const series = useMemo(() => buildCategorySeries(rows), [rows]);
  const daily = useMemo(() => buildDailyBreakdown(rows, series), [rows, series]);

  const dataMap = useMemo(
    () => new Map(daily.map((d) => [d.date, d])),
    [daily]
  );
  const colorById = useMemo(
    () => new Map(series.map((s) => [s.id, s])),
    [series]
  );
  const maxValue = useMemo(
    () => Math.max(...daily.map((d) => d.total), 0),
    [daily]
  );

  const rangeStart = startOfWeek(dateFrom, { weekStartsOn: 1 });
  const rangeEnd = endOfWeek(dateTo, { weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

  const weeks: Date[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Mapa de calor de gastos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No hay gastos en este período
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="inline-flex gap-0">
              {/* Day labels */}
              <div className="mr-2 mt-6 flex flex-col gap-[3px]">
                {WEEK_DAYS.map((d) => (
                  <div
                    key={d}
                    className="flex h-[14px] w-4 items-center text-[10px] text-muted-foreground"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              <div className="flex gap-[3px]">
                {weeks.map((week, wi) => {
                  const firstInRange = week.find(
                    (d) => d >= dateFrom && d <= dateTo
                  );
                  const prevWeek = wi > 0 ? weeks[wi - 1] : null;
                  const prevFirst = prevWeek?.find(
                    (d) => d >= dateFrom && d <= dateTo
                  );
                  const showMonth =
                    firstInRange &&
                    (!prevFirst ||
                      format(firstInRange, "MM") !== format(prevFirst, "MM"));

                  return (
                    <div key={wi} className="flex flex-col gap-[3px]">
                      <div className="h-5 whitespace-nowrap text-[10px] text-muted-foreground">
                        {showMonth
                          ? format(firstInRange!, "MMM", { locale: es })
                          : ""}
                      </div>
                      {week.map((day, di) => {
                        const dateStr = format(day, "yyyy-MM-dd");
                        const isInRange = day >= dateFrom && day <= dateTo;
                        const entry = isInRange
                          ? dataMap.get(dateStr)
                          : undefined;
                        const amount = entry?.total ?? 0;
                        const dominant = entry?.dominantId
                          ? colorById.get(entry.dominantId)
                          : undefined;
                        const intensity = getIntensity(amount, maxValue);
                        const label = isInRange
                          ? `${format(day, "EEEE d MMM yyyy", { locale: es })}: ${
                              amount > 0
                                ? `${money.format(amount)}${
                                    dominant ? ` · ${dominant.name}` : ""
                                  }`
                                : "Sin gastos"
                            }`
                          : "";
                        return (
                          <div
                            key={di}
                            className={`h-[14px] w-[14px] rounded-sm ${
                              !isInRange ? "opacity-20" : ""
                            }`}
                            style={{
                              backgroundColor: dominant
                                ? fillFor(dominant.color, intensity)
                                : EMPTY_FILL,
                            }}
                            title={label}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dos canales, dos leyendas: sin decir qué significa cada uno el
                mapa parecería un mosaico decorativo. */}
            <div className="mt-4 space-y-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="text-[10px] text-muted-foreground">
                  Color: categoría con más gasto del día
                </span>
                {series.map((s) => (
                  <span
                    key={s.id}
                    className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
                  >
                    <span
                      className="h-[10px] w-[10px] rounded-sm"
                      style={{ backgroundColor: s.color }}
                    />
                    {s.name}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span>Intensidad: menos</span>
                {INTENSITY_MIX.map((mix, i) => (
                  <span
                    key={i}
                    className="h-[14px] w-[14px] rounded-sm"
                    style={{
                      backgroundColor:
                        i === 0
                          ? EMPTY_FILL
                          : `color-mix(in oklab, var(--foreground) ${mix}%, var(--card))`,
                    }}
                  />
                ))}
                <span>más</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
