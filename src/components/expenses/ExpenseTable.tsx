"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Category } from "@/db/schema/categories";
import { type Expense } from "@/db/schema/expenses";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Pencil, Trash2 } from "lucide-react";

interface ExpenseTableProps {
  expenses: Expense[];
  categories: Category[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export default function ExpenseTable({
  expenses,
  categories,
  onEdit,
  onDelete,
}: ExpenseTableProps) {
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <p className="text-muted-foreground">No hay gastos que coincidan con los filtros.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="hidden sm:table-cell">Categoría</TableHead>
            <TableHead className="hidden md:table-cell">Tipo</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead className="w-[80px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => {
            const category = categories.find((c) => c.id === expense.categoryId);
            const amount = Number(expense.amount);
            const isIncome = expense.type === "income";

            return (
              <TableRow key={expense.id}>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatDate(expense.date, {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>

                <TableCell className="max-w-[180px]">
                  <p className="truncate font-medium">{expense.description}</p>
                  {expense.notes && (
                    <p className="truncate text-xs text-muted-foreground">
                      {expense.notes}
                    </p>
                  )}
                </TableCell>

                <TableCell className="hidden sm:table-cell">
                  {category ? (
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: category.color,
                        color: category.color,
                      }}
                    >
                      {category.name}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  <Badge variant={isIncome ? "default" : "secondary"}>
                    {isIncome ? "Ingreso" : "Gasto"}
                  </Badge>
                </TableCell>

                <TableCell className="text-right font-medium">
                  <span className={isIncome ? "text-green-600" : "text-red-600"}>
                    {isIncome ? "+" : "-"}
                    {formatCurrency(amount)}
                  </span>
                </TableCell>

                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEdit(expense)}
                      aria-label="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => onDelete(expense)}
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
