import {
  boolean,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * Un banco y una plataforma se consultan distinto; el tipo permite agruparlas.
 * Un consorcio no rinde: se paga en cuotas hasta recibir la carta de crédito, y
 * lo que no vuelve (adhesión, tasa de administración, seguro) se anota como
 * costo, así que su "ganancia" es lo que cuesta.
 */
export const investmentAccountKindEnum = pgEnum("investment_account_kind", [
  "bank",
  "platform",
  "consortium",
]);

/**
 * Una cuenta es un producto concreto donde hay plata invertida: no "Banco X"
 * sino "Banco X — depósito a plazo". Cada una tiene su moneda, porque los
 * totales solo se pueden sumar convirtiendo a la moneda base.
 */
export const investmentAccounts = pgTable(
  "investment_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    institution: text("institution").notNull(),
    kind: investmentAccountKindEnum("kind").notNull().default("bank"),
    name: text("name").notNull(),
    currency: text("currency").notNull().default("CLP"),
    color: text("color").notNull().default("#6366f1"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    userIdIdx: index("investment_accounts_user_id_idx").on(t.userId),
  })
);

export const investmentMovementTypeEnum = pgEnum("investment_movement_type", [
  "contribution",
  "withdrawal",
  "interest",
  "fee",
]);

/**
 * Lo que se mueve en la cuenta. `contribution` y `withdrawal` son plata tuya
 * entrando o saliendo y forman el capital invertido; `interest` y `fee` son lo
 * que la cuenta genera o cobra por su cuenta y NO cuentan como capital.
 *
 * `fxRate` es el cambio a la moneda base el día del movimiento: un aporte en
 * dólares cuesta los pesos de ese día, no los de hoy.
 */
export const investmentMovements = pgTable(
  "investment_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => investmentAccounts.id, { onDelete: "cascade" }),
    type: investmentMovementTypeEnum("type").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    fxRate: numeric("fx_rate", { precision: 18, scale: 6 })
      .notNull()
      .default("1"),
    date: timestamp("date").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    userDateIdx: index("investment_movements_user_date_idx").on(t.userId, t.date),
    accountDateIdx: index("investment_movements_account_date_idx").on(
      t.accountId,
      t.date
    ),
  })
);

/**
 * El saldo que la institución muestra en una fecha. Funciona como punto de
 * control: fija cuánto hay ese día y vuelve irrelevante todo lo anterior, así
 * que anotar intereses y anotar el saldo no se cuenta dos veces.
 *
 * Único por (cuenta, fecha): volver a registrar el mismo día corrige el valor
 * en vez de duplicarlo.
 */
export const investmentValuations = pgTable(
  "investment_valuations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => investmentAccounts.id, { onDelete: "cascade" }),
    balance: numeric("balance", { precision: 14, scale: 2 }).notNull(),
    fxRate: numeric("fx_rate", { precision: 18, scale: 6 })
      .notNull()
      .default("1"),
    date: timestamp("date").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    accountDateIdx: index("investment_valuations_account_date_idx").on(
      t.accountId,
      t.date
    ),
    accountDateUnique: unique("investment_valuations_account_date_key").on(
      t.accountId,
      t.date
    ),
  })
);

export type InvestmentAccount = typeof investmentAccounts.$inferSelect;
export type NewInvestmentAccount = typeof investmentAccounts.$inferInsert;
export type InvestmentMovement = typeof investmentMovements.$inferSelect;
export type NewInvestmentMovement = typeof investmentMovements.$inferInsert;
export type InvestmentValuation = typeof investmentValuations.$inferSelect;
export type NewInvestmentValuation = typeof investmentValuations.$inferInsert;
