"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { type Category } from "@/db/schema/categories";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { Pencil, Tag, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CategoryDialog from "./CategoryDialog";

interface CategoryCardProps {
  category: Category;
  onDelete: (id: string) => void;
}

export default function CategoryCard({ category, onDelete }: CategoryCardProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const IconComponent = CATEGORY_ICONS[category.icon] ?? Tag;

  function handleDeleteConfirm() {
    setDeleteOpen(false);
    onDelete(category.id);
  }

  function handleEditSuccess() {
    setEditOpen(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
          style={{
            backgroundColor: category.color + "20",
            color: category.color,
          }}
        >
          <IconComponent className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{category.name}</p>
          <p
            className="mt-0.5 font-mono text-xs"
            style={{ color: category.color }}
          >
            {category.color}
          </p>
        </div>

        <div className="flex flex-shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setEditOpen(true)}
            aria-label="Editar"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
            aria-label="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CategoryDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        category={category}
        onSuccess={handleEditSuccess}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará &quot;{category.name}&quot; de forma
              permanente. Los gastos asociados perderán su categoría.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
