// app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

// 1. Crea tu cliente de Supabase
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE as string // Usar SERVICE_ROLE para operaciones de backend como autenticación
);

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET, // Asegúrate de tener esta variable en tu .env

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Usuario", type: "text", placeholder: "tu_usuario" },
        password: { label: "Contraseña", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          console.warn("[NextAuth Authorize] Faltan credenciales (username o password).");
          return null;
        }

        // --- NORMALIZACIÓN DEL USERNAME ---
        // Elimina espacios al inicio/final y convierte a minúsculas.
        const normalizedUsername = credentials.username.trim().toLowerCase();
        const { password } = credentials;

        // Validar que el username no quede vacío después del trim
        if (!normalizedUsername) {
            console.warn("[NextAuth Authorize] Username vacío después de la normalización.");
            return null;
        }

        console.log(`[NextAuth Authorize] Intentando autenticar usuario normalizado: '${normalizedUsername}'`);

        // 2. Busca el usuario en tu tabla 'users'.
        //    IMPORTANTE: Para que esta consulta funcione de manera óptima con la normalización,
        //    la columna 'username' en tu tabla 'users' de Supabase DEBERÍA estar almacenada
        //    también en minúsculas y sin espacios al inicio/final.
        //    Si no es el caso, considera ajustar la consulta (ej. usando .filter('lower(username)', 'eq', normalizedUsername))
        //    o, preferiblemente, normalizar los datos existentes en tu BD.
        const { data: user, error: fetchError } = await supabase
          .from("users") // Asegúrate que el nombre de tu tabla es 'users'
          .select("id, username, password") // recupera el hash de la contraseña
          .eq("username", normalizedUsername) // Compara con el username normalizado
          .maybeSingle(); // obtén un solo registro o null

        if (fetchError) {
          console.error("[NextAuth Authorize] Error al consultar Supabase:", fetchError.message);
          // Puedes decidir lanzar un error para que NextAuth lo maneje de forma genérica,
          // o retornar null para un mensaje de "credenciales inválidas".
          // throw new Error("Error de base de datos durante la autenticación.");
          return null; // Indica un fallo, resultará en "CredentialsSignin"
        }

        if (!user) {
          console.log(`[NextAuth Authorize] Usuario '${normalizedUsername}' no encontrado en la base de datos.`);
          return null; // Usuario no encontrado
        }

        // 3. Compara la contraseña ingresada con la almacenada (hash).
        //    Asegúrate que 'user.password' contiene el hash generado por bcrypt.
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
          console.log(`[NextAuth Authorize] Contraseña incorrecta para el usuario '${normalizedUsername}'.`);
          return null; // Contraseña incorrecta
        }

        console.log(`[NextAuth Authorize] Usuario '${normalizedUsername}' autenticado correctamente. ID: ${user.id}`);
        // Usuario autenticado correctamente.
        // El objeto devuelto aquí estará disponible en el callback `jwt` y `session` como parámetro `user`.
        return {
          id: user.id.toString(),       // ID del usuario (asegúrate que es string)
          name: user.username,          // Nombre de usuario (puedes usar el original o el de la BD)
          // email: user.email,         // Si tienes email y lo quieres en el token/session
          // role: user.role,           // Si tienes roles y los quieres en el token/session
        };
      },
    }),
  ],

  pages: {
    signIn: "/login", // Ajustado para coincidir con tu frontend. Verifica si es correcto.
    // error: '/auth/error', // (opcional) Puedes crear una página personalizada para errores de autenticación
  },

  session: {
    strategy: "jwt", // Usar JWT para las sesiones es común y flexible
  },

  callbacks: {
    async jwt({ token, user, account, profile, isNewUser }) {
      // El parámetro `user` solo está disponible en el primer inicio de sesión después de `authorize`.
      if (user) {
        token.id = user.id; // Propaga el id del usuario al token
        // token.name = user.name; // `name` ya se incluye por defecto si está en el objeto user
        // if (user.role) { // Ejemplo: si tienes roles
        //   token.role = user.role;
        // }
      }
      return token;
    },
    async session({ session, token, user }) {
      // El `token` aquí es el JWT procesado por el callback `jwt`.
      // Propaga datos del token a `session.user` para que estén disponibles en el cliente.
      if (session.user) {
        session.user.id = token.id as string;
        // session.user.name = token.name as string; // `name` ya suele estar
        // if (token.role) { // Ejemplo: si tienes roles
        //   session.user.role = token.role as string;
        // }
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };