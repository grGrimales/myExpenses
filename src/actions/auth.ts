"use server";

import { signIn as authSignIn, signOut as authSignOut } from "@/auth";

export async function signInAction() {
  await authSignIn("google", { redirectTo: "/dashboard" });
}

export async function signOutAction() {
  await authSignOut({ redirectTo: "/login" });
}
