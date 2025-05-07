// app/api/users/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
// Opcional: Importar los tipos generados por Supabase si los tienes
// import { Database } from '@/types/supabase';

// Crea un cliente de Supabase
// Considera usar la Anon Key si las políticas RLS permiten la creación de usuarios
// o si esta API está destinada solo para uso interno/admin.
// Usar la Service Role Key bypassa RLS.
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE as string
);

// --- Función Auxiliar getErrorMessage ---
// (Recomendado tenerla en un archivo de utilidades central)
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  // Intenta manejar errores de Supabase u otros objetos con 'message'
  if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
    return (error as { message: string }).message || "Error con mensaje vacío.";
  }
  try {
      const errorString = String(error);
      if (errorString !== '[object Object]') {
          return errorString;
      }
  } catch (e) { /* Ignorar */ }
  return "Ocurrió un error desconocido.";
}
// --- FIN Función Auxiliar ---


export async function POST(request: Request) {
  try {
    // 1. Lee y valida el body
    // Es MUY recomendable validar los datos de entrada con Zod u otra librería
    let username, password;
    try {
      const body = await request.json();
      // Validación simple (mejor usar Zod)
      if (!body || typeof body.username !== 'string' || typeof body.password !== 'string' || !body.username || !body.password) {
        return NextResponse.json({ success: false, error: 'Faltan campos requeridos (username, password).' }, { status: 400 });
      }
      username = body.username.trim(); // Limpiar username
      password = body.password;

      // Añadir más validaciones si es necesario (longitud, caracteres, etc.)
      if (username.length < 3) {
         return NextResponse.json({ success: false, error: 'El nombre de usuario debe tener al menos 3 caracteres.' }, { status: 400 });
      }
      if (password.length < 6) {
         return NextResponse.json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 });
      }

      // Considerar normalizar username a minúsculas si el login lo hace
      username = username.toLowerCase();

    } catch (parseError) {
      console.error("Error parseando JSON del request:", parseError);
      return NextResponse.json({ success: false, error: 'Formato de solicitud inválido.' }, { status: 400 });
    }


    // 2. Hashea la contraseña
    const passwordHashed = await bcrypt.hash(password, 10);

    // 3. Inserta el usuario en la base de datos
    console.log(`Intentando insertar usuario: ${username}`);

    // Opcional: Definir el tipo esperado para la inserción (si usas tipos generados)
    // type UserInsert = Database['public']['Tables']['users']['Insert'];
    // const userData: UserInsert = { username, password: passwordHashed };

    // O usar un objeto directamente si no tienes tipos generados
    const userData = { username, password: passwordHashed };

    const { data, error: dbError } = await supabase
      .from('users') // Asegúrate que la tabla se llama 'users'
      .insert(userData) // Pasar el objeto tipado (implícito o explícito)
      .select('id, username, created_at'); // Seleccionar solo lo necesario y seguro para devolver

    if (dbError) {
      console.error("Error de Supabase al insertar usuario:", dbError);
      // Manejar errores específicos de la BD, como username duplicado (código 23505 en PostgreSQL)
      if (dbError.code === '23505') {
        return NextResponse.json({ success: false, error: 'El nombre de usuario ya existe.' }, { status: 409 }); // 409 Conflict
      }
      // Devolver un error genérico para otros problemas de BD
      return NextResponse.json({ success: false, error: 'Error al crear el usuario en la base de datos.' }, { status: 500 });
    }

    if (!data || data.length === 0) {
        console.error("No se devolvieron datos después de insertar el usuario (posible problema con RLS o select).");
        return NextResponse.json({ success: false, error: 'Error al verificar la creación del usuario.' }, { status: 500 });
    }

    // 4. Retorna la respuesta exitosa (sin la contraseña hasheada)
    console.log("Usuario creado exitosamente:", data[0]);
    // Devuelve solo el primer usuario creado (insert devuelve un array)
    return NextResponse.json({ success: true, user: data[0] }, { status: 201 });

  } catch (err: unknown) { // <--- CAMBIO: tipado como unknown
    console.error('Error inesperado en POST /api/users:', err);
    // Usa la función auxiliar para obtener el mensaje
    const errorMessage = getErrorMessage(err);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// Podrías añadir otros métodos HTTP como GET (para listar usuarios, si es necesario y seguro)
// export async function GET(request: Request) {
//   // ... lógica para obtener usuarios ...
// }