// src/next-auth.d.ts

// Importa solo los tipos que realmente necesitas para extender las interfaces
import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";
// 'NextAuth' y 'JWT' no son necesarios para la declaración de módulos si solo extiendes interfaces existentes.

// --- Extiende el módulo "next-auth" ---
declare module "next-auth" {
  /**
   * Extiende la interfaz User base.
   * Representa el objeto 'user' que devuelves desde 'authorize'
   * y que recibes como argumento en el callback 'jwt' (la primera vez).
   */
  interface User extends DefaultUser {
    // Añade aquí las propiedades personalizadas que tu 'authorize' devuelve
    // y que quieres que estén disponibles inicialmente en el callback 'jwt'.
    id: string;
    // Ejemplo: Si tuvieras roles
    // role?: string;
  }

  /**
   * Extiende la interfaz Session base.
   * Representa el objeto 'session' que el cliente recibe (ej. con useSession).
   * Debes poblar estas propiedades personalizadas en el callback 'session'.
   */
  interface Session extends DefaultSession {
    // Extiende la propiedad 'user' dentro de 'Session'
    user?: {
      id: string; // Propiedad personalizada que viene del token
      // Ejemplo: Si tuvieras roles
      // role?: string;
    } & DefaultSession["user"]; // Combina con las propiedades por defecto (name, email, image)
  }
}

// --- Extiende el módulo "next-auth/jwt" ---
declare module "next-auth/jwt" {
  /**
   * Extiende la interfaz JWT base.
   * Representa el token decodificado que se recibe y se devuelve
   * en el callback 'jwt' y se pasa al callback 'session'.
   */
  interface JWT extends DefaultJWT {
    // Añade aquí las propiedades personalizadas que quieres almacenar en el token JWT.
    // Estas propiedades se añaden generalmente en el callback 'jwt' usando la
    // información del argumento 'user' (la primera vez) o de llamadas a BD/API.
    id: string;
    // Ejemplo: Si tuvieras roles
    // role?: string;
  }
}