"use client";

import { deleteInvestmentAccountAction } from "@/actions/investments";
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  type AccountSnapshot,
  type PortfolioPoint,
  type PortfolioTotals,
  type TimelineEntry,
} from "@/types/investment";
import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertTriangle,
  History,
  Pencil,
  Plus,
  TrendingDown,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import AccountDialog from "./AccountDialog";
import AccountHistoryDialog from "./AccountHistoryDialog";
import PortfolioChart from "./PortfolioChart";
import RecordDialog from "./RecordDialog";

interface InvestmentsClientProps {
  snapshots: AccountSnapshot[];
  totals: PortfolioTotals;
  series: PortfolioPoint[];
  /** Historial ya calculado por cuenta, indexado por id de cuenta. */
  timelines: Record<string, TimelineEntry[]>;
}

/** Pasado un mes sin confirmar el saldo, la ganancia mostrada ya es una foto vieja. */
const STALE_AFTER_DAYS = 35;

function formatPct(value: number | null): string {
  if (value === null) return "—";
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
}

export default function InvestmentsClient({
  snapshots,
  totals,
  series,
  timelines,
}: InvestmentsClientProps) {
  const money = useMoney();
  const router = useRouter();
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InvestmentAccount | undefined>();
  const [deleting, setDeleting] = useState<InvestmentAccount | undefined>();
  const [historyOf, setHistoryOf] = useState<InvestmentAccount | undefined>();

  const accounts = snapshots.map((s) => s.account);
  const gainIsPositive = totals.gain >= 0;

  const stale = snapshots.filter(
    (s) =>
      s.lastValuationAt === null ||
      differenceInDays(new Date(), s.lastValuationAt) > STALE_AFTER_DAYS
  );

  function refresh() {
    setAccountDialogOpen(false);
    setRecordDialogOpen(false);
    setEditing(undefined);
    router.refresh();
  }

  async function handleDelete() {
    if (!deleting) return;
    const result = await deleteInvestmentAccountAction(deleting.id);
    if (result.success) {
      toast.success("Cuenta eliminada");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setDeleting(undefined);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inversiones</h1>
          <p className="text-muted-foreground">
            {accounts.length === 0
              ? "Aún no tienes cuentas de inversión"
              : `${accounts.length} cuenta${accounts.length !== 1 ? "s" : ""} · totales en ${money.currency}`}
          </p>
        </div>
        <div className="flex gap-2">
          {accounts.length > 0 && (
            <Button variant="outline" onClick={() => setRecordDialogOpen(true)}>
              Registrar
            </Button>
          )}
          <Button
            onClick={() => {
              setEditing(undefined);
              setAccountDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva cuenta
          </Button>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <p className="text-muted-foreground">
            Crea una cuenta por cada producto donde tengas plata invertida.
          </p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Después registra el saldo que te muestra cada institución y los
            aportes que hagas: la ganancia se calcula sola.
          </p>
          <Button
            variant="link"
            onClick={() => {
              setEditing(undefined);
              setAccountDialogOpen(true);
            }}
          >
            Crear la primera cuenta
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Capital puesto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {money.format(totals.invested)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Aportes menos retiros, al cambio de cada día
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Valor actual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {money.format(totals.currentValue)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Último saldo confirmado más lo posterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ganancia
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* El signo va con icono y etiqueta, no solo con el color. */}
                <p
                  className={`flex items-center gap-1.5 text-2xl font-semibold ${
                    gainIsPositive ? "text-green-600" : "text-destructive"
                  }`}
                >
                  {gainIsPositive ? (
                    <TrendingUp className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="h-5 w-5" aria-hidden="true" />
                  )}
                  {gainIsPositive ? "+" : ""}
                  {money.format(totals.gain)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatPct(totals.returnPct)} sobre el capital puesto
                </p>
              </CardContent>
            </Card>
          </div>

          {stale.length > 0 && (
            <div className="flex items-start gap-2.5 rounded-lg border border-dashed px-3 py-2.5 text-sm text-muted-foreground">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <p>
                <span className="font-medium text-foreground">
                  Saldo sin confirmar
                </span>{" "}
                en {stale.map((s) => s.account.name).join(", ")}. La ganancia de
                {stale.length === 1 ? " esa cuenta" : " esas cuentas"} se está
                estimando con datos viejos.
              </p>
            </div>
          )}

          {series.length >= 2 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  Capital contra valor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PortfolioChart series={series} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Cuentas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    {/* Las tres últimas columnas van convertidas a la moneda del
                        usuario y el saldo va en la de su cuenta: sin decirlo en
                        la cabecera, ver 598,56 al lado de 3.082,58 parece un
                        error de cálculo en vez de dos monedas. */}
                    <TableRow>
                      <TableHead>Cuenta</TableHead>
                      <TableHead className="text-right">
                        Saldo
                        <span className="block text-xs font-normal text-muted-foreground">
                          moneda de la cuenta
                        </span>
                      </TableHead>
                      <TableHead className="text-right">
                        Capital
                        <span className="block text-xs font-normal text-muted-foreground">
                          {money.currency}
                        </span>
                      </TableHead>
                      <TableHead className="text-right">
                        Valor
                        <span className="block text-xs font-normal text-muted-foreground">
                          {money.currency}
                        </span>
                      </TableHead>
                      <TableHead className="text-right">
                        Ganancia
                        <span className="block text-xs font-normal text-muted-foreground">
                          {money.currency}
                        </span>
                      </TableHead>
                      <TableHead className="text-right">Último saldo</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snapshots.map((s) => (
                      <TableRow key={s.account.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-sm"
                              style={{ backgroundColor: s.account.color }}
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {s.account.name}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {s.account.institution} · {s.account.currency}
                                {s.account.currency !== money.currency &&
                                  ` · 1 ${s.account.currency} = ${s.fxRate} ${money.currency}`}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {money.format(s.balance, s.account.currency)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {money.format(s.invested)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {money.format(s.currentValue)}
                        </TableCell>
                        <TableCell
                          className={`text-right tabular-nums ${
                            s.gain >= 0 ? "text-green-600" : "text-destructive"
                          }`}
                        >
                          {s.gain >= 0 ? "+" : ""}
                          {money.format(s.gain)}
                          <span className="ml-1 text-xs text-muted-foreground">
                            {formatPct(s.returnPct)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {s.lastValuationAt
                            ? format(
                                utcDayToLocal(s.lastValuationAt),
                                "d MMM yyyy",
                                { locale: es }
                              )
                            : "Sin registrar"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Ver historial de ${s.account.name}`}
                              onClick={() => setHistoryOf(s.account)}
                            >
                              <History className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Editar ${s.account.name}`}
                              onClick={() => {
                                setEditing(s.account);
                                setAccountDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Eliminar ${s.account.name}`}
                              onClick={() => setDeleting(s.account)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <AccountDialog
        open={accountDialogOpen}
        onOpenChange={(open) => {
          setAccountDialogOpen(open);
          if (!open) setEditing(undefined);
        }}
        account={editing}
        onSuccess={refresh}
      />

      <RecordDialog
        open={recordDialogOpen}
        onOpenChange={setRecordDialogOpen}
        accounts={accounts}
        onSuccess={refresh}
      />

      <AccountHistoryDialog
        open={Boolean(historyOf)}
        onOpenChange={(open) => !open && setHistoryOf(undefined)}
        account={historyOf}
        entries={historyOf ? (timelines[historyOf.id] ?? []) : []}
      />

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar la cuenta?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrarán también todos los movimientos y saldos registrados en
              {deleting ? ` ${deleting.name}` : " ella"}. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
