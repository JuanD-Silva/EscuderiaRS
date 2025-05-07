// src/app/admin/services/vehicleService.ts
import { supabase, VehiculoFormData, Vehiculo } from "../lib/supabase";

// --- Tipo de Payload para Supabase ---
// Este tipo representa la estructura de datos que realmente enviaremos a Supabase.
// Es esencialmente `Partial<Vehiculo>`, pero omitiendo los campos que nunca se envían
// y asegurando que los tipos coincidan con lo que Supabase espera (ej. números son números, no strings).
// Usamos Omit para quitar los campos autogenerados o que no manejamos en el insert/update directo.
type VehiculoPayload = Partial<Omit<Vehiculo, 'id' | 'created_at'>>;
// Si necesitas ser aún más específico, podrías listar explícitamente las propiedades y sus tipos:
// type VehiculoPayload = {
//   linea?: string | null;
//   marca?: string | null;
//   modelo?: number | null;
//   km?: number | null;
//   // ... y así sucesivamente para todos los campos que puedes insertar/actualizar
//   imagenes?: string | null;
//   vendido?: boolean;
//   estado?: string | null; // O tu tipo Enum específico si lo defines
//   // etc.
// }

// --- Función Auxiliar getErrorMessage ---
// (Importante para manejar errores consistentemente)
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
    return (error as { message: string }).message || "Error con mensaje vacío.";
  }
  try {
      const errorString = String(error);
      if (errorString !== '[object Object]') {
          return errorString;
      }
  } catch (e) { /* Ignorar error de conversión */ }
  return "Ocurrió un error desconocido.";
}

// --- Función de Parseo ---
// Devuelve Partial<Vehiculo> como antes, esto es útil para la lógica de transformación.
function parseAndValidateFormData(formData: VehiculoFormData, imageUrl?: string | null): Partial<Vehiculo> {
  const parsed: Partial<Vehiculo> = {};

  parsed.linea = formData.linea?.trim() || null;
  parsed.marca = formData.marca?.trim() || null;
  parsed.tipo_caja = formData.tipo_caja?.trim() || null;
  parsed.propietario_ubicacion = formData.propietario_ubicacion?.trim() || null;
  parsed.descripcion = formData.descripcion?.trim() || null;
  parsed.color = formData.color?.trim() || null;
  parsed.lugar_matricula = formData.lugar_matricula?.trim() || null;
  parsed.motor = formData.motor?.trim() || null;
  parsed.estado = formData.estado?.trim() || 'disponible';
  parsed.placa = formData.placa?.trim().toUpperCase() || null;
  parsed.soat = formData.soat || null;
  parsed.tecno = formData.tecno || null;

  const modeloNum = parseInt(formData.modelo, 10);
  parsed.modelo = !isNaN(modeloNum) ? modeloNum : null;

  const kmNum = parseInt(formData.km, 10);
  parsed.km = !isNaN(kmNum) ? kmNum : null;

  const valorNum = parseFloat(formData.valor_venta);
  parsed.valor_venta = !isNaN(valorNum) ? valorNum : null;

  parsed.reporte = formData.reporte ?? false;
  parsed.prenda = formData.prenda ?? false;
  parsed.imagenes = imageUrl ?? (formData.imagenes || null);

  // Opcional: Filtrar claves undefined si es necesario, aunque Supabase suele ignorarlas.
  // Object.keys(parsed).forEach(key => {
  //    if (parsed[key as keyof typeof parsed] === undefined) {
  //       delete parsed[key as keyof typeof parsed];
  //     }
  // });

  // Considera validaciones más robustas aquí si es necesario
  if (!parsed.marca || !parsed.linea || !parsed.modelo || !parsed.placa || !parsed.valor_venta) {
      console.warn("Advertencia: Campos obligatorios faltantes o inválidos en parseAndValidateFormData:", parsed);
      // Dependiendo de tu lógica, podrías lanzar un error aquí
      // throw new Error("Faltan campos obligatorios.");
  }

  return parsed;
}

// --- Funciones de Servicio CRUD ---

export async function createVehiculo(formData: VehiculoFormData, imageUrl: string | null): Promise<Vehiculo> {
  // 1. Parsear: Convierte los strings del formulario a los tipos correctos (number, null, etc.)
  const parsedData: Partial<Vehiculo> = parseAndValidateFormData(formData, imageUrl);

  // 2. Ajustar datos específicos para la creación
  parsedData.vendido = false; // Asegura que 'vendido' sea false
  delete parsedData.id;        // No enviar ID
  delete parsedData.created_at;// No enviar created_at

  // 3. Preparar el payload final para Supabase (usando el tipo VehiculoPayload)
  //    Esto asegura que estamos pasando un objeto con la estructura esperada por .insert()
  const payload: VehiculoPayload = parsedData;
  console.log("Insertando payload:", payload);

  // 4. Ejecutar la inserción (sin 'as any')
  const { data, error } = await supabase
    .from("Autos")
    .insert(payload) // Pasar el payload tipado
    .select()
    .single();

  // 5. Manejo de errores
  if (error) {
    console.error("[createVehiculo] Error de Supabase:", error);
    throw new Error(getErrorMessage(error));
  }
  if (!data) {
    // Esto puede ocurrir si las políticas RLS impiden la inserción pero no devuelven un error explícito,
    // o si .single() falla por alguna razón inesperada después de un insert exitoso (menos común).
    console.error("[createVehiculo] No se recibieron datos después de la inserción.");
    throw new Error("No se pudo crear el vehículo, no se devolvieron datos.");
  }

  console.log("[createVehiculo] Vehículo creado exitosamente:", data);
  // Asegurar que los datos devueltos coincidan con el tipo Vehiculo
  return data as Vehiculo;
}

export async function fetchVehiculos() { // Devuelve { data, error } directamente
    console.log("[fetchVehiculos] Obteniendo todos los vehículos...");
    const result = await supabase
        .from("Autos")
        .select(`*`) // Considera seleccionar solo las columnas necesarias para la lista
        .order("created_at", { ascending: false });
    console.log(`[fetchVehiculos] Se encontraron ${result.data?.length ?? 0} vehículos.`);
    if(result.error) {
        console.error("[fetchVehiculos] Error de Supabase:", result.error);
        // Podrías lanzar un error aquí también si prefieres manejarlo en el hook
        // throw new Error(getErrorMessage(result.error));
    }
    return result; // Devuelve el objeto { data, error } completo
}

export async function updateVehiculo(id: number, formData: VehiculoFormData): Promise<Vehiculo> {
    // 1. Parsear datos del formulario (incluyendo la URL de imagen existente si no hay una nueva implícita)
    const parsedData: Partial<Vehiculo> = parseAndValidateFormData(formData, formData.imagenes);

    // 2. Eliminar campos que no deben actualizarse directamente
    delete parsedData.id;
    delete parsedData.created_at;
    delete parsedData.vendido; // Se maneja por marcarComoVendido

    // 3. Preparar el payload final para Supabase update
    const payload: VehiculoPayload = parsedData;
    console.log("Actualizando ID", id, "con payload:", payload);

    // 4. Ejecutar la actualización (sin 'as any')
    const { data, error } = await supabase
        .from("Autos")
        .update(payload) // Pasar el payload tipado
        .eq("id", id)
        .select()
        .single(); // Para obtener el registro actualizado

    // 5. Manejo de errores
    if (error) {
      console.error("[updateVehiculo] Error de Supabase:", error);
      throw new Error(getErrorMessage(error));
    }
    if (!data) {
      // Puede ocurrir si el ID no existe o RLS impiden la actualización/selección
      console.error(`[updateVehiculo] No se recibieron datos después de actualizar ID ${id}.`);
      throw new Error(`No se pudo actualizar el vehículo con ID ${id}, no se devolvieron datos.`);
    }

    console.log(`[updateVehiculo] Vehículo ID ${id} actualizado exitosamente:`, data);
    return data as Vehiculo;
}

// deleteVehiculo devuelve { data, error } para que el hook pueda manejarlo si es necesario
export async function deleteVehiculo(id: number) {
  console.log("[deleteVehiculo] Eliminando ID:", id);
  const result = await supabase.from("Autos").delete().eq("id", id);
  if (result.error) {
    console.error("[deleteVehiculo] Error de Supabase:", result.error);
    // Es buena práctica lanzar el error para que el hook lo capture
    throw new Error(getErrorMessage(result.error));
  }
  console.log(`[deleteVehiculo] Solicitud de eliminación para ID ${id} enviada.`);
  return result; // Devuelve el resultado { data, error } (error será null si tuvo éxito)
}

export async function marcarComoVendido(id: number): Promise<Vehiculo> {
  console.log("[marcarComoVendido] Marcando como vendido ID:", id);

  const updatePayload = {
    vendido: true,
    fecha_venta: new Date().toISOString(),
    // Si necesitas actualizar el ENUM 'estado', añádelo aquí:
    // estado: 'vendido' // Solo si 'vendido' es parte válida del ENUM 'Estado'
  };
  console.log("[marcarComoVendido] Payload de actualización:", updatePayload);

  const { data, error } = await supabase
    .from("Autos")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[marcarComoVendido] Error de Supabase:", error);
    throw new Error(getErrorMessage(error));
  }
  if (!data) {
    console.warn(`[marcarComoVendido] No se encontró el vehículo con ID ${id} para marcar como vendido.`);
    throw new Error(`Vehículo con ID ${id} no encontrado.`);
  }

  console.log("[marcarComoVendido] Vehículo marcado como vendido exitosamente:", data);
  return data as Vehiculo;
}

export async function fetchVehiculosVendidos(filters?: { month?: number, year?: number }): Promise<Vehiculo[]> {
    console.log("[fetchVehiculosVendidos] Obteniendo vehículos vendidos con filtros:", filters);
    let query = supabase
        .from("Autos")
        .select("*")
        .eq("vendido", true);

    if (filters?.year && filters?.month) {
        const startDate = new Date(filters.year, filters.month - 1, 1);
        const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59, 999);
        console.log(`Filtrando por fecha_venta entre ${startDate.toISOString()} y ${endDate.toISOString()}`);
        query = query.gte("fecha_venta", startDate.toISOString())
                     .lte("fecha_venta", endDate.toISOString());
    } else if (filters?.year) {
        const startDate = new Date(filters.year, 0, 1);
        const endDate = new Date(filters.year, 11, 31, 23, 59, 59, 999);
        console.log(`Filtrando por fecha_venta para el año ${filters.year}`);
        query = query.gte("fecha_venta", startDate.toISOString())
                     .lte("fecha_venta", endDate.toISOString());
    }

    query = query.order("fecha_venta", { ascending: false });
    const { data, error } = await query;

    if (error) {
        console.error("[fetchVehiculosVendidos] Error fetching vehículos vendidos:", error);
        throw new Error(getErrorMessage(error));
    }
    if (!data) {
        console.log("[fetchVehiculosVendidos] No se encontraron vehículos vendidos para los filtros aplicados.");
        return [];
    }

    console.log("[fetchVehiculosVendidos] Vehículos vendidos encontrados:", data.length);
    return data as Vehiculo[];
}