// src/app/catalogo/components/SortDropdown.tsx
import React from 'react';
import { FiChevronDown } from 'react-icons/fi';

// Definición del tipo para las opciones de ordenación
export type SortOption = {
  value: string;
  label: string;
};

interface SortDropdownProps {
  options: SortOption[];
  value: string; // El valor actualmente seleccionado
  onChange: (value: string) => void; // Función para manejar el cambio
}

export const SortDropdown: React.FC<SortDropdownProps> = ({ options, value, onChange }) => {

  return (
    <div className="relative inline-block text-left w-full sm:w-auto">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full sm:w-auto bg-gray-800 border border-gray-600 rounded-md pl-3 pr-8 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 cursor-pointer"
        aria-label="Ordenar vehículos por"
      >
        {/* Opcional: Placeholder si no quieres una opción por defecto seleccionada
         <option value="" disabled>Ordenar por...</option> */}
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {/* Icono de flecha */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
        <FiChevronDown size={16} aria-hidden="true" />
      </div>
    </div>
  );
};