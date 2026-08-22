import {
  differenceInCalendarMonths,
  endOfDay,
  endOfMonth,
  endOfYear,
  isFirstDayOfMonth,
  isLastDayOfMonth,
  parseISO,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns";

export type DatePreset =
  | "current-month"
  | "last-month"
  | "last-3-months"
  | "current-year"
  | "custom";

export const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "current-month", label: "Mes actual" },
  { value: "last-month", label: "Mes anterior" },
  { value: "last-3-months", label: "Últimos 3 meses" },
  { value: "current-year", label: "Año actual" },
  { value: "custom", label: "Personalizado" },
];

export function getDateRangeForPreset(
  preset: DatePreset,
  customFrom?: string,
  customTo?: string
): { dateFrom: Date; dateTo: Date } {
  const now = new Date();
  switch (preset) {
    case "current-month":
      return { dateFrom: startOfMonth(now), dateTo: endOfMonth(now) };
    case "last-month": {
      const last = subMonths(now, 1);
      return { dateFrom: startOfMonth(last), dateTo: endOfMonth(last) };
    }
    case "last-3-months":
      return {
        dateFrom: startOfMonth(subMonths(now, 2)),
        dateTo: endOfMonth(now),
      };
    case "current-year":
      return { dateFrom: startOfYear(now), dateTo: endOfYear(now) };
    case "custom":
      return {
        dateFrom: customFrom ? parseISO(customFrom) : startOfMonth(now),
        dateTo: customTo ? endOfDay(parseISO(customTo)) : endOfMonth(now),
      };
    default:
      return { dateFrom: startOfMonth(now), dateTo: endOfMonth(now) };
  }
}

export function getPreviousPeriod(
  dateFrom: Date,
  dateTo: Date
): { prevFrom: Date; prevTo: Date } {
  // Si el rango cubre meses calendario completos, hay que desplazarlo por meses,
  // no por duración: los meses no duran lo mismo, y una ventana de igual longitud
  // se desborda sobre el mes anterior. Comparar julio (31 días) contra los
  // "31 días previos" arrastra el 31 de mayo dentro del total de junio.
  if (isFirstDayOfMonth(dateFrom) && isLastDayOfMonth(dateTo)) {
    const months = differenceInCalendarMonths(dateTo, dateFrom) + 1;
    return {
      prevFrom: startOfMonth(subMonths(dateFrom, months)),
      prevTo: endOfMonth(subMonths(dateTo, months)),
    };
  }

  // Rango arbitrario (preset "custom"): ventana contigua de la misma duración.
  const duration = dateTo.getTime() - dateFrom.getTime();
  return {
    prevFrom: new Date(dateFrom.getTime() - duration - 1),
    prevTo: new Date(dateFrom.getTime() - 1),
  };
}
