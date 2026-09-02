import { auth } from "@/auth";
import { cache } from "react";

/**
 * La moneda del usuario para componentes de servidor; los de cliente la sacan de
 * useMoney(). Va envuelta en cache() porque auth() consulta la base en su
 * callback de sesión, y varios componentes de una misma página la piden: sin
 * esto, pintar el panel costaría una consulta por tarjeta.
 */
export const getUserCurrency = cache(async (): Promise<string> => {
  const session = await auth();
  return session?.user?.currency ?? "CLP";
});
