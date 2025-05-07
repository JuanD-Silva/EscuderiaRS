// src/next-auth.d.ts (o en la raíz del proyecto)

import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

// Extiende el tipo User por defecto de NextAuth
declare module "next-auth" {
  /**
   * El objeto User devuelto por el callback `authorize` o por un provider OAuth.
   */
  interface User extends DefaultUser {
    id: string; // Añade la propiedad 'id'
    // role?: string; // Ejemplo: si también tienes roles
  }

  /**
   * El objeto Session devuelto por `useSession`, `getSession` y recibido en los callbacks.
   */
  interface Session extends DefaultSession {
    user?: {
      id: string; // Asegúrate de que coincida con lo que pones en el token
      // role?: string; // Ejemplo: si también tienes roles
    } & DefaultSession["user"]; // Mantiene las propiedades originales (name, email, image)
  }
}

// Extiende el tipo JWT por defecto de NextAuth
declare module "next-auth/jwt" {
  /**
   * El token JWT devuelto por el callback `jwt`.
   */
  interface JWT extends DefaultJWT {
    id: string; // Añade la propiedad 'id'
    // role?: string; // Ejemplo: si también tienes roles
  }
}