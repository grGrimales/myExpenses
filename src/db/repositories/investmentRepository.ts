import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { db } from "..";
import {
  investmentAccounts,
  investmentMovements,
  investmentValuations,
  type InvestmentAccount,
  type InvestmentMovement,
  type InvestmentValuation,
  type NewInvestmentAccount,
  type NewInvestmentMovement,
  type NewInvestmentValuation,
} from "../schema/investments";
import { type AccountLedger } from "@/types/investment";

/**
 * Toda consulta filtra por userId, incluidas las de movimientos y valuaciones:
 * conocer un id ajeno no alcanza para leerlo ni para borrarlo. Las escrituras
 * que apuntan a una cuenta comprueban antes que la cuenta sea del usuario.
 */
export const investmentRepository = {
  async findAccountsByUserId(userId: string): Promise<InvestmentAccount[]> {
    return db
      .select()
      .from(investmentAccounts)
      .where(eq(investmentAccounts.userId, userId))
      .orderBy(investmentAccounts.institution, investmentAccounts.name);
  },

  async findAccountById(
    id: string,
    userId: string
  ): Promise<InvestmentAccount | undefined> {
    const [account] = await db
      .select()
      .from(investmentAccounts)
      .where(
        and(eq(investmentAccounts.id, id), eq(investmentAccounts.userId, userId))
      )
      .limit(1);
    return account;
  },

  async createAccount(data: NewInvestmentAccount): Promise<InvestmentAccount> {
    const [account] = await db.insert(investmentAccounts).values(data).returning();
    return account;
  },

  async updateAccount(
    id: string,
    userId: string,
    data: Partial<NewInvestmentAccount>
  ): Promise<InvestmentAccount | undefined> {
    const [account] = await db
      .update(investmentAccounts)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(eq(investmentAccounts.id, id), eq(investmentAccounts.userId, userId))
      )
      .returning();
    return account;
  },

  async deleteAccount(
    id: string,
    userId: string
  ): Promise<InvestmentAccount | undefined> {
    const [account] = await db
      .delete(investmentAccounts)
      .where(
        and(eq(investmentAccounts.id, id), eq(investmentAccounts.userId, userId))
      )
      .returning();
    return account;
  },

  /**
   * Cuentas del usuario con todos sus registros. Se trae completo a propósito:
   * el cálculo necesita el historial entero para reconstruir el capital, y el
   * volumen de una cartera personal es de cientos de filas, no de millones.
   */
  async findLedgersByUserId(userId: string): Promise<AccountLedger[]> {
    const accounts = await this.findAccountsByUserId(userId);
    if (accounts.length === 0) return [];

    const accountIds = accounts.map((a) => a.id);

    const [movements, valuations] = await Promise.all([
      db
        .select()
        .from(investmentMovements)
        .where(
          and(
            eq(investmentMovements.userId, userId),
            inArray(investmentMovements.accountId, accountIds)
          )
        )
        .orderBy(investmentMovements.date),
      db
        .select()
        .from(investmentValuations)
        .where(
          and(
            eq(investmentValuations.userId, userId),
            inArray(investmentValuations.accountId, accountIds)
          )
        )
        .orderBy(investmentValuations.date),
    ]);

    return accounts.map((account) => ({
      account,
      movements: movements.filter((m) => m.accountId === account.id),
      valuations: valuations.filter((v) => v.accountId === account.id),
    }));
  },

  async findRecentMovements(
    userId: string,
    limit: number = 20
  ): Promise<InvestmentMovement[]> {
    return db
      .select()
      .from(investmentMovements)
      .where(eq(investmentMovements.userId, userId))
      .orderBy(desc(investmentMovements.date))
      .limit(limit);
  },

  async createMovement(
    data: NewInvestmentMovement
  ): Promise<InvestmentMovement> {
    const [movement] = await db
      .insert(investmentMovements)
      .values(data)
      .returning();
    return movement;
  },

  async findMovementById(
    id: string,
    userId: string
  ): Promise<InvestmentMovement | undefined> {
    const [movement] = await db
      .select()
      .from(investmentMovements)
      .where(
        and(
          eq(investmentMovements.id, id),
          eq(investmentMovements.userId, userId)
        )
      )
      .limit(1);
    return movement;
  },

  async updateMovement(
    id: string,
    userId: string,
    data: Partial<NewInvestmentMovement>
  ): Promise<InvestmentMovement | undefined> {
    const [movement] = await db
      .update(investmentMovements)
      .set(data)
      .where(
        and(
          eq(investmentMovements.id, id),
          eq(investmentMovements.userId, userId)
        )
      )
      .returning();
    return movement;
  },

  async deleteMovement(
    id: string,
    userId: string
  ): Promise<InvestmentMovement | undefined> {
    const [movement] = await db
      .delete(investmentMovements)
      .where(
        and(
          eq(investmentMovements.id, id),
          eq(investmentMovements.userId, userId)
        )
      )
      .returning();
    return movement;
  },

  /**
   * Registrar el saldo del mismo día dos veces corrige el valor en vez de
   * duplicarlo: es la corrección de un dato, no un hecho nuevo.
   */
  async upsertValuation(
    data: NewInvestmentValuation
  ): Promise<InvestmentValuation> {
    const [valuation] = await db
      .insert(investmentValuations)
      .values(data)
      .onConflictDoUpdate({
        target: [investmentValuations.accountId, investmentValuations.date],
        set: { balance: data.balance, fxRate: data.fxRate },
      })
      .returning();
    return valuation;
  },

  async findValuationById(
    id: string,
    userId: string
  ): Promise<InvestmentValuation | undefined> {
    const [valuation] = await db
      .select()
      .from(investmentValuations)
      .where(
        and(
          eq(investmentValuations.id, id),
          eq(investmentValuations.userId, userId)
        )
      )
      .limit(1);
    return valuation;
  },

  /**
   * Un saldo distinto del que se está editando, en esa cuenta y esa fecha.
   * `excludeId` se omite cuando todavía no existe la fila con la que comparar.
   *
   * Pide userId aunque quien la llama ya haya comprobado la cuenta: es el único
   * método del repositorio que buscaba por accountId a secas, y dejarlo así era
   * confiar en que ningún futuro llamador olvide la comprobación.
   */
  async findValuationConflict(
    accountId: string,
    userId: string,
    date: Date,
    excludeId?: string
  ): Promise<InvestmentValuation | undefined> {
    const [valuation] = await db
      .select()
      .from(investmentValuations)
      .where(
        and(
          eq(investmentValuations.userId, userId),
          eq(investmentValuations.accountId, accountId),
          eq(investmentValuations.date, date),
          excludeId ? ne(investmentValuations.id, excludeId) : undefined
        )
      )
      .limit(1);
    return valuation;
  },

  async updateValuation(
    id: string,
    userId: string,
    data: Partial<NewInvestmentValuation>
  ): Promise<InvestmentValuation | undefined> {
    const [valuation] = await db
      .update(investmentValuations)
      .set(data)
      .where(
        and(
          eq(investmentValuations.id, id),
          eq(investmentValuations.userId, userId)
        )
      )
      .returning();
    return valuation;
  },

  async deleteValuation(
    id: string,
    userId: string
  ): Promise<InvestmentValuation | undefined> {
    const [valuation] = await db
      .delete(investmentValuations)
      .where(
        and(
          eq(investmentValuations.id, id),
          eq(investmentValuations.userId, userId)
        )
      )
      .returning();
    return valuation;
  },
};
