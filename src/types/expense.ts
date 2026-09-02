export type ExpenseType = "expense" | "income";

export interface ExpenseFilters {
  categoryId?: string;
  type?: ExpenseType;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface ExpenseSummary {
  income: number;
  expense: number;
  balance: number;
}

export interface CategoryExpense {
  categoryId: string | null;
  categoryName: string | null;
  total: number;
  count: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
}

/**
 * Un día desglosado por categoría: hay una fila por cada par (día, categoría)
 * con gasto. El total del día es la suma de sus filas. Los gastos sin
 * categoría llegan con categoryId nulo y un nombre/color de reserva.
 */
export interface DailyCategoryExpense {
  date: string;
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
  total: number;
}
