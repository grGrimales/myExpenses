import { db } from "../db";
import { categories } from "../db/schema/categories";

export const DEFAULT_CATEGORIES = [
  { name: "Alimentación", color: "#ef4444", icon: "utensils", isDefault: true },
  { name: "Transporte", color: "#3b82f6", icon: "car", isDefault: true },
  { name: "Entretenimiento", color: "#f59e0b", icon: "popcorn", isDefault: true },
  { name: "Salud", color: "#10b981", icon: "heart-pulse", isDefault: true },
  { name: "Educación", color: "#6366f1", icon: "graduation-cap", isDefault: true },
  { name: "Ropa", color: "#ec4899", icon: "shirt", isDefault: true },
  { name: "Hogar", color: "#8b5cf6", icon: "home", isDefault: true },
  { name: "Trabajo", color: "#64748b", icon: "briefcase", isDefault: true },
];

export async function createDefaultCategories(userId: string) {
  const categoriesToInsert = DEFAULT_CATEGORIES.map((cat) => ({
    ...cat,
    userId,
  }));

  return await db.insert(categories).values(categoriesToInsert);
}
