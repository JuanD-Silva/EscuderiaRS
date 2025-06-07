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
import { getAllImageUrlsFromString } from "@/app/lib/utils"; // Para parsear al editar

const initialFormData: VehiculoFormData = {
    linea: "", marca: "", modelo: "", km: "", tipo_caja: "", valor_venta: "",
    propietario_ubicacion: "", descripcion: "", soat: "", tecno: "", color: "",
    lugar_matricula: "", reporte: false, prenda: false, motor: "",
    estado: "disponible", imagenes: "", placa: "", // 'imagenes' en formData se mantiene como string para la URL existente al editar
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const maybeErrorWithMessage = error as { message?: unknown };
    if (typeof maybeErrorWithMessage.message === 'string') {
      return maybeErrorWithMessage.message || "Error con mensaje vacío.";
    }
  }
  try {
    const errorString = String(error);
    if (errorString !== '[object Object]') return errorString;
  } catch { /* Ignorar */ }
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
  const [editId, setEditId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para múltiples imágenes
  const [imageFiles, setImageFiles] = useState<File[]>([]); // Nuevos archivos a subir
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]); // URLs de imágenes ya guardadas (al editar)
  const [imageUrlsToDelete, setImageUrlsToDelete] = useState<string[]>([]); // URLs marcadas para borrar del storage al actualizar

  const loadVehiculos = useCallback(async () => {
    // ... (sin cambios)
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
    // ... (sin cambios)
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
    // ... (sin cambios)
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

  // Manejar cambio en input de archivos múltiples
  const handleImageChange = useCallback((files: FileList | null) => {
    if (files) {
      // Añadir nuevos archivos a la lista, evitando duplicados si se seleccionan de nuevo
      // (aunque el input file típicamente reemplaza la selección)
      const newFilesArray = Array.from(files);
      setImageFiles(prevFiles => {
        // Simple concatenación por ahora, se pueden añadir lógicas más complejas
        // para evitar duplicados exactos si es necesario.
        const combined = [...prevFiles, ...newFilesArray];
        // Limitar cantidad de imágenes si es necesario
        // const MAX_IMAGES = 10;
        // return combined.slice(0, MAX_IMAGES);
        return combined;
      });
    }
  }, []);

  // Quitar un archivo nuevo de la lista de subida
  const handleRemoveNewImage = useCallback((indexToRemove: number) => {
    setImageFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  }, []);

  // Marcar una URL existente para eliminación (y quitarla de la preview)
  const handleRemoveExistingImage = useCallback((indexToRemove: number) => {
    const urlToRemove = existingImageUrls[indexToRemove];
    if (urlToRemove) {
      setImageUrlsToDelete(prev => [...prev, urlToRemove]);
      setExistingImageUrls(prevUrls => prevUrls.filter((_, index) => index !== indexToRemove));
    }
  }, [existingImageUrls]);


  const clearForm = useCallback(() => {
    console.log("[useVehicles] Limpiando formulario.");
    setFormData(initialFormData);
    setEditId(null);
    setImageFiles([]);
    setExistingImageUrls([]);
    setImageUrlsToDelete([]);
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
      imagenes: veh.imagenes || "", // Este se usa para la lógica de 'imageUrl' en submit
      placa: veh.placa || "",
    });
    setImageFiles([]); // Limpiar selección de archivos nuevos
    setExistingImageUrls(getAllImageUrlsFromString(veh.imagenes)); // Parsear string a array de URLs
    setImageUrlsToDelete([]); // Limpiar URLs a eliminar
  }, []);

  // Sube un array de archivos y devuelve un array de URLs
  const uploadImages = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];
    console.log(`[useVehicles] Subiendo ${files.length} imágenes...`);
    
    const uploadPromises = files.map(async (file) => {
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const filePath = `autos/${fileName}`;
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
      return urlData.publicUrl;
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    console.log("[useVehicles] Imágenes subidas, URLs:", uploadedUrls);
    return uploadedUrls;
  };
  
  // Elimina imágenes de Supabase Storage
  const deleteImagesFromStorage = async (urls: string[]) => {
    if (urls.length === 0) return;
    console.log("[useVehicles] Eliminando imágenes de Storage:", urls);
    const pathsToDelete: string[] = [];
    urls.forEach(url => {
      try {
        if (url.includes('/storage/v1/object/public/')) {
            const urlParts = url.split('/public/');
            if (urlParts.length > 1) {
                const path = urlParts[1];
                // Asegurarse que el path comience con el nombre del bucket correcto si está incluido
                if (path.startsWith('escuderia-autos/')) {
                   pathsToDelete.push(path.substring('escuderia-autos/'.length));
                } else {
                   pathsToDelete.push(path); // Asumir que es el path dentro del bucket
                }
            }
        }
      } catch (e) {
        console.warn(`Error parseando URL para eliminar de storage: ${url}`, e);
      }
    });

    if (pathsToDelete.length > 0) {
      const { data, error } = await supabase.storage.from('escuderia-autos').remove(pathsToDelete);
      if (error) {
        console.warn("Advertencia: No se pudieron eliminar algunas imágenes de Storage:", getErrorMessage(error));
        // No lanzar error crítico aquí, solo advertir.
      } else {
        console.log("Imágenes eliminadas de Storage exitosamente:", data);
      }
    }
  };


  const handleSubmit = async () => {
    console.log("[useVehicles] Iniciando handleSubmit:", editId ? `Editando ID ${editId}` : "Creando nuevo");
    setIsSubmitting(true);
    setGeneralError(null);
    const toastAction = editId ? 'actualizando' : 'creando';
    const toastId = toast.loading(editId ? 'Actualizando vehículo...' : 'Creando vehículo...');

    try {
      let finalImageUrls: string[] = [...existingImageUrls]; // Empezar con las existentes que no se marcaron para borrar

      // 1. Subir nuevos archivos si los hay
      if (imageFiles.length > 0) {
        const newUploadedUrls = await uploadImages(imageFiles);
        finalImageUrls = [...finalImageUrls, ...newUploadedUrls];
      }
      
      // 2. Si se está editando, eliminar las imágenes marcadas para borrar de Supabase Storage
      if (editId && imageUrlsToDelete.length > 0) {
        await deleteImagesFromStorage(imageUrlsToDelete);
      }

      // 3. Formatear el array de URLs a un string para la BD
      //    (ej: "{url1,url2,url3}" o un JSON string si prefieres)
      //    Usaremos el formato de llaves y comas por consistencia con getFirstImageUrlFromString
      const imagenesString = finalImageUrls.length > 0 ? `{${finalImageUrls.map(url => `"${url}"`).join(',')}}` : null;

      const dataToSend: VehiculoFormData = {
        ...formData,
        imagenes: imagenesString || "", // Asegurar que sea string o string vacío, no null aquí para el tipo
      };
      
      // Validar que haya al menos una imagen si se está creando
      if (!editId && finalImageUrls.length === 0) {
        throw new Error("Debes subir al menos una imagen para el nuevo vehículo.");
      }


      if (editId) {
        console.log("[useVehicles] Llamando a apiUpdateVehiculo para ID:", editId, "con datos:", dataToSend);
        await apiUpdateVehiculo(editId, dataToSend); // El servicio ya maneja el string de imágenes
        toast.success('Vehículo actualizado!', { id: toastId });
      } else {
        console.log("[useVehicles] Llamando a apiCreateVehiculo con datos:", dataToSend);
        // apiCreateVehiculo ahora solo necesita VehiculoFormData, el string de imágenes ya está en dataToSend.imagenes
        await apiCreateVehiculo(dataToSend); // El segundo argumento de imagen individual ya no es necesario
        toast.success('Vehículo creado!', { id: toastId });
      }
      clearForm();
      await loadVehiculos(); 
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
    const vehicleToDelete = vehiculos.find(v => v.id === id) || vehiculosVendidos.find(v => v.id === id);
    const toastId = toast.loading(`Eliminando ${vehicleToDelete?.marca || 'vehículo'} ${vehicleToDelete?.linea || ''}...`);
    setGeneralError(null);

    try {
      console.log("[useVehicles] Llamando a apiDeleteVehiculo para ID:", id);
      
      // Obtener URLs de imágenes ANTES de borrar el registro de la BD
      const urlsToDeleteFromStorage = vehicleToDelete?.imagenes ? getAllImageUrlsFromString(vehicleToDelete.imagenes) : [];

      await apiDeleteVehiculo(id); // Eliminar de la BD

      // Eliminar imágenes de Storage
      if (urlsToDeleteFromStorage.length > 0) {
        await deleteImagesFromStorage(urlsToDeleteFromStorage);
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
    // ... (sin cambios)
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
    vehiculos,
    isLoadingList,
    generalError,
    formData,
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
    loadVehiculosVendidos, 
    
    // Nuevos estados y handlers para imágenes múltiples
    imageFiles,
    existingImageUrls,
    handleImageChange,
    handleRemoveNewImage,
    handleRemoveExistingImage,

    updateFormField,
    handleSubmit,
    handleDelete,
    handleMarkAsSold,
    startEdit,
    clearForm,
  };
}