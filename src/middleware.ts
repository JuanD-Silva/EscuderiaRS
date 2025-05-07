// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth({
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    authorized({ token, req }) {
      
      // Por ahora, solo verificamos que haya un token (usuario autenticado)
      // Comenta la línea de abajo y usa la verificación de rol cuando confirmes la estructura del token
      return !!token;
      
      // Cuando sepamos la estructura del token, podemos usar:
      // const isAdmin = token?.role === "admin"; // o cualquier estructura que tenga tu token
      // return !!isAdmin;
    },
  },
});

export const config = {
  matcher: ["/admin/:path*"],
};