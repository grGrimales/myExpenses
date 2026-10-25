import { z } from "zod";

export const createInvestmentAccountSchema = z.object({
  institution: z
    .string()
    .min(2, "La institución debe tener al menos 2 caracteres")
    .max(60, "La institución no puede exceder los 60 caracteres"),
  kind: z.enum(["bank", "platform", "consortium"]),
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(60, "El nombre no puede exceder los 60 caracteres"),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/, "Usa el código de 3 letras de la moneda (ej: CLP, USD)"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "El color debe ser un código hex válido (ej: #ffffff)"),
});

export const updateInvestmentAccountSchema =
  createInvestmentAccountSchema.partial();

/**
 * El monto siempre es positivo: el signo lo pone el tipo de movimiento, no el
 * usuario. Un retiro de -100 y uno de 100 significarían lo mismo y no hay forma
 * de saber cuál quiso escribir.
 */
export const createInvestmentMovementSchema = z.object({
  accountId: z.string().uuid(),
  type: z.enum(["contribution", "withdrawal", "interest", "fee"]),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  fxRate: z.coerce
    .number()
    .positive("El tipo de cambio debe ser mayor a 0")
    .default(1),
  date: z.coerce.date(),
  notes: z.string().max(300).optional(),
});

/** El saldo sí puede ser 0: una cuenta vaciada sigue siendo un dato válido. */
export const createInvestmentValuationSchema = z.object({
  accountId: z.string().uuid(),
  balance: z.coerce.number().nonnegative("El saldo no puede ser negativo"),
  fxRate: z.coerce
    .number()
    .positive("El tipo de cambio debe ser mayor a 0")
    .default(1),
  date: z.coerce.date(),
});

/**
 * Editar un registro del historial. Lleva `previousKind` porque los saldos y
 * los movimientos viven en tablas distintas: si el tipo cruza esa frontera no
 * basta con un UPDATE, hay que mover la fila de una tabla a la otra, y para
 * saberlo hace falta conocer de dónde venía.
 */
export const updateInvestmentRecordSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid(),
  previousKind: z.enum([
    "valuation",
    "contribution",
    "withdrawal",
    "interest",
    "fee",
  ]),
  kind: z.enum([
    "valuation",
    "contribution",
    "withdrawal",
    "interest",
    "fee",
  ]),
  amount: z.coerce.number().nonnegative("El monto no puede ser negativo"),
  fxRate: z.coerce
    .number()
    .positive("El tipo de cambio debe ser mayor a 0")
    .default(1),
  date: z.coerce.date(),
  notes: z.string().max(300).optional(),
});

export type UpdateInvestmentRecordInput = z.infer<
  typeof updateInvestmentRecordSchema
>;

export type CreateInvestmentAccountInput = z.infer<
  typeof createInvestmentAccountSchema
>;
export type UpdateInvestmentAccountInput = z.infer<
  typeof updateInvestmentAccountSchema
>;
export type CreateInvestmentMovementInput = z.infer<
  typeof createInvestmentMovementSchema
>;
export type CreateInvestmentValuationInput = z.infer<
  typeof createInvestmentValuationSchema
>;
