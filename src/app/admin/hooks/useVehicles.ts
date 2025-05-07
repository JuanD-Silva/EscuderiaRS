// src/app/admin/hooks/useVehicles.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import toast from 'react-hot-toast'; // Importar toast
import { supabase, VehiculoFormData, Vehiculo } from "../lib/supabase";
import {
  createVehiculo as apiCreateVehiculo,
  fetchVehiculos as apiFetchVehiculos,
  updateVehiculo as apiUpdateVehiculo,
  deleteVehiculo as apiDeleteVehiculo,
  marcarComoVendido as apiMarcarComoVendido,
  fetchVehiculosVendidos as apiFetchVehiculosVendidos,
} from "../services/vehicleService";

// Estado inicial vacío y limpio
const initialFormData: VehiculoFormData = {
    linea: "", marca: "", modelo: "", km: "", tipo_caja: "", valor_venta: "",
    propietario_ubicacion: "", descripcion: "", soat: "", tecno: "", color: "",
    lugar_matricula: "", reporte: false, prenda: false, motor: "",
    estado: "disponible", imagenes: "", placa: "", 
};

export function useVehicles() {
  // Estados Generales
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true); // Carga inicial de la lista
  const [generalError, setGeneralError] = useState<string | null>(null);
    
  const [vehiculosVendidos, setVehiculosVendidos] = useState<Vehiculo[]>([]); // <-- AÑADIDO
  const [isLoadingVendidos, setIsLoadingVendidos] = useState(false);          // <-- AÑADIDO
  const [activeTab, setActiveTab] = useState<'inventario' | 'vendidos'>('inventario'); // <-- AÑADIDO
  const [filtroMes, setFiltroMes] = useState<number>(new Date().getMonth() + 1); // Mes actual por defecto
  const [filtroAnio, setFiltroAnio] = useState<number>(new Date().getFullYear()); // Año actual por defecto

  // Estados del Formulario
  const [formData, setFormData] = useState<VehiculoFormData>(initialFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Para el botón de submit

  // --- Carga Inicial ---
  const loadVehiculos = useCallback(async () => {
    setIsLoadingList(true);
    setGeneralError(null);
    try {
      const { data, error } = await apiFetchVehiculos();
      if (error) throw error;
      setVehiculos(data || []);
    } catch (err: any) {
      console.error("Error cargando vehículos:", err);
      const errorMsg = err.message || "Error desconocido al cargar vehículos.";
      setGeneralError(errorMsg);
      toast.error(errorMsg); // Mostrar error con toast
    } finally {
      setIsLoadingList(false);
    }
  }, []);

    // --- Carga de Vehículos Vendidos ---
    const loadVehiculosVendidos = useCallback(async (month?: number, year?: number) => {
      setIsLoadingVendidos(true);
      setGeneralError(null); // Podrías tener un error específico para esta lista
      try {
        // Usar los estados de filtro si no se pasan argumentos
        const currentMonth = month ?? filtroMes;
        const currentYear = year ?? filtroAnio;
        const data = await apiFetchVehiculosVendidos({ month: currentMonth, year: currentYear });
        setVehiculosVendidos(data);
      } catch (err: any) {
        console.error("Error cargando vehículos vendidos:", err);
        const errorMsg = err.message || "Error desconocido al cargar vehículos vendidos.";
        // setGeneralError(errorMsg); // O un estado de error específico
        toast.error(errorMsg);
      } finally {
        setIsLoadingVendidos(false);
      }
    }, [filtroMes, filtroAnio]); // Añadir dependencias si usas estados de filtro

    useEffect(() => {
      if (activeTab === 'inventario') {
        loadVehiculos();
      } else if (activeTab === 'vendidos') {
        loadVehiculosVendidos();
      }
    }, [activeTab, loadVehiculos, loadVehiculosVendidos]);

  // --- Manejo del Formulario ---
  const updateFormField = useCallback(<K extends keyof VehiculoFormData>(field: K, value: VehiculoFormData[K]) => {
     // Validaciones/transformaciones simples aquí si se desea (ej: placa a mayúsculas)
     // if (field === 'placa') value = (value as string).toUpperCase();
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleImageChange = useCallback((file: File | null) => {
      setImageFile(file);
      // Si se cambia la imagen, limpiamos la URL existente en el form data
      // para asegurar que se use el archivo nuevo si se guarda.
      // Si se cancela, se puede restaurar o dejar vacío.
      // OJO: Esto asume que solo manejas UNA imagen principal.
      if(file) {
        updateFormField('imagenes', '');
      }
  }, [updateFormField]);


  const clearForm = useCallback(() => {
    setFormData(initialFormData);
    setImageFile(null);
    setEditId(null);
    // Considera si quieres limpiar errores específicos del formulario aquí
  }, []);

   const startEdit = useCallback((veh: Vehiculo) => {
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll al formulario
      setEditId(veh.id);
      // Convertir números/booleanos a string/boolean para el estado del formulario
      setFormData({
        linea: veh.linea || "",
        marca: veh.marca || "",
        modelo: veh.modelo?.toString() ?? "", // Convertir a string
        km: veh.km?.toString() ?? "",         // Convertir a string
        tipo_caja: veh.tipo_caja || "",
        valor_venta: veh.valor_venta?.toString() ?? "", // Convertir a string
        propietario_ubicacion: veh.propietario_ubicacion || "",
        descripcion: veh.descripcion || "",
        soat: veh.soat || "", // El input date maneja 'YYYY-MM-DD'
        tecno: veh.tecno || "",
        color: veh.color || "",
        lugar_matricula: veh.lugar_matricula || "",
        reporte: veh.reporte ?? false,
        prenda: veh.prenda ?? false,
        motor: veh.motor || "",
        estado: veh.estado || "disponible",
        imagenes: veh.imagenes || "", // Mantener la URL existente
        placa: veh.placa || "",
      });
      setImageFile(null); // Limpiar archivo seleccionado al empezar a editar
  }, []);

  // --- Acciones CRUD ---

  // Subir imagen a Supabase Storage (función auxiliar)
  const uploadImage = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`; // Nombre único y limpio
    const filePath = `autos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("escuderia-autos") // Asegúrate que este bucket existe y tiene políticas adecuadas
      .upload(filePath, file, {
          cacheControl: '3600', // Opcional: Control de caché
          upsert: false // Cambia a true si quieres permitir sobrescribir
      });

    if (uploadError) {
      console.error("Error subiendo imagen:", uploadError);
      throw new Error(`Error al subir imagen: ${uploadError.message}`);
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from("escuderia-autos")
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error("No se pudo obtener la URL pública de la imagen subida.");
    }
    console.log("Imagen subida, URL:", urlData.publicUrl)
    return urlData.publicUrl;
  };


  const handleSubmit = async () => {
    setIsSubmitting(true);
    setGeneralError(null);
    const toastId = toast.loading(editId ? 'Actualizando vehículo...' : 'Creando vehículo...');

    try {
        let imageUrl: string | null = formData.imagenes || null;

        if (imageFile) {
            imageUrl = await uploadImage(imageFile);
        }

        if (editId) {
            // Actualizar (pasamos la URL dentro del objeto, || '' ya está bien aquí)
            const { error } = await apiUpdateVehiculo(editId, { ...formData, imagenes: imageUrl || '' });
            if (error) throw error;
            toast.success('Vehículo actualizado con éxito!', { id: toastId });
        } else {
            // Crear
            // *** CORRECCIÓN AQUÍ: Usar || '' para asegurar que siempre sea string ***
            const { error } = await apiCreateVehiculo(formData, imageUrl || ''); // Si imageUrl es null, pasa ''
            if (error) throw error;
            toast.success('Vehículo creado con éxito!', { id: toastId });
        }

        clearForm();
        await loadVehiculos();

    } catch (err: any) {
        console.error("Error al guardar:", err);
        const errorMsg = err.message || `Error desconocido al ${editId ? 'actualizar' : 'crear'}.`;
        setGeneralError(errorMsg);
        toast.error(errorMsg, { id: toastId });
    } finally {
        setIsSubmitting(false);
    }
};


  const handleDelete = async (id: number): Promise<void> => { // Hacerla async y retornar Promise<void>
    // El estado de carga se maneja en VehicleList, aquí solo ejecutamos la acción
    // if (!confirm("¿Seguro que deseas eliminar este vehículo?")) return; // Confirmación mejor en UI

    const vehicleToDelete = vehiculos.find(v => v.id === id);
    if (!vehicleToDelete) return;

    const toastId = toast.loading(`Eliminando ${vehicleToDelete.marca} ${vehicleToDelete.linea}...`);
    try {
      const { error } = await apiDeleteVehiculo(id);
      if (error) throw error;

      // Opcional: Eliminar imagen de Storage (¡cuidado!)
      // if (vehicleToDelete.imagenes) {
      //     const path = vehicleToDelete.imagenes.split('/autos/')[1];
      //     if (path) await supabase.storage.from("escuderia-autos").remove([`autos/${path}`]);
      // }

      toast.success('Vehículo eliminado.', { id: toastId });
      await loadVehiculos(); // Recargar lista
      if (activeTab === 'vendidos') { // Recargar vendidos solo si es la pestaña activa
        await loadVehiculosVendidos();
      }
    } catch (err: any) {
      console.error("Error al eliminar vehículo:", err);
      const errorMsg = err.message || "Error desconocido al eliminar.";
      setGeneralError(errorMsg); // Podrías tener un estado de error específico para la lista
      toast.error(errorMsg, { id: toastId });
    }
    // El estado de carga (isDeleting) se resetea en el componente VehicleList
  };

  const handleMarkAsSold = async (id: number): Promise<void> => {
    const vehicleToSell = vehiculos.find(v => v.id === id);
    if (!vehicleToSell) {
        console.warn(`[useVehicles] Vehículo con ID ${id} no encontrado en la lista local para marcar como vendido.`);
        toast.error("No se pudo encontrar el vehículo especificado.");
        return;
    }
        
    const toastId = toast.loading(`Marcando ${vehicleToSell.marca} ${vehicleToSell.linea} como vendido...`);
    // Aquí necesitas una forma de indicar en la UI que ESTE ITEM específico está cargando.
    // Si usas 'itemBeingMarkedSoldId' como sugerí en la respuesta del modal:
    // setItemBeingMarkedSoldId(id); // Si este estado lo manejas en VehicleList, VehicleList debe tener una función para setearlo

    setGeneralError(null); // Limpiar errores generales previos

    try {
      // apiMarcarComoVendido ahora lanza un Error si algo sale mal.
      // No necesitas desestructurar 'error' aquí.
      await apiMarcarComoVendido(id); 
      
      toast.success('Vehículo marcado como vendido.', { id: toastId });
      await loadVehiculos(); // Recargar lista para reflejar el cambio
    } catch (err: any) { // err ahora debería ser una instancia de Error
      console.error("Error al marcar como vendido (capturado en useVehicles):", err); // Log completo del error
      
      // El mensaje de error debería estar en err.message gracias a la modificación en apiMarcarComoVendido
      const errorMsg = err.message || "Error desconocido al intentar marcar como vendido.";
      
      setGeneralError(errorMsg);
      toast.error(errorMsg, { id: toastId });
    } finally {
      // Asegúrate de limpiar el estado de carga del item específico
      // Si 'itemBeingMarkedSoldId' se maneja en VehicleList, VehicleList se encarga de limpiarlo.
      // Si se maneja en este hook, sería:
      // setItemBeingMarkedSoldId(null);
    }
    // "El estado de carga (isMarkingSold) se resetea en el componente VehicleList"
    // Esto significa que VehicleList tiene su propio estado para el spinner del botón del item.
    // Asegúrate que el 'finally' en VehicleList (si la llamada se origina allí)
    // o aquí (si no hay un nivel intermedio) limpie ese estado.
  };

  return {
    // Estados
    vehiculos,
    isLoadingList,
    generalError,
    formData,
    imageFile,
    editId,
    isSubmitting, // Estado de carga del formulario
    vehiculosVendidos, // <-- AÑADIDO
    isLoadingVendidos, // <-- AÑADIDO
    activeTab,         // <-- AÑADIDO
    setActiveTab,      // <-- AÑADIDO
    filtroMes,         // <-- AÑADIDO
    setFiltroMes,      // <-- AÑADIDO
    filtroAnio,        // <-- AÑADIDO
    setFiltroAnio,     // <-- AÑADIDO
    loadVehiculosVendidos, // <-- AÑADIDO (para llamar desde la UI al cambiar filtros)

    // Setters y Handlers
    handleImageChange, // Cambiado de setImagenFile
    updateFormField,
    handleSubmit, // Renombrado de handleCreate/handleUpdate
    handleDelete,
    handleMarkAsSold,
    startEdit,
    clearForm, // Exportar para el botón cancelar
  };
}