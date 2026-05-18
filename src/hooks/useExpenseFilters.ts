"use client";

import { type ExpenseFilters, type ExpenseType } from "@/types/expense";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef } from "react";

export function useExpenseFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filters: ExpenseFilters = useMemo(() => {
    const type = searchParams.get("type") as ExpenseType | null;
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const dateFromStr = searchParams.get("dateFrom");
    const dateToStr = searchParams.get("dateTo");

    return {
      type: type ?? undefined,
      categoryId: categoryId ?? undefined,
      search: search ?? undefined,
      dateFrom: dateFromStr ? new Date(dateFromStr) : undefined,
      dateTo: dateToStr ? new Date(dateToStr) : undefined,
    };
  }, [searchParams]);

  function setFilter(key: keyof ExpenseFilters, value: string | Date | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === undefined || value === null || value === "") {
      params.delete(key);
    } else if (value instanceof Date) {
      params.set(key, value.toISOString().split("T")[0]);
    } else {
      params.set(key, String(value));
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function setSearchDebounced(value: string) {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setFilter("search", value || undefined);
    }, 350);
  }

  function clearFilters() {
    router.push(pathname);
  }

  const page = parseInt(searchParams.get("page") ?? "1", 10);

  function goToPage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  }

  return { filters, setFilter, setSearchDebounced, clearFilters, page, goToPage };
}
