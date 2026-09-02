"use client";

import {
  createInvestmentMovementAction,
  upsertInvestmentValuationAction,
} from "@/actions/investments";
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
import { localDayToUtc } from "@/lib/investment-dates";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

/**
 * Registrar el saldo y registrar un interés son el mismo gesto para quien lleva
 * la cartera, así que comparten formulario. "balance" no es un movimiento: se
 * guarda como valuación y funciona como punto de control.
 */
const RECORD_KINDS = [
  {
    value: "balance",
    label: "Saldo actual",
    hint: "El número que muestra hoy el banco o la plataforma. Fija el valor de la cuenta a esa fecha.",
    amountLabel: "Saldo",
  },
  {
    value: "contribution",
    label: "Aporte",
    hint: "Plata tuya que entra. Suma al capital invertido, no cuenta como ganancia.",
    amountLabel: "Monto del aporte",
  },
  {
    value: "withdrawal",
    label: "Retiro",
    hint: "Plata que sacas de la cuenta. Descuenta del capital invertido.",
    amountLabel: "Monto del retiro",
  },
  {
    value: "interest",
    label: "Interés o ganancia",
    hint: "Lo que la cuenta generó sola. Puede ser diario o mensual; si ya registraste el saldo después de esta fecha, no se cuenta dos veces.",
    amountLabel: "Monto del interés",
  },
  {
    value: "fee",
    label: "Comisión o costo",
    hint: "Lo que la institución descuenta. Baja el saldo sin ser un retiro tuyo.",
    amountLabel: "Monto del costo",
  },
] as const;

const formSchema = z.object({
  accountId: z.string().uuid("Selecciona una cuenta"),
  kind: z.enum(["balance", "contribution", "withdrawal", "interest", "fee"]),
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

interface RecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: InvestmentAccount[];
  onSuccess?: () => void;
}

export default function RecordDialog({
  open,
  onOpenChange,
  accounts,
  onSuccess,
}: RecordDialogProps) {
  const money = useMoney();
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
      accountId: accounts[0]?.id,
      kind: "balance",
      amount: undefined as unknown as number,
      fxRate: 1,
      date: new Date(),
      notes: "",
    },
  });

  const firstAccountId = accounts[0]?.id;

  /**
   * Igual que el diálogo de cuentas: al quedarse montado, reabrirlo mostraría
   * el monto y la fecha del registro anterior, y bastaría con darle a Registrar
   * para duplicarlo sin querer. La dependencia es el id y no el arreglo, que el
   * padre recrea en cada render.
   */
  useEffect(() => {
    if (!open) return;
    reset({
      accountId: firstAccountId,
      kind: "balance",
      amount: undefined as unknown as number,
      fxRate: 1,
      date: new Date(),
      notes: "",
    });
  }, [open, firstAccountId, reset]);

  const selectedKind = watch("kind");
  const selectedAccountId = watch("accountId");

  const kind =
    RECORD_KINDS.find((k) => k.value === selectedKind) ?? RECORD_KINDS[0];
  const account = accounts.find((a) => a.id === selectedAccountId);
  // El tipo de cambio solo tiene sentido cuando la cuenta no está en la moneda
  // base; pedirlo siempre sería un campo que nunca cambia de 1.
  const needsFxRate = Boolean(account && account.currency !== money.currency);

  async function onSubmit(data: FormValues) {
    const fxRate = needsFxRate ? data.fxRate : 1;
    // Se manda el día, no el instante: si viajara la hora, un interés escrito
    // después del saldo del mismo día quedaría "posterior" y se sumaría encima.
    const date = localDayToUtc(data.date);

    const result =
      data.kind === "balance"
        ? await upsertInvestmentValuationAction({
            accountId: data.accountId,
            balance: data.amount,
            fxRate,
            date,
          })
        : await createInvestmentMovementAction({
            accountId: data.accountId,
            type: data.kind,
            amount: data.amount,
            fxRate,
            date,
            notes: data.notes || undefined,
          });

    if (result.success) {
      toast.success(
        data.kind === "balance" ? "Saldo registrado" : "Movimiento registrado"
      );
      onSuccess?.();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar</DialogTitle>
          <DialogDescription>
            Anota lo que pusiste, lo que sacaste o el saldo que te muestra la
            institución. La ganancia sale de la diferencia.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Cuenta</Label>
            <Controller
              control={control}
              name="accountId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.institution} — {a.name} ({a.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.accountId && (
              <p className="text-sm text-destructive">
                {errors.accountId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Qué registrar</Label>
            <Controller
              control={control}
              name="kind"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECORD_KINDS.map((k) => (
                      <SelectItem key={k.value} value={k.value}>
                        {k.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-muted-foreground">{kind.hint}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">
              {kind.amountLabel}
              {account ? ` (${account.currency})` : ""}
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {needsFxRate && (
            <div className="space-y-2">
              <Label htmlFor="fxRate">
                ¿Cuánto valía 1 {account!.currency} en {money.currency} ese día?
              </Label>
              <Input
                id="fxRate"
                type="number"
                step="0.000001"
                min="0"
                placeholder="0.00"
                {...register("fxRate", { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                Esta cuenta está en {account!.currency} y tus totales se muestran
                en {money.currency}. Se guarda el cambio de ese día y no el de
                hoy, así un aporte viejo sigue valiendo lo que de verdad costó.
              </p>
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

          {selectedKind !== "balance" && (
            <div className="space-y-2">
              <Label htmlFor="notes">
                Notas{" "}
                <span className="text-xs text-muted-foreground">(opcional)</span>
              </Label>
              <Input id="notes" placeholder="Ej: aporte mensual" {...register("notes")} />
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || accounts.length === 0}
          >
            {isSubmitting ? "Guardando..." : "Registrar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
