import { auth } from "@/auth";
import { categoryRepository, expenseRepository } from "@/db/repositories";
import { type ExpenseFilters } from "@/types/expense";
import { format, parseISO } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const dateFromStr = searchParams.get("dateFrom");
  const dateToStr = searchParams.get("dateTo");
  const type = searchParams.get("type");
  const categoryId = searchParams.get("categoryId");

  const filters: ExpenseFilters = {
    ...(dateFromStr && { dateFrom: parseISO(dateFromStr) }),
    ...(dateToStr && { dateTo: parseISO(dateToStr) }),
    ...(type && type !== "all" && {
      type: type as "expense" | "income",
    }),
    ...(categoryId && categoryId !== "all" && { categoryId }),
  };

  const [expenses, categories] = await Promise.all([
    expenseRepository.findExpensesByUserId(session.user.id, filters),
    categoryRepository.findCategoriesByUserId(session.user.id),
  ]);

  const headers = ["Fecha", "Descripción", "Categoría", "Tipo", "Monto"];

  const rows = expenses.map((e) => {
    const category = categories.find((c) => c.id === e.categoryId);
    return [
      format(e.date, "yyyy-MM-dd"),
      `"${(e.description ?? "").replace(/"/g, '""')}"`,
      `"${(category?.name ?? "Sin categoría").replace(/"/g, '""')}"`,
      e.type === "income" ? "Ingreso" : "Gasto",
      String(e.amount),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const filename = `gastos-${format(new Date(), "yyyy-MM-dd")}.csv`;

  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
