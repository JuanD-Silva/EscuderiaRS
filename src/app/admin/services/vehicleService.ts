// src/app/admin/services/vehicleService.ts
import { supabase, VehiculoFormData, Vehiculo } from "../lib/supabase";

type VehiculoPayload = Partial<Omit<Vehiculo, 'id' | 'created_at'>>;

function getErrorMessage(error: unknown): string {
  // ... (sin cambios)
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const maybeErrorWithMessage = error as { message?: unknown }; 
    if (typeof maybeErrorWithMessage.message === 'string') {
      return maybeErrorWithMessage.message || "Error con mensaje vacío.";
    }
  }
  try {
      const errorString = String(error);
      if (errorString !== '[object Object]') {
          return errorString;
      }
  } catch (_e) { /* Ignorar */ }
  return "Ocurrió un error desconocido.";
}

// La función de parseo ahora directamente usa formData.imagenes que ya viene como string formateado
function parseAndValidateFormData(formData: VehiculoFormData): Partial<Vehiculo> {
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

  const valorNum = parseFloat(String(formData.valor_venta).replace(/[^0-9.-]+/g,"")); // Limpiar formato moneda
  parsed.valor_venta = !isNaN(valorNum) ? valorNum : null;

  parsed.reporte = formData.reporte ?? false;
  parsed.prenda = formData.prenda ?? false;
  
  // formData.imagenes ya viene como el string formateado "{url1,url2}" o string vacío/null
  parsed.imagenes = formData.imagenes && formData.imagenes.trim() !== "" ? formData.imagenes.trim() : null;


  if (!parsed.marca || !parsed.linea || !parsed.modelo || !parsed.placa || !parsed.valor_venta) {
      console.warn("Advertencia: Campos obligatorios faltantes o inválidos en parseAndValidateFormData:", parsed);
  }

  return parsed;
}


// createVehiculo ahora no necesita el argumento imageUrl separado,
// ya que formData.imagenes contendrá el string de URLs formateado desde el hook.
export async function createVehiculo(formData: VehiculoFormData, _imageUrl_deprecated: string | null /*No usado*/): Promise<Vehiculo> {
  const parsedData: Partial<Vehiculo> = parseAndValidateFormData(formData);
  parsedData.vendido = false; // Por defecto no está vendido al crear
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
    // ... (sin cambios)
    console.log("[fetchVehiculos] Obteniendo todos los vehículos...");
    const result = await supabase
        .from("Autos")
        .select(`*`)
        .order("created_at", { ascending: false });
    console.log(`[fetchVehiculos] Se encontraron ${result.data?.length ?? 0} vehículos.`);
    if(result.error) {
        console.error("[fetchVehiculos] Error de Supabase:", result.error);
        throw new Error(getErrorMessage(result.error));
    }
    return result;
}

// updateVehiculo también usa formData.imagenes que ya viene como string formateado.
export async function updateVehiculo(id: number, formData: VehiculoFormData): Promise<Vehiculo> {
    const parsedData: Partial<Vehiculo> = parseAndValidateFormData(formData);
    delete parsedData.id;
    delete parsedData.created_at;
    // 'vendido' no se actualiza desde este formulario general, sino con marcarComoVendido
    // delete parsedData.vendido; // Comentado, ya que 'vendido' no está en VehiculoFormData, pero sí en Vehiculo

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
  // ... (sin cambios en su lógica principal, la eliminación de imágenes de storage se maneja en el hook)
  console.log("[deleteVehiculo] Eliminando ID:", id);
  const { error } = await supabase.from("Autos").delete().eq("id", id); 
  if (error) {
    console.error("[deleteVehiculo] Error de Supabase:", error);
    throw new Error(getErrorMessage(error)); 
  }
  console.log(`[deleteVehiculo] Solicitud de eliminación para ID ${id} enviada.`);
}

export async function marcarComoVendido(id: number): Promise<Vehiculo> {
  // ... (sin cambios)
  console.log("[marcarComoVendido] Marcando como vendido ID:", id);
  const updatePayload = {
    vendido: true,
    fecha_venta: new Date().toISOString(),
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
    // ... (sin cambios)
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
    const resultData = data || [];
    console.log("[fetchVehiculosVendidos] Vehículos vendidos encontrados:", resultData.length);
    return resultData as Vehiculo[];
}
