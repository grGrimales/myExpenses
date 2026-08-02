import { getCategoriesAction } from "@/actions/categories";
import { getExpensesAction } from "@/actions/expenses";
import GastosClient from "@/components/expenses/GastosClient";
import { type ExpenseFilters, type ExpenseType } from "@/types/expense";
import { parseISO } from "date-fns";
import { type Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Gastos — Mis Gastos",
  description: "Gestiona y visualiza todos tus movimientos financieros",
};

const PAGE_SIZE = 10;

export default async function GastosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const page = parseInt(String(params.page ?? "1"), 10);

  const filters: ExpenseFilters = {
    type: (params.type as ExpenseType) || undefined,
    categoryId: (params.categoryId as string) || undefined,
    search: (params.search as string) || undefined,
    dateFrom: params.dateFrom ? parseISO(params.dateFrom as string) : undefined,
    dateTo: params.dateTo ? parseISO(params.dateTo as string) : undefined,
  };

  const [expensesResult, categoriesResult] = await Promise.all([
    getExpensesAction(filters, { page, pageSize: PAGE_SIZE }),
    getCategoriesAction(),
  ]);

  const expenses = expensesResult.success ? expensesResult.data.expenses : [];
  const total = expensesResult.success ? expensesResult.data.total : 0;
  const categories = categoriesResult.success ? categoriesResult.data : [];

  return (
    <div className="space-y-6">
      <Suspense>
        <GastosClient
          expenses={expenses}
          categories={categories}
          total={total}
          pageSize={PAGE_SIZE}
        />
      </Suspense>
    </div>
  );
}
