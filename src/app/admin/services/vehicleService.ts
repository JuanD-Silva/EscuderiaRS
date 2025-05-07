// src/app/admin/services/vehicleService.ts
import { supabase, VehiculoFormData, Vehiculo } from "../lib/supabase";

// Función de parseo mejorada y separada
function parseAndValidateFormData(formData: VehiculoFormData, imageUrl?: string | null): Partial<Vehiculo> {
  const parsed: Partial<Vehiculo> = {};

  // Campos de texto (mantener null si están vacíos)
  parsed.linea = formData.linea?.trim() || null;
  parsed.marca = formData.marca?.trim() || null;
  parsed.tipo_caja = formData.tipo_caja?.trim() || null;
  parsed.propietario_ubicacion = formData.propietario_ubicacion?.trim() || null;
  parsed.descripcion = formData.descripcion?.trim() || null;
  parsed.color = formData.color?.trim() || null;
  parsed.lugar_matricula = formData.lugar_matricula?.trim() || null;
  parsed.motor = formData.motor?.trim() || null;
  parsed.estado = formData.estado?.trim() || 'disponible'; // Estado por defecto
  parsed.placa = formData.placa?.trim().toUpperCase() || null;

  // Fechas (mantener null si están vacías)
  parsed.soat = formData.soat || null;
  parsed.tecno = formData.tecno || null;

  // Números (parsear y validar, devolver null si no es válido)
  const modeloNum = parseInt(formData.modelo, 10);
  parsed.modelo = !isNaN(modeloNum) ? modeloNum : null;

  const kmNum = parseInt(formData.km, 10);
  parsed.km = !isNaN(kmNum) ? kmNum : null;

  const valorNum = parseFloat(formData.valor_venta); // Usar parseFloat para permitir decimales si aplica
  parsed.valor_venta = !isNaN(valorNum) ? valorNum : null;

  // Booleanos (ya vienen como boolean del FormField)
  parsed.reporte = formData.reporte ?? false;
  parsed.prenda = formData.prenda ?? false;

  // Imagen (usar la URL pasada o la del formData si existe)
  parsed.imagenes = imageUrl ?? (formData.imagenes || null);

  // Vendido (generalmente se maneja aparte, no desde el form principal)
  // parsed.vendido = false; // Se establece en false al crear

  // Filtrar propiedades con valor undefined antes de devolver
  Object.keys(parsed).forEach(key => {
     if (parsed[key as keyof typeof parsed] === undefined) {
        delete parsed[key as keyof typeof parsed];
      }
  });


  // Validaciones adicionales (opcional, lanzar error si algo es inválido)
  if (!parsed.marca || !parsed.linea || !parsed.modelo || !parsed.placa || !parsed.valor_venta) {
      console.error("Datos inválidos detectados:", parsed);
      // Podrías lanzar un error aquí para detener el proceso
      // throw new Error("Faltan campos obligatorios o tienen formato incorrecto.");
  }


  return parsed;
}


export async function createVehiculo(formData: VehiculoFormData, imageUrl: string | null) {
  const parsedData = parseAndValidateFormData(formData, imageUrl);
  // Asegurar que 'vendido' sea false al crear
  parsedData.vendido = false;
  // Asegurarse que no se envie ID al crear
  delete parsedData.id;
  delete parsedData.created_at;

  console.log("Insertando:", parsedData);
  return await supabase.from("Autos").insert(parsedData as any).select().single(); // `as any` puede ser necesario si el tipo Partial<Vehiculo> no coincide 100% con lo esperado por insert
}

export async function fetchVehiculos() {
    // Seleccionar solo las columnas necesarias
    return await supabase
        .from("Autos")
        .select(`
            *
        `) // Ajusta las columnas según necesites en la lista
        .order("created_at", { ascending: false });
}

export async function updateVehiculo(id: number, formData: VehiculoFormData) { // Recibe FormData completo
    const parsedData = parseAndValidateFormData(formData, formData.imagenes); // Usar URL del formData si no se subió nueva
    // Eliminar campos que no deben actualizarse directamente (ej: created_at, vendido se maneja aparte)
    delete parsedData.id;
    delete parsedData.created_at;
    delete parsedData.vendido; // El estado 'vendido' se actualiza por separado

    console.log("Actualizando ID", id, "con:", parsedData);
    return await supabase
        .from("Autos")
        .update(parsedData as any) // `as any` puede ser necesario
        .eq("id", id)
        .select()
        .single();
}


export async function deleteVehiculo(id: number) {
  console.log("Eliminando ID", id);
  return await supabase.from("Autos").delete().eq("id", id);
}



export async function marcarComoVendido(id: number): Promise<Vehiculo> { // Puedes seguir devolviendo el vehículo actualizado
  console.log("[vehicleService] Marcando como vendido (solo columna 'vendido') ID:", id);

  const { data, error } = await supabase
    .from("Autos")
    .update({
      vendido: true,
      fecha_venta: new Date().toISOString(),
       // ÚNICAMENTE actualizamos la columna 'vendido'
      // NO incluimos la columna 'estado' aquí
    })
    .eq("id", id)
    .select() // Buena práctica para obtener el registro actualizado
    .single(); // Si esperas que solo se actualice un registro

  if (error) {
    console.error("[vehicleService] Error de Supabase al marcar como vendido (solo columna 'vendido'):", error);
    // Lanza un nuevo error con el mensaje del error de Supabase.
    throw new Error(error.message || "Error desconocido en la base de datos al actualizar 'vendido'.");
  }

  if (!data) {
    // Esto ocurre si el ID no se encontró, pero no hubo error de BD.
    console.warn(`[vehicleService] No se encontró el vehículo con ID ${id} para actualizar 'vendido'.`);
    throw new Error(`Vehículo con ID ${id} no encontrado.`);
  }

  console.log("[vehicleService] Columna 'vendido' actualizada a true exitosamente para:", data);
  return data as Vehiculo; // Devuelve el vehículo actualizado
}

// AÑADE ESTA NUEVA FUNCIÓN
export async function fetchVehiculosVendidos(filters?: { month?: number, year?: number }) {
  console.log("[vehicleService] Fetching vehículos vendidos con filtros:", filters);
  let query = supabase
      .from("Autos")
      // Simplemente selecciona todas las columnas, o especifícalas si quieres ser selectivo.
      // 'propietario_ubicacion' es solo una columna más de 'Autos'.
      .select("*") // Esto ya incluye 'propietario_ubicacion' y todas las demás columnas de 'Autos'
      // Si solo quisieras algunas columnas específicas, las listarías:
      // .select("id, marca, linea, modelo, placa, fecha_venta, propietario_ubicacion, valor_venta, vendido")
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
      console.error("[vehicleService] Error fetching vehículos vendidos:", error);
      throw new Error(error.message || "Error al obtener vehículos vendidos.");
  }

  if (!data) {
      console.log("[vehicleService] No se encontraron vehículos vendidos para los filtros aplicados.");
      return []; // Devuelve array vacío si no hay datos
  }

  console.log("[vehicleService] Vehículos vendidos encontrados:", data.length);
  // Asegurarse de que el tipo devuelto coincida con lo que espera el resto de tu código
  return data as Vehiculo[]; // O simplemente data si la inferencia es correcta
}