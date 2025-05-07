// src/app/admin/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// --- Tipos Mejorados ---

// Tipo base de la tabla 'Autos' en Supabase
export interface Vehiculo {
  id: number; // Asumiendo que ID es numérico autoincremental
  created_at?: string; // Opcional si no siempre lo necesitas
  linea: string | null;
  marca: string | null;
  modelo: number | null; // Año
  km: number | null;
  tipo_caja: string | null;
  valor_venta: number | null;
  propietario_ubicacion: string | null; // Considera si esto es necesario o debe ser otra tabla
  descripcion: string | null;
  vendido: boolean;
  soat: string | null; // Formato 'YYYY-MM-DD'
  tecno: string | null; // Formato 'YYYY-MM-DD'
  color: string | null;
  lugar_matricula: string | null;
  reporte: boolean | null;
  prenda: boolean | null;
  motor: string | null;
  estado: string | null; // Considera usar un Enum/Tipo específico: 'disponible' | 'alistamiento' | ...
  imagenes: string | null; // URL única por ahora, o string JSON si manejas múltiples
  placa: string | null;
  fecha_venta?: string | null;
}

// Tipo para el ESTADO del formulario (permite strings temporalmente para inputs)
// Es importante parsear a los tipos correctos antes de enviar a Supabase
export interface VehiculoFormData {
  linea: string;
  marca: string;
  modelo: string; // Se parseará a number
  km: string;     // Se parseará a number
  tipo_caja: string;
  valor_venta: string; // Se parseará a number
  propietario_ubicacion: string;
  descripcion: string;
  soat: string; // Input type="date" devuelve 'YYYY-MM-DD'
  tecno: string;
  color: string;
  lugar_matricula: string;
  reporte: boolean; // Checkbox maneja boolean directamente
  prenda: boolean;
  motor: string;
  estado: string; // El select maneja string
  imagenes: string; // Guarda la URL existente si se edita
  placa: string;
}

// --- Cliente Supabase (CORREGIDO) ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE; // <-- USA ANON KEY

if (!supabaseUrl) {
  throw new Error("Supabase URL no encontrada (NEXT_PUBLIC_SUPABASE_URL).");
}
if (!supabaseAnonKey) {
  throw new Error("Supabase Anon Key no encontrada (NEXT_PUBLIC_SUPABASE_ANON_KEY).");
}

export const supabase = createClient<Vehiculo>(supabaseUrl, supabaseAnonKey); // Puedes pasar el tipo aquí para mejor inferencia

// Opcional: Tipo para los estados posibles (mejora la consistencia)
export const VEHICLE_STATUS_OPTIONS = [
    { value: 'disponible', label: 'Disponible' },
    { value: 'alistamiento', label: 'Alistamiento' },
    { value: 'vendido', label: 'Vendido' }, // Añadir 'vendido' aquí si es un estado gestionable desde el form
    { value: 'en crédito', label: 'En Crédito' },
    { value: 'virtual', label: 'Virtual' },
    { value: 'separado', label: 'Separado' },
] as const; // 'as const' para tipos más estrictos

export type VehicleStatus = typeof VEHICLE_STATUS_OPTIONS[number]['value'];