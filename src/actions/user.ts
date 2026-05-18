"use server";

import { auth } from "@/auth";
import { userRepository } from "@/db/repositories";
import { type User } from "@/db/schema/users";
import { VALID_CURRENCIES } from "@/lib/utils/currency";
import { type ActionResult } from "@/lib/utils/errors";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
});

export async function getUserProfileAction(): Promise<ActionResult<User>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  try {
    const user = await userRepository.findUserById(session.user.id);
    if (!user) return { success: false, error: "Usuario no encontrado" };
    return { success: true, data: user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al obtener perfil",
    };
  }
}

export async function updateUserProfileAction(data: {
  name: string;
}): Promise<ActionResult<User>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  const validated = updateProfileSchema.safeParse(data);
  if (!validated.success)
    return { success: false, error: validated.error.issues[0].message };

  try {
    const user = await userRepository.updateUser(session.user.id, {
      name: validated.data.name,
    });
    if (!user) return { success: false, error: "Usuario no encontrado" };
    revalidatePath("/perfil");
    return { success: true, data: user };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al actualizar perfil",
    };
  }
}

export async function updateUserCurrencyAction(
  currency: string
): Promise<ActionResult<User>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  if (!VALID_CURRENCIES.includes(currency)) {
    return { success: false, error: "Moneda no válida" };
  }

  try {
    const user = await userRepository.updateUser(session.user.id, { currency });
    if (!user) return { success: false, error: "Usuario no encontrado" };
    revalidatePath("/perfil");
    return { success: true, data: user };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error al actualizar moneda",
    };
  }
}
