import { type DailyCategoryExpense } from "@/types/expense";

/**
 * Serie de color del gráfico apilado y del mapa de calor. El id es el de la
 * categoría; los gastos sin categoría y el resto plegado tienen ids propios
 * que no chocan con un uuid.
 */
export interface CategorySeries {
  id: string;
  name: string;
  color: string;
}

/** Un día ya resuelto: total, reparto por serie y serie dominante. */
export interface DailyBreakdown {
  date: string;
  total: number;
  /** Monto por id de serie. Solo incluye las series con gasto ese día. */
  bySeries: Record<string, number>;
  /** Serie que más aportó ese día, o null si el día no tuvo gastos. */
  dominantId: string | null;
}

export const UNCATEGORIZED_ID = "sin-categoria";
export const OTHER_ID = "otras";

const UNCATEGORIZED_COLOR = "#94a3b8";

/**
 * Más allá de ~7 clases de color los tonos vecinos dejan de distinguirse, y en
 * una celda de 14px del mapa de calor el margen es aún menor. Las categorías
 * que no entran se pliegan en "Otras" en vez de recibir un color nuevo.
 */
export const MAX_SERIES = 6;

const OTHER_SERIES: CategorySeries = {
  id: OTHER_ID,
  name: "Otras",
  // Gris de texto secundario: "Otras" no es una categoría más, es el resto.
  color: "var(--muted-foreground)",
};

function seriesIdOf(row: DailyCategoryExpense): string {
  return row.categoryId ?? UNCATEGORIZED_ID;
}

/**
 * Series ordenadas por gasto total descendente en el período. El orden fija el
 * color de cada categoría: sigue a la categoría, no a su posición en la pila,
 * así que filtrar el período no repinta a las que sobreviven.
 */
export function buildCategorySeries(
  rows: DailyCategoryExpense[]
): CategorySeries[] {
  const totals = new Map<string, { series: CategorySeries; total: number }>();

  for (const row of rows) {
    const id = seriesIdOf(row);
    const existing = totals.get(id);
    if (existing) {
      existing.total += row.total;
      continue;
    }
    totals.set(id, {
      series: {
        id,
        name: row.categoryName,
        color: row.categoryId ? row.categoryColor : UNCATEGORIZED_COLOR,
      },
      total: row.total,
    });
  }

  const ranked = Array.from(totals.values()).sort((a, b) => b.total - a.total);
  const visible = ranked.slice(0, MAX_SERIES).map((entry) => entry.series);

  return ranked.length > MAX_SERIES ? [...visible, OTHER_SERIES] : visible;
}

/**
 * Reparte cada día entre las series visibles, sumando en "Otras" todo lo que
 * quedó fuera del corte.
 */
export function buildDailyBreakdown(
  rows: DailyCategoryExpense[],
  series: CategorySeries[]
): DailyBreakdown[] {
  const visibleIds = new Set(
    series.filter((s) => s.id !== OTHER_ID).map((s) => s.id)
  );
  const hasOther = series.some((s) => s.id === OTHER_ID);

  const byDate = new Map<string, DailyBreakdown>();

  for (const row of rows) {
    const rawId = seriesIdOf(row);
    const id = visibleIds.has(rawId) ? rawId : hasOther ? OTHER_ID : rawId;

    let day = byDate.get(row.date);
    if (!day) {
      day = { date: row.date, total: 0, bySeries: {}, dominantId: null };
      byDate.set(row.date, day);
    }

    day.total += row.total;
    day.bySeries[id] = (day.bySeries[id] ?? 0) + row.total;
  }

  for (const day of byDate.values()) {
    let best: string | null = null;
    let bestAmount = 0;
    for (const [id, amount] of Object.entries(day.bySeries)) {
      if (amount > bestAmount) {
        best = id;
        bestAmount = amount;
      }
    }
    day.dominantId = best;
  }

  return Array.from(byDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}
