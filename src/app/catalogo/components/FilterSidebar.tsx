// src/app/catalogo/components/FilterSidebar.tsx
import React from 'react';
import { FiX } from 'react-icons/fi';
import { formatPrice } from '@/app/lib/utils'; // *** IMPORTAR formatPrice ***

// --- Tipos (sin cambios) ---
export type Filters = {
  make: string;
  model: string;
  yearRange: { min?: number; max?: number };
  priceRange: { min?: number; max?: number };
  kmRange: { min?: number; max?: number };
};

type FilterOptions = {
  makes: string[];
  modelsByMake: { [key: string]: string[] };
  priceRange: { min: number; max: number };
  yearRange: { min: number; max: number };
  kmRange: { min: number; max: number };
};

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  options: FilterOptions;
  onFilterChange: (newFilters: Partial<Filters>) => void;
  onReset: () => void;
  vehicleCount: number;
}

// --- Componente ---
export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  isOpen,
  onClose,
  filters,
  options,
  onFilterChange,
  onReset,
  vehicleCount,
}) => {

    // --- Manejador de Cambios Corregido ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target; // No necesitamos 'type' aquí

        // Verificar si el nombre corresponde a un input de rango (contiene '.')
        if (name.includes('.') && name.split('.').length === 2) {
            // --- Lógica para Inputs de Rango (min/max) ---
            const [rangeKey, subKey] = name.split('.') as [keyof Filters, 'min' | 'max']; // Usar keyof Filters y 'min'|'max' para más seguridad

            // Validar que rangeKey sea una de las claves de rango esperadas
            if ((rangeKey === 'priceRange' || rangeKey === 'yearRange' || rangeKey === 'kmRange') && (subKey === 'min' || subKey === 'max')) {

                // Convertir el valor a número o undefined si está vacío/inválido
                const numericValue = value === '' ? undefined : parseInt(value, 10);
                const finalValue = isNaN(numericValue as any) ? undefined : numericValue;

                // *** CORRECCIÓN PRINCIPAL: Acceder al objeto de rango actual de forma segura ***
                const currentRange = filters[rangeKey]; // TS ahora sabe que esto es { min?, max? }

                // Actualizar el filtro específico (min o max) manteniendo el otro valor
                onFilterChange({
                    [rangeKey]: { // Usar la variable correcta 'rangeKey'
                        ...currentRange, // *** Ahora sí, el spread es seguro ***
                        [subKey]: finalValue, // Usar la variable correcta 'subKey'
                    },
                });

            } else {
                console.warn("Nombre de input de rango inválido recibido:", name);
            }

        } else if (name in filters) {
            // --- Lógica para Inputs Directos (make, model, etc.) ---
            // Asegurarse de que 'name' es una clave válida de 'Filters' antes de actualizar
            onFilterChange({ [name]: value });

        } else {
             console.warn("Nombre de input desconocido recibido:", name);
        }
    };
    // --- Fin del Manejador de Cambios Corregido ---


    // Obtener los modelos disponibles para la marca seleccionada (sin cambios)
    const availableModels = filters.make !== 'all' ? options.modelsByMake[filters.make] || [] : [];

    // Clases CSS (sin cambios)
    const sidebarClasses = `
      fixed inset-y-0 left-0 z-40 bg-gray-950 border-r border-gray-700/50 shadow-xl
      transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      transition-transform duration-300 ease-in-out
      w-72 sm:w-80 lg:w-64 xl:w-72
      lg:sticky lg:top-16
      lg:h-[calc(100vh-4rem)]
      flex flex-col p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900
    `;

    // Formateador (sin cambios)
    const formatRangePlaceholder = (value: number) => {
        if (value == null || isNaN(value)) return ''; // Manejar null/NaN
        if (value === 0) return '0';
        if (value < 10000) return value.toString();
        // Usar toLocaleString para miles si el número es grande
        if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M'; // Millones
        return (value / 1000).toFixed(0) + 'k'; // Miles
    }


    // --- JSX (Renderizado) ---
    return (
      <>
        {/* Overlay (sin cambios) */}
        {isOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose} aria-hidden="true"></div>}

        {/* Sidebar */}
        <aside className={sidebarClasses} aria-label="Filtros de Vehículos">
          {/* Header del Sidebar (sin cambios) */}
          <div className="flex justify-between items-center mb-5 border-b border-gray-700 pb-3">
            <h2 className="text-xl font-semibold text-white">Filtrar</h2>
            <button
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-white p-1 -mr-1"
              aria-label="Cerrar filtros"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Formulario de Filtros */}
          <form className="space-y-6 flex-grow">
            {/* Filtro por Marca (sin cambios) */}
            <div>
              <label htmlFor="make" className="block text-sm font-medium text-gray-300 mb-1">Marca</label>
              <select
                id="make" name="make" value={filters.make} onChange={handleInputChange}
                className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">Todas las Marcas</option>
                {options.makes.map(make => <option key={make} value={make}>{make}</option>)}
              </select>
            </div>

            {/* Filtro por Línea/Modelo (sin cambios) */}
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-1">Línea / Modelo</label>
              <select
                id="model" name="model" value={filters.model} onChange={handleInputChange}
                disabled={filters.make === 'all' || availableModels.length === 0}
                className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="all">Todos los Modelos</option>
                {availableModels.map(model => <option key={model} value={model}>{model}</option>)}
              </select>
            </div>

            {/* --- RANGOS CON HANDLER CORREGIDO --- */}

            {/* Filtro por Rango de Precio */}
            <fieldset>
               <legend className="block text-sm font-medium text-gray-300 mb-2">Precio (COP)</legend>
               <div className="flex space-x-2 items-center">
                  <input
                      type="number"
                      name="priceRange.min" // Correcto
                      placeholder={`Min ${formatPrice(options.priceRange.min)}`} // Usar formatPrice importado
                      value={filters.priceRange.min ?? ''}
                      onChange={handleInputChange}
                      min="0"
                      className="w-1/2 bg-gray-800 border border-gray-600 rounded-md p-2 text-white text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 placeholder-gray-500"
                      aria-label="Precio mínimo"
                   />
                   <span className="text-gray-500">-</span>
                  <input
                      type="number"
                      name="priceRange.max" // Correcto
                      placeholder={`Max ${formatPrice(options.priceRange.max)}`} // Usar formatPrice importado
                      value={filters.priceRange.max ?? ''}
                      onChange={handleInputChange}
                      min="0"
                      className="w-1/2 bg-gray-800 border border-gray-600 rounded-md p-2 text-white text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 placeholder-gray-500"
                      aria-label="Precio máximo"
                  />
               </div>
            </fieldset>

            {/* Filtro por Rango de Año */}
            <fieldset>
               <legend className="block text-sm font-medium text-gray-300 mb-2">Año</legend>
               <div className="flex space-x-2 items-center">
                   <input
                      type="number"
                      name="yearRange.min" // Correcto
                      placeholder={`Min ${options.yearRange.min || ''}`}
                      value={filters.yearRange.min ?? ''}
                      onChange={handleInputChange}
                      min={options.yearRange.min || 1980} // Añadir fallback por si min es 0 o Infinity
                      max={options.yearRange.max || new Date().getFullYear()} // Añadir fallback
                      className="w-1/2 bg-gray-800 border border-gray-600 rounded-md p-2 text-white text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 placeholder-gray-500"
                      aria-label="Año mínimo"
                   />
                    <span className="text-gray-500">-</span>
                   <input
                      type="number"
                      name="yearRange.max" // Correcto
                      placeholder={`Max ${options.yearRange.max || ''}`}
                      value={filters.yearRange.max ?? ''}
                      onChange={handleInputChange}
                      min={options.yearRange.min || 1980}
                      max={options.yearRange.max || new Date().getFullYear()}
                      className="w-1/2 bg-gray-800 border border-gray-600 rounded-md p-2 text-white text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 placeholder-gray-500"
                      aria-label="Año máximo"
                    />
                </div>
            </fieldset>

             {/* Filtro por Rango de Kilometraje */}
             <fieldset>
               <legend className="block text-sm font-medium text-gray-300 mb-2">Kilometraje (Km)</legend>
               <div className="flex space-x-2 items-center">
                  <input
                      type="number"
                      name="kmRange.min" // Correcto
                      placeholder={`Min ${formatRangePlaceholder(options.kmRange.min)}`}
                      value={filters.kmRange.min ?? ''}
                      onChange={handleInputChange}
                      min="0"
                      className="w-1/2 bg-gray-800 border border-gray-600 rounded-md p-2 text-white text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 placeholder-gray-500"
                      aria-label="Kilometraje mínimo"
                  />
                   <span className="text-gray-500">-</span>
                  <input
                      type="number"
                      name="kmRange.max" // Correcto
                      placeholder={`Max ${formatRangePlaceholder(options.kmRange.max)}`}
                      value={filters.kmRange.max ?? ''}
                      onChange={handleInputChange}
                      min="0"
                      className="w-1/2 bg-gray-800 border border-gray-600 rounded-md p-2 text-white text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 placeholder-gray-500"
                      aria-label="Kilometraje máximo"
                   />
               </div>
            </fieldset>

            {/* ... (espacio para más filtros) */}

          </form>

          {/* Botón Limpiar (sin cambios) */}
          <div className="mt-auto pt-4 border-t border-gray-700">
             <button
                  onClick={() => { onReset(); }}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold p-2.5 rounded-md text-sm transition-colors duration-200"
              >
                  Limpiar Filtros
              </button>
          </div>
        </aside>
      </>
    );
};