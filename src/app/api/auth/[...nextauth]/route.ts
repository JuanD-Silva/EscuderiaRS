// app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE as string
);

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    CredentialsProvider({
      // ... (configuración de CredentialsProvider sin cambios) ...
      name: "Credentials",
      credentials: {
        username: { label: "Usuario", type: "text", placeholder: "tu_usuario" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          console.warn("[NextAuth Authorize] Faltan credenciales.");
          return null;
        }
        const normalizedUsername = credentials.username.trim().toLowerCase();
        const { password } = credentials;
        if (!normalizedUsername) {
            console.warn("[NextAuth Authorize] Username vacío post-normalización.");
            return null;
        }
        console.log(`[NextAuth Authorize] Autenticando: '${normalizedUsername}'`);
        const { data: user, error: fetchError } = await supabase
          .from("users")
          .select("id, username, password")
          .eq("username", normalizedUsername)
          .maybeSingle();

        if (fetchError) {
          console.error("[NextAuth Authorize] Error Supabase:", fetchError.message);
          return null;
        }
        if (!user) {
          console.log(`[NextAuth Authorize] Usuario '${normalizedUsername}' no encontrado.`);
          return null;
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          console.log(`[NextAuth Authorize] Contraseña incorrecta para '${normalizedUsername}'.`);
          return null;
        }
        console.log(`[NextAuth Authorize] Autenticado: '${normalizedUsername}', ID: ${user.id}`);
        return {
          id: user.id.toString(),
          name: user.username,
        };
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    // Solo desestructurar 'token' y 'user' ya que son los únicos que se usan
    async jwt({ token, user /* account, profile, isNewUser --> eliminados */ }) {
      // 'user' solo está presente en el primer inicio de sesión después de 'authorize'
      if (user) {
        // Añadir datos del 'user' (devuelto por authorize) al token JWT
        token.id = user.id;
        // token.name = user.name; // 'name' ya se añade por defecto
        // Ejemplo: si tuvieras roles y los devolvieras en authorize:
        // if ('role' in user && user.role) {
        //   token.role = user.role;
        // }
      }
      // El token se pasa a la siguiente llamada (ej. al callback session o al cliente)
      return token;
    },
    // Solo desestructurar 'session' y 'token', ya que 'user' no se usa aquí
    async session({ session, token /* user --> eliminado */ }) {
      // Asignar datos desde el token JWT procesado a la sesión del cliente
      if (token && session.user) {
        // Asegúrate de que 'id' exista en tu tipo JWT extendido (next-auth.d.ts)
        session.user.id = token.id as string;
        // session.user.name = token.name as string; // 'name' ya debería estar
        // Ejemplo: si tuvieras roles en el token
        // if (token.role) {
        //   session.user.role = token.role as string;
        // }
      }
      // La sesión devuelta es la que obtiene el cliente con useSession() o getSession()
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };