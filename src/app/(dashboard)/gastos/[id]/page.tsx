import { getCategoriesAction } from "@/actions/categories";
import { getExpenseByIdAction } from "@/actions/expenses";
import ExpenseDetailActions from "@/components/expenses/ExpenseDetailActions";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { ArrowLeft, Tag } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [expenseResult, categoriesResult] = await Promise.all([
    getExpenseByIdAction(id),
    getCategoriesAction(),
  ]);

  if (!expenseResult.success) notFound();

  const expense = expenseResult.data;
  const categories = categoriesResult.success ? categoriesResult.data : [];
  const category = categories.find((c) => c.id === expense.categoryId);
  const CategoryIcon = category ? (CATEGORY_ICONS[category.icon] ?? Tag) : null;
  const isIncome = expense.type === "income";
  const amount = Number(expense.amount);

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link
          href="/gastos"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Detalle del gasto</h1>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-5">
        {/* Amount */}
        <div className="text-center">
          <p
            className={`text-4xl font-bold ${
              isIncome ? "text-green-600" : "text-red-600"
            }`}
          >
            {isIncome ? "+" : "-"}
            {formatCurrency(amount)}
          </p>
          <Badge
            className="mt-2"
            variant={isIncome ? "default" : "secondary"}
          >
            {isIncome ? "Ingreso" : "Gasto"}
          </Badge>
        </div>

        <hr />

        {/* Fields */}
        <dl className="space-y-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Descripción</dt>
            <dd className="font-medium text-right">{expense.description}</dd>
          </div>

          <div className="flex justify-between">
            <dt className="text-muted-foreground">Fecha</dt>
            <dd className="font-medium">{formatDate(expense.date)}</dd>
          </div>

          <div className="flex justify-between items-center">
            <dt className="text-muted-foreground">Categoría</dt>
            <dd>
              {category ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                  style={{
                    borderColor: category.color,
                    color: category.color,
                  }}
                >
                  {CategoryIcon && <CategoryIcon className="h-3 w-3" />}
                  {category.name}
                </span>
              ) : (
                <span className="text-muted-foreground">Sin categoría</span>
              )}
            </dd>
          </div>

          {expense.notes && (
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground">Notas</dt>
              <dd className="font-medium">{expense.notes}</dd>
            </div>
          )}

          <div className="flex justify-between">
            <dt className="text-muted-foreground">Creado</dt>
            <dd className="text-muted-foreground">
              {formatDate(expense.createdAt, {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </dd>
          </div>
        </dl>
      </div>

      <ExpenseDetailActions expense={expense} categories={categories} />
    </div>
  );
}
