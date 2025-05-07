// src/app/admin/components/VehicleList.tsx
import React, { useState } from 'react';
// Asegúrate de que VehicleItem y VehicleItemProps se importen si es necesario para claridad, aunque no directamente para tipado aquí.
import { VehicleItem } from './VehicleItem';
import { Vehiculo } from '../lib/supabase';
import { ConfirmModal } from './ConfirmModal';
import { FiSearch } from 'react-icons/fi';

// Skeleton Loader Component (Simple) - Sin cambios
const SkeletonVehicleItem = () => (
    <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-700 flex flex-col md:flex-row mb-4 animate-pulse">
        <div className="flex-shrink-0 w-full md:w-40 h-40 md:h-auto bg-gray-700"></div>
        <div className="p-4 flex-grow flex flex-col justify-between">
            <div>
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/3 mb-3"></div>
            </div>
            <div className="h-8 bg-gray-700 rounded w-1/4 mt-1 mb-3 md:mb-0"></div>
        </div>
        <div className="p-3 bg-gray-800/50 border-t border-gray-700 md:border-t-0 md:border-l md:w-auto flex flex-row md:flex-col items-center justify-center gap-2 md:gap-3">
            <div className="h-8 w-20 bg-gray-700 rounded"></div>
            <div className="h-8 w-20 bg-gray-700 rounded"></div>
            <div className="h-8 w-20 bg-gray-700 rounded"></div>
        </div>
    </div>
);

// Interfaz de Props para VehicleList
export interface VehicleListProps {
  vehicles: Vehiculo[];
  loading: boolean;
  onEdit: (vehicle: Vehiculo) => void;
  onMarkAsSold?: (id: number) => Promise<void>; // <--- HECHO OPCIONAL CON '?'
  onDelete: (id: number) => Promise<void>; // La función del hook que borra
  listType?: 'inventario' | 'vendidos';
}

export const VehicleList: React.FC<VehicleListProps> = ({
  vehicles,
  loading,
  onEdit,
  onMarkAsSold, // Esta prop ahora es opcional
  onDelete,
  listType,   // Recibimos listType
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [itemBeingDeletedId, setItemBeingDeletedId] = useState<number | null>(null);
  const [itemBeingMarkedSoldId, setItemBeingMarkedSoldId] = useState<number | null>(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [vehicleToConfirmDelete, setVehicleToConfirmDelete] = useState<Vehiculo | null>(null);
  const [isProcessingDeleteInModal, setIsProcessingDeleteInModal] = useState(false);

  const filteredVehicles = vehicles.filter(v =>
    v.placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.linea?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.modelo?.toString().includes(searchTerm)
  );

  const handleRequestDeleteConfirmation = (vehicle: Vehiculo) => {
    setVehicleToConfirmDelete(vehicle);
    setIsConfirmDeleteModalOpen(true);
  };

  const handleCancelDelete = () => {
    setIsConfirmDeleteModalOpen(false);
    setVehicleToConfirmDelete(null);
    setIsProcessingDeleteInModal(false);
  };

  const handleConfirmAndDelete = async () => {
    if (!vehicleToConfirmDelete) return;
    setIsProcessingDeleteInModal(true);
    setItemBeingDeletedId(vehicleToConfirmDelete.id);
    try {
      await onDelete(vehicleToConfirmDelete.id);
    } catch (error) {
      console.error("Error al confirmar y eliminar vehículo:", error);
    } finally {
      handleCancelDelete();
      setItemBeingDeletedId(null);
    }
  };

  // Handler local para "Marcar como Vendido" que maneja el spinner del ítem
  const localHandleMarkAsSold = async (id: number) => {
    // Solo proceder si onMarkAsSold (la prop del hook) fue proporcionada
    if (!onMarkAsSold) {
      console.warn("Attempted to call onMarkAsSold but it was not provided.");
      return;
    }
    setItemBeingMarkedSoldId(id);
    try {
      await onMarkAsSold(id); // Llama a la función del hook
    } catch (error) {
      console.error("Error en localHandleMarkAsSold:", error);
      // El toast de error ya lo maneja el hook useVehicles
    } finally {
      setItemBeingMarkedSoldId(null);
    }
  };

  return (
    <>
      <section className="mt-10">
        <div className="flex flex-col md:flex-row justify-between items-center mb-5 gap-4">
          <h2 className="text-xl md:text-2xl font-bold text-white">
            {/* Ajustar título según listType si se desea */}
            {listType === 'vendidos' ? 'Historial de Vehículos Vendidos' : 'Listado de Vehículos'}
          </h2>
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Buscar por Placa, Marca, Línea..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md bg-gray-800 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" size={18} />
            </div>
          </div>
        </div>

        {loading && (
          <div className="space-y-4">
            <SkeletonVehicleItem />
            <SkeletonVehicleItem />
            <SkeletonVehicleItem />
          </div>
        )}

        {!loading && filteredVehicles.length === 0 && (
          <div className="text-center py-10 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-gray-400">
              {vehicles.length === 0 ?
                (listType === 'vendidos' ? "No hay vehículos vendidos en este periodo." : "No hay vehículos registrados todavía.")
                : "No se encontraron vehículos con ese criterio."}
            </p>
          </div>
        )}

        {!loading && filteredVehicles.length > 0 && (
          <div className="space-y-4">
            {filteredVehicles.map((vehicle) => (
              <VehicleItem
                key={vehicle.id}
                vehicle={vehicle}
                onEdit={onEdit}
                // Se pasa la función local `localHandleMarkAsSold` si `onMarkAsSold` (del hook) existe.
                // `VehicleItem` recibirá una función `(id: number) => void` o `undefined`.
                onMarkAsSold={onMarkAsSold ? localHandleMarkAsSold : undefined}
                onDelete={() => handleRequestDeleteConfirmation(vehicle)} // Esto pasa `() => void` a VehicleItem
                isDeleting={itemBeingDeletedId === vehicle.id}
                isMarkingSold={itemBeingMarkedSoldId === vehicle.id}
                listType={listType} // Pasar el tipo de lista para que VehicleItem se adapte
              />
            ))}
          </div>
        )}
      </section>

      {vehicleToConfirmDelete && (
        <ConfirmModal
          isOpen={isConfirmDeleteModalOpen}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmAndDelete}
          title="Confirmar Eliminación"
          message={
            <>
              <p className="mb-2">¿Estás seguro de que deseas eliminar permanentemente el vehículo?</p>
              <p className="font-semibold text-red-400">{`${vehicleToConfirmDelete.marca} ${vehicleToConfirmDelete.linea} (Placa: ${vehicleToConfirmDelete.placa || 'N/A'})`}</p>
              <p className="mt-2 text-xs text-gray-500">Esta acción no se puede deshacer.</p>
            </>
          }
          confirmText="Sí, Eliminar"
          isLoading={isProcessingDeleteInModal}
        />
      )}
    </>
  );
};