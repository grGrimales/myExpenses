"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type Category } from "@/db/schema/categories";
import { type Expense } from "@/db/schema/expenses";
import ExpenseForm from "./ExpenseForm";

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense;
  categories: Category[];
  onSuccess?: () => void;
}

export default function ExpenseDialog({
  open,
  onOpenChange,
  expense,
  categories,
  onSuccess,
}: ExpenseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{expense ? "Editar gasto" : "Nuevo gasto"}</DialogTitle>
        </DialogHeader>
        <ExpenseForm
          expense={expense}
          categories={categories}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
