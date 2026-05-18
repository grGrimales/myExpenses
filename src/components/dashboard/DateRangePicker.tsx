"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DATE_PRESETS,
  type DatePreset,
  getDateRangeForPreset,
} from "@/lib/date-range";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface DateRangePickerProps {
  currentPreset: DatePreset;
  dateFrom: Date;
  dateTo: Date;
}

export default function DateRangePicker({
  currentPreset,
  dateFrom,
  dateTo,
}: DateRangePickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState<Date | undefined>(
    currentPreset === "custom" ? dateFrom : undefined
  );
  const [customTo, setCustomTo] = useState<Date | undefined>(
    currentPreset === "custom" ? dateTo : undefined
  );

  function selectPreset(preset: DatePreset) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("preset", preset);
    if (preset !== "custom") {
      params.delete("dateFrom");
      params.delete("dateTo");
      setOpen(false);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function applyCustom() {
    if (!customFrom || !customTo) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("preset", "custom");
    params.set("dateFrom", format(customFrom, "yyyy-MM-dd"));
    params.set("dateTo", format(customTo, "yyyy-MM-dd"));
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  const label =
    currentPreset === "custom"
      ? `${format(dateFrom, "d MMM", { locale: es })} – ${format(dateTo, "d MMM yyyy", { locale: es })}`
      : DATE_PRESETS.find((p) => p.value === currentPreset)?.label ??
        "Seleccionar período";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <CalendarDays className="mr-2 h-4 w-4" />
          {label}
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="end">
        <div className="space-y-1">
          {DATE_PRESETS.filter((p) => p.value !== "custom").map((preset) => (
            <button
              key={preset.value}
              onClick={() => selectPreset(preset.value)}
              className={cn(
                "w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                currentPreset === preset.value &&
                  "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {preset.label}
            </button>
          ))}

          <div className="border-t my-1" />

          {/* Custom range */}
          <button
            onClick={() => selectPreset("custom")}
            className={cn(
              "w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
              currentPreset === "custom" &&
                "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            Personalizado
          </button>

          {currentPreset === "custom" && (
            <div className="pt-2 space-y-3 border-t mt-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1 px-1">Desde</p>
                  <Calendar
                    mode="single"
                    selected={customFrom}
                    onSelect={setCustomFrom}
                    captionLayout="label"
                    className="rounded-md border"
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1 px-1">Hasta</p>
                  <Calendar
                    mode="single"
                    selected={customTo}
                    onSelect={setCustomTo}
                    captionLayout="label"
                    className="rounded-md border"
                  />
                </div>
              </div>
              <Button
                size="sm"
                className="w-full"
                disabled={!customFrom || !customTo}
                onClick={applyCustom}
              >
                Aplicar
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
