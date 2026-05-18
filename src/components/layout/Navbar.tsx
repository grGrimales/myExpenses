import { auth } from "@/auth";
import UserMenu from "@/components/layout/UserMenu";
import { Wallet } from "lucide-react";
import Link from "next/link";

export default async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Wallet className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Mis Gastos</span>
        </Link>

        <div className="flex items-center gap-4">
          <UserMenu name={user?.name} email={user?.email} image={user?.image} />
        </div>
      </div>
    </header>
  );
}
