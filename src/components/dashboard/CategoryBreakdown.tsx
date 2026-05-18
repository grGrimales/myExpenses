import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Category } from "@/db/schema/categories";
import { formatCurrency } from "@/lib/utils/format";
import { type CategoryExpense } from "@/types/expense";

interface CategoryBreakdownProps {
  data: CategoryExpense[];
  categories: Category[];
  total: number;
}

export default function CategoryBreakdown({
  data,
  categories,
  total,
}: CategoryBreakdownProps) {
  const sorted = [...data].sort((a, b) => b.total - a.total);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Desglose por categoría
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No hay gastos en este período
          </p>
        ) : (
          <div className="space-y-4">
            {sorted.map((item) => {
              const category = categories.find((c) => c.id === item.categoryId);
              const color = category?.color ?? "#94a3b8";
              const pct = total > 0 ? (item.total / total) * 100 : 0;
              return (
                <div key={item.categoryId ?? "sin-cat"} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate font-medium">
                        {item.categoryName ?? "Sin categoría"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({item.count})
                      </span>
                    </div>
                    <div className="ml-2 flex items-center gap-2 whitespace-nowrap">
                      <span className="text-xs text-muted-foreground">
                        {pct.toFixed(1)}%
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(item.total)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
