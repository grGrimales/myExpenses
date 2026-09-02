import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      /** Moneda en la que el usuario quiere leer todos los montos. */
      currency: string;
    } & DefaultSession["user"];
  }
}
