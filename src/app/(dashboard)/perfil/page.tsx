import { getUserProfileAction } from "@/actions/user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ProfileForm from "@/components/profile/ProfileForm";
import { type Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Perfil — Mis Gastos",
  description: "Gestiona tu información personal y preferencias",
};

export default async function PerfilPage() {
  const result = await getUserProfileAction();
  if (!result.success) redirect("/dashboard");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Perfil</h1>
        <p className="text-muted-foreground">
          Gestiona tu información y preferencias
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información personal</CardTitle>
          <CardDescription>
            Actualiza tu nombre y moneda preferida
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm user={result.data} />
        </CardContent>
      </Card>
    </div>
  );
}
