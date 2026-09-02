"use client";

import { getCategoryExpensesAction } from "@/actions/expenses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { type Category } from "@/db/schema/categories";
import { type Expense } from "@/db/schema/expenses";
import {
  categoryKey,
  keyToCategoryId,
  useCategorySelection,
} from "@/hooks/useCategorySelection";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { cn } from "@/lib/utils";
import { useMoney } from "@/lib/currency-context";
import { type CategoryExpense } from "@/types/expense";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronDown, Crown, Loader2, Tag } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import CategoryBarChartDisplay from "./CategoryBarChartDisplay";

interface CategoryBreakdownProps {
  data: CategoryExpense[];
  categories: Category[];
  total: number;
  dateFrom: Date;
  dateTo: Date;
}

export default function CategoryBreakdown({
  data,
  categories,
  total,
  dateFrom,
  dateTo,
}: CategoryBreakdownProps) {
  const money = useMoney();
  const { selection, setSelection } = useCategorySelection();

  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [expensesByKey, setExpensesByKey] = useState<Record<string, Expense[]>>(
    {}
  );
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...data].sort((a, b) => b.total - a.total),
    [data]
  );
  const allKeys = useMemo(
    () => sorted.map((item) => categoryKey(item.categoryId)),
    [sorted]
  );

  // `null` en la URL significa "todas": es el estado inicial de la pantalla.
  const selectedKeys = useMemo(
    () => selection ?? new Set(allKeys),
    [selection, allKeys]
  );

  /** Monto excluido a mano dentro de cada categoría ya cargada. */
  const excludedByKey = useMemo(() => {
    const map = new Map<string, { amount: number; count: number }>();
    for (const [key, list] of Object.entries(expensesByKey)) {
      let amount = 0;
      let count = 0;
      for (const expense of list) {
        if (!excludedIds.has(expense.id)) continue;
        amount += Number(expense.amount) || 0;
        count += 1;
      }
      if (count > 0) map.set(key, { amount, count });
    }
    return map;
  }, [expensesByKey, excludedIds]);

  const { selectedTotal, excludedCount } = useMemo(() => {
    let sum = 0;
    let excluded = 0;
    for (const item of sorted) {
      const key = categoryKey(item.categoryId);
      // Si la categoría entera está fuera, sus exclusiones individuales ya no
      // aportan nada al cálculo.
      if (!selectedKeys.has(key)) continue;
      sum += item.total;
      const off = excludedByKey.get(key);
      if (off) {
        sum -= off.amount;
        excluded += off.count;
      }
    }
    return { selectedTotal: sum, excludedCount: excluded };
  }, [sorted, selectedKeys, excludedByKey]);

  // La URL puede arrastrar categorías de otro período que ya no tienen gastos
  // en este rango. Contar solo las visibles evita un "5 de 3 categorías".
  const selectedVisibleCount = useMemo(
    () => allKeys.filter((key) => selectedKeys.has(key)).length,
    [allKeys, selectedKeys]
  );

  const isFiltered =
    selectedVisibleCount !== allKeys.length || excludedCount > 0;

  function toggleCategory(key: string) {
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    // Volver a "todas" limpia el parámetro en vez de listar cada id.
    setSelection(next.size === allKeys.length ? null : next);
  }

  async function toggleExpanded(key: string) {
    if (expandedKey === key) {
      setExpandedKey(null);
      return;
    }
    setExpandedKey(key);
    if (expensesByKey[key]) return;

    setLoadingKey(key);
    const result = await getCategoryExpensesAction(
      keyToCategoryId(key),
      dateFrom,
      dateTo
    );
    setLoadingKey(null);
    if (result.success) {
      setExpensesByKey((prev) => ({ ...prev, [key]: result.data }));
    } else {
      setExpandedKey(null);
      toast.error(result.error);
    }
  }

  function toggleExpense(id: string) {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold">
            Desglose por categoría
          </CardTitle>
          {sorted.length > 0 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => {
                  setSelection(null);
                  setExcludedIds(new Set());
                }}
              >
                Todas
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => setSelection(new Set())}
              >
                Ninguna
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No hay gastos en este período
          </p>
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total seleccionado
              </p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums">
                {money.format(selectedTotal)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedVisibleCount} de {allKeys.length} categoría
                {allKeys.length !== 1 ? "s" : ""}
                {excludedCount > 0 &&
                  ` · ${excludedCount} gasto${
                    excludedCount !== 1 ? "s" : ""
                  } excluido${excludedCount !== 1 ? "s" : ""}`}
                {isFiltered && ` · total del período ${money.format(total)}`}
              </p>
            </div>

            <CategoryBarChartDisplay
              data={sorted.map((item) => {
                const category = categories.find(
                  (c) => c.id === item.categoryId
                );
                return {
                  name: item.categoryName ?? "Sin categoría",
                  total: item.total,
                  color: category?.color ?? "#94a3b8",
                };
              })}
            />

            <div className="space-y-4">
              {sorted.map((item, index) => {
                const key = categoryKey(item.categoryId);
                const category = categories.find(
                  (c) => c.id === item.categoryId
                );
                const color = category?.color ?? "#94a3b8";
                const Icon = category
                  ? CATEGORY_ICONS[category.icon] ?? Tag
                  : Tag;
                const pct = total > 0 ? (item.total / total) * 100 : 0;
                const isTop = index === 0;
                const isSelected = selectedKeys.has(key);
                const off = excludedByKey.get(key);
                const isExpanded = expandedKey === key;
                const rowExpenses = expensesByKey[key];

                return (
                  <div
                    key={key}
                    className={cn(
                      "space-y-1.5 rounded-lg",
                      isTop && "border bg-muted/40 p-2.5"
                    )}
                    style={isTop ? { borderColor: color + "40" } : undefined}
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={isSelected && off ? "indeterminate" : isSelected}
                        onCheckedChange={() => toggleCategory(key)}
                        aria-label={`Incluir ${
                          item.categoryName ?? "Sin categoría"
                        } en el total`}
                      />
                      <button
                        type="button"
                        onClick={() => toggleExpanded(key)}
                        aria-expanded={isExpanded}
                        className={cn(
                          "flex min-w-0 flex-1 items-center gap-2 rounded text-left transition-opacity",
                          !isSelected && "opacity-40"
                        )}
                      >
                        <div
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: color + "20", color }}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="truncate font-medium">
                          {item.categoryName ?? "Sin categoría"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({item.count})
                        </span>
                        {isTop && (
                          <Badge
                            variant="outline"
                            className="ml-1 hidden shrink-0 gap-1 border-none bg-background px-1.5 py-0 text-[10px] font-medium sm:flex"
                            style={{ color }}
                          >
                            <Crown className="h-3 w-3" />
                            Mayor gasto
                          </Badge>
                        )}
                        {loadingKey === key ? (
                          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
                        ) : (
                          <ChevronDown
                            className={cn(
                              "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                              isExpanded && "rotate-180"
                            )}
                          />
                        )}
                      </button>
                      <div
                        className={cn(
                          "ml-auto flex items-center gap-2 whitespace-nowrap transition-opacity",
                          !isSelected && "opacity-40"
                        )}
                      >
                        <span className="text-xs text-muted-foreground">
                          {pct.toFixed(1)}%
                        </span>
                        <span className="font-semibold tabular-nums">
                          {off && isSelected
                            ? money.format(item.total - off.amount)
                            : money.format(item.total)}
                        </span>
                      </div>
                    </div>

                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          !isSelected && "opacity-30"
                        )}
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>

                    {isExpanded && rowExpenses && (
                      <ul className="mt-2 space-y-1 border-l-2 pl-3">
                        {rowExpenses.length === 0 && (
                          <li className="py-1 text-xs text-muted-foreground">
                            Sin gastos en este período
                          </li>
                        )}
                        {rowExpenses.map((expense) => {
                          const isExcluded = excludedIds.has(expense.id);
                          return (
                            <li
                              key={expense.id}
                              className="flex items-center gap-2 py-0.5 text-xs"
                            >
                              <Checkbox
                                checked={!isExcluded}
                                disabled={!isSelected}
                                onCheckedChange={() => toggleExpense(expense.id)}
                                aria-label={`Contar ${expense.description} en el total`}
                                className="h-3.5 w-3.5"
                              />
                              <span
                                className={cn(
                                  "min-w-0 flex-1 truncate",
                                  (isExcluded || !isSelected) &&
                                    "text-muted-foreground line-through"
                                )}
                              >
                                {expense.description}
                              </span>
                              <span className="shrink-0 text-muted-foreground">
                                {format(new Date(expense.date), "d MMM", {
                                  locale: es,
                                })}
                              </span>
                              <span
                                className={cn(
                                  "shrink-0 tabular-nums",
                                  (isExcluded || !isSelected) &&
                                    "text-muted-foreground line-through"
                                )}
                              >
                                {money.format(Number(expense.amount) || 0)}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
