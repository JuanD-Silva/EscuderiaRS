// src/app/admin/services/vehicleService.ts
import { supabase, VehiculoFormData, Vehiculo } from "../lib/supabase";

// --- Tipo de Payload para Supabase ---
type VehiculoPayload = Partial<Omit<Vehiculo, 'id' | 'created_at'>>;

// --- Función Auxiliar getErrorMessage ---
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  // Intenta manejar errores de Supabase u otros objetos con 'message'
  // de forma más segura sin 'as any' explícito
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
  } catch (_e) { // <--- CAMBIO: Prefijar 'e' con '_' ya que no se usa
     /* Ignorar error de conversión */
  }
  return "Ocurrió un error desconocido.";
}

// --- Función de Parseo ---
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

  // Validación básica
  if (!parsed.marca || !parsed.linea || !parsed.modelo || !parsed.placa || !parsed.valor_venta) {
      console.warn("Advertencia: Campos obligatorios faltantes o inválidos en parseAndValidateFormData:", parsed);
      // throw new Error("Faltan campos obligatorios."); // Considera lanzar error
  }

  return parsed;
}

// --- Funciones de Servicio CRUD ---

export async function createVehiculo(formData: VehiculoFormData, imageUrl: string | null): Promise<Vehiculo> {
  const parsedData: Partial<Vehiculo> = parseAndValidateFormData(formData, imageUrl);
  parsedData.vendido = false;
  delete parsedData.id;
  delete parsedData.created_at;

  const payload: VehiculoPayload = parsedData;
  console.log("Insertando payload:", payload);

  const { data, error } = await supabase
    .from("Autos")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("[createVehiculo] Error de Supabase:", error);
    throw new Error(getErrorMessage(error));
  }
  if (!data) {
    console.error("[createVehiculo] No se recibieron datos después de la inserción.");
    throw new Error("No se pudo crear el vehículo, no se devolvieron datos.");
  }
  console.log("[createVehiculo] Vehículo creado exitosamente:", data);
  return data as Vehiculo;
}

export async function fetchVehiculos() {
    console.log("[fetchVehiculos] Obteniendo todos los vehículos...");
    const result = await supabase
        .from("Autos")
        .select(`*`)
        .order("created_at", { ascending: false });
    console.log(`[fetchVehiculos] Se encontraron ${result.data?.length ?? 0} vehículos.`);
    if(result.error) {
        console.error("[fetchVehiculos] Error de Supabase:", result.error);
        // Lanzar error para que el hook lo maneje consistentemente
        throw new Error(getErrorMessage(result.error));
    }
    // Devolver solo data si el hook está preparado para eso,
    // o mantener la devolución de { data, error } si el hook lo necesita.
    // Asumiendo que el hook solo necesita 'data' tras verificar 'error'
    return result; // Devolver el objeto completo para que el hook maneje data/error
}

export async function updateVehiculo(id: number, formData: VehiculoFormData): Promise<Vehiculo> {
    const parsedData: Partial<Vehiculo> = parseAndValidateFormData(formData, formData.imagenes);
    delete parsedData.id;
    delete parsedData.created_at;
    delete parsedData.vendido;

    const payload: VehiculoPayload = parsedData;
    console.log("Actualizando ID", id, "con payload:", payload);

    const { data, error } = await supabase
        .from("Autos")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

    if (error) {
      console.error("[updateVehiculo] Error de Supabase:", error);
      throw new Error(getErrorMessage(error));
    }
    if (!data) {
      console.error(`[updateVehiculo] No se recibieron datos después de actualizar ID ${id}.`);
      throw new Error(`No se pudo actualizar el vehículo con ID ${id}, no se devolvieron datos.`);
    }
    console.log(`[updateVehiculo] Vehículo ID ${id} actualizado exitosamente:`, data);
    return data as Vehiculo;
}

export async function deleteVehiculo(id: number) {
  console.log("[deleteVehiculo] Eliminando ID:", id);
  const { error } = await supabase.from("Autos").delete().eq("id", id); // No necesitamos 'data' para delete
  if (error) {
    console.error("[deleteVehiculo] Error de Supabase:", error);
    throw new Error(getErrorMessage(error)); // Lanza el error
  }
  console.log(`[deleteVehiculo] Solicitud de eliminación para ID ${id} enviada.`);
  // No es necesario devolver nada si la operación fue exitosa y no lanzó error
}

export async function marcarComoVendido(id: number): Promise<Vehiculo> {
  console.log("[marcarComoVendido] Marcando como vendido ID:", id);
  const updatePayload = {
    vendido: true,
    fecha_venta: new Date().toISOString(),
    // estado: 'vendido' // Si aplica
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
    // Devolver un array vacío directamente si data es null o undefined
    const resultData = data || [];
    console.log("[fetchVehiculosVendidos] Vehículos vendidos encontrados:", resultData.length);
    return resultData as Vehiculo[];
}