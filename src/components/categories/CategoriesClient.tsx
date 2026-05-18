"use client";

import { deleteCategoryAction } from "@/actions/categories";
import { Button } from "@/components/ui/button";
import { type Category } from "@/db/schema/categories";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import CategoryCard from "./CategoryCard";
import CategoryDialog from "./CategoryDialog";

interface CategoriesClientProps {
  categories: Category[];
}

export default function CategoriesClient({
  categories,
}: CategoriesClientProps) {
  const router = useRouter();
  const [newOpen, setNewOpen] = useState(false);
  const [, startTransition] = useTransition();

  const [optimisticCategories, removeOptimistic] = useOptimistic(
    categories,
    (state, deletedId: string) => state.filter((c) => c.id !== deletedId)
  );

  function handleNewSuccess() {
    setNewOpen(false);
    router.refresh();
  }

  function handleDeleteCategory(id: string) {
    startTransition(async () => {
      removeOptimistic(id);
      const result = await deleteCategoryAction(id);
      if (result.success) {
        toast.success("Categoría eliminada");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorías</h1>
          <p className="text-muted-foreground">
            {optimisticCategories.length === 0
              ? "Aún no tienes categorías"
              : `${optimisticCategories.length} categoría${
                  optimisticCategories.length !== 1 ? "s" : ""
                }`}
          </p>
        </div>
        <Button onClick={() => setNewOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva categoría
        </Button>
      </div>

      {optimisticCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <p className="text-muted-foreground">No tienes categorías todavía.</p>
          <Button
            variant="link"
            className="mt-2"
            onClick={() => setNewOpen(true)}
          >
            Crear tu primera categoría
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {optimisticCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onDelete={handleDeleteCategory}
            />
          ))}
        </div>
      )}

      <CategoryDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onSuccess={handleNewSuccess}
      />
    </>
  );
}
