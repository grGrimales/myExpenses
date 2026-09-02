"use server";

import { auth } from "@/auth";
import { investmentRepository } from "@/db/repositories";
import {
  type InvestmentAccount,
  type InvestmentMovement,
  type InvestmentValuation,
} from "@/db/schema/investments";
import { toUtcDay } from "@/lib/investment-dates";
import { type ActionResult } from "@/lib/utils/errors";
import {
  createInvestmentAccountSchema,
  createInvestmentMovementSchema,
  createInvestmentValuationSchema,
  updateInvestmentAccountSchema,
  updateInvestmentRecordSchema,
  type CreateInvestmentAccountInput,
  type CreateInvestmentMovementInput,
  type CreateInvestmentValuationInput,
  type UpdateInvestmentAccountInput,
  type UpdateInvestmentRecordInput,
} from "@/lib/validations/investment";
import { type AccountLedger } from "@/types/investment";
import { revalidatePath } from "next/cache";

/**
 * Un accountId llega desde el cliente, así que antes de escribir contra él hay
 * que comprobar que la cuenta sea de quien la manda: sin esto, adivinar un uuid
 * bastaría para inyectar movimientos en la cartera de otro.
 */
async function ownsAccount(
  accountId: string,
  userId: string
): Promise<boolean> {
  const account = await investmentRepository.findAccountById(accountId, userId);
  return Boolean(account);
}

export async function getInvestmentAccountsAction(): Promise<
  ActionResult<InvestmentAccount[]>
> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  try {
    const accounts = await investmentRepository.findAccountsByUserId(
      session.user.id
    );
    return { success: true, data: accounts };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al obtener las cuentas",
    };
  }
}

export async function getInvestmentLedgersAction(): Promise<
  ActionResult<AccountLedger[]>
> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  try {
    const ledgers = await investmentRepository.findLedgersByUserId(
      session.user.id
    );
    return { success: true, data: ledgers };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al obtener las inversiones",
    };
  }
}

export async function createInvestmentAccountAction(
  data: CreateInvestmentAccountInput
): Promise<ActionResult<InvestmentAccount>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  const validated = createInvestmentAccountSchema.safeParse(data);
  if (!validated.success)
    return { success: false, error: validated.error.issues[0].message };

  try {
    const account = await investmentRepository.createAccount({
      ...validated.data,
      userId: session.user.id,
    });
    revalidatePath("/inversiones");
    return { success: true, data: account };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear la cuenta",
    };
  }
}

export async function updateInvestmentAccountAction(
  id: string,
  data: UpdateInvestmentAccountInput
): Promise<ActionResult<InvestmentAccount>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  const validated = updateInvestmentAccountSchema.safeParse(data);
  if (!validated.success)
    return { success: false, error: validated.error.issues[0].message };

  try {
    const account = await investmentRepository.updateAccount(
      id,
      session.user.id,
      validated.data
    );
    if (!account) return { success: false, error: "Cuenta no encontrada" };
    revalidatePath("/inversiones");
    return { success: true, data: account };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al actualizar la cuenta",
    };
  }
}

export async function deleteInvestmentAccountAction(
  id: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  try {
    const account = await investmentRepository.deleteAccount(
      id,
      session.user.id
    );
    if (!account) return { success: false, error: "Cuenta no encontrada" };
    revalidatePath("/inversiones");
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al eliminar la cuenta",
    };
  }
}

export async function createInvestmentMovementAction(
  data: CreateInvestmentMovementInput
): Promise<ActionResult<InvestmentMovement>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  const validated = createInvestmentMovementSchema.safeParse(data);
  if (!validated.success)
    return { success: false, error: validated.error.issues[0].message };

  if (!(await ownsAccount(validated.data.accountId, session.user.id)))
    return { success: false, error: "Cuenta no encontrada" };

  try {
    const movement = await investmentRepository.createMovement({
      userId: session.user.id,
      accountId: validated.data.accountId,
      type: validated.data.type,
      amount: validated.data.amount.toFixed(2),
      fxRate: validated.data.fxRate.toString(),
      date: toUtcDay(validated.data.date),
      notes: validated.data.notes,
    });
    revalidatePath("/inversiones");
    return { success: true, data: movement };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al registrar el movimiento",
    };
  }
}

export async function deleteInvestmentMovementAction(
  id: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  try {
    const movement = await investmentRepository.deleteMovement(
      id,
      session.user.id
    );
    if (!movement) return { success: false, error: "Movimiento no encontrado" };
    revalidatePath("/inversiones");
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al eliminar el movimiento",
    };
  }
}

export async function upsertInvestmentValuationAction(
  data: CreateInvestmentValuationInput
): Promise<ActionResult<InvestmentValuation>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  const validated = createInvestmentValuationSchema.safeParse(data);
  if (!validated.success)
    return { success: false, error: validated.error.issues[0].message };

  if (!(await ownsAccount(validated.data.accountId, session.user.id)))
    return { success: false, error: "Cuenta no encontrada" };

  try {
    const valuation = await investmentRepository.upsertValuation({
      userId: session.user.id,
      accountId: validated.data.accountId,
      balance: validated.data.balance.toFixed(2),
      fxRate: validated.data.fxRate.toString(),
      date: toUtcDay(validated.data.date),
    });
    revalidatePath("/inversiones");
    return { success: true, data: valuation };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al registrar el saldo",
    };
  }
}

/**
 * Corrige un registro ya guardado.
 *
 * Un saldo y un movimiento son filas de tablas distintas, así que cambiar el
 * tipo de uno al otro no es un UPDATE: se borra la fila vieja y se crea la
 * nueva. Se hace en ese orden —borrar y luego crear— para que un saldo que
 * cambia de fecha no choque contra sí mismo en la restricción de cuenta+fecha.
 */
export async function updateInvestmentRecordAction(
  data: UpdateInvestmentRecordInput
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  const validated = updateInvestmentRecordSchema.safeParse(data);
  if (!validated.success)
    return { success: false, error: validated.error.issues[0].message };

  const { id, accountId, previousKind, kind, amount, fxRate, notes } =
    validated.data;
  const date = toUtcDay(validated.data.date);
  const userId = session.user.id;

  if (!(await ownsAccount(accountId, userId)))
    return { success: false, error: "Cuenta no encontrada" };

  // El id del registro también llega del cliente: comprobar la cuenta no basta,
  // hay que confirmar que esta fila concreta sea del usuario.
  const existing =
    previousKind === "valuation"
      ? await investmentRepository.findValuationById(id, userId)
      : await investmentRepository.findMovementById(id, userId);
  if (!existing) return { success: false, error: "Registro no encontrado" };
  if (existing.accountId !== accountId)
    return { success: false, error: "El registro no es de esa cuenta" };

  if (kind !== "valuation" && amount <= 0)
    return { success: false, error: "El monto debe ser mayor a 0" };

  const wasValuation = previousKind === "valuation";

  try {
    if (kind === "valuation") {
      // Al editar un saldo se excluye él mismo de la comprobación; al convertir
      // un movimiento en saldo no hay nada que excluir todavía.
      const clash = await investmentRepository.findValuationConflict(
        accountId,
        userId,
        date,
        wasValuation ? id : undefined
      );
      if (clash)
        return {
          success: false,
          error: "Ya hay un saldo registrado en esa cuenta y esa fecha",
        };

      if (wasValuation) {
        await investmentRepository.updateValuation(id, userId, {
          balance: amount.toFixed(2),
          fxRate: fxRate.toString(),
          date,
        });
      } else {
        await investmentRepository.deleteMovement(id, userId);
        await investmentRepository.upsertValuation({
          userId,
          accountId,
          balance: amount.toFixed(2),
          fxRate: fxRate.toString(),
          date,
        });
      }
    } else if (wasValuation) {
      await investmentRepository.deleteValuation(id, userId);
      await investmentRepository.createMovement({
        userId,
        accountId,
        type: kind,
        amount: amount.toFixed(2),
        fxRate: fxRate.toString(),
        date,
        notes,
      });
    } else {
      await investmentRepository.updateMovement(id, userId, {
        type: kind,
        amount: amount.toFixed(2),
        fxRate: fxRate.toString(),
        date,
        notes: notes ?? null,
      });
    }

    revalidatePath("/inversiones");
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al actualizar el registro",
    };
  }
}

export async function deleteInvestmentValuationAction(
  id: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  try {
    const valuation = await investmentRepository.deleteValuation(
      id,
      session.user.id
    );
    if (!valuation) return { success: false, error: "Saldo no encontrado" };
    revalidatePath("/inversiones");
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al eliminar el saldo",
    };
  }
}
