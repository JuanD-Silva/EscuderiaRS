// src/app/admin/components/VehicleForm.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { FormField } from './FormField';
import { VehiculoFormData, VEHICLE_STATUS_OPTIONS } from '../lib/supabase';
import { ClipLoader } from 'react-spinners';
import { FiPlusCircle, FiXCircle } from 'react-icons/fi';

interface VehicleFormProps {
  formData: VehiculoFormData;
  onUpdateField: <K extends keyof VehiculoFormData>(field: K, value: VehiculoFormData[K]) => void;
  // Para múltiples imágenes
  imageFiles: File[]; 
  existingImageUrls: string[]; 
  onImageChange: (files: FileList | null) => void; 
  onRemoveNewImage: (index: number) => void; 
  onRemoveExistingImage: (index: number) => void; 
  
  onSubmit: () => Promise<void>;
  isEdit: boolean;
  onCancelEdit: () => void;
  isLoading: boolean;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({
  formData,
  onUpdateField,
  imageFiles, 
  existingImageUrls, 
  onImageChange,
  onRemoveNewImage,
  onRemoveExistingImage,
  onSubmit,
  isEdit,
  onCancelEdit,
  isLoading,
}) => {
  const [imagePreviews, setImagePreviews] = useState<{ url: string, name?: string, type: 'existing' | 'new' }[]>([]);

  // Efecto para generar previsualizaciones combinadas de imágenes existentes y nuevas
  useEffect(() => {
    const newFilePreviews = imageFiles.map(file => ({
      url: URL.createObjectURL(file),
      name: file.name,
      type: 'new' as 'new',
    }));

    const existingUrlPreviews = existingImageUrls.map(url => ({
      url: url,
      name: url.substring(url.lastIndexOf('/') + 1), // Extraer nombre de archivo de URL
      type: 'existing' as 'existing',
    }));
    
    setImagePreviews([...existingUrlPreviews, ...newFilePreviews]);

    // Limpieza de Object URLs para los archivos nuevos
    return () => {
      newFilePreviews.forEach(preview => URL.revokeObjectURL(preview.url));
    };
  }, [imageFiles, existingImageUrls]);


  const handleFormSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (isLoading) return;
      await onSubmit();
  };
  
  const handleRemoveImage = (index: number, type: 'existing' | 'new') => {
    if (type === 'existing') {
      onRemoveExistingImage(index);
    } else {
      onRemoveNewImage(index);
    }
  };

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
          <FormField id="placa" label="Placa" type="text" placeholder="AAA-123" value={formData.placa} onChange={(v) => onUpdateField('placa', (v as string)?.toUpperCase() || '')} required />
          <FormField id="marca" label="Marca" type="text" placeholder="Ej: Toyota" value={formData.marca} onChange={(v) => onUpdateField('marca', v as string || '')} required />
          <FormField id="linea" label="Línea" type="text" placeholder="Ej: Corolla" value={formData.linea} onChange={(v) => onUpdateField('linea', v as string || '')} required />
          {/* CORRECCIÓN AQUÍ para modelo */}
          <FormField id="modelo" label="Año (Modelo)" type="number" placeholder="Ej: 2020" value={formData.modelo} onChange={(v) => onUpdateField('modelo', String(v ?? ''))} required />
          <FormField id="color" label="Color" type="text" placeholder="Ej: Rojo" value={formData.color} onChange={(v) => onUpdateField('color', v as string || '')} />
          {/* CORRECCIÓN AQUÍ para km */}
           <FormField id="km" label="Kilometraje" type="number" placeholder="Ej: 50000" value={formData.km} onChange={(v) => onUpdateField('km', String(v ?? ''))} />
        </fieldset>

        <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <legend className="text-lg font-semibold mb-3 text-red-400 col-span-full">Especificaciones</legend>
          <FormField id="motor" label="Motor" type="text" placeholder="Ej: 1.8L" value={formData.motor} onChange={(v) => onUpdateField('motor', v as string || '')} />
          <FormField id="tipoCaja" label="Tipo de Caja" type="text" placeholder="Ej: Automática" value={formData.tipo_caja} onChange={(v) => onUpdateField('tipo_caja', v as string || '')} />
        </fieldset>

        <fieldset className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <legend className="text-lg font-semibold mb-3 text-red-400 col-span-full">Documentación y Estado Legal</legend>
            <FormField id="soat" label="Vencimiento SOAT" type="date" value={formData.soat} onChange={(v) => onUpdateField('soat', v as string || '')} />
            <FormField id="tecno" label="Vencimiento Tecnomecánica" type="date" value={formData.tecno} onChange={(v) => onUpdateField('tecno', v as string || '')} />
            <FormField id="lugarMatricula" label="Ciudad Matrícula" type="text" placeholder="Ej: Bogotá" value={formData.lugar_matricula} onChange={(v) => onUpdateField('lugar_matricula', v as string || '')} />
            <div className="flex flex-col justify-center space-y-3 pt-2 md:pt-0 md:pl-4">
                 <FormField id="reporte" label="Tiene Reportes?" type="checkbox" value={formData.reporte} onChange={(v) => onUpdateField('reporte', v as boolean)} />
                 <FormField id="prenda" label="Está en Prenda?" type="checkbox" value={formData.prenda} onChange={(v) => onUpdateField('prenda', v as boolean)} />
            </div>
        </fieldset>

        <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <legend className="text-lg font-semibold mb-3 text-red-400 col-span-full">Venta y Detalles</legend>
          {/* CORRECCIÓN AQUÍ para valor_venta */}
          <FormField id="valorVenta" label="Valor de Venta (COP)" type="currency" placeholder="Ej: 55000000" value={formData.valor_venta} onChange={(v) => onUpdateField('valor_venta', String(v ?? ''))} required />
          <FormField id="estado" label="Estado Actual" type="select" value={formData.estado} onChange={(v) => onUpdateField('estado', v as string || '')} options={VEHICLE_STATUS_OPTIONS} required />
          <div className="md:col-span-2">
                <FormField id="descripcion" label="Descripción Adicional" type="textarea" rows={4} placeholder="Añade detalles relevantes sobre el vehículo..." value={formData.descripcion} onChange={(v) => onUpdateField('descripcion', v as string || '')} />
          </div>
           <FormField id="propietarioUbic" label="Contacto Propietario" type="text" placeholder="Nombre o Cédula" value={formData.propietario_ubicacion} onChange={(v) => onUpdateField('propietario_ubicacion', v as string || '')} />
        </fieldset>

        <fieldset>
             <legend className="text-lg font-semibold mb-3 text-red-400">Imágenes del Vehículo</legend>
             <FormField
                id="imagenesNuevas" 
                label={imagePreviews.length > 0 ? "Añadir más imágenes" : "Subir Imágenes"}
                type="file"
                value={null} 
                onChange={(files) => onImageChange(files as FileList | null)} 
                multiple={true} 
                accept="image/jpeg, image/png, image/webp"
                imagePreviews={imagePreviews} 
                onRemoveImagePreview={handleRemoveImage} 
             />
             {(!imagePreviews || imagePreviews.length === 0) && isEdit && (
                <p className="mt-2 text-xs text-yellow-400">
                    Este vehículo no tiene imágenes actualmente. Sube al menos una.
                </p>
             )}
             {(!imagePreviews || imagePreviews.length === 0) && !isEdit && (
                <p className="mt-2 text-xs text-gray-400">
                    Sube al menos una imagen para el vehículo. La primera será la principal.
                </p>
             )}
        </fieldset>
      </div>

      <div className="mt-8 pt-5 border-t border-gray-700">
        <button
          type="submit"
          disabled={isLoading || (!isEdit && imageFiles.length === 0 && existingImageUrls.length === 0) } 
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