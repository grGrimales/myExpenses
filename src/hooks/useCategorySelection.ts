"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

const PARAM = "categoryIds";

/**
 * Las filas del desglose se agrupan por `categoryId`, que puede ser null para
 * los gastos sin categoría. La URL necesita una clave textual, y este centinela
 * no colisiona con los UUID reales.
 */
export const UNCATEGORIZED_KEY = "uncategorized";

export function categoryKey(categoryId: string | null): string {
  return categoryId ?? UNCATEGORIZED_KEY;
}

export function keyToCategoryId(key: string): string | null {
  return key === UNCATEGORIZED_KEY ? null : key;
}

/**
 * Selección de categorías persistida en la URL, junto al resto de filtros de
 * Informes.
 *
 * Tres estados distintos, y el parámetro vacío no es lo mismo que ausente:
 *   - ausente        -> `null`, que el consumidor interpreta como "todas"
 *   - `?categoryIds=`      -> conjunto vacío, ninguna marcada
 *   - `?categoryIds=a,b`   -> solo esas
 *
 * Sin esa distinción no habría forma de desmarcarlas todas: el estado quedaría
 * indistinguible de la carga inicial y la pantalla volvería a marcarlo todo.
 */
export function useCategorySelection() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const raw = searchParams.get(PARAM);

  const selection = useMemo<Set<string> | null>(() => {
    if (raw === null) return null;
    if (raw === "") return new Set<string>();
    return new Set(raw.split(",").filter(Boolean));
  }, [raw]);

  const setSelection = useCallback(
    (next: Set<string> | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === null) {
        params.delete(PARAM);
      } else {
        params.set(PARAM, [...next].join(","));
      }
      // `replace` en vez de `push`: marcar y desmarcar casillas no debería
      // llenar el historial de entradas por las que el usuario tiene que
      // retroceder una por una.
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  return { selection, setSelection };
}
