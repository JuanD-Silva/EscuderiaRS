// src/app/catalogo/page.tsx
"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { supabase, Vehiculo } from "../admin/lib/supabase"; // Ajusta la ruta si es necesario

// Importa los nuevos componentes
import { FilterSidebar, Filters } from "../catalogo/components/FilterSidebar";
import { VehicleCard } from "../catalogo/components/VehicleCard";
import { SortDropdown, SortOption } from "../catalogo/components/SortDropdown";

// Importa iconos (asegúrate de tener react-icons instalado: npm install react-icons)
import { FiFilter } from "react-icons/fi";
import { ClipLoader } from "react-spinners"; // O usa tu propio spinner

// --- Constantes y Tipos ---
const initialFilters: Filters = {
  make: "all",
  model: "all",
  yearRange: {},
  priceRange: {},
  kmRange: {},
};

const sortOptions: SortOption[] = [
  { value: "newest", label: "Más Recientes" },
  { value: "price_asc", label: "Precio (Menor a Mayor)" },
  { value: "price_desc", label: "Precio (Mayor a Menor)" },
  { value: "year_desc", label: "Año (Más Nuevo)" },
  { value: "year_asc", label: "Año (Más Viejo)" },
  { value: "km_asc", label: "Kilometraje (Menor)" }, // Texto más corto
  { value: "km_desc", label: "Kilometraje (Mayor)" }, // Texto más corto
];

// --- Componente Principal del Catálogo ---
export default function CatalogoPage() {
  const [allVehicles, setAllVehicles] = useState<Vehiculo[]>([]); // Todos los vehículos cargados
  const [filteredVehicles, setFilteredVehicles] = useState<Vehiculo[]>([]); // Vehículos después de filtrar/ordenar
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [sortBy, setSortBy] = useState<string>(sortOptions[0].value); // Orden por defecto
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false); // Estado para el modal de filtros

  // --- Efecto para Cargar Datos Iniciales ---
  useEffect(() => {
    async function loadVehiculos() {
      setLoading(true);
      setErrorMsg(null);
      setAllVehicles([]); // Limpia antes de cargar
      setFilteredVehicles([]);
      try {
        // Seleccionar explícitamente solo las columnas necesarias
        const { data, error } = await supabase
          .from("Autos")
          .select(
            "id, created_at, marca, linea, modelo, km, imagenes, valor_venta, tipo_caja, motor, color, placa" // Añade más si las usas en la tarjeta o filtros
            // Quita columnas que no uses para optimizar
          )
          .eq("vendido", false) // Solo los que no están marcados como vendidos
          .order("created_at", { ascending: false }); // Orden inicial por defecto

        if (error) {
          console.error("Error Supabase al obtener vehículos:", error);
          throw new Error("No se pudieron cargar los vehículos desde la base de datos.");
        }

        if (data) {
          const vehiclesData = data as Vehiculo[];
          setAllVehicles(vehiclesData);
          // setFilteredVehicles(vehiclesData); // Se actualizará en el effect de applyFiltersAndSort
        }

      } catch (err: any) {
        console.error("Error cargando vehículos:", err);
        setErrorMsg(err.message || "Ocurrió un error inesperado al cargar los vehículos.");
      } finally {
        setLoading(false);
      }
    }
    loadVehiculos();
  }, []); // Se ejecuta solo una vez al montar el componente

  // --- Calcular Opciones Disponibles para los Filtros ---
  const filterOptions = useMemo(() => {
    const makes = new Set<string>();
    const modelsByMake: { [key: string]: Set<string> } = {};
    let minPrice = Infinity, maxPrice = 0;
    let minYear = Infinity, maxYear = 0;
    let minKm = Infinity, maxKm = 0;

    allVehicles.forEach((v) => {
      if (v.marca) makes.add(v.marca);
      if (v.marca && v.linea) {
        if (!modelsByMake[v.marca]) modelsByMake[v.marca] = new Set<string>();
        modelsByMake[v.marca].add(v.linea);
      }
      if (v.valor_venta != null) {
        minPrice = Math.min(minPrice, v.valor_venta);
        maxPrice = Math.max(maxPrice, v.valor_venta);
      }
      if (v.modelo != null) {
        minYear = Math.min(minYear, v.modelo);
        maxYear = Math.max(maxYear, v.modelo);
      }
      if (v.km != null) {
        minKm = Math.min(minKm, v.km);
        maxKm = Math.max(maxKm, v.km);
      }
    });

    // Si no hay vehículos, usar rangos por defecto o vacíos
    const defaultMinYear = new Date().getFullYear() - 20;
    const defaultMaxYear = new Date().getFullYear();

    return {
      makes: Array.from(makes).sort(),
      modelsByMake: Object.entries(modelsByMake).reduce((acc, [make, modelSet]) => {
        acc[make] = Array.from(modelSet).sort();
        return acc;
      }, {} as { [key: string]: string[] }),
      priceRange: { min: minPrice === Infinity ? 0 : minPrice, max: maxPrice || 100000000 }, // Poner un max por defecto si es 0
      yearRange: { min: minYear === Infinity ? defaultMinYear : minYear, max: maxYear === 0 ? defaultMaxYear : maxYear },
      kmRange: { min: minKm === Infinity ? 0 : minKm, max: maxKm || 500000 }, // Poner un max por defecto si es 0
    };
  }, [allVehicles]);

  // --- Función Memoizada para Aplicar Filtros y Ordenación ---
  const applyFiltersAndSort = useCallback(() => {
    let tempVehicles = [...allVehicles];

    // 1. Aplicar Filtros
    tempVehicles = tempVehicles.filter((v) => {
      // Marca
      if (filters.make !== "all" && v.marca !== filters.make) return false;
      // Modelo (solo si hay marca seleccionada Y modelo seleccionado)
      if (filters.make !== "all" && filters.model !== "all" && v.linea !== filters.model) return false;
      // Rango de Precio (usar ?? para manejar null/undefined)
      const price = v.valor_venta ?? null;
      if (price === null && (filters.priceRange.min || filters.priceRange.max)) return false; // Excluir si no tiene precio y se filtra por precio
      if (filters.priceRange.min != null && price != null && price < filters.priceRange.min) return false;
      if (filters.priceRange.max != null && price != null && price > filters.priceRange.max) return false;
      // Rango de Año (modelo)
      const year = v.modelo ?? null;
      if (year === null && (filters.yearRange.min || filters.yearRange.max)) return false;
      if (filters.yearRange.min != null && year != null && year < filters.yearRange.min) return false;
      if (filters.yearRange.max != null && year != null && year > filters.yearRange.max) return false;
      // Rango de Kilometraje
      const km = v.km ?? null;
      if (km === null && (filters.kmRange.min || filters.kmRange.max)) return false;
      if (filters.kmRange.min != null && km != null && km < filters.kmRange.min) return false;
      if (filters.kmRange.max != null && km != null && km > filters.kmRange.max) return false;

      // Añadir más condiciones de filtro aquí si es necesario

      return true; // Pasa todos los filtros
    });

    // 2. Aplicar Ordenación
    tempVehicles.sort((a, b) => {
      const valA_price = a.valor_venta ?? (sortBy === 'price_asc' ? Infinity : -Infinity); // Nulos al final/principio según orden
      const valB_price = b.valor_venta ?? (sortBy === 'price_asc' ? Infinity : -Infinity);
      const valA_year = a.modelo ?? 0;
      const valB_year = b.modelo ?? 0;
      const valA_km = a.km ?? (sortBy === 'km_asc' ? Infinity : -Infinity);
      const valB_km = b.km ?? (sortBy === 'km_asc' ? Infinity : -Infinity);
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;

      switch (sortBy) {
        case "price_asc": return valA_price - valB_price;
        case "price_desc": return valB_price - valA_price;
        case "year_asc": return valA_year - valB_year;
        case "year_desc": return valB_year - valA_year;
        case "km_asc": return valA_km - valB_km;
        case "km_desc": return valB_km - valA_km;
        case "newest":
        default: return dateB - dateA; // Más reciente primero
      }
    });

    setFilteredVehicles(tempVehicles); // Actualiza el estado con los vehículos filtrados/ordenados

  }, [allVehicles, filters, sortBy]);

  // --- Efecto para Re-aplicar Filtros/Orden cuando cambian ---
  useEffect(() => {
    // Aplicar filtros/ordenación cada vez que cambien los datos originales,
    // los filtros seleccionados o el criterio de ordenación.
    applyFiltersAndSort();
  }, [applyFiltersAndSort]); // La dependencia es la función memoizada

  // --- Manejadores de Eventos ---
  const handleFilterChange = useCallback((newFilters: Partial<Filters>) => {
    setFilters(prevFilters => {
        const updatedFilters = { ...prevFilters, ...newFilters };
        // Si la marca cambió, resetear el modelo a 'all'
        if (newFilters.make && newFilters.make !== prevFilters.make) {
            updatedFilters.model = "all";
        }
        return updatedFilters;
    });
    // Podrías cerrar el modal móvil aquí si lo deseas:
    // if (isMobileFilterOpen) setIsMobileFilterOpen(false);
  }, []); // Sin dependencias, ya que solo usa setFilters

  const handleResetFilters = useCallback(() => {
    setFilters(initialFilters);
    // Podrías cerrar el modal móvil aquí:
     if (isMobileFilterOpen) setIsMobileFilterOpen(false);
  }, [isMobileFilterOpen]); // Depende de isMobileFilterOpen si lo usas dentro

  const handleSortChange = useCallback((newSortBy: string) => {
    setSortBy(newSortBy);
  }, []);

  // --- Renderizado ---
  return (
    <>
      <Head>
        <title>Catálogo de Vehículos - Escuderia RS</title>
        <meta
          name="description"
          content="Explora y filtra nuestro catálogo completo de autos usados disponibles en Escudería RS."
        />
        {/* Considera añadir meta tags OpenGraph para compartir en redes sociales */}
      </Head>

      <div className="bg-black text-white min-h-screen flex flex-col">
        {/* HEADER (Considera extraer a un componente Layout si es compartido) */}
        <header className="bg-gradient-to-r from-red-800 via-red-700 to-red-600 h-16 px-4 flex items-center justify-between shadow-lg shadow-black sticky top-0 z-30">
          <Link href="/" className="text-xl sm:text-2xl font-bold tracking-wider hover:text-gray-200 transition-colors">
            ESCUDERÍA R.S
          </Link>
          {/* Botón para abrir filtros en móvil (visible solo en pantallas pequeñas) */}
          <button
            className="lg:hidden text-white hover:text-gray-300 p-2 -mr-2" // Ajusta padding/margen si es necesario
            onClick={() => setIsMobileFilterOpen(true)}
            aria-label="Abrir filtros"
          >
            <FiFilter size={24} />
          </button>
        </header>

        {/* --- Layout Principal (Sidebar + Contenido) --- */}
        {/* flex-1 asegura que este div ocupe el espacio restante */}
        <div className="flex flex-1 flex-col lg:flex-row"> {/* Cambia a row en pantallas grandes */}
          {/* --- Sidebar de Filtros --- */}
          {/* Se pasa el estado y los manejadores como props */}
          <FilterSidebar
            isOpen={isMobileFilterOpen}
            onClose={() => setIsMobileFilterOpen(false)}
            filters={filters}
            options={filterOptions} // Pasa las opciones calculadas
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            vehicleCount={filteredVehicles.length} // Pasa el conteo de resultados
          />

          {/* --- Contenido Principal --- */}
          {/* flex-grow permite que ocupe el espacio restante al lado del sidebar */}
          {/* overflow-y-auto permite scroll independiente del contenido si es largo */}
          <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <h1 className="text-3xl sm:text-4xl font-black text-center lg:text-left text-gray-100 mb-6 sm:mb-8">
              Vehículos Disponibles
            </h1>

            {/* --- Controles Superiores (Resultados y Ordenación) --- */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              {/* Conteo de resultados */}
              <p className="text-sm text-gray-400 order-2 sm:order-1">
                {loading
                  ? 'Buscando vehículos...'
                  : `${filteredVehicles.length} vehículo(s) ${allVehicles.length > 0 && filteredVehicles.length !== allVehicles.length ? `de ${allVehicles.length}` : 'encontrado(s)'}`
                 }
              </p>
              {/* Dropdown de Ordenación */}
              <div className="order-1 sm:order-2 w-full sm:w-auto">
                <SortDropdown
                  options={sortOptions}
                  value={sortBy}
                  onChange={handleSortChange}
                />
              </div>
            </div>

            {/* --- Feedback de Carga, Errores y Sin Resultados --- */}
            {loading && (
              <div className="flex justify-center items-center py-20 flex-col text-center">
                 {/* Ejemplo con react-loader-spinner (npm install react-loader-spinner) */}
                 <ClipLoader
                    color="#dc2626" // Tu color rojo de marca
                    loading={loading} // Propiedad para controlar visibilidad (ya la tenemos)
                    size={50} // Tamaño en píxeles (ajusta según prefieras)
                    aria-label="Cargando vehículos..." // Para accesibilidad
                 />
                 <p className="text-gray-400 text-lg mt-4">Cargando vehículos...</p>
              </div>
            )}
            {errorMsg && !loading && (
              <div className="text-center text-red-400 bg-red-900/20 border border-red-700/50 p-6 rounded-lg max-w-lg mx-auto my-10 shadow-md">
                <p className="font-semibold text-lg mb-2">¡Error!</p>
                <p className="text-sm">{errorMsg}</p>
                {/* Podrías añadir un botón para reintentar la carga */}
              </div>
            )}
            {/* Mensaje cuando hay filtros aplicados pero no hay resultados */}
            {!loading && !errorMsg && filteredVehicles.length === 0 && allVehicles.length > 0 && (
              <div className="text-center text-gray-400 bg-gray-900/30 border border-gray-700/50 p-8 rounded-lg max-w-lg mx-auto my-10 shadow-md">
                  <p className="font-semibold text-lg mb-2">No se encontraron vehículos</p>
                  <p className="text-sm mb-5">Intenta ajustar los filtros o eliminarlos para una búsqueda más amplia.</p>
                  <button
                      onClick={handleResetFilters}
                      className="bg-red-700 hover:bg-red-600 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors duration-200"
                  >
                      Limpiar Filtros
                  </button>
              </div>
            )}
             {/* Mensaje cuando la base de datos está vacía */}
            {!loading && !errorMsg && allVehicles.length === 0 && (
                 <p className="text-center text-gray-400 text-xl py-20">
                    Actualmente no hay vehículos disponibles en el catálogo.
                 </p>
            )}

            {/* --- Cuadrícula de Vehículos --- */}
            {/* Solo mostrar si no está cargando, no hay error y hay vehículos para mostrar */}
            {!loading && !errorMsg && filteredVehicles.length > 0 && (
              // Ajusta las columnas según tus preferencias y el ancho del sidebar
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                {filteredVehicles.map((vehicle, index) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    // Prioriza la carga de las primeras ~6 imágenes (ajusta según el grid)
                    priority={index < 6}
                   />
                ))}
              </div>
            )}
          </main>
        </div> {/* Fin de flex-1 */}

        {/* FOOTER (Considera extraer a un componente Layout) */}
        <footer className="bg-gray-950 text-center p-4 border-t border-gray-700/50 mt-auto"> {/* mt-auto si no usas flex-1 en el div padre */}
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Escudería R.S. Todos los derechos reservados.
          </p>
        </footer>
      </div> {/* Fin de flex flex-col min-h-screen */}
    </>
  );
}