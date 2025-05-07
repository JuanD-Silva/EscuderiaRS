// app/api/users/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
// Opcional: Importar los tipos generados por Supabase si los tienes
// import { Database } from '@/types/supabase';

// Crea un cliente de Supabase
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE as string
);

// --- Función Auxiliar getErrorMessage ---
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  // Intenta manejar errores de Supabase u otros objetos con 'message' de forma más segura
  if (error && typeof error === 'object' && 'message' in error) {
    const maybeErrorWithMessage = error as { message?: unknown }; // Tipado más seguro
    if (typeof maybeErrorWithMessage.message === 'string') {
      return maybeErrorWithMessage.message || "Error con mensaje vacío.";
    }
  }
  try {
      const errorString = String(error);
      if (errorString !== '[object Object]') {
          return errorString;
      }
  // eslint-disable-next-line no-empty
  } catch (_e) { // <--- CAMBIO: Prefijar 'e' no usado con '_'
     /* Ignorar error de conversión */
  }
  return "Ocurrió un error desconocido.";
}
// --- FIN Función Auxiliar ---


export async function POST(request: Request) {
  try {
    // 1. Lee y valida el body
    let username, password;
    try {
      const body = await request.json();
      if (!body || typeof body.username !== 'string' || typeof body.password !== 'string' || !body.username || !body.password) {
        return NextResponse.json({ success: false, error: 'Faltan campos requeridos (username, password).' }, { status: 400 });
      }
      username = body.username.trim().toLowerCase(); // Limpiar y normalizar username
      password = body.password;

      if (username.length < 3) {
         return NextResponse.json({ success: false, error: 'El nombre de usuario debe tener al menos 3 caracteres.' }, { status: 400 });
      }
      if (password.length < 6) {
         return NextResponse.json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 });
      }

    } catch (parseError) {
      console.error("Error parseando JSON del request:", parseError);
      return NextResponse.json({ success: false, error: 'Formato de solicitud inválido.' }, { status: 400 });
    }

    // 2. Hashea la contraseña
    const passwordHashed = await bcrypt.hash(password, 10);

    // 3. Inserta el usuario en la base de datos
    console.log(`Intentando insertar usuario: ${username}`);
    const userData = { username, password: passwordHashed };

    const { data, error: dbError } = await supabase
      .from('users')
      .insert(userData)
      .select('id, username, created_at');

    if (dbError) {
      console.error("Error de Supabase al insertar usuario:", dbError);
      if (dbError.code === '23505') { // Username duplicado
        return NextResponse.json({ success: false, error: 'El nombre de usuario ya existe.' }, { status: 409 });
      }
      // Usar getErrorMessage para otros errores de BD
      return NextResponse.json({ success: false, error: getErrorMessage(dbError) || 'Error al crear el usuario en la base de datos.' }, { status: 500 });
    }

    if (!data || data.length === 0) {
        console.error("No se devolvieron datos después de insertar el usuario (posible problema con RLS o select).");
        return NextResponse.json({ success: false, error: 'Error al verificar la creación del usuario.' }, { status: 500 });
    }

    // 4. Retorna la respuesta exitosa
    console.log("Usuario creado exitosamente:", data[0]);
    return NextResponse.json({ success: true, user: data[0] }, { status: 201 });

  } catch (err: unknown) { // Mantener unknown para el catch global
    console.error('Error inesperado en POST /api/users:', err);
    const errorMessage = getErrorMessage(err);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}