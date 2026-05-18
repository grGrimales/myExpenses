import { db } from "..";
import { categories, type NewCategory, type Category } from "../schema/categories";
import { eq, and } from "drizzle-orm";

export const categoryRepository = {
  async findCategoriesByUserId(userId: string): Promise<Category[]> {
    return db.select().from(categories).where(eq(categories.userId, userId));
  },

  async findCategoryById(id: string, userId: string): Promise<Category | undefined> {
    const [result] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));
    return result;
  },

  async createCategory(data: NewCategory): Promise<Category> {
    const [result] = await db.insert(categories).values(data).returning();
    return result;
  },

  async updateCategory(
    id: string,
    userId: string,
    data: Partial<NewCategory>
  ): Promise<Category | undefined> {
    const [result] = await db
      .update(categories)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();
    return result;
  },

  async deleteCategory(id: string, userId: string): Promise<Category | undefined> {
    const [result] = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();
    return result;
  },
};
