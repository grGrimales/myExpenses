import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(50, "El nombre no puede exceder los 50 caracteres"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "El color debe ser un código hex válido (ej: #ffffff)"),
  icon: z.string().min(1, "El icono es requerido"),
  isDefault: z.boolean().default(false),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
