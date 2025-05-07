// src/app/admin/components/VehicleItem.tsx
import React from 'react';
import Image from 'next/image';
import { Vehiculo } from '../lib/supabase';
import { formatPrice, getFirstImageUrlFromString } from '@/app/lib/utils';
import { FiEdit, FiTrash2, FiDollarSign } from 'react-icons/fi';
import { ClipLoader } from 'react-spinners';

export interface VehicleItemProps { // <--- Asegúrate que esta interfaz es la que usas
  vehicle: Vehiculo;
  onEdit: (vehicle: Vehiculo) => void;
  onMarkAsSold?: (id: number) => void;
  onDelete: () => void;
  isDeleting: boolean;
  isMarkingSold: boolean;
  listType?: 'inventario' | 'vendidos'; // Prop opcional
}

export const VehicleItem: React.FC<VehicleItemProps> = ({
  vehicle,
  onEdit,
  onMarkAsSold,
  onDelete,
  isDeleting,
  isMarkingSold,
  listType, // Puede ser 'inventario', 'vendidos', o undefined
}) => {
  const imageUrl = getFirstImageUrlFromString(vehicle.imagenes);

  const handleEditClick = () => {
    // Lógica de edición:
    // Si listType es 'vendidos', no permitir editar (o tener lógica diferente).
    // Si listType es 'inventario' o undefined (por defecto inventario), permitir editar si no se está procesando.
    if (listType === 'vendidos' || isDeleting || isMarkingSold) { // Si es la lista de vendidos, O está procesando, no editar
        // Opcionalmente, podrías tener una lógica de edición diferente para 'vendidos'
        console.log("Edición no permitida o diferente para este tipo de lista/estado.");
        return;
    }
    onEdit(vehicle);
  };

  const handleDeleteClick = () => {
    if (isDeleting || isMarkingSold) return;
    onDelete();
  };

  const handleMarkAsSoldClick = () => {
    // Solo llamar si:
    // 1. onMarkAsSold existe (se pasó la prop)
    // 2. El vehículo no está ya vendido
    // 3. No estamos en la lista de 'vendidos' (explícitamente)
    // 4. No se está procesando otra acción
    // Si listType es undefined, asumimos que es 'inventario' y permitimos marcar como vendido.
    if (onMarkAsSold && !vehicle.vendido && listType !== 'vendidos' && !isMarkingSold && !isDeleting) {
      onMarkAsSold(vehicle.id);
    }
  };

  // Determinar si el botón de editar debe estar deshabilitado
  const isEditDisabled = (listType === 'vendidos' && vehicle.vendido) || // Si es lista de vendidos Y está vendido
                         isDeleting || isMarkingSold;

  return (
    <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-700 flex flex-col md:flex-row mb-4 transition-shadow hover:shadow-lg hover:border-gray-600">
        {/* Columna de Imagen */}
        <div className="flex-shrink-0 w-full md:w-40 h-40 md:h-auto relative">
            <Image
                src={imageUrl || '/placeholder.png'}
                alt={`Imagen ${vehicle.marca} ${vehicle.linea}`}
                fill sizes="(max-width: 768px) 100vw, 160px"
                className="object-cover"
                onError={(e) => { if (e.currentTarget.src !== '/placeholder.png') { e.currentTarget.src = '/placeholder.png'; }}}
            />
            {vehicle.vendido && (
                <span className="absolute top-2 left-2 bg-red-700 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">VENDIDO</span>
            )}
        </div>

        {/* Columna de Información */}
        <div className="p-4 flex-grow flex flex-col justify-between">
            <div>
                <h3 className="text-lg font-bold text-white mb-1 truncate" title={`${vehicle.marca} ${vehicle.linea} ${vehicle.modelo}`}>
                    {vehicle.marca} {vehicle.linea} - <span className="text-gray-300 font-medium">{vehicle.modelo}</span>
                </h3>
                <p className="text-sm text-gray-400 mb-2">
                    Placa: <span className="font-medium text-gray-300">{vehicle.placa || 'N/A'}</span> | KM: <span className="font-medium text-gray-300">{vehicle.km?.toLocaleString('es-CO') ?? 'N/A'}</span>
                </p>
                <p className="text-sm text-gray-400 mb-3">
                    Estado: <span className={`font-semibold ${vehicle.vendido ? 'text-red-400' : 'text-green-400'}`}>{vehicle.estado || 'N/A'}</span>
                </p>
                {listType === 'vendidos' && vehicle.fecha_venta && (
                    <p className="text-xs text-gray-500">
                        Vendido el: {new Date(vehicle.fecha_venta).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                )}
            </div>
            <p className="text-xl font-extrabold text-red-500 mt-1 mb-3 md:mb-0">{formatPrice(vehicle.valor_venta)}</p>
        </div>

        {/* Columna de Acciones */}
        <div className="p-3 bg-gray-800/50 border-t border-gray-700 md:border-t-0 md:border-l md:w-auto flex flex-row md:flex-col items-center justify-center gap-2 md:gap-3 flex-wrap">
           {/* Botón Editar */}
           {/* Mostrar botón de editar si no es la lista de vendidos, O si es la lista de vendidos pero quieres permitir
               algún tipo de edición (ej. notas de venta). Aquí lo oculto para 'vendidos' por simplicidad. */}
           {listType !== 'vendidos' && ( // <--- CONDICIÓN CLAVE
               <button
                    onClick={handleEditClick} // Usa el handler que tiene la lógica condicional
                    disabled={isEditDisabled} // Usa la variable para deshabilitar
                    title="Editar Vehículo"
                    className={`flex items-center justify-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 cursor-pointer ${
                        isEditDisabled
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50' // Quitado disabled:cursor-not-allowed redundante
                    }`}
                >
                    <FiEdit size={14} />
                    <span className="hidden sm:inline">Editar</span>
                </button>
            )}

            {/* Botón Marcar como Vendido */}
            {/* Se muestra solo si: onMarkAsSold existe, el vehículo no está vendido, Y (listType no es 'vendidos' O listType es undefined) */}
            {onMarkAsSold && !vehicle.vendido && listType !== 'vendidos' && ( // <--- CONDICIÓN CLAVE
                 <button
                     onClick={handleMarkAsSoldClick} // Usa el handler
                     disabled={isMarkingSold || isDeleting}
                     title="Marcar como Vendido"
                     className="flex items-center justify-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-yellow-500 bg-yellow-600 hover:bg-yellow-500 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                     {isMarkingSold ? <ClipLoader size={14} color="#fff" /> : <FiDollarSign size={14} />}
                     <span className="hidden sm:inline">Vendido</span>
                 </button>
            )}

            {/* Botón Eliminar */}
            <button
                onClick={handleDeleteClick} // Usa el handler
                disabled={isDeleting || isMarkingSold}
                title={listType === 'vendidos' ? "Eliminar registro de venta" : "Eliminar Vehículo"}
                className="flex items-center justify-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 bg-red-600 hover:bg-red-500 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
                 {isDeleting ? <ClipLoader size={14} color="#fff" /> : <FiTrash2 size={14} />}
                 <span className="hidden sm:inline">Eliminar</span>
            </button>
        </div>
    </div>
  );
};