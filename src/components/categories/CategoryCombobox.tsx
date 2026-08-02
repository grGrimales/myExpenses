"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { type Category } from "@/db/schema/categories";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Tag } from "lucide-react";
import { useState } from "react";

interface CategoryComboboxProps {
  categories: Category[];
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  allowClear?: boolean;
  clearLabel?: string;
}

export default function CategoryCombobox({
  categories,
  value,
  onChange,
  placeholder = "Seleccionar categoría",
  allowClear = true,
  clearLabel = "Sin categoría",
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);

  const selected = categories.find((c) => c.id === value);
  const SelectedIcon = selected ? CATEGORY_ICONS[selected.icon] ?? Tag : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selected ? (
            <span className="flex min-w-0 items-center gap-2">
              {SelectedIcon && (
                <SelectedIcon
                  className="h-4 w-4 flex-shrink-0"
                  style={{ color: selected.color }}
                />
              )}
              <span className="truncate">{selected.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">
              {allowClear ? clearLabel : placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 flex-shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar categoría..." />
          <CommandList>
            <CommandEmpty>No se encontraron categorías.</CommandEmpty>
            <CommandGroup>
              {allowClear && (
                <CommandItem
                  value={clearLabel}
                  onSelect={() => {
                    onChange(undefined);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      !value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  {clearLabel}
                </CommandItem>
              )}
              {categories.map((category) => {
                const Icon = CATEGORY_ICONS[category.icon] ?? Tag;
                return (
                  <CommandItem
                    key={category.id}
                    value={category.name}
                    onSelect={() => {
                      onChange(category.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4",
                        value === category.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <Icon
                      className="h-4 w-4 flex-shrink-0"
                      style={{ color: category.color }}
                    />
                    <span className="truncate">{category.name}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
