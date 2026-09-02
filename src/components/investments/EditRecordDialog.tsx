"use client";

import { updateInvestmentRecordAction } from "@/actions/investments";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type InvestmentAccount } from "@/db/schema/investments";
import { useMoney } from "@/lib/currency-context";
import { localDayToUtc, utcDayToLocal } from "@/lib/investment-dates";
import { type TimelineEntry, type TimelineKind } from "@/types/investment";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const KIND_OPTIONS: Array<{ value: TimelineKind; label: string }> = [
  { value: "valuation", label: "Saldo actual" },
  { value: "contribution", label: "Aporte" },
  { value: "withdrawal", label: "Retiro" },
  { value: "interest", label: "Interés o ganancia" },
  { value: "fee", label: "Comisión o costo" },
];

const formSchema = z.object({
  kind: z.enum(["valuation", "contribution", "withdrawal", "interest", "fee"]),
  amount: z
    .number({ message: "Ingresa un monto válido" })
    .nonnegative("El monto no puede ser negativo"),
  fxRate: z
    .number({ message: "Ingresa un tipo de cambio válido" })
    .positive("El tipo de cambio debe ser mayor a 0"),
  date: z.date({ message: "Selecciona una fecha" }),
  notes: z.string().max(300).optional(),
});
type FormValues = z.infer<typeof formSchema>;

interface EditRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: InvestmentAccount;
  entry?: TimelineEntry;
  onSuccess?: () => void;
}

export default function EditRecordDialog({
  open,
  onOpenChange,
  account,
  entry,
  onSuccess,
}: EditRecordDialogProps) {
  const money = useMoney();
  const router = useRouter();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      kind: "valuation",
      amount: 0,
      fxRate: 1,
      date: new Date(),
      notes: "",
    },
  });

  // Mismo motivo que en los otros diálogos: este componente no se desmonta al
  // cerrarse, así que sin reset la segunda edición mostraría la primera.
  useEffect(() => {
    if (!open || !entry) return;
    reset({
      kind: entry.kind,
      amount: entry.amount,
      fxRate: entry.fxRate,
      date: utcDayToLocal(entry.date),
      notes: entry.notes ?? "",
    });
  }, [open, entry, reset]);

  const selectedKind = watch("kind");
  const needsFxRate = account.currency !== money.currency;

  async function onSubmit(data: FormValues) {
    if (!entry) return;

    if (data.kind !== "valuation" && data.amount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    const result = await updateInvestmentRecordAction({
      id: entry.id,
      accountId: account.id,
      previousKind: entry.kind,
      kind: data.kind,
      amount: data.amount,
      fxRate: needsFxRate ? data.fxRate : 1,
      date: localDayToUtc(data.date),
      notes: data.notes || undefined,
    });

    if (result.success) {
      toast.success("Registro actualizado");
      router.refresh();
      onSuccess?.();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar registro</DialogTitle>
          <DialogDescription>
            {account.institution} — {account.name}. Cambiar el tipo también está
            permitido: si te equivocaste de categoría, corrígela aquí.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Qué registra</Label>
            <Controller
              control={control}
              name="kind"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KIND_OPTIONS.map((k) => (
                      <SelectItem key={k.value} value={k.value}>
                        {k.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-amount">
              {selectedKind === "valuation" ? "Saldo" : "Monto"} (
              {account.currency})
            </Label>
            <Input
              id="edit-amount"
              type="number"
              step="0.01"
              min="0"
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {needsFxRate && (
            <div className="space-y-2">
              <Label htmlFor="edit-fxRate">
                ¿Cuánto valía 1 {account.currency} en {money.currency} ese día?
              </Label>
              <Input
                id="edit-fxRate"
                type="number"
                step="0.000001"
                min="0"
                {...register("fxRate", { valueAsNumber: true })}
              />
              {errors.fxRate && (
                <p className="text-sm text-destructive">
                  {errors.fxRate.message}
                </p>
              )}
            </div>
          )}

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

          {selectedKind !== "valuation" && (
            <div className="space-y-2">
              <Label htmlFor="edit-notes">
                Notas{" "}
                <span className="text-xs text-muted-foreground">(opcional)</span>
              </Label>
              <Input id="edit-notes" {...register("notes")} />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar cambios"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
