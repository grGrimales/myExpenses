"use server";

import { categoryRepository } from "@/db/repositories";
import { DEFAULT_CATEGORIES } from "@/actions/seed-categories";
import { type ActionResult } from "@/lib/utils/errors";

export async function seedDefaultCategoriesAction(
  userId: string
): Promise<ActionResult> {
  try {
    const existing = await categoryRepository.findCategoriesByUserId(userId);
    if (existing.length > 0) return { success: true, data: undefined };

    await Promise.all(
      DEFAULT_CATEGORIES.map((cat) =>
        categoryRepository.createCategory({ ...cat, userId })
      )
    );

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al crear categorías predeterminadas",
    };
  }
}
