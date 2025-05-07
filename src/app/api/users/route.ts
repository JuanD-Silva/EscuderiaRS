// app/api/users/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Crea un cliente de Supabase
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE as string // O Anon key, según permisos
);

export async function POST(request: Request) {
  try {
    // 1. Lee el body
    const { username, password } = await request.json();

    // 2. Hashea la contraseña
    const passwordHashed = await bcrypt.hash(password, 10);

    // 3. Inserta el usuario en la base de datos
    const { data, error } = await supabase
      .from('users')
      .insert({ username, password: passwordHashed })
      .select(); // 'select()' para devolver el registro creado, si quieres

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // 4. Retorna la respuesta exitosa
    return NextResponse.json({ success: true, user: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
