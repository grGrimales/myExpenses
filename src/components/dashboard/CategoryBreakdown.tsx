import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Category } from "@/db/schema/categories";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format";
import { type CategoryExpense } from "@/types/expense";
import { Crown, Tag } from "lucide-react";

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
            {sorted.map((item, index) => {
              const category = categories.find((c) => c.id === item.categoryId);
              const color = category?.color ?? "#94a3b8";
              const Icon = category ? CATEGORY_ICONS[category.icon] ?? Tag : Tag;
              const pct = total > 0 ? (item.total / total) * 100 : 0;
              const isTop = index === 0;
              return (
                <div
                  key={item.categoryId ?? "sin-cat"}
                  className={cn(
                    "space-y-1.5 rounded-lg",
                    isTop && "border bg-muted/40 p-2.5"
                  )}
                  style={isTop ? { borderColor: color + "40" } : undefined}
                >
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="w-4 flex-shrink-0 text-xs font-semibold text-muted-foreground">
                        {index + 1}
                      </span>
                      <div
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
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
                          className="ml-1 flex-shrink-0 gap-1 border-none bg-background px-1.5 py-0 text-[10px] font-medium"
                          style={{ color }}
                        >
                          <Crown className="h-3 w-3" />
                          Mayor gasto
                        </Badge>
                      )}
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
