import { categoryRepository } from "./repositories";

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

/**
 * Crea las categorías iniciales de un usuario recién registrado.
 *
 * Deliberadamente NO es un Server Action: recibe un userId arbitrario y corre
 * desde el callback de signIn, cuando todavía no hay sesión que comprobar. Como
 * Server Action sería un endpoint de escritura alcanzable sin autenticar, así
 * que se queda como función interna, invocable solo desde el servidor.
 */
export async function seedDefaultCategories(userId: string): Promise<void> {
  const existing = await categoryRepository.findCategoriesByUserId(userId);
  if (existing.length > 0) return;

  await Promise.all(
    DEFAULT_CATEGORIES.map((cat) =>
      categoryRepository.createCategory({ ...cat, userId })
    )
  );
}
