// src/app/catalogo/page.tsx
"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { supabase, Vehiculo } from "@/app/admin/lib/supabase"; 

import { FilterSidebar, Filters } from "./components/FilterSidebar";
import { VehicleCard } from "./components/VehicleCard";
import { SortDropdown, SortOption } from "./components/SortDropdown";
import { VehicleDetailModal } from "./components/VehicleDetailModal"; 

import { FiFilter, FiImage } from "react-icons/fi"; // FiImage para placeholder
import { ClipLoader } from "react-spinners";

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
  { value: "km_asc", label: "Kilometraje (Menor)" },
  { value: "km_desc", label: "Kilometraje (Mayor)" },
];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
      const errorString = String(error);
      if (errorString !== '[object Object]') return errorString;
  } catch (conversionError) {
      console.error("Error al convertir el error a string:", conversionError);
  }
  return "Ocurrió un error desconocido.";
}

export default function CatalogoPage() {
  const [allVehicles, setAllVehicles] = useState<Vehiculo[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [sortBy, setSortBy] = useState<string>(sortOptions[0].value);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [selectedVehicleForDetail, setSelectedVehicleForDetail] = useState<Vehiculo | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Estado para asegurar que el modal solo se renderice en el cliente después del montaje
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleOpenDetailModal = useCallback((vehicle: Vehiculo) => {
    setSelectedVehicleForDetail(vehicle);
    setIsDetailModalOpen(true);
    if (typeof document !== 'undefined') {
        document.body.style.overflow = 'hidden'; 
    }
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedVehicleForDetail(null);
    if (typeof document !== 'undefined') {
        document.body.style.overflow = ''; 
    }
  }, []);

  useEffect(() => {
    async function loadVehiculos() {
      setLoading(true);
      setErrorMsg(null);
      setAllVehicles([]);
      setFilteredVehicles([]);
      try {
        const { data, error } = await supabase
          .from("Autos")
          .select("*") 
          .order("created_at", { ascending: false }); // Mostrar todos, vendidos y no vendidos

        if (error) {
          console.error("Error Supabase al obtener vehículos:", error);
          throw new Error(getErrorMessage(error));
        }
        setAllVehicles((data as Vehiculo[]) || []);
      } catch (err: unknown) { 
        console.error("Error cargando vehículos:", err);
        setErrorMsg(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadVehiculos();
  }, []);

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

    const defaultMinYear = new Date().getFullYear() - 20;
    const defaultMaxYear = new Date().getFullYear();
    const finalMinPrice = isFinite(minPrice) ? minPrice : 0;
    const finalMaxPrice = isFinite(maxPrice) && maxPrice > 0 ? maxPrice : 150000000; 
    const finalMinYear = isFinite(minYear) ? minYear : defaultMinYear;
    const finalMaxYear = isFinite(maxYear) && maxYear > 0 ? maxYear : defaultMaxYear;
    const finalMinKm = isFinite(minKm) ? minKm : 0;
    const finalMaxKm = isFinite(maxKm) && maxKm > 0 ? maxKm : 500000;

    return {
      makes: Array.from(makes).sort(),
      modelsByMake: Object.entries(modelsByMake).reduce((acc, [make, modelSet]) => {
        acc[make] = Array.from(modelSet).sort();
        return acc;
      }, {} as { [key: string]: string[] }),
      priceRange: { min: finalMinPrice, max: finalMaxPrice },
      yearRange: { min: finalMinYear, max: finalMaxYear },
      kmRange: { min: finalMinKm, max: finalMaxKm },
    };
  }, [allVehicles]);

  const applyFiltersAndSort = useCallback(() => {
    let tempVehicles = [...allVehicles];
    // Filtrar primero los no vendidos para la vista principal del catálogo
    // Si quieres mostrar todos y que el modal indique si está vendido, quita este filtro.
    // Por ahora, lo mantendré para que el catálogo principal solo muestre disponibles.
    tempVehicles = tempVehicles.filter(v => !v.vendido);

    tempVehicles = tempVehicles.filter((v) => {
      if (filters.make !== "all" && v.marca !== filters.make) return false;
      if (filters.make !== "all" && filters.model !== "all" && v.linea !== filters.model) return false;
      const price = v.valor_venta ?? null;
      if (price === null && (filters.priceRange?.min || filters.priceRange?.max)) return false;
      if (filters.priceRange?.min != null && price != null && price < filters.priceRange.min) return false;
      if (filters.priceRange?.max != null && price != null && price > filters.priceRange.max) return false;
      const year = v.modelo ?? null;
      if (year === null && (filters.yearRange?.min || filters.yearRange?.max)) return false;
      if (filters.yearRange?.min != null && year != null && year < filters.yearRange.min) return false;
      if (filters.yearRange?.max != null && year != null && year > filters.yearRange.max) return false;
      const km = v.km ?? null;
      if (km === null && (filters.kmRange?.min || filters.kmRange?.max)) return false;
      if (filters.kmRange?.min != null && km != null && km < filters.kmRange.min) return false;
      if (filters.kmRange?.max != null && km != null && km > filters.kmRange.max) return false;
      return true;
    });

    tempVehicles.sort((a, b) => {
      const valA_price = a.valor_venta ?? (sortBy === 'price_asc' ? Infinity : -Infinity);
      const valB_price = b.valor_venta ?? (sortBy === 'price_asc' ? Infinity : -Infinity);
      const valA_year = a.modelo ?? (sortBy === 'year_asc' ? Infinity : -Infinity); 
      const valB_year = b.modelo ?? (sortBy === 'year_asc' ? Infinity : -Infinity);
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
        case "newest": default: return dateB - dateA;
      }
    });
    setFilteredVehicles(tempVehicles);
  }, [allVehicles, filters, sortBy]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

  const handleFilterChange = useCallback((newFilters: Partial<Filters>) => {
    setFilters(prevFilters => {
        const updatedFilters = { ...prevFilters, ...newFilters };
        if (newFilters.make && newFilters.make !== prevFilters.make) {
            updatedFilters.model = "all";
        }
        return updatedFilters;
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(initialFilters);
     if (isMobileFilterOpen) setIsMobileFilterOpen(false);
  }, [isMobileFilterOpen]);

  const handleSortChange = useCallback((newSortBy: string) => {
    setSortBy(newSortBy);
  }, []);

  return (
    <>
      <Head>
        <title>Catálogo de Vehículos - Escuderia RS</title>
        <meta
          name="description"
          content="Explora y filtra nuestro catálogo completo de autos usados disponibles en Escudería RS."
        />
      </Head>

      <div className="bg-black text-white min-h-screen flex flex-col">
        <header className="bg-gradient-to-r from-red-800 via-red-700 to-red-600 h-16 px-4 flex items-center justify-between shadow-lg shadow-black sticky top-0 z-30">
          <Link href="/" className="text-xl sm:text-2xl font-bold tracking-wider hover:text-gray-200 transition-colors">
            ESCUDERÍA R.S
          </Link>
          <button
            className="lg:hidden text-white hover:text-gray-300 p-2 -mr-2"
            onClick={() => setIsMobileFilterOpen(true)}
            aria-label="Abrir filtros"
          >
            <FiFilter size={24} />
          </button>
        </header>

        <div className="flex flex-1 flex-col lg:flex-row">
           <FilterSidebar
            isOpen={isMobileFilterOpen}
            onClose={() => setIsMobileFilterOpen(false)}
            filters={filters}
            options={filterOptions}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            vehicleCount={filteredVehicles.length}
          />

          <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <h1 className="text-3xl sm:text-4xl font-black text-center lg:text-left text-gray-100 mb-6 sm:mb-8">
              Vehículos Disponibles
            </h1>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <p className="text-sm text-gray-400 order-2 sm:order-1">
                {loading
                  ? 'Buscando vehículos...'
                  // Ajuste para contar sobre los vehículos disponibles (no vendidos) que se muestran en el catálogo
                  : `${filteredVehicles.length} vehículo(s) ${allVehicles.filter(v => !v.vendido).length > 0 && filteredVehicles.length !== allVehicles.filter(v => !v.vendido).length ? `de ${allVehicles.filter(v => !v.vendido).length}` : 'encontrado(s)'}`
                 }
              </p>
              <div className="order-1 sm:order-2 w-full sm:w-auto">
                <SortDropdown
                  options={sortOptions}
                  value={sortBy}
                  onChange={handleSortChange}
                />
              </div>
            </div>

            {loading && (
              <div className="flex justify-center items-center py-20 flex-col text-center">
                 <ClipLoader
                    color="#dc2626"
                    loading={loading}
                    size={50}
                    aria-label="Cargando vehículos..."
                 />
                 <p className="text-gray-400 text-lg mt-4">Cargando vehículos...</p>
              </div>
            )}
            {errorMsg && !loading && (
              <div className="text-center text-red-400 bg-red-900/20 border border-red-700/50 p-6 rounded-lg max-w-lg mx-auto my-10 shadow-md">
                <p className="font-semibold text-lg mb-2">¡Error!</p>
                <p className="text-sm">{errorMsg}</p>
              </div>
            )}
            {!loading && !errorMsg && filteredVehicles.length === 0 && allVehicles.filter(v => !v.vendido).length > 0 && (
              <div className="text-center text-gray-400 bg-gray-900/30 border border-gray-700/50 p-8 rounded-lg max-w-lg mx-auto my-10 shadow-md">
                  <p className="font-semibold text-lg mb-2">No se encontraron vehículos</p>
                  <p className="text-sm mb-5">Intenta ajustar los filtros o eliminarlos para una búsqueda más amplia.</p>
                  <button
                      onClick={handleResetFilters}
                      className="bg-red-700 hover:bg-red-600 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors duration-200 cursor-pointer"
                  >
                      Limpiar Filtros
                  </button>
              </div>
            )}
             {!loading && !errorMsg && allVehicles.filter(v => !v.vendido).length === 0 && (
                 <p className="text-center text-gray-400 text-xl py-20">
                    Actualmente no hay vehículos disponibles en el catálogo.
                 </p>
            )}

            {!loading && !errorMsg && filteredVehicles.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                {filteredVehicles.map((vehicle, index) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    priority={index < 6}
                    onViewDetails={handleOpenDetailModal}
                   />
                ))}
              </div>
            )}
          </main>
        </div>

        <footer className="bg-gray-950 text-center p-4 border-t border-gray-700/50 mt-auto">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Escudería R.S. Todos los derechos reservados.
          </p>
        </footer>
      </div>

      {/* --- Renderizar el Modal de Detalles del Vehículo (solo si hasMounted es true) --- */}
      {hasMounted && (
        <VehicleDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          vehicle={selectedVehicleForDetail}
        />
      )}
    </>
  );
}