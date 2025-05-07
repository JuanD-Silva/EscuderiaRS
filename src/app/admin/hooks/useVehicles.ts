// src/app/admin/hooks/useVehicles.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import toast from 'react-hot-toast';
import { supabase, VehiculoFormData, Vehiculo } from "../lib/supabase";
import {
  createVehiculo as apiCreateVehiculo,
  fetchVehiculos as apiFetchVehiculos,
  updateVehiculo as apiUpdateVehiculo,
  deleteVehiculo as apiDeleteVehiculo,
  marcarComoVendido as apiMarcarComoVendido,
  fetchVehiculosVendidos as apiFetchVehiculosVendidos,
} from "../services/vehicleService";

const initialFormData: VehiculoFormData = {
    linea: "", marca: "", modelo: "", km: "", tipo_caja: "", valor_venta: "",
    propietario_ubicacion: "", descripcion: "", soat: "", tecno: "", color: "",
    lugar_matricula: "", reporte: false, prenda: false, motor: "",
    estado: "disponible", imagenes: "", placa: "",
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
    return (error as { message: string }).message || "Error con mensaje vacío.";
  }
  try {
    const errorString = String(error);
    if (errorString !== '[object Object]') return errorString;
  } catch (e) { /* Ignorar */ }
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
      const { data, error: fetchError } = await apiFetchVehiculos();
      if (fetchError) throw fetchError;
      const inventario = data?.filter(v => !v.vendido) || [];
      setVehiculos(inventario);
      console.log("[useVehicles] Vehículos de inventario cargados:", inventario.length);
    } catch (err: unknown) {
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
      updateFormField('imagenes', ''); // Limpia la URL de imagen existente si se selecciona un nuevo archivo
    }
  }, [updateFormField]);

  const clearForm = useCallback(() => {
    console.log("[useVehicles] Limpiando formulario.");
    setFormData(initialFormData);
    setImageFile(null);
    setEditId(null);
    // setIsSubmitting(false); // No es necesario resetear isSubmitting aquí, se hace en handleSubmit
  }, []);

  const startEdit = useCallback((veh: Vehiculo) => {
    console.log("[useVehicles] Iniciando edición para vehículo ID:", veh.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setEditId(veh.id);
    setFormData({
      linea: veh.linea || "", marca: veh.marca || "",
      modelo: veh.modelo?.toString() ?? "", km: veh.km?.toString() ?? "",
      tipo_caja: veh.tipo_caja || "", valor_venta: veh.valor_venta?.toString() ?? "",
      propietario_ubicacion: veh.propietario_ubicacion || "", // Ajusta si propietario_ubicacion es un objeto
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
      throw new Error(getErrorMessage(uploadError));
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
      let imageUrl: string | null = formData.imagenes || null; // URL existente o null
      if (imageFile) {
        console.log("[useVehicles] Subiendo nueva imagen...");
        imageUrl = await uploadImage(imageFile);
      } else {
        console.log("[useVehicles] No hay nuevo archivo de imagen, usando URL existente (si hay):", imageUrl);
      }

      // Construye el objeto de datos para enviar, manteniendo los tipos de VehiculoFormData
      // La función de servicio (apiCreateVehiculo/apiUpdateVehiculo) se encargará del parseo final.
      const dataToSend: VehiculoFormData = {
        ...formData, // Copia todos los campos del formulario actual
        imagenes: imageUrl || "", // Asegura que 'imagenes' sea string (o el tipo esperado por VehiculoFormData)
                                   // Si VehiculoFormData.imagenes puede ser null, entonces `imageUrl || null` está bien.
                                   // Tu VehiculoFormData.imagenes es string, así que '' es mejor que null.
      };
      // Los campos como 'modelo', 'km', 'valor_venta' ya están como strings en formData,
      // que es lo que espera VehiculoFormData.

      if (editId) {
        console.log("[useVehicles] Llamando a apiUpdateVehiculo para ID:", editId, "con datos:", dataToSend);
        await apiUpdateVehiculo(editId, dataToSend); // Pasa VehiculoFormData
        toast.success('Vehículo actualizado!', { id: toastId });
      } else {
        console.log("[useVehicles] Llamando a apiCreateVehiculo con datos:", dataToSend, "y URL de imagen:", imageUrl);
        // apiCreateVehiculo espera VehiculoFormData y la URL de imagen por separado.
        // Asegúrate de que la firma de apiCreateVehiculo sea (formData: VehiculoFormData, imageUrl: string | null)
        await apiCreateVehiculo(dataToSend, imageUrl);
        toast.success('Vehículo creado!', { id: toastId });
      }
      clearForm();
      await loadVehiculos();
      if (activeTab === 'vendidos') {
        await loadVehiculosVendidos();
      }
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
    const vehicleToDelete = vehiculos.find(v => v.id === id) || vehiculosVendidos.find(v => v.id === id);
    const toastId = toast.loading(`Eliminando ${vehicleToDelete?.marca || 'vehículo'} ${vehicleToDelete?.linea || ''}...`);
    setGeneralError(null);
    try {
      console.log("[useVehicles] Llamando a apiDeleteVehiculo para ID:", id);
      await apiDeleteVehiculo(id);
      if (vehicleToDelete?.imagenes) {
        try {
          // Intenta parsear la URL de manera más segura
          let pathToDelete: string | undefined;
          if (vehicleToDelete.imagenes.includes('/storage/v1/object/public/')) {
            pathToDelete = vehicleToDelete.imagenes.split('/public/')[1];
          }

          if (pathToDelete) {
            const [bucketName, ...filePathParts] = pathToDelete.split('/');
            const filePath = filePathParts.join('/');
            if (bucketName && filePath && bucketName === "escuderia-autos") { // Verifica el nombre del bucket
              console.log(`[useVehicles] Eliminando imagen de Storage: Bucket: ${bucketName}, Path: ${filePath}`);
              await supabase.storage.from(bucketName).remove([filePath]);
            } else {
              console.warn("[useVehicles] No se pudo determinar el bucket o path correcto para eliminar imagen:", vehicleToDelete.imagenes);
            }
          }
        } catch (storageError: unknown) {
          console.warn("Advertencia: No se pudo eliminar la imagen de Storage:", getErrorMessage(storageError));
        }
      }
      toast.success('Vehículo eliminado.', { id: toastId });
      console.log("[useVehicles] Recargando listas después de eliminar...");
      await loadVehiculos();
      await loadVehiculosVendidos();
    } catch (err: unknown) {
      console.error("Error al eliminar vehículo:", err);
      const errorMsg = getErrorMessage(err);
      setGeneralError(errorMsg);
      toast.error(errorMsg, { id: toastId });
      throw err;
    }
  };

  const handleMarkAsSold = async (id: number): Promise<void> => {
    console.log("[useVehicles] Iniciando handleMarkAsSold para ID:", id);
    const vehicleToSell = vehiculos.find(v => v.id === id);
    if (!vehicleToSell) {
      toast.error("Vehículo no encontrado en inventario.");
      console.warn("[useVehicles] Vehículo no encontrado en inventario local, ID:", id);
      return;
    }
    const toastId = toast.loading(`Marcando ${vehicleToSell.marca} ${vehicleToSell.linea} como vendido...`);
    setGeneralError(null);
    try {
      console.log("[useVehicles] Llamando a apiMarcarComoVendido para ID:", id);
      await apiMarcarComoVendido(id);
      toast.success('Vehículo marcado como vendido.', { id: toastId });
      console.log("[useVehicles] Recargando listas después de marcar como vendido...");
      await loadVehiculos();
      await loadVehiculosVendidos();
    } catch (err: unknown) {
      console.error("Error al marcar como vendido:", err);
      const errorMsg = getErrorMessage(err);
      setGeneralError(errorMsg);
      toast.error(errorMsg, { id: toastId });
      throw err;
    }
  };

  return {
    vehiculos, isLoadingList, generalError, formData, imageFile, editId,
    isSubmitting, vehiculosVendidos, isLoadingVendidos, activeTab, setActiveTab,
    filtroMes, setFiltroMes, filtroAnio, setFiltroAnio, loadVehiculosVendidos,
    handleImageChange, updateFormField, handleSubmit, handleDelete,
    handleMarkAsSold, startEdit, clearForm,
  };
}