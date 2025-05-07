// src/app/admin/page.tsx
"use client";

import { useSession } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { VehicleForm } from './components/VehicleForm';
import { VehicleList } from './components/VehicleList';
import { useVehicles } from './hooks/useVehicles';
import Image from 'next/image';
import { useEffect } from 'react';
import { Vehiculo } from '@/app/admin/lib/supabase';

// Componente DateFilterControls (sin cambios respecto a tu versión, está bien aquí o en su propio archivo)
const DateFilterControls: React.FC<{
  filtroMes: number;
  setFiltroMes: (mes: number) => void;
  filtroAnio: number;
  setFiltroAnio: (anio: number) => void;
  onApplyFilters?: () => void;
}> = ({ filtroMes, setFiltroMes, filtroAnio, setFiltroAnio, onApplyFilters }) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-6 items-end p-4 bg-gray-800/50 rounded-md border border-gray-700">
      <div>
        <label htmlFor="filtroMes" className="block text-sm font-medium text-gray-300 mb-1">Mes:</label>
        <select
          id="filtroMes"
          value={filtroMes}
          onChange={(e) => setFiltroMes(parseInt(e.target.value, 10))}
          className="bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-red-500 focus:border-red-500 w-full sm:w-auto"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString('es-ES', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="filtroAnio" className="block text-sm font-medium text-gray-300 mb-1">Año:</label>
        <input
          type="number"
          id="filtroAnio"
          value={filtroAnio}
          onChange={(e) => setFiltroAnio(parseInt(e.target.value, 10))}
          className="bg-gray-700 text-white p-2 rounded-md border border-gray-600 w-full sm:w-28 focus:ring-red-500 focus:border-red-500"
          list="years-datalist"
        />
        <datalist id="years-datalist">
            {years.map(year => <option key={year} value={year} />)}
        </datalist>
      </div>
      {/* ... (botón opcional aplicar filtros) ... */}
    </div>
  );
};


export default function AdminPage() {
  const { data: session, status } = useSession({ required: true });

  const {
    vehiculos,
    isLoadingList: isLoadingInventario,
    vehiculosVendidos,
    isLoadingVendidos,
    activeTab,
    setActiveTab,
    filtroMes,
    setFiltroMes,
    filtroAnio,
    setFiltroAnio,
    loadVehiculosVendidos,
    formData,
    imageFile,
    editId,
    isSubmitting,
    generalError,
    handleImageChange,
    updateFormField,
    handleSubmit,
    handleDelete,
    handleMarkAsSold, // Esta es la función del hook que se pasa a la lista de inventario
    startEdit,
    clearForm,
  } = useVehicles();

  useEffect(() => {
    if (activeTab === 'vendidos') {
      if (!isNaN(filtroMes) && !isNaN(filtroAnio)) {
        loadVehiculosVendidos(filtroMes, filtroAnio);
      }
    }
    // No es necesario incluir loadVehiculos aquí porque el hook useVehicles ya tiene un useEffect
    // que llama a loadVehiculos() al montarse y cuando activeTab cambia a 'inventario' (si así lo configuraste en el hook).
    // Si el hook no lo hace, entonces sí necesitarías un if (activeTab === 'inventario') { loadVehiculos(); }
  }, [filtroMes, filtroAnio, activeTab, loadVehiculosVendidos]);


  const totalVendidosEnPeriodo = vehiculosVendidos.length;
  const valorTotalVentas = vehiculosVendidos.reduce((sum, v) => sum + (v.valor_venta || 0), 0);

  if (status === "loading") {
    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black text-white flex items-center justify-center">
            <p>Cargando sesión...</p>
        </div>
    );
  }

  // Define qué hacer al editar un vehículo vendido (podría ser diferente a editar uno en inventario)
  const handleEditSoldVehicle = (vehicle: Vehiculo) => {
    console.log("Intento de editar vehículo vendido:", vehicle);
    // Podrías abrir un modal diferente, o simplemente no permitir la edición,
    // o permitir editar solo ciertos campos (ej. notas de la venta, precio final si es editable post-venta).
    // Por ahora, no hacemos nada o llamamos a startEdit si la lógica es la misma.
    // startEdit(vehicle); // Si quieres usar el mismo formulario y lógica
    alert(`Editar vehículo vendido (ID: ${vehicle.id}) no implementado aún o usa una lógica diferente.`);
  };

  // Define qué hacer al "eliminar" un vehículo vendido
  const handleDeleteSoldVehicle = async (id: number) => {
    console.log("Intento de eliminar registro de vehículo vendido:", id);
    // ¿Esto borra el registro permanentemente o revierte la venta?
    // Por ahora, llamaremos a la misma función handleDelete del hook.
    // Considera si necesitas una lógica diferente en useVehicles para esto.
    // Si handleDelete es solo para borrar de la BD, está bien.
    // Si necesitas "deshacer venta", sería una nueva función en el hook.
    await handleDelete(id);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black text-white p-4 md:p-8">
      <Toaster
        position="top-right"
        toastOptions={{
          className: '',
          style: { background: '#333', color: '#fff', border: '1px solid #555' },
          success: { style: { background: '#16a34a', border: '1px solid #15803d'}, iconTheme: { primary: '#fff', secondary: '#16a34a' } },
          error: { style: { background: '#dc2626', border: '1px solid #b91c1c'}, iconTheme: { primary: '#fff', secondary: '#dc2626' } },
          loading: { style: { background: '#4b5563', border: '1px solid #374151'} }
        }}
      />

      <header className="mb-8 md:mb-12 text-center">
         <div className="inline-block mb-4">
             <Image
                src="/logo-definitivo_Mesa de trabajo 1.png"
                alt="Logo Escuderia RS"
                width={150} height={150}
                className="object-contain" priority
            />
         </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
            Panel de Administración
        </h1>
         <p className="text-gray-400 text-sm max-w-xl mx-auto">
            Gestiona el inventario y las ventas de vehículos de Escudería R.S.
        </p>
         {generalError && (
            <div className="mt-4 max-w-lg mx-auto bg-red-900/30 border border-red-600/50 text-red-300 px-4 py-2 rounded-md text-sm" role="alert">
                <strong>Error:</strong> {generalError}
            </div>
         )}
      </header>

      <div className="mb-6 border-b border-gray-700 flex flex-wrap -mb-px">
        <button
          onClick={() => setActiveTab('inventario')}
          className={`px-3 sm:px-4 py-2.5 text-sm font-medium rounded-t-md transition-colors focus:outline-none -ml-px
            ${activeTab === 'inventario'
              ? 'bg-gray-800 border border-gray-700 border-b-transparent text-red-400 relative z-10'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30 border border-transparent'}`}
        >
          Inventario ({activeTab === 'inventario' && !isLoadingInventario ? vehiculos.length : '...'})
        </button>
        <button
          onClick={() => setActiveTab('vendidos')}
          className={`px-3 sm:px-4 py-2.5 text-sm font-medium rounded-t-md transition-colors focus:outline-none
            ${activeTab === 'vendidos'
              ? 'bg-gray-800 border border-gray-700 border-b-transparent text-red-400 relative z-10'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30 border border-transparent'}`}
        >
          Vendidos ({activeTab === 'vendidos' && !isLoadingVendidos ? vehiculosVendidos.length : '...'})
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'inventario' && (
          <div className="space-y-10">
            <VehicleForm
                formData={formData}
                onUpdateField={updateFormField}
                imageFile={imageFile}
                onImageChange={handleImageChange}
                onSubmit={handleSubmit}
                isEdit={!!editId}
                onCancelEdit={clearForm}
                isLoading={isSubmitting}
            />
            <VehicleList
              vehicles={vehiculos}
              loading={isLoadingInventario}
              onEdit={startEdit} // Función de edición para inventario
              onMarkAsSold={handleMarkAsSold} // Función para marcar como vendido (del hook)
              onDelete={handleDelete} // Función de borrado para inventario (del hook)
              listType="inventario"
            />
            
            </div>
        )}

        {activeTab === 'vendidos' && (
          <div className="bg-gray-800/70 backdrop-blur-sm p-4 sm:p-6 rounded-lg shadow-md border border-gray-700">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-3">
              Historial de Vehículos Vendidos
            </h2>
            <DateFilterControls
                filtroMes={filtroMes}
                setFiltroMes={setFiltroMes}
                filtroAnio={filtroAnio}
                setFiltroAnio={setFiltroAnio}
            />
            {isLoadingVendidos && <p className="text-center py-4 text-gray-400">Cargando vehículos vendidos...</p>}
            {!isLoadingVendidos && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-center">
                    <div className="bg-gray-700/60 p-4 rounded-lg shadow">
                        <p className="text-sm text-gray-400 uppercase tracking-wider">Total Vendidos (Periodo)</p>
                        <p className="text-3xl font-bold text-red-400 mt-1">{totalVendidosEnPeriodo}</p>
                    </div>
                    <div className="bg-gray-700/60 p-4 rounded-lg shadow">
                        <p className="text-sm text-gray-400 uppercase tracking-wider">Valor Total Ventas (Periodo)</p>
                        <p className="text-3xl font-bold text-red-400 mt-1">
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(valorTotalVentas)}
                        </p>
                    </div>
                </div>
            )}
            <VehicleList
              vehicles={vehiculosVendidos}
              loading={isLoadingVendidos}
              onEdit={handleEditSoldVehicle} // Función específica para editar vendidos
              // onMarkAsSold se omite (será undefined para VehicleList)
              onDelete={handleDeleteSoldVehicle} // Función específica para eliminar vendidos
              listType="vendidos"
            />
          </div>
        )}
      </div>

      <footer className="text-center mt-12 text-xs text-gray-600">
          Panel de Administración © {new Date().getFullYear()} Escudería R.S.
      </footer>
    </div>
  );
}