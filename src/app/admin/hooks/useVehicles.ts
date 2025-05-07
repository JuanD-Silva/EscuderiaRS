// src/app/admin/hooks/useVehicles.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import toast from 'react-hot-toast';
import { supabase, VehiculoFormData, Vehiculo } from "../lib/supabase"; // Asegúrate que las rutas sean correctas
import {
  createVehiculo as apiCreateVehiculo,
  fetchVehiculos as apiFetchVehiculos,
  updateVehiculo as apiUpdateVehiculo,
  deleteVehiculo as apiDeleteVehiculo,
  marcarComoVendido as apiMarcarComoVendido,
  fetchVehiculosVendidos as apiFetchVehiculosVendidos,
} from "../services/vehicleService"; // Asegúrate que las rutas sean correctas

const initialFormData: VehiculoFormData = {
    linea: "", marca: "", modelo: "", km: "", tipo_caja: "", valor_venta: "",
    propietario_ubicacion: "", descripcion: "", soat: "", tecno: "", color: "",
    lugar_matricula: "", reporte: false, prenda: false, motor: "",
    estado: "disponible", imagenes: "", placa: "",
};

// Función auxiliar para obtener mensajes de error de forma segura
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  // Intenta manejar errores de Supabase u otros objetos con 'message'
  // Evita usar 'as any' aquí si es posible, pero a veces es necesario si el tipo de error es muy variado
  if (error && typeof error === 'object' && 'message' in error) {
    // Castea de forma más segura si sabes que es un objeto con message
    const maybeErrorWithMessage = error as { message?: unknown };
    if (typeof maybeErrorWithMessage.message === 'string') {
      return maybeErrorWithMessage.message || "Error con mensaje vacío.";
    }
  }
  try {
    const errorString = String(error);
    if (errorString !== '[object Object]') return errorString;
  } catch (_e) { // <--- CAMBIO: Prefijar 'e' no usado con '_'
    // Ignorar error de conversión
  }
  return "Ocurrió un error desconocido.";
}

export function useVehicles() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [vehiculosVendidos, setVehiculosVendidos] = useState<Vehiculo[]>([]);
  const [isLoadingVendidos, setIsLoadingVendidos] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'inventario' | 'vendidos'>('inventario');
  const [filtroMes, setFiltroMes] = useState<number>(new Date().getMonth() + 1);
  const [filtroAnio, setFiltroAnio] = useState<number>(new Date().getFullYear());
  const [formData, setFormData] = useState<VehiculoFormData>(initialFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadVehiculos = useCallback(async () => {
    console.log("[useVehicles] Cargando vehículos de inventario...");
    setIsLoadingList(true);
    setGeneralError(null);
    try {
      // fetchVehiculos devuelve { data, error }
      const { data, error: fetchError } = await apiFetchVehiculos();
      // Lanza un error si fetchVehiculos falló
      if (fetchError) throw fetchError; // fetchError ya debería ser un Error o tener .message
      // Filtra los vehículos no vendidos para la lista de inventario
      const inventario = data?.filter(v => !v.vendido) || [];
      setVehiculos(inventario);
      console.log("[useVehicles] Vehículos de inventario cargados:", inventario.length);
    } catch (err: unknown) { // Captura errores lanzados
      console.error("Error cargando vehículos de inventario:", err);
      const errorMsg = getErrorMessage(err);
      setGeneralError(errorMsg);
      toast.error(`Error inventario: ${errorMsg}`);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  const loadVehiculosVendidos = useCallback(async (month?: number, year?: number) => {
    const currentMonth = month ?? filtroMes;
    const currentYear = year ?? filtroAnio;
    console.log(`[useVehicles] Cargando vehículos vendidos para ${currentMonth}/${currentYear}...`);
    setIsLoadingVendidos(true);
    try {
      // apiFetchVehiculosVendidos devuelve Vehiculo[] o lanza error
      const data = await apiFetchVehiculosVendidos({ month: currentMonth, year: currentYear });
      setVehiculosVendidos(data);
      console.log("[useVehicles] Vehículos vendidos cargados:", data.length);
    } catch (err: unknown) {
      console.error("Error cargando vehículos vendidos:", err);
      const errorMsg = getErrorMessage(err);
      toast.error(`Error vendidos: ${errorMsg}`);
    } finally {
      setIsLoadingVendidos(false);
    }
  }, [filtroMes, filtroAnio]);

  useEffect(() => {
    console.log(`[useVehicles] useEffect - Pestaña activa: ${activeTab}`);
    if (activeTab === 'inventario') {
      loadVehiculos();
    } else if (activeTab === 'vendidos') {
      loadVehiculosVendidos();
    }
  }, [activeTab, loadVehiculos, loadVehiculosVendidos]);

  const updateFormField = useCallback(<K extends keyof VehiculoFormData>(field: K, value: VehiculoFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleImageChange = useCallback((file: File | null) => {
    setImageFile(file);
    if (file) {
      updateFormField('imagenes', '');
    }
  }, [updateFormField]);

  const clearForm = useCallback(() => {
    console.log("[useVehicles] Limpiando formulario.");
    setFormData(initialFormData);
    setImageFile(null);
    setEditId(null);
  }, []);

  const startEdit = useCallback((veh: Vehiculo) => {
    console.log("[useVehicles] Iniciando edición para vehículo ID:", veh.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setEditId(veh.id);
    setFormData({
      linea: veh.linea || "", marca: veh.marca || "",
      modelo: veh.modelo?.toString() ?? "", km: veh.km?.toString() ?? "",
      tipo_caja: veh.tipo_caja || "", valor_venta: veh.valor_venta?.toString() ?? "",
      propietario_ubicacion: veh.propietario_ubicacion || "",
      descripcion: veh.descripcion || "", soat: veh.soat || "", tecno: veh.tecno || "",
      color: veh.color || "", lugar_matricula: veh.lugar_matricula || "",
      reporte: veh.reporte ?? false, prenda: veh.prenda ?? false,
      motor: veh.motor || "", estado: veh.estado || "disponible",
      imagenes: veh.imagenes || "", placa: veh.placa || "",
    });
    setImageFile(null);
  }, []);

  const uploadImage = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const filePath = `autos/${fileName}`;
    console.log("[useVehicles] Subiendo imagen a:", filePath);
    const { error: uploadError } = await supabase.storage
      .from("escuderia-autos")
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error("Error subiendo imagen a Supabase Storage:", uploadError);
      throw new Error(getErrorMessage(uploadError)); // Lanza Error estándar
    }
    const { data: urlData } = supabase.storage.from("escuderia-autos").getPublicUrl(filePath);
    if (!urlData?.publicUrl) {
      console.error("No se pudo obtener la URL pública después de subir:", filePath);
      throw new Error("No se pudo obtener la URL pública de la imagen subida.");
    }
    console.log("[useVehicles] Imagen subida, URL pública:", urlData.publicUrl);
    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    console.log("[useVehicles] Iniciando handleSubmit:", editId ? `Editando ID ${editId}` : "Creando nuevo");
    setIsSubmitting(true);
    setGeneralError(null);
    const toastAction = editId ? 'actualizando' : 'creando';
    const toastId = toast.loading(editId ? 'Actualizando vehículo...' : 'Creando vehículo...');

    try {
      let imageUrl: string | null = formData.imagenes || null;
      if (imageFile) {
        console.log("[useVehicles] Subiendo nueva imagen...");
        imageUrl = await uploadImage(imageFile);
      } else {
        console.log("[useVehicles] No hay nuevo archivo de imagen, usando URL existente (si hay):", imageUrl);
      }

      const dataToSend: VehiculoFormData = {
        ...formData,
        imagenes: imageUrl || "",
      };

      if (editId) {
        console.log("[useVehicles] Llamando a apiUpdateVehiculo para ID:", editId, "con datos:", dataToSend);
        // apiUpdateVehiculo devuelve el vehículo actualizado o lanza error
        await apiUpdateVehiculo(editId, dataToSend);
        toast.success('Vehículo actualizado!', { id: toastId });
      } else {
        console.log("[useVehicles] Llamando a apiCreateVehiculo con datos:", dataToSend, "y URL de imagen:", imageUrl);
        // apiCreateVehiculo devuelve el vehículo creado o lanza error
        await apiCreateVehiculo(dataToSend, imageUrl);
        toast.success('Vehículo creado!', { id: toastId });
      }
      clearForm();
      await loadVehiculos(); // Siempre recargar inventario
      // Siempre recargar vendidos por si la edición afecta el estado o si se crea y luego se vende rápido
      await loadVehiculosVendidos();

    } catch (err: unknown) {
      console.error(`Error al ${toastAction} vehículo:`, err);
      const errorMsg = getErrorMessage(err);
      setGeneralError(errorMsg);
      toast.error(errorMsg, { id: toastId });
    } finally {
      console.log("[useVehicles] Finalizando handleSubmit.");
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    console.log("[useVehicles] Iniciando handleDelete para ID:", id);
    // Intenta encontrar el vehículo en cualquiera de las listas para el mensaje toast
    const vehicleToDelete = vehiculos.find(v => v.id === id) || vehiculosVendidos.find(v => v.id === id);
    const toastId = toast.loading(`Eliminando ${vehicleToDelete?.marca || 'vehículo'} ${vehicleToDelete?.linea || ''}...`);
    setGeneralError(null);

    try {
      console.log("[useVehicles] Llamando a apiDeleteVehiculo para ID:", id);
      // apiDeleteVehiculo lanza error si falla
      await apiDeleteVehiculo(id);

      // Lógica opcional para eliminar imagen de Storage
      if (vehicleToDelete?.imagenes) {
        try {
          let pathToDelete: string | undefined;
          // Intenta parsear la URL de forma más robusta
          if (vehicleToDelete.imagenes.includes('/storage/v1/object/public/')) {
              const urlParts = vehicleToDelete.imagenes.split('/public/');
              if (urlParts.length > 1) {
                  pathToDelete = urlParts[1];
              }
          }

          if (pathToDelete) {
            const [bucketName, ...filePathParts] = pathToDelete.split('/');
            const filePath = filePathParts.join('/');
            // Asegúrate que el bucketName sea el correcto
            if (bucketName && filePath && bucketName === "escuderia-autos") {
              console.log(`[useVehicles] Eliminando imagen de Storage: Bucket: ${bucketName}, Path: ${filePath}`);
              await supabase.storage.from(bucketName).remove([filePath]);
            } else {
               console.warn("[useVehicles] No se pudo determinar el bucket o path correcto para eliminar imagen:", vehicleToDelete.imagenes);
            }
          } else {
             console.warn("[useVehicles] URL de imagen no tiene el formato esperado para extraer el path:", vehicleToDelete.imagenes);
          }
        } catch (storageError: unknown) {
          console.warn("Advertencia: No se pudo eliminar la imagen de Storage:", getErrorMessage(storageError));
        }
      }

      toast.success('Vehículo eliminado.', { id: toastId });
      console.log("[useVehicles] Recargando listas después de eliminar...");
      // Recargar ambas listas ya que un vehículo puede ser eliminado desde cualquiera
      await loadVehiculos();
      await loadVehiculosVendidos();
    } catch (err: unknown) {
      console.error("Error al eliminar vehículo:", err);
      const errorMsg = getErrorMessage(err);
      setGeneralError(errorMsg);
      toast.error(errorMsg, { id: toastId });
      // Propagar el error para que el componente que llama (si es necesario) sepa que falló
      // Esto es importante para que el 'finally' en VehicleList funcione correctamente
      throw err;
    }
    // El spinner del botón se maneja en VehicleList (en el finally de su handler local)
  };

  const handleMarkAsSold = async (id: number): Promise<void> => {
    console.log("[useVehicles] Iniciando handleMarkAsSold para ID:", id);
    const vehicleToSell = vehiculos.find(v => v.id === id);
    if (!vehicleToSell) {
      toast.error("Vehículo no encontrado en inventario.");
      console.warn("[useVehicles] Vehículo no encontrado en inventario local, ID:", id);
      return; // Retorna explícitamente void si no se encuentra
    }

    const toastId = toast.loading(`Marcando ${vehicleToSell.marca} ${vehicleToSell.linea} como vendido...`);
    setGeneralError(null);

    try {
      console.log("[useVehicles] Llamando a apiMarcarComoVendido para ID:", id);
      // apiMarcarComoVendido devuelve el vehículo actualizado o lanza error
      await apiMarcarComoVendido(id);
      toast.success('Vehículo marcado como vendido.', { id: toastId });
      console.log("[useVehicles] Recargando listas después de marcar como vendido...");
      // Recargar ambas listas ya que afecta a ambas
      await loadVehiculos();
      await loadVehiculosVendidos();
    } catch (err: unknown) {
      console.error("Error al marcar como vendido:", err);
      const errorMsg = getErrorMessage(err);
      setGeneralError(errorMsg);
      toast.error(errorMsg, { id: toastId });
      // Propagar el error para el finally en el componente que llama
      throw err;
    }
    // El spinner del botón se maneja en VehicleList (en el finally de su handler local)
  };

  // --- Valores de Retorno del Hook ---
  return {
    // Estados
    vehiculos,
    isLoadingList,
    generalError,
    formData,
    imageFile,
    editId,
    isSubmitting,
    vehiculosVendidos,
    isLoadingVendidos,
    activeTab,
    setActiveTab,
    filtroMes,
    setFiltroMes,
    filtroAnio,
    setFiltroAnio,
    loadVehiculosVendidos, // Exportar si se llama desde fuera (ej. botón aplicar filtros)

    // Handlers
    handleImageChange,
    updateFormField,
    handleSubmit,
    handleDelete,
    handleMarkAsSold,
    startEdit,
    clearForm,
  };
}