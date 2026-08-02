"use server";

import { auth } from "@/auth";
import { expenseRepository } from "@/db/repositories";
import { revalidatePath } from "next/cache";
import {
  createExpenseSchema,
  updateExpenseSchema,
  type CreateExpenseInput,
  type UpdateExpenseInput,
} from "@/lib/validations/expense";
import { type ActionResult } from "@/lib/utils/errors";
import { type Expense } from "@/db/schema/expenses";
import {
  type ExpenseFilters,
  type PaginationParams,
  type ExpenseSummary,
  type CategoryExpense,
  type MonthlyTrend,
  type DailyExpense,
} from "@/types/expense";

export async function createExpenseAction(
  data: CreateExpenseInput
): Promise<ActionResult<Expense>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  const validated = createExpenseSchema.safeParse(data);
  if (!validated.success)
    return { success: false, error: validated.error.issues[0].message };

  try {
    const expense = await expenseRepository.createExpense({
      ...validated.data,
      amount: String(validated.data.amount),
      userId: session.user.id,
    });
    revalidatePath("/gastos");
    return { success: true, data: expense };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear gasto",
    };
  }
}

export async function updateExpenseAction(
  id: string,
  data: UpdateExpenseInput
): Promise<ActionResult<Expense>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  const validated = updateExpenseSchema.safeParse(data);
  if (!validated.success)
    return { success: false, error: validated.error.issues[0].message };

  try {
    const { amount, ...rest } = validated.data;
    const updateData = {
      ...rest,
      ...(amount !== undefined && { amount: String(amount) }),
    };
    const expense = await expenseRepository.updateExpense(
      id,
      session.user.id,
      updateData
    );
    if (!expense) return { success: false, error: "Gasto no encontrado" };
    revalidatePath("/gastos");
    return { success: true, data: expense };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar gasto",
    };
  }
}

export async function deleteExpenseAction(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  try {
    const expense = await expenseRepository.deleteExpense(id, session.user.id);
    if (!expense) return { success: false, error: "Gasto no encontrado" };
    revalidatePath("/gastos");
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al eliminar gasto",
    };
  }
}

export async function getExpensesAction(
  filters?: ExpenseFilters,
  pagination?: PaginationParams
): Promise<ActionResult<{ expenses: Expense[]; total: number }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  try {
    const userId = session.user.id;
    const [expensesList, allMatching] = await Promise.all([
      expenseRepository.findExpensesByUserId(userId, filters, pagination),
      pagination
        ? expenseRepository.findExpensesByUserId(userId, filters)
        : Promise.resolve(null),
    ]);

    const total = allMatching ? allMatching.length : expensesList.length;
    return { success: true, data: { expenses: expensesList, total } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al obtener gastos",
    };
  }
}

export async function getExpenseByIdAction(
  id: string
): Promise<ActionResult<Expense>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  try {
    const expense = await expenseRepository.findExpenseById(id, session.user.id);
    if (!expense) return { success: false, error: "Gasto no encontrado" };
    return { success: true, data: expense };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al obtener gasto",
    };
  }
}

export async function getExpenseSummaryAction(
  dateFrom: Date,
  dateTo: Date
): Promise<ActionResult<ExpenseSummary>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  try {
    const summary = await expenseRepository.getExpenseSummary(
      session.user.id,
      dateFrom,
      dateTo
    );
    return { success: true, data: summary };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al obtener resumen",
    };
  }
}

export async function getExpensesByCategoryAction(
  dateFrom: Date,
  dateTo: Date
): Promise<ActionResult<CategoryExpense[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  try {
    const rows = await expenseRepository.getExpensesByCategory(
      session.user.id,
      dateFrom,
      dateTo
    );
    const data: CategoryExpense[] = rows.map((row) => ({
      categoryId: row.categoryId ?? null,
      categoryName: row.categoryName ?? null,
      total: Number(row.total) || 0,
      count: Number(row.count) || 0,
    }));
    return { success: true, data };
  } catch (error) {
    console.error("Error al obtener gastos por categoría:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al obtener gastos por categoría",
    };
  }
}

export async function getDailyExpensesAction(
  dateFrom: Date,
  dateTo: Date
): Promise<ActionResult<DailyExpense[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  try {
    const data = await expenseRepository.getDailyExpenses(
      session.user.id,
      dateFrom,
      dateTo
    );
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al obtener gastos diarios",
    };
  }
}

export async function getMonthlyTrendAction(
  months: number
): Promise<ActionResult<MonthlyTrend[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  try {
    const rows = await expenseRepository.getMonthlyTrend(session.user.id, months);

    const trendMap = new Map<string, MonthlyTrend>();
    for (const row of rows) {
      if (!trendMap.has(row.month)) {
        trendMap.set(row.month, { month: row.month, income: 0, expense: 0 });
      }
      const entry = trendMap.get(row.month)!;
      if (row.type === "income") entry.income = Number(row.total) || 0;
      if (row.type === "expense") entry.expense = Number(row.total) || 0;
    }

    return { success: true, data: Array.from(trendMap.values()) };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al obtener tendencia mensual",
    };
  }
}
