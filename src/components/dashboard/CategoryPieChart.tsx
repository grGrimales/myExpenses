import { getCategoriesAction } from "@/actions/categories";
import { getExpensesByCategoryAction } from "@/actions/expenses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CategoryPieChartDisplay from "./CategoryPieChartDisplay";

interface CategoryPieChartProps {
  dateFrom: Date;
  dateTo: Date;
}

export default async function CategoryPieChart({
  dateFrom,
  dateTo,
}: CategoryPieChartProps) {
  const [expensesResult, categoriesResult] = await Promise.all([
    getExpensesByCategoryAction(dateFrom, dateTo),
    getCategoriesAction(),
  ]);

  const categoryExpenses = expensesResult.success ? expensesResult.data : [];
  const categories = categoriesResult.success ? categoriesResult.data : [];

  const data = categoryExpenses
    .filter((e) => e.total > 0)
    .map((e) => {
      const cat = categories.find((c) => c.id === e.categoryId);
      return {
        name: e.categoryName ?? "Sin categoría",
        value: e.total,
        color: cat?.color ?? "#94a3b8",
      };
    });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Gastos por categoría
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CategoryPieChartDisplay data={data} />
      </CardContent>
    </Card>
  );
}
