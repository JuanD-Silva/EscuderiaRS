// src/app/admin/components/VehicleForm.tsx
import React, { useState, useEffect } from 'react';
import { FormField } from './FormField';
import { VehiculoFormData, VEHICLE_STATUS_OPTIONS } from '../lib/supabase'; // Importar opciones
import { ClipLoader } from 'react-spinners'; // Para el botón

interface VehicleFormProps {
  formData: VehiculoFormData;
  onUpdateField: <K extends keyof VehiculoFormData>(field: K, value: VehiculoFormData[K]) => void;
  imageFile: File | null;
  onImageChange: (file: File | null) => void;
  onSubmit: () => Promise<void>;
  isEdit: boolean;
  onCancelEdit: () => void;
  isLoading: boolean;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({
  formData,
  onUpdateField,
  imageFile,
  onImageChange,
  onSubmit,
  isEdit,
  onCancelEdit,
  isLoading,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Generar preview para archivo nuevo o usar URL existente
  useEffect(() => {
    let objectUrl: string | null = null; // Variable para almacenar la URL del blob si se crea

    if (imageFile) {
      // Si hay un archivo nuevo seleccionado, crear una URL de objeto para la preview
      objectUrl = URL.createObjectURL(imageFile);
      setImagePreview(objectUrl);
      console.log("VehicleForm - New imageFile, preview set to blob URL:", objectUrl);
    } else if (isEdit && formData.imagenes && formData.imagenes.trim() !== "") {
      // Si estamos editando, no hay archivo nuevo, Y formData.imagenes es una URL válida (no vacía)
      // usamos la URL existente de la base de datos para la preview.
      setImagePreview(formData.imagenes);
      console.log("VehicleForm - Editing, no new file, preview set to existing URL:", formData.imagenes);
    } else {
      // En cualquier otro caso (ej: creando nuevo sin imagen, o editando y la URL existente está vacía)
      // no mostramos preview.
      setImagePreview(null);
      console.log("VehicleForm - No imageFile and no valid existing URL, preview set to null. isEdit:", isEdit, "formData.imagenes:", formData.imagenes);
    }

    // Función de limpieza del useEffect:
    // Se ejecuta cuando el componente se desmonta o ANTES de que el efecto se vuelva a ejecutar
    // debido a un cambio en sus dependencias.
    return () => {
      if (objectUrl) {
        // Si creamos una URL de objeto (blob), la revocamos para liberar memoria.
        // Esto es importante SOLO para las URLs creadas con URL.createObjectURL.
        URL.revokeObjectURL(objectUrl);
        console.log("VehicleForm - Revoked blob URL:", objectUrl);
      }
    };
  }, [imageFile, isEdit, formData.imagenes]); // Dependencias del efecto


  const handleFormSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (isLoading) return;
      await onSubmit();
  };

  // El resto del componente JSX permanece igual...
  return (
    <form onSubmit={handleFormSubmit} className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 mb-8">
        <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-3">
            <h2 className="text-xl md:text-2xl font-bold text-white">
                {isEdit ? 'Editar Vehículo' : 'Agregar Nuevo Vehículo'}
            </h2>
            {isEdit && (
                 <button
                    type="button"
                    onClick={onCancelEdit}
                    disabled={isLoading}
                    className="text-sm bg-gray-600 hover:bg-gray-500 text-white px-3 py-1.5 rounded-md transition duration-150 ease-in-out disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                    Cancelar Edición
                </button>
            )}
        </div>

      <div className="space-y-6">
        <fieldset className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <legend className="text-lg font-semibold mb-3 text-red-400 col-span-full">Información Básica</legend>
          <FormField id="placa" label="Placa" type="text" placeholder="AAA-123" value={formData.placa} onChange={(v) => onUpdateField('placa', v.toUpperCase())} required />
          <FormField id="marca" label="Marca" type="text" placeholder="Ej: Toyota" value={formData.marca} onChange={(v) => onUpdateField('marca', v)} required />
          <FormField id="linea" label="Línea" type="text" placeholder="Ej: Corolla" value={formData.linea} onChange={(v) => onUpdateField('linea', v)} required />
          <FormField id="modelo" label="Año (Modelo)" type="number" placeholder="Ej: 2020" value={formData.modelo} onChange={(v) => onUpdateField('modelo', v)} required />
          <FormField id="color" label="Color" type="text" placeholder="Ej: Rojo" value={formData.color} onChange={(v) => onUpdateField('color', v)} />
           <FormField id="km" label="Kilometraje" type="number" placeholder="Ej: 50000" value={formData.km} onChange={(v) => onUpdateField('km', v)} />
        </fieldset>

        <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <legend className="text-lg font-semibold mb-3 text-red-400 col-span-full">Especificaciones</legend>
          <FormField id="motor" label="Motor" type="text" placeholder="Ej: 1.8L" value={formData.motor} onChange={(v) => onUpdateField('motor', v)} />
          <FormField id="tipoCaja" label="Tipo de Caja" type="text" placeholder="Ej: Automática" value={formData.tipo_caja} onChange={(v) => onUpdateField('tipo_caja', v)} />
        </fieldset>

        <fieldset className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <legend className="text-lg font-semibold mb-3 text-red-400 col-span-full">Documentación y Estado Legal</legend>
            <FormField id="soat" label="Vencimiento SOAT" type="date" value={formData.soat} onChange={(v) => onUpdateField('soat', v)} />
            <FormField id="tecno" label="Vencimiento Tecnomecánica" type="date" value={formData.tecno} onChange={(v) => onUpdateField('tecno', v)} />
            <FormField id="lugarMatricula" label="Ciudad Matrícula" type="text" placeholder="Ej: Bogotá" value={formData.lugar_matricula} onChange={(v) => onUpdateField('lugar_matricula', v)} />
            <div className="flex flex-col justify-center space-y-3 pt-2 md:pt-0 md:pl-4">
                 <FormField id="reporte" label="Tiene Reportes?" type="checkbox" value={formData.reporte} onChange={(v) => onUpdateField('reporte', v)} />
                 <FormField id="prenda" label="Está en Prenda?" type="checkbox" value={formData.prenda} onChange={(v) => onUpdateField('prenda', v)} />
            </div>
        </fieldset>

        <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <legend className="text-lg font-semibold mb-3 text-red-400 col-span-full">Venta y Detalles</legend>
          <FormField id="valorVenta" label="Valor de Venta (COP)" type="currency" placeholder="Ej: 55000000" value={formData.valor_venta} onChange={(v) => onUpdateField('valor_venta', v)} required />
          <FormField id="estado" label="Estado Actual" type="select" value={formData.estado} onChange={(v) => onUpdateField('estado', v)} options={VEHICLE_STATUS_OPTIONS} required />
          <div className="md:col-span-2">
                <FormField id="descripcion" label="Descripción Adicional" type="textarea" rows={4} placeholder="Añade detalles relevantes sobre el vehículo..." value={formData.descripcion} onChange={(v) => onUpdateField('descripcion', v)} />
          </div>
           <FormField id="propietarioUbic" label="Contacto Propietario" type="text" placeholder="Nombre o Cédula" value={formData.propietario_ubicacion} onChange={(v) => onUpdateField('propietario_ubicacion', v)} />
        </fieldset>

        <fieldset>
             <legend className="text-lg font-semibold mb-3 text-red-400">Imagen Principal</legend>
             <FormField
                id="imagenes"
                label={isEdit && formData.imagenes && formData.imagenes.trim() !== "" ? "Reemplazar Imagen" : "Subir Imagen"}
                type="file"
                value={imageFile}
                onChange={onImageChange}
                imagePreviewUrl={imagePreview}
                accept="image/jpeg, image/png, image/webp"
             />
        </fieldset>
      </div>

      <div className="mt-8 pt-5 border-t border-gray-700">
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full md:w-auto flex items-center justify-center bg-gradient-to-r from-red-700 via-red-600 to-red-500 hover:from-red-600 hover:via-red-500 hover:to-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 text-white font-semibold px-6 py-2.5 rounded-md shadow-md transition-all duration-300 ease-in-out cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            <>
              <ClipLoader color="#ffffff" size={20} className="mr-2"/>
              {isEdit ? 'Actualizando...' : 'Agregando...'}
            </>
          ) : (
            isEdit ? 'Guardar Cambios' : 'Agregar Vehículo'
          )}
        </button>
      </div>
    </form>
  );
};