"use client";

import { createExpenseAction, updateExpenseAction } from "@/actions/expenses";
import CategoryCombobox from "@/components/categories/CategoryCombobox";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { type Category } from "@/db/schema/categories";
import { type Expense } from "@/db/schema/expenses";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  type: z.enum(["expense", "income"]),
  amount: z.number({ message: "Ingresa un monto válido" }).positive("El monto debe ser mayor a 0"),
  description: z.string().min(1, "La descripción es requerida").max(200),
  notes: z.string().max(500).optional(),
  categoryId: z.string().uuid().optional(),
  date: z.date({ message: "Selecciona una fecha" }),
});
type FormValues = z.infer<typeof formSchema>;

interface ExpenseFormProps {
  expense?: Expense;
  categories: Category[];
  onSuccess?: () => void;
}

export default function ExpenseForm({
  expense,
  categories,
  onSuccess,
}: ExpenseFormProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: expense?.type ?? "expense",
      amount: expense ? Number(expense.amount) : (undefined as unknown as number),
      description: expense?.description ?? "",
      notes: expense?.notes ?? "",
      categoryId: expense?.categoryId ?? undefined,
      date: expense ? new Date(expense.date) : new Date(),
    },
  });

  const selectedType = watch("type");

  async function onSubmit(data: FormValues) {
    const result = expense
      ? await updateExpenseAction(expense.id, data)
      : await createExpenseAction(data);

    if (result.success) {
      toast.success(expense ? "Gasto actualizado" : "Gasto creado");
      onSuccess?.();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Type toggle */}
      <div className="space-y-2">
        <Label>Tipo</Label>
        <div className="grid grid-cols-2 rounded-md border p-1 gap-1">
          <button
            type="button"
            onClick={() => setValue("type", "expense")}
            className={cn(
              "rounded px-3 py-1.5 text-sm font-medium transition-colors",
              selectedType === "expense"
                ? "bg-destructive text-destructive-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Gasto
          </button>
          <button
            type="button"
            onClick={() => setValue("type", "income")}
            className={cn(
              "rounded px-3 py-1.5 text-sm font-medium transition-colors",
              selectedType === "income"
                ? "bg-green-600 text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Ingreso
          </button>
        </div>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount">Monto</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          {...register("amount", { valueAsNumber: true })}
        />
        {errors.amount && (
          <p className="text-sm text-destructive">{errors.amount.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Input
          id="description"
          placeholder="Ej: Almuerzo en restaurante"
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>Categoría</Label>
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <CategoryCombobox
              categories={categories}
              value={field.value}
              onChange={field.onChange}
              clearLabel="Sin categoría"
            />
          )}
        />
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label>Fecha</Label>
        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value
                    ? format(field.value, "d 'de' MMMM 'de' yyyy", {
                        locale: es,
                      })
                    : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={(date) => {
                    field.onChange(date);
                    setCalendarOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          )}
        />
        {errors.date && (
          <p className="text-sm text-destructive">{errors.date.message}</p>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">
          Notas{" "}
          <span className="text-muted-foreground text-xs">(opcional)</span>
        </Label>
        <textarea
          id="notes"
          rows={2}
          placeholder="Notas adicionales..."
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          {...register("notes")}
        />
        {errors.notes && (
          <p className="text-sm text-destructive">{errors.notes.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting
          ? "Guardando..."
          : expense
          ? "Actualizar gasto"
          : "Crear gasto"}
      </Button>
    </form>
  );
}
