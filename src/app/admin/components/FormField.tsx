// src/app/admin/components/FormField.tsx
import React, { ChangeEvent } from 'react';
import Image from 'next/image'; // Para preview de imagen

// 1. Definir un tipo más específico para el valor de onChange
type FormFieldValue = string | number | boolean | File | null;

interface FormFieldProps {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'checkbox' | 'file' | 'select' | 'currency';
  value: string | number | boolean | File | null | undefined;
  onChange: (value: FormFieldValue | undefined) => void; // <--- Ajustado para permitir undefined potentialmente desde input numérico
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
  imagePreviewUrl = null,
  currencySymbol = '$', // Mantener el default o cambiarlo si COP es más común
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

  if (type === 'file') {
    let previewSrc: string | null = null;
    if (value instanceof File) {
        previewSrc = URL.createObjectURL(value);
    } else if (imagePreviewUrl && (imagePreviewUrl.startsWith('http') || imagePreviewUrl.startsWith('blob:'))) {
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
                        onChange(file || null); // Pasamos File | null
                    }}
                    disabled={disabled}
                    required={required}
                    className={`
                        block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0 file:text-sm file:font-semibold
                        file:bg-red-700/80 file:text-white hover:file:bg-red-600
                        cursor-pointer file:cursor-pointer file:transition-colors file:duration-150
                        ${baseInputClasses} p-0 ${errorClasses} overflow-hidden
                    `}
                />
                 {previewSrc && (
                     <div className="flex-shrink-0">
                        <Image
                           src={previewSrc}
                           alt="Preview"
                           width={48}
                           height={48}
                           className="object-cover rounded"
                           // --- CAMBIO: Prefijar el parámetro no usado con '_' ---
                           onError={(_event) => { // Se usa '_event' para indicar que no se usa el argumento
                            // No necesitas el evento aquí si solo haces log
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
          value={(value as string | number) ?? ''} // El valor puede ser string o number inicialmente
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
              // Para number y currency, intentamos devolver un number o undefined si está vacío/inválido
              if (type === 'number' || type === 'currency') {
                  const num = e.target.valueAsNumber; // Intenta obtener el número
                  onChange(Number.isNaN(num) ? undefined : num); // Pasa number o undefined
              } else {
                  onChange(e.target.value); // Para otros tipos, pasa el string
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