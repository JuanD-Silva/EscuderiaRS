// src/app/admin/components/FormField.tsx
import React, { ChangeEvent } from 'react';
import Image from 'next/image'; // Para preview de imagen

interface FormFieldProps {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'checkbox' | 'file' | 'select' | 'currency';
  value: string | number | boolean | File | null | undefined;
  onChange: (value: any) => void;
  options?: readonly Readonly<{ value: string; label: string }>[];
  rows?: number;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string | null;
  accept?: string;
  imagePreviewUrl?: string | null;
  currencySymbol?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  id, label, type, value, onChange, options = [], rows = 3,
  placeholder, required = false, disabled = false, error = null, accept = "image/*",
  imagePreviewUrl = null, currencySymbol = 'COP',
}) => {

  const baseInputClasses = `
    block w-full px-3 py-2 rounded-md bg-gray-800 text-white placeholder-gray-400
    border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500
    transition duration-150 ease-in-out sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed
  `;
  const errorClasses = error ? 'border-red-500 ring-red-500' : 'border-gray-600';

  if (type === 'checkbox') {
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

  // --- File Input (con Preview) ---
  if (type === 'file') {
    // Determinar la URL de origen para la imagen de previsualización
    let previewSrc: string | null = null;
    if (value instanceof File) {
        // Si 'value' es un archivo, crear una URL de objeto para él.
        // Esta URL es temporal y debe ser revocada cuando ya no se necesite.
        // La revocación se maneja en el componente padre (VehicleForm)
        // que es quien crea y gestiona el ciclo de vida de esta URL de objeto.
        previewSrc = URL.createObjectURL(value);
    } else if (imagePreviewUrl && (imagePreviewUrl.startsWith('http') || imagePreviewUrl.startsWith('blob:'))) {
        // Si no hay archivo en 'value', pero hay una imagePreviewUrl válida (externa o blob existente), usarla.
        previewSrc = imagePreviewUrl;
    }


    return (
        <div className="w-full">
            <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
                 {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex items-center gap-4">
                <input
                    id={id}
                    name={id}
                    type="file"
                    accept={accept}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files?.[0];
                        onChange(file || null);
                    }}
                    disabled={disabled}
                    required={required} // `required` en input file tiene un comportamiento peculiar, considerar validación en JS
                    className={`
                        block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0 file:text-sm file:font-semibold
                        file:bg-red-700/80 file:text-white hover:file:bg-red-600
                        cursor-pointer file:cursor-pointer file:transition-colors file:duration-150
                        ${baseInputClasses} p-0 ${errorClasses} overflow-hidden
                    `}
                />
                {/* Preview de Imagen: Solo se muestra si tenemos una previewSrc válida */}
                 {previewSrc && (
                     <div className="flex-shrink-0">
                        <Image
                           src={previewSrc} // Usar la variable previewSrc determinada arriba
                           alt="Preview"
                           width={48}
                           height={48}
                           className="object-cover rounded"
                           // El onLoad para revocar URLs de blob se maneja de forma más segura
                           // en el componente que creó la URL de blob (VehicleForm).
                           // onError puede ser útil aquí para mostrar un placeholder si la URL externa falla.
                           onError={(e) => {
                            // Podrías tener una lógica para reemplazar con un placeholder si la carga de `previewSrc` falla.
                            // e.currentTarget.src = '/path/to/placeholder-image.png';
                            console.warn(`Error cargando imagen preview: ${previewSrc}`);
                           }}
                         />
                    </div>
                )}
            </div>
             {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
    );
}

  // --- Inputs Normales (text, number, date, currency) ---
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className={type === 'currency' ? 'relative' : ''}>
        {type === 'currency' && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 sm:text-sm">$</span> {/* Considerar pasar currencySymbol si no siempre es $ */}
            </div>
        )}
        <input
          id={id}
          name={id}
          type={(type === 'currency' || type === 'number') ? 'number' : type}
          value={(value as string | number) ?? ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
              onChange(e.target.value);
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