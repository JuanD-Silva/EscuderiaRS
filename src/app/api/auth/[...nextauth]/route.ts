// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

// La creación del cliente de Supabase no cambia
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE as string
);

// CORRECCIÓN: Se ha eliminado la palabra 'export' de esta constante.
// Este objeto de configuración no debe ser exportado desde un archivo de ruta.
const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    CredentialsProvider({
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
    signIn: "/auth/login", // Asegúrate que esta sea la ruta correcta a tu página de login
  },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };