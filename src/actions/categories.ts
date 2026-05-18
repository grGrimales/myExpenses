"use server";

import { auth } from "@/auth";
import { categoryRepository } from "@/db/repositories";
import { revalidatePath } from "next/cache";
import {
  createCategorySchema,
  updateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "@/lib/validations/category";
import { type ActionResult } from "@/lib/utils/errors";
import { type Category } from "@/db/schema/categories";

export async function createCategoryAction(
  data: CreateCategoryInput
): Promise<ActionResult<Category>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  const validated = createCategorySchema.safeParse(data);
  if (!validated.success)
    return { success: false, error: validated.error.issues[0].message };

  try {
    const category = await categoryRepository.createCategory({
      ...validated.data,
      userId: session.user.id,
    });
    revalidatePath("/categorias");
    return { success: true, data: category };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear categoría",
    };
  }
}

export async function updateCategoryAction(
  id: string,
  data: UpdateCategoryInput
): Promise<ActionResult<Category>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  const validated = updateCategorySchema.safeParse(data);
  if (!validated.success)
    return { success: false, error: validated.error.issues[0].message };

  try {
    const category = await categoryRepository.updateCategory(
      id,
      session.user.id,
      validated.data
    );
    if (!category) return { success: false, error: "Categoría no encontrada" };
    revalidatePath("/categorias");
    return { success: true, data: category };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar categoría",
    };
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  try {
    const category = await categoryRepository.deleteCategory(id, session.user.id);
    if (!category) return { success: false, error: "Categoría no encontrada" };
    revalidatePath("/categorias");
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al eliminar categoría",
    };
  }
}

export async function getCategoriesAction(): Promise<ActionResult<Category[]>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autenticado" };

  try {
    const categoriesList = await categoryRepository.findCategoriesByUserId(
      session.user.id
    );
    return { success: true, data: categoriesList };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al obtener categorías",
    };
  }
}
