"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Category } from "@/db/schema/categories";
import { DATE_PRESETS, type DatePreset } from "@/lib/date-range";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface InformesFiltersProps {
  currentPreset: DatePreset;
  dateFrom: Date;
  dateTo: Date;
  categories: Category[];
}

export default function InformesFilters({
  currentPreset,
  dateFrom,
  dateTo,
  categories,
}: InformesFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value !== null) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function selectPreset(preset: DatePreset) {
    if (preset !== "custom") {
      updateParams({ preset, dateFrom: null, dateTo: null });
    } else {
      updateParams({ preset });
    }
  }

  function handleExport() {
    const params = new URLSearchParams();
    params.set("dateFrom", format(dateFrom, "yyyy-MM-dd"));
    params.set("dateTo", format(dateTo, "yyyy-MM-dd"));
    const type = searchParams.get("type");
    const categoryId = searchParams.get("categoryId");
    if (type && type !== "all") params.set("type", type);
    if (categoryId && categoryId !== "all") params.set("categoryId", categoryId);
    window.open(`/api/export/expenses?${params.toString()}`, "_blank");
  }

  const currentType = searchParams.get("type") ?? "all";
  const currentCategoryId = searchParams.get("categoryId") ?? "all";

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Date presets */}
        <div className="space-y-1">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Período
          </p>
          {DATE_PRESETS.filter((p) => p.value !== "custom").map((preset) => (
            <button
              key={preset.value}
              onClick={() => selectPreset(preset.value)}
              className={cn(
                "w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted",
                currentPreset === preset.value &&
                  "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {preset.label}
            </button>
          ))}
          <button
            onClick={() => selectPreset("custom")}
            className={cn(
              "w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted",
              currentPreset === "custom" &&
                "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            Personalizado
          </button>
        </div>

        {currentPreset === "custom" && (
          <div className="space-y-3 border-t pt-3">
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Desde</p>
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={(d) =>
                  d &&
                  updateParams({
                    preset: "custom",
                    dateFrom: format(d, "yyyy-MM-dd"),
                  })
                }
                captionLayout="label"
                className="rounded-md border"
              />
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Hasta</p>
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={(d) =>
                  d &&
                  updateParams({
                    preset: "custom",
                    dateTo: format(d, "yyyy-MM-dd"),
                  })
                }
                captionLayout="label"
                className="rounded-md border"
              />
            </div>
          </div>
        )}

        {/* Type */}
        <div className="border-t pt-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Tipo</p>
          <Select
            value={currentType}
            onValueChange={(v) =>
              updateParams({ type: v === "all" ? null : v })
            }
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="expense">Gastos</SelectItem>
              <SelectItem value="income">Ingresos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Categoría</p>
          <Select
            value={currentCategoryId}
            onValueChange={(v) =>
              updateParams({ categoryId: v === "all" ? null : v })
            }
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Export */}
        <div className="border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
