"use client";

import { Button } from "@/components/ui/button";
import { type Category } from "@/db/schema/categories";
import { type Expense } from "@/db/schema/expenses";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import DeleteExpenseDialog from "./DeleteExpenseDialog";
import ExpenseDialog from "./ExpenseDialog";

interface ExpenseDetailActionsProps {
  expense: Expense;
  categories: Category[];
}

export default function ExpenseDetailActions({
  expense,
  categories,
}: ExpenseDetailActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </Button>
        <Button
          variant="outline"
          className="text-destructive hover:text-destructive"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar
        </Button>
      </div>

      <ExpenseDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        expense={expense}
        categories={categories}
        onSuccess={() => {
          setEditOpen(false);
          router.refresh();
        }}
      />

      <DeleteExpenseDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        expense={expense}
        onSuccess={() => router.push("/gastos")}
      />
    </>
  );
}
