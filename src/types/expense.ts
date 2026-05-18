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
