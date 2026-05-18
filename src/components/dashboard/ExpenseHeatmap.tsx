"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/format";
import { type DailyExpense } from "@/types/expense";
import {
  eachDayOfInterval,
  endOfWeek,
  format,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";

interface ExpenseHeatmapProps {
  dailyData: DailyExpense[];
  dateFrom: Date;
  dateTo: Date;
}

const WEEK_DAYS = ["L", "M", "X", "J", "V", "S", "D"];

const intensityClasses = [
  "bg-muted/50",
  "bg-red-200 dark:bg-red-900/50",
  "bg-red-300 dark:bg-red-800/60",
  "bg-red-400 dark:bg-red-700/70",
  "bg-red-500 dark:bg-red-600/80",
  "bg-red-600 dark:bg-red-500",
];

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
  dailyData,
  dateFrom,
  dateTo,
}: ExpenseHeatmapProps) {
  const dataMap = new Map(dailyData.map((d) => [d.date, d.total]));
  const maxValue = Math.max(...dailyData.map((d) => d.total), 0);

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
        {dailyData.length === 0 ? (
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
                        const amount = dataMap.get(dateStr) ?? 0;
                        const isInRange = day >= dateFrom && day <= dateTo;
                        const intensity = isInRange
                          ? getIntensity(amount, maxValue)
                          : 0;
                        const label = isInRange
                          ? `${format(day, "EEEE d MMM yyyy", { locale: es })}: ${
                              amount > 0 ? formatCurrency(amount) : "Sin gastos"
                            }`
                          : "";
                        return (
                          <div
                            key={di}
                            className={`h-[14px] w-[14px] rounded-sm ${intensityClasses[intensity]} ${
                              !isInRange ? "opacity-20" : ""
                            }`}
                            title={label}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span>Menos</span>
              {intensityClasses.map((cls, i) => (
                <div key={i} className={`h-[14px] w-[14px] rounded-sm ${cls}`} />
              ))}
              <span>Más</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
