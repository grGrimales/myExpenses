import { getCategoriesAction } from "@/actions/categories";
import CategoriesClient from "@/components/categories/CategoriesClient";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Categorías — Mis Gastos",
  description: "Gestiona tus categorías de gastos e ingresos",
};

export default async function CategoriasPage() {
  const result = await getCategoriesAction();
  const categories = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <CategoriesClient categories={categories} />
    </div>
  );
}
