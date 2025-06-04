// src/app/admin/components/FormField.tsx
import React, { ChangeEvent } from 'react';
import Image from 'next/image';
import { FiPaperclip, FiTrash2, FiUploadCloud } from 'react-icons/fi'; // Para iconos

type FormFieldValue = string | number | boolean | File | FileList | null; // FileList para múltiples archivos

interface FormFieldProps {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'checkbox' | 'file' | 'select' | 'currency';
  value: string | number | boolean | File | FileList | null | undefined; // El estado del form puede tener FileList
  onChange: (value: FormFieldValue | undefined, fieldId?: string) // fieldId es opcional
    => void; 
  options?: readonly Readonly<{ value: string; label: string }>[];
  rows?: number;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string | null;
  accept?: string;
  // Para múltiples imágenes
  multiple?: boolean; // Nueva prop para permitir selección múltiple
  imagePreviews?: { url: string, name?: string, type: 'existing' | 'new' }[]; // Array de URLs para previsualización
  onRemoveImagePreview?: (index: number, type: 'existing' | 'new') => void; // Para quitar imágenes
  currencySymbol?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  id, label, type, value, onChange, options = [], rows = 3,
  placeholder, required = false, disabled = false, error = null, accept = "image/*",
  multiple = false, // default a false
  imagePreviews = [],
  onRemoveImagePreview,
  currencySymbol = '$',
}) => {

  const baseInputClasses = `
    block w-full px-3 py-2 rounded-md bg-gray-800 text-white placeholder-gray-400
    border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500
    transition duration-150 ease-in-out sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed
  `;
  const errorClasses = error ? 'border-red-500 ring-red-500' : 'border-gray-600';

  if (type === 'checkbox') {
    // ... (sin cambios)
    return (
      <div className="flex flex-col">
        <label htmlFor={id} className="flex items-center gap-2 cursor-pointer">
          <input
            id={id}
            name={id}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
            disabled={disabled}
            className={`h-5 w-5 rounded border-gray-500 text-red-600 focus:ring-red-500 disabled:opacity-60 disabled:cursor-not-allowed accent-red-600 ${error ? 'border-red-500' : ''}`}
          />
          <span className="text-sm font-medium text-gray-300">{label} {required && <span className="text-red-500">*</span>}</span>
        </label>
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  if (type === 'textarea') {
    // ... (sin cambios)
    return (
      <div className="w-full">
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <textarea
          id={id}
          name={id}
          rows={rows}
          value={(value as string) ?? ''}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`${baseInputClasses} ${errorClasses} resize-y min-h-[60px]`}
        />
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  if (type === 'select') {
    // ... (sin cambios)
     return (
      <div className="w-full">
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
          id={id}
          name={id}
          value={(value as string) ?? ''}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          className={`${baseInputClasses} ${errorClasses} pr-8`}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  if (type === 'file') {
    return (
        <div className="w-full space-y-3">
            <label htmlFor={id} className="block text-sm font-medium text-gray-300">
                 {label} {required && !imagePreviews.length && <span className="text-red-500">*</span>}
            </label>
            <div className={`
              relative flex items-center justify-center w-full px-3 py-4 rounded-md 
              border-2 border-dashed border-gray-600 hover:border-red-500 transition-colors
              ${errorClasses} ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-800' : 'bg-gray-800/50 cursor-pointer'}
            `}>
                <input
                    id={id}
                    name={id}
                    type="file"
                    accept={accept}
                    multiple={multiple} // Usar la prop multiple
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        // Para múltiples archivos, e.target.files es un FileList
                        // Para un solo archivo, también es un FileList (con un solo elemento o vacío)
                        onChange(e.target.files); // Pasar el FileList completo
                    }}
                    disabled={disabled}
                    // 'required' es difícil de manejar directamente con FileList, se valida en el hook
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="text-center">
                  <FiUploadCloud className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-1 text-xs text-gray-400">
                    <span className="font-semibold text-red-400">Haz clic para subir</span> o arrastra y suelta
                  </p>
                  {multiple && <p className="text-xs text-gray-500">Puedes seleccionar varias imágenes</p>}
                  <p className="text-xs text-gray-500 mt-0.5">{accept.replace('image/', '').toUpperCase()}</p>
                </div>
            </div>

            {imagePreviews && imagePreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={preview.url || index} className="relative group aspect-square border border-gray-700 rounded-md overflow-hidden">
                    <Image
                       src={preview.url}
                       alt={preview.name || `Preview ${index + 1}`}
                       fill
                       sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                       className="object-cover"
                       onError={(e) => {
                         console.warn(`Error cargando imagen preview: ${preview.url}`);
                         e.currentTarget.src = '/placeholder.png'; // Fallback
                       }}
                     />
                    {onRemoveImagePreview && !disabled && (
                      <button
                        type="button"
                        onClick={() => onRemoveImagePreview(index, preview.type)}
                        className="absolute top-1 right-1 bg-black/60 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                        aria-label="Eliminar imagen"
                      >
                        <FiTrash2 size={12} />
                      </button>
                    )}
                    {/* Opcional: Mostrar nombre del archivo o si es nueva/existente */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] px-1.5 py-0.5 truncate">
                      {preview.name ? (preview.name.length > 15 ? preview.name.substring(0,12) + '...' : preview.name) : (preview.type === 'new' ? 'Nueva' : 'Existente')}
                    </div>
                  </div>
                ))}
              </div>
            )}
             {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
    );
  }

  // Inputs estándar (text, number, date, currency)
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className={type === 'currency' ? 'relative' : ''}>
        {type === 'currency' && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 sm:text-sm">{currencySymbol}</span>
            </div>
        )}
        <input
          id={id}
          name={id}
          type={(type === 'currency' || type === 'number') ? 'number' : type}
          value={(value as string | number) ?? ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
              if (type === 'number' || type === 'currency') {
                  const num = e.target.valueAsNumber; 
                  onChange(Number.isNaN(num) ? undefined : num); 
              } else {
                  onChange(e.target.value);
              }
          }}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`
            ${baseInputClasses} ${errorClasses}
            ${type === 'currency' ? 'pl-7' : ''}
            ${type === 'number' ? `
                [&::-webkit-inner-spin-button]:appearance-none
                [&::-webkit-outer-spin-button]:appearance-none
                [-moz-appearance:textfield]`
            : ''}
          `}
          {...(type === 'number' || type === 'currency' ? { step: "any", min: "0" } : {})}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
};
