// src/app/catalogo/components/FilterSidebar.tsx
import React from 'react';
import { FiX, FiRefreshCw } from 'react-icons/fi'; // Importar FiRefreshCw para el botón reset
import { formatPrice } from '@/app/lib/utils';

// --- Tipos ---
// (Asumiendo que estos tipos están correctos y definidos)
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

// --- Interfaz de Props ---
// Añadir vehicleCount a la interfaz
interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  options: FilterOptions;
  onFilterChange: (newFilters: Partial<Filters>) => void;
  onReset: () => void;
  vehicleCount: number; // <-- AÑADIDA LA PROP REQUERIDA
}

// --- Componente ---
export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  isOpen,
  onClose,
  filters,
  options,
  onFilterChange,
  onReset,
  vehicleCount, // <-- DESESTRUCTURAR LA PROP
}) => {

    // --- Manejador de Cambios ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name.includes('.') && name.split('.').length === 2) {
            // Manejo de campos de rango (ej. "priceRange.min")
            const [rangeKey, subKey] = name.split('.') as [keyof Filters, 'min' | 'max'];

            if (['priceRange', 'yearRange', 'kmRange'].includes(rangeKey) && (subKey === 'min' || subKey === 'max')) {
                const parsedNum = parseInt(value, 10);
                const finalValue = Number.isNaN(parsedNum) ? undefined : parsedNum; // Usar undefined si no es un número válido

                const currentRange = filters[rangeKey as keyof Pick<Filters, 'priceRange' | 'yearRange' | 'kmRange'>]; // Ayuda a TS
                onFilterChange({
                    [rangeKey]: {
                        ...currentRange,
                        [subKey]: finalValue,
                    },
                });
            } else {
                console.warn("Nombre de input de rango inválido recibido:", name);
            }
        } else if (name === 'make' || name === 'model') {
             // Manejo de campos directos (make, model)
            onFilterChange({ [name]: value });
        } else {
             console.warn("Nombre de input desconocido recibido:", name);
        }
    };
    // --- Fin del Manejador de Cambios ---

    const availableModels = filters.make !== 'all' ? options.modelsByMake[filters.make] || [] : [];

    const sidebarClasses = `
      fixed inset-y-0 left-0 z-40 bg-gray-950 border-r border-gray-700/50 shadow-xl
      transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      transition-transform duration-300 ease-in-out
      w-72 sm:w-80 lg:w-64 xl:w-72
      lg:sticky lg:top-16
      lg:h-[calc(100vh-4rem)]
      flex flex-col p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900
    `;

    // Función auxiliar para formatear placeholders de rangos (ej. 50k, 1.5M)
    const formatRangePlaceholder = (value: number) => {
        if (value == null || isNaN(value)) return '';
        if (value === 0) return '0';
        if (value < 1000) return value.toString(); // Muestra números menores a 1000 completos
        if (value >= 1000000) return (value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1) + 'M'; // 1M, 1.5M
        return (value / 1000).toFixed(0) + 'k'; // 50k, 120k
    }

    return (
      <>
        {/* Overlay para cerrar en móvil */}
        {isOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose} aria-hidden="true"></div>}

        <aside className={sidebarClasses} aria-label="Filtros de Vehículos">
          {/* Encabezado del Sidebar */}
          <div className="flex justify-between items-center mb-5 border-b border-gray-700 pb-3">
            <h2 className="text-xl font-semibold text-white">Filtrar</h2>
            {/* Mostrar conteo de resultados */}
            <span className="text-sm text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
              {vehicleCount} {vehicleCount === 1 ? 'Resultado' : 'Resultados'}
            </span>
            {/* Botón cerrar en móvil */}
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
            {/* Filtro Marca */}
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

            {/* Filtro Modelo */}
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

            {/* Filtro Precio */}
            <fieldset>
               <legend className="block text-sm font-medium text-gray-300 mb-2">Precio (COP)</legend>
               <div className="flex space-x-2 items-center">
                  <input
                      type="number" name="priceRange.min"
                      placeholder={`Min ${formatPrice(options.priceRange.min)}`} // Formato sin decimales
                      value={filters.priceRange.min ?? ''} onChange={handleInputChange}
                      min="0" step="100000" // Step opcional para facilitar
                      className="w-1/2 bg-gray-800 border border-gray-600 rounded-md p-2 text-white text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 placeholder-gray-500"
                      aria-label="Precio mínimo"
                   />
                   <span className="text-gray-500">-</span>
                  <input
                      type="number" name="priceRange.max"
                      placeholder={`Max ${formatPrice(options.priceRange.max)}`} // Formato sin decimales
                      value={filters.priceRange.max ?? ''} onChange={handleInputChange}
                      min="0" step="100000"
                      className="w-1/2 bg-gray-800 border border-gray-600 rounded-md p-2 text-white text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 placeholder-gray-500"
                      aria-label="Precio máximo"
                  />
               </div>
            </fieldset>

            {/* Filtro Año */}
            <fieldset>
               <legend className="block text-sm font-medium text-gray-300 mb-2">Año</legend>
               <div className="flex space-x-2 items-center">
                   <input
                      type="number" name="yearRange.min"
                      placeholder={`Min ${options.yearRange.min || ''}`}
                      value={filters.yearRange.min ?? ''} onChange={handleInputChange}
                      min={options.yearRange.min && options.yearRange.min > 0 ? options.yearRange.min : 1980}
                      max={options.yearRange.max || new Date().getFullYear() + 1}
                      step="1"
                      className="w-1/2 bg-gray-800 border border-gray-600 rounded-md p-2 text-white text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 placeholder-gray-500"
                      aria-label="Año mínimo"
                   />
                    <span className="text-gray-500">-</span>
                   <input
                      type="number" name="yearRange.max"
                      placeholder={`Max ${options.yearRange.max || ''}`}
                      value={filters.yearRange.max ?? ''} onChange={handleInputChange}
                      min={options.yearRange.min && options.yearRange.min > 0 ? options.yearRange.min : 1980}
                      max={options.yearRange.max || new Date().getFullYear() + 1}
                      step="1"
                      className="w-1/2 bg-gray-800 border border-gray-600 rounded-md p-2 text-white text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 placeholder-gray-500"
                      aria-label="Año máximo"
                    />
                </div>
            </fieldset>

            {/* Filtro Kilometraje */}
             <fieldset>
               <legend className="block text-sm font-medium text-gray-300 mb-2">Kilometraje (Km)</legend>
               <div className="flex space-x-2 items-center">
                  <input
                      type="number" name="kmRange.min"
                      placeholder={`Min ${formatRangePlaceholder(options.kmRange.min)}`}
                      value={filters.kmRange.min ?? ''} onChange={handleInputChange}
                      min="0" step="1000"
                      className="w-1/2 bg-gray-800 border border-gray-600 rounded-md p-2 text-white text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 placeholder-gray-500"
                      aria-label="Kilometraje mínimo"
                  />
                   <span className="text-gray-500">-</span>
                  <input
                      type="number" name="kmRange.max"
                      placeholder={`Max ${formatRangePlaceholder(options.kmRange.max)}`}
                      value={filters.kmRange.max ?? ''} onChange={handleInputChange}
                      min="0" step="1000"
                      className="w-1/2 bg-gray-800 border border-gray-600 rounded-md p-2 text-white text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 placeholder-gray-500"
                      aria-label="Kilometraje máximo"
                   />
               </div>
            </fieldset>
          </form>

          {/* Botón Limpiar Filtros */}
          <div className="mt-auto pt-4 border-t border-gray-700">
             <button
                  onClick={onReset}
                  className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium py-2.5 px-4 rounded-md transition-colors"
              >
                  <FiRefreshCw size={16} />
                  Limpiar Filtros
              </button>
          </div>
        </aside>
      </>
    );
};