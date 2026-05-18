"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Category } from "@/db/schema/categories";
import { useExpenseFilters } from "@/hooks/useExpenseFilters";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";

interface ExpenseFiltersProps {
  categories: Category[];
}

export default function ExpenseFilters({ categories }: ExpenseFiltersProps) {
  const { filters, setFilter, setSearchDebounced, clearFilters } =
    useExpenseFilters();

  const hasActiveFilters =
    filters.type || filters.categoryId || filters.search || filters.dateFrom || filters.dateTo;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Type filter */}
      <div className="flex rounded-md border text-sm">
        {(["", "expense", "income"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter("type", t || undefined)}
            className={cn(
              "px-3 py-1.5 transition-colors first:rounded-l-md last:rounded-r-md",
              (t === "" ? !filters.type : filters.type === t)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {t === "" ? "Todos" : t === "expense" ? "Gastos" : "Ingresos"}
          </button>
        ))}
      </div>

      {/* Category */}
      <Select
        value={filters.categoryId ?? "all"}
        onValueChange={(v) => setFilter("categoryId", v === "all" ? undefined : v)}
      >
        <SelectTrigger className="h-9 w-[160px]">
          <SelectValue placeholder="Categoría" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las categorías</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date from */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 font-normal">
            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
            {filters.dateFrom
              ? format(filters.dateFrom, "d MMM yyyy", { locale: es })
              : "Desde"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.dateFrom}
            onSelect={(d) => setFilter("dateFrom", d ?? undefined)}
          />
        </PopoverContent>
      </Popover>

      {/* Date to */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 font-normal">
            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
            {filters.dateTo
              ? format(filters.dateTo, "d MMM yyyy", { locale: es })
              : "Hasta"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.dateTo}
            onSelect={(d) => setFilter("dateTo", d ?? undefined)}
          />
        </PopoverContent>
      </Popover>

      {/* Search */}
      <Input
        placeholder="Buscar descripción..."
        defaultValue={filters.search ?? ""}
        onChange={(e) => setSearchDebounced(e.target.value)}
        className="h-9 w-[200px]"
      />

      {/* Clear */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-muted-foreground"
          onClick={clearFilters}
        >
          <X className="mr-1 h-3.5 w-3.5" />
          Limpiar
        </Button>
      )}
    </div>
  );
}
