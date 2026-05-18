import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-lg text-muted-foreground">
        Bienvenido, <span className="font-semibold text-foreground">{session?.user?.name}</span>
      </p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Placeholders for summary cards */}
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow">
          <p className="text-sm font-medium text-muted-foreground">Saldo Total</p>
          <p className="text-2xl font-bold">$0.00</p>
        </div>
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow">
          <p className="text-sm font-medium text-muted-foreground">Ingresos</p>
          <p className="text-2xl font-bold text-green-600">$0.00</p>
        </div>
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow">
          <p className="text-sm font-medium text-muted-foreground">Gastos</p>
          <p className="text-2xl font-bold text-red-600">$0.00</p>
        </div>
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow">
          <p className="text-sm font-medium text-muted-foreground">Categoría Top</p>
          <p className="text-2xl font-bold">-</p>
        </div>
      </div>
    </div>
  );
}
