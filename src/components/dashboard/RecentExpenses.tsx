import { getCategoriesAction } from "@/actions/categories";
import { getExpensesAction } from "@/actions/expenses";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import Link from "next/link";

interface RecentExpensesProps {
  dateFrom?: Date;
  dateTo?: Date;
}

export default async function RecentExpenses({
  dateFrom,
  dateTo,
}: RecentExpensesProps) {
  const [expensesResult, categoriesResult] = await Promise.all([
    getExpensesAction({ dateFrom, dateTo }, { page: 1, pageSize: 5 }),
    getCategoriesAction(),
  ]);

  const expenses = expensesResult.success ? expensesResult.data.expenses : [];
  const categories = categoriesResult.success ? categoriesResult.data : [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">
          Últimos movimientos
        </CardTitle>
        <Link
          href="/gastos"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Ver todos →
        </Link>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No hay movimientos en este período
          </p>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => {
              const category = categories.find(
                (c) => c.id === expense.categoryId
              );
              const isIncome = expense.type === "income";
              return (
                <div
                  key={expense.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {expense.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(expense.date, {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                        {category && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                            style={{
                              borderColor: category.color,
                              color: category.color,
                            }}
                          >
                            {category.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold whitespace-nowrap ml-2 ${
                      isIncome ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isIncome ? "+" : "-"}
                    {formatCurrency(Number(expense.amount))}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
