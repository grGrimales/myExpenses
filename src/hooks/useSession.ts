"use client";
import { useSession as useNextAuthSession } from "next-auth/react";

export function useSession() {
  const session = useNextAuthSession();
  return {
    user: session.data?.user,
    isLoading: session.status === "loading",
    isAuthenticated: session.status === "authenticated",
  };
}
