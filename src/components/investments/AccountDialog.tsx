"use client";

import {
  createInvestmentAccountAction,
  updateInvestmentAccountAction,
} from "@/actions/investments";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type InvestmentAccount } from "@/db/schema/investments";
import { useMoney } from "@/lib/currency-context";
import { cn } from "@/lib/utils";
import { CURRENCIES } from "@/lib/utils/currency";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  institution: z
    .string()
    .min(2, "La institución debe tener al menos 2 caracteres")
    .max(60),
  kind: z.enum(["bank", "platform", "consortium"]),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(60),
  currency: z.string().regex(/^[A-Za-z]{3}$/, "Selecciona una moneda"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color hex inválido"),
});
type FormValues = z.infer<typeof formSchema>;

/**
 * Ocho tonos con separación verificada entre sí, para que dos cuentas vecinas
 * no se confundan en el gráfico ni con daltonismo.
 */
const ACCOUNT_COLORS = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#008300",
  "#4a3aa7",
  "#e34948",
];

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: InvestmentAccount;
  onSuccess?: () => void;
}

export default function AccountDialog({
  open,
  onOpenChange,
  account,
  onSuccess,
}: AccountDialogProps) {
  const money = useMoney();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      institution: "",
      kind: "bank",
      name: "",
      currency: money.currency,
      color: ACCOUNT_COLORS[0],
    },
  });

  /**
   * El diálogo se monta una sola vez y se queda montado, así que defaultValues
   * solo corre en el primer render: sin este reset, abrir "editar" mostraría lo
   * que hubiera quedado de la vez anterior y guardar escribiría esos datos
   * ajenos sobre la cuenta que sí elegiste.
   *
   * Las dependencias son valores sueltos y no el objeto account, porque el
   * padre lo recrea en cada render y resetear a media edición borraría lo que
   * estás escribiendo.
   */
  useEffect(() => {
    if (!open) return;
    reset({
      institution: account?.institution ?? "",
      kind: account?.kind ?? "bank",
      name: account?.name ?? "",
      currency: account?.currency ?? money.currency,
      color: account?.color ?? ACCOUNT_COLORS[0],
    });
  }, [
    open,
    account?.id,
    account?.institution,
    account?.kind,
    account?.name,
    account?.currency,
    account?.color,
    money.currency,
    reset,
  ]);

  async function onSubmit(data: FormValues) {
    const payload = { ...data, currency: data.currency.toUpperCase() };
    const result = account
      ? await updateInvestmentAccountAction(account.id, payload)
      : await createInvestmentAccountAction(payload);

    if (result.success) {
      toast.success(account ? "Cuenta actualizada" : "Cuenta creada");
      onSuccess?.();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {account ? "Editar cuenta" : "Nueva cuenta de inversión"}
          </DialogTitle>
          <DialogDescription>
            Un producto por cuenta: cada uno lleva su propio saldo, su moneda y
            su rentabilidad.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="institution">Institución</Label>
            <Input
              id="institution"
              placeholder="Ej: Banco Estado"
              {...register("institution")}
            />
            {errors.institution && (
              <p className="text-sm text-destructive">
                {errors.institution.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Producto</Label>
            <Input
              id="name"
              placeholder="Ej: Depósito a plazo"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Controller
                control={control}
                name="kind"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Banco</SelectItem>
                      <SelectItem value="platform">Plataforma</SelectItem>
                      <SelectItem value="consortium">Consorcio</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Moneda</Label>
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.code} — {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.currency && (
                <p className="text-sm text-destructive">
                  {errors.currency.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <Controller
              control={control}
              name="color"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {ACCOUNT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Color ${color}`}
                      onClick={() => field.onChange(color)}
                      className={cn(
                        "h-7 w-7 rounded-md transition-transform",
                        field.value === color &&
                          "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting
              ? "Guardando..."
              : account
                ? "Guardar cambios"
                : "Crear cuenta"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
