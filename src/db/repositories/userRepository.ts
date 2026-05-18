import { db } from "..";
import { users, type NewUser, type User } from "../schema/users";
import { eq } from "drizzle-orm";

export const userRepository = {
  async findUserByEmail(email: string): Promise<User | undefined> {
    const [result] = await db.select().from(users).where(eq(users.email, email));
    return result;
  },

  async findUserById(id: string): Promise<User | undefined> {
    const [result] = await db.select().from(users).where(eq(users.id, id));
    return result;
  },

  async createUser(data: NewUser): Promise<User> {
    const [result] = await db.insert(users).values(data).returning();
    return result;
  },

  async updateUser(id: string, data: Partial<NewUser>): Promise<User | undefined> {
    const [result] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result;
  },
};
