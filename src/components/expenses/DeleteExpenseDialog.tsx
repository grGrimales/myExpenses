"use client";

import { deleteExpenseAction } from "@/actions/expenses";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { type Expense } from "@/db/schema/expenses";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface DeleteExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
  onConfirm?: (expense: Expense) => void;
  onSuccess?: () => void;
}

export default function DeleteExpenseDialog({
  open,
  onOpenChange,
  expense,
  onConfirm,
  onSuccess,
}: DeleteExpenseDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!expense) return;

    if (onConfirm) {
      onOpenChange(false);
      onConfirm(expense);
      return;
    }

    setIsDeleting(true);
    const result = await deleteExpenseAction(expense.id);
    setIsDeleting(false);
    if (result.success) {
      toast.success("Gasto eliminado");
      onOpenChange(false);
      router.refresh();
      onSuccess?.();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar gasto?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará &quot;{expense?.description}&quot; de forma
            permanente y no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
