import { db } from "..";
import { expenses, type NewExpense, type Expense } from "../schema/expenses";
import { categories } from "../schema/categories";
import { eq, and, gte, lte, ilike, desc, sql, sum, count } from "drizzle-orm";
import { type ExpenseFilters, type PaginationParams } from "@/types/expense";
import { endOfDay } from "date-fns";

export const expenseRepository = {
  async findExpensesByUserId(
    userId: string,
    filters?: ExpenseFilters,
    pagination?: PaginationParams
  ): Promise<Expense[]> {
    const conditions = [eq(expenses.userId, userId)];

    if (filters?.categoryId) {
      conditions.push(eq(expenses.categoryId, filters.categoryId));
    }
    if (filters?.type) {
      conditions.push(eq(expenses.type, filters.type));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(expenses.date, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(lte(expenses.date, endOfDay(filters.dateTo)));
    }
    if (filters?.search) {
      conditions.push(ilike(expenses.description, `%${filters.search}%`));
    }

    const finalQuery = db
      .select()
      .from(expenses)
      .where(and(...conditions))
      .orderBy(desc(expenses.date));

    if (pagination) {
      const offset = (pagination.page - 1) * pagination.pageSize;
      return finalQuery.limit(pagination.pageSize).offset(offset);
    }

    return finalQuery;
  },

  async findExpenseById(id: string, userId: string): Promise<Expense | undefined> {
    const [result] = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
    return result;
  },

  async createExpense(data: NewExpense): Promise<Expense> {
    const [result] = await db.insert(expenses).values(data).returning();
    return result;
  },

  async updateExpense(
    id: string,
    userId: string,
    data: Partial<NewExpense>
  ): Promise<Expense | undefined> {
    const [result] = await db
      .update(expenses)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .returning();
    return result;
  },

  async deleteExpense(id: string, userId: string): Promise<Expense | undefined> {
    const [result] = await db
      .delete(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .returning();
    return result;
  },

  async getExpenseSummary(userId: string, dateFrom: Date, dateTo: Date) {
    const result = await db
      .select({
        type: expenses.type,
        total: sum(expenses.amount),
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          gte(expenses.date, dateFrom),
          lte(expenses.date, dateTo)
        )
      )
      .groupBy(expenses.type);

    const summary = {
      income: 0,
      expense: 0,
      balance: 0,
    };

    result.forEach((row) => {
      if (row.type === "income") summary.income = Number(row.total) || 0;
      if (row.type === "expense") summary.expense = Number(row.total) || 0;
    });

    summary.balance = summary.income - summary.expense;
    return summary;
  },

  async getExpensesByCategory(userId: string, dateFrom: Date, dateTo: Date) {
    return db
      .select({
        categoryId: expenses.categoryId,
        categoryName: categories.name,
        total: sum(expenses.amount),
        count: count(expenses.id),
      })
      .from(expenses)
      .leftJoin(categories, eq(expenses.categoryId, categories.id))
      .where(
        and(
          eq(expenses.userId, userId),
          eq(expenses.type, "expense"),
          gte(expenses.date, dateFrom),
          lte(expenses.date, dateTo)
        )
      )
      .groupBy(expenses.categoryId, categories.name)
      .orderBy(desc(sum(expenses.amount)));
  },

  async getMonthlyTrend(userId: string, months: number = 6) {
    const monthExpr = sql<string>`to_char(${expenses.date}, 'YYYY-MM')`;
    return db
      .select({
        month: monthExpr,
        type: expenses.type,
        total: sum(expenses.amount),
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          gte(expenses.date, sql`now() - interval '${sql.raw(months.toString())} months'`)
        )
      )
      .groupBy(monthExpr, expenses.type)
      .orderBy(monthExpr);
  },

  async getDailyExpenses(
    userId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<{ date: string; total: number }[]> {
    const result = await db
      .select({
        date: sql<string>`to_char(${expenses.date}, 'YYYY-MM-DD')`,
        total: sql<string>`COALESCE(SUM(${expenses.amount}::numeric), 0)`,
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          eq(expenses.type, "expense"),
          gte(expenses.date, dateFrom),
          lte(expenses.date, dateTo)
        )
      )
      .groupBy(sql`to_char(${expenses.date}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${expenses.date}, 'YYYY-MM-DD')`);
    return result.map((r) => ({ date: r.date, total: Number(r.total) || 0 }));
  },
};
