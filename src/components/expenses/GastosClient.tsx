"use client";

import { deleteExpenseAction } from "@/actions/expenses";
import { Button } from "@/components/ui/button";
import { type Category } from "@/db/schema/categories";
import { type Expense } from "@/db/schema/expenses";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import DeleteExpenseDialog from "./DeleteExpenseDialog";
import ExpenseDialog from "./ExpenseDialog";
import ExpenseFilters from "./ExpenseFilters";
import ExpensePagination from "./ExpensePagination";
import ExpenseTable from "./ExpenseTable";

interface GastosClientProps {
  expenses: Expense[];
  categories: Category[];
  total: number;
  pageSize: number;
}

export default function GastosClient({
  expenses,
  categories,
  total,
  pageSize,
}: GastosClientProps) {
  const router = useRouter();
  const [newOpen, setNewOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);
  const [, startTransition] = useTransition();

  const [optimisticExpenses, removeOptimistic] = useOptimistic(
    expenses,
    (state, deletedId: string) => state.filter((e) => e.id !== deletedId)
  );

  function handleNewSuccess() {
    setNewOpen(false);
    router.refresh();
  }

  function handleEditSuccess() {
    setEditExpense(null);
    router.refresh();
  }

  function handleConfirmDelete(expense: Expense) {
    startTransition(async () => {
      removeOptimistic(expense.id);
      const result = await deleteExpenseAction(expense.id);
      if (result.success) {
        toast.success("Gasto eliminado");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gastos</h1>
          <p className="text-muted-foreground">
            {total} registro{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setNewOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo gasto
        </Button>
      </div>

      <ExpenseFilters categories={categories} />

      <ExpenseTable
        expenses={optimisticExpenses}
        categories={categories}
        onEdit={setEditExpense}
        onDelete={setDeleteExpense}
      />

      <ExpensePagination total={total} pageSize={pageSize} />

      <ExpenseDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        categories={categories}
        onSuccess={handleNewSuccess}
      />

      <ExpenseDialog
        open={editExpense !== null}
        onOpenChange={(open) => !open && setEditExpense(null)}
        expense={editExpense ?? undefined}
        categories={categories}
        onSuccess={handleEditSuccess}
      />

      <DeleteExpenseDialog
        open={deleteExpense !== null}
        onOpenChange={(open) => !open && setDeleteExpense(null)}
        expense={deleteExpense}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
