import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      const { db } = await import("./db");
      const { users } = await import("./db/schema/users");
      const { eq } = await import("drizzle-orm");

      try {
        // Check if user exists
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email));

        if (!existingUser) {
          const [newUser] = await db
            .insert(users)
            .values({
              name: user.name || "User",
              email: user.email,
              image: user.image,
            })
            .returning();

          const { seedDefaultCategoriesAction } = await import(
            "./actions/seed"
          );
          await seedDefaultCategoriesAction(newUser.id);
        }

        return true;
      } catch (error) {
        console.error("Error during sign in callback:", error);
        return false;
      }
    },
    async session({ session, token }) {
      if (session.user && session.user.email) {
        const { db } = await import("./db");
        const { users } = await import("./db/schema/users");
        const { eq } = await import("drizzle-orm");

        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, session.user.email));

        if (dbUser) {
          session.user.id = dbUser.id;
        }
      }
      return session;
    },
  },
});
