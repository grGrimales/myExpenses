"use client";

import { createCategoryAction, updateCategoryAction } from "@/actions/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type Category } from "@/db/schema/categories";
import { CATEGORY_ICONS, ICON_NAMES } from "@/lib/category-icons";
import { cn } from "@/lib/utils";
import { createCategorySchema } from "@/lib/validations/category";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tag } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const formSchema = createCategorySchema.omit({ isDefault: true });
type FormValues = z.infer<typeof formSchema>;

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#84cc16", "#22c55e", "#10b981", "#14b8a6",
  "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6",
  "#a855f7", "#ec4899", "#f43f5e", "#64748b",
];

interface CategoryFormProps {
  category?: Category;
  onSuccess?: () => void;
}

export default function CategoryForm({ category, onSuccess }: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: category?.name ?? "",
      color: category?.color ?? "#6366f1",
      icon: category?.icon ?? "tag",
    },
  });

  const selectedColor = watch("color");
  const selectedIcon = watch("icon");

  async function onSubmit(data: FormValues) {
    const result = category
      ? await updateCategoryAction(category.id, data)
      : await createCategoryAction({ ...data, isDefault: false });

    if (result.success) {
      toast.success(category ? "Categoría actualizada" : "Categoría creada");
      onSuccess?.();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" placeholder="Ej: Alimentación" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="grid grid-cols-8 gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={cn(
                "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                selectedColor === color
                  ? "border-foreground scale-110"
                  : "border-transparent"
              )}
              style={{ backgroundColor: color }}
              onClick={() => setValue("color", color, { shouldValidate: true })}
              aria-label={color}
            />
          ))}
        </div>
        {errors.color && (
          <p className="text-sm text-destructive">{errors.color.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Ícono</Label>
        <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto pr-1">
          {ICON_NAMES.map((name) => {
            const Icon = CATEGORY_ICONS[name] ?? Tag;
            return (
              <button
                key={name}
                type="button"
                className={cn(
                  "flex h-9 w-full items-center justify-center rounded-md border transition-colors",
                  selectedIcon === name
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input hover:bg-muted"
                )}
                onClick={() => setValue("icon", name, { shouldValidate: true })}
                aria-label={name}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
        {errors.icon && (
          <p className="text-sm text-destructive">{errors.icon.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting
          ? "Guardando..."
          : category
          ? "Actualizar categoría"
          : "Crear categoría"}
      </Button>
    </form>
  );
}
