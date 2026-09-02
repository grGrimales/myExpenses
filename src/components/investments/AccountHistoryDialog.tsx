"use client";

import {
  deleteInvestmentMovementAction,
  deleteInvestmentValuationAction,
} from "@/actions/investments";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type InvestmentAccount } from "@/db/schema/investments";
import { useMoney } from "@/lib/currency-context";
import { utcDayToLocal } from "@/lib/investment-dates";
import { type TimelineEntry, type TimelineKind } from "@/types/investment";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowDown, ArrowUp, Minus, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import EditRecordDialog from "./EditRecordDialog";

/**
 * Cada tipo lleva su propia etiqueta y su signo. El signo es el que la cuenta
 * ve: un aporte y un interés suben el saldo aunque solo uno sea plata tuya, y
 * esa diferencia se lee en la columna de capital, no en el signo.
 */
const KIND_LABEL: Record<TimelineKind, { label: string; sign: "+" | "−" | "" }> =
  {
    valuation: { label: "Saldo confirmado", sign: "" },
    contribution: { label: "Aporte", sign: "+" },
    withdrawal: { label: "Retiro", sign: "−" },
    interest: { label: "Interés", sign: "+" },
    fee: { label: "Costo", sign: "−" },
  };

interface AccountHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: InvestmentAccount;
  entries: TimelineEntry[];
}

export default function AccountHistoryDialog({
  open,
  onOpenChange,
  account,
  entries,
}: AccountHistoryDialogProps) {
  const money = useMoney();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<TimelineEntry | undefined>();

  if (!account) return null;

  async function handleDelete(entry: TimelineEntry) {
    setDeletingId(entry.id);
    const result =
      entry.kind === "valuation"
        ? await deleteInvestmentValuationAction(entry.id)
        : await deleteInvestmentMovementAction(entry.id);

    if (result.success) {
      toast.success("Registro eliminado");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setDeletingId(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {account.institution} — {account.name}
          </DialogTitle>
          <DialogDescription>
            Todo lo registrado, de lo más reciente a lo más antiguo. La columna
            de ganancia dice cómo quedaba la cuenta después de cada línea.
          </DialogDescription>
        </DialogHeader>

        {entries.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Todavía no hay registros en esta cuenta.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead className="text-right">
                    Monto ({account.currency})
                  </TableHead>
                  <TableHead className="text-right">
                    Saldo ({account.currency})
                  </TableHead>
                  <TableHead className="text-right">Capital</TableHead>
                  <TableHead className="text-right">Ganancia</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, index) => {
                  const kind = KIND_LABEL[entry.kind];
                  // La comparación es contra la línea de abajo, que por el orden
                  // descendente es la anterior en el tiempo.
                  const previous = entries[index + 1];
                  const delta = previous
                    ? entry.gainAfter - previous.gainAfter
                    : entry.gainAfter;
                  const direction =
                    Math.abs(delta) < 0.005 ? "flat" : delta > 0 ? "up" : "down";

                  return (
                    <TableRow key={`${entry.kind}-${entry.id}`}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {format(utcDayToLocal(entry.date), "d MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{kind.label}</span>
                        {entry.notes && (
                          <p className="text-xs text-muted-foreground">
                            {entry.notes}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right tabular-nums">
                        {kind.sign}
                        {money.format(entry.amount, account!.currency)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right tabular-nums text-muted-foreground">
                        {money.format(entry.balanceAfter, account!.currency)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right tabular-nums text-muted-foreground">
                        {money.format(entry.investedAfter)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right tabular-nums">
                        {/* Icono además del color: la dirección no puede
                            depender solo de rojo contra verde. */}
                        <span
                          className={`flex items-center justify-end gap-1 ${
                            direction === "flat"
                              ? "text-muted-foreground"
                              : direction === "up"
                                ? "text-green-600"
                                : "text-destructive"
                          }`}
                        >
                          {direction === "up" ? (
                            <ArrowUp className="h-3.5 w-3.5" aria-label="subió" />
                          ) : direction === "down" ? (
                            <ArrowDown
                              className="h-3.5 w-3.5"
                              aria-label="bajó"
                            />
                          ) : (
                            <Minus
                              className="h-3.5 w-3.5"
                              aria-label="sin cambio"
                            />
                          )}
                          {entry.gainAfter >= 0 ? "+" : ""}
                          {money.format(entry.gainAfter)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Editar ${kind.label.toLowerCase()} del ${format(utcDayToLocal(entry.date), "d MMM yyyy", { locale: es })}`}
                            onClick={() => setEditing(entry)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Eliminar ${kind.label.toLowerCase()} del ${format(utcDayToLocal(entry.date), "d MMM yyyy", { locale: es })}`}
                            disabled={deletingId === entry.id}
                            onClick={() => handleDelete(entry)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <EditRecordDialog
          open={Boolean(editing)}
          onOpenChange={(isOpen) => !isOpen && setEditing(undefined)}
          account={account}
          entry={editing}
          onSuccess={() => setEditing(undefined)}
        />
      </DialogContent>
    </Dialog>
  );
}
