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

export interface DailyExpense {
  date: string;
  total: number;
}
