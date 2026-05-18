import { Button } from "@/components/ui/button";
import { Home, SearchX } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <SearchX className="mb-6 h-16 w-16 text-muted-foreground" />
      <h1 className="mb-3 text-7xl font-bold tracking-tight">404</h1>
      <h2 className="mb-2 text-2xl font-semibold">Página no encontrada</h2>
      <p className="mb-8 max-w-md text-muted-foreground">
        La página que buscas no existe o fue eliminada. Vuelve al dashboard para
        continuar.
      </p>
      <Button asChild>
        <Link href="/dashboard">
          <Home className="mr-2 h-4 w-4" />
          Ir al Dashboard
        </Link>
      </Button>
    </div>
  );
}
