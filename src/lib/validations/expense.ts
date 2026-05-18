import { z } from "zod";

export const createExpenseSchema = z.object({
  type: z.enum(["expense", "income"]),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  description: z.string().min(1, "La descripción es requerida").max(200),
  notes: z.string().max(500).optional(),
  categoryId: z.string().uuid().optional(),
  date: z.coerce.date(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
