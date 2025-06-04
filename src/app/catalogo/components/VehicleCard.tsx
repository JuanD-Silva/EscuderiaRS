// src/app/catalogo/components/VehicleCard.tsx
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Vehiculo } from '@/app/admin/lib/supabase'; // Ajusta ruta si es necesario
import { getFirstImageUrlFromString, formatPrice } from '@/app/lib/utils'; // Ajusta ruta
import { FiDollarSign, FiEye } from 'react-icons/fi'; // FiEye para "Ver Detalles"
import { FaWhatsapp } from 'react-icons/fa';
import { FinanciacionModal } from './FinanciacionModal'; 

interface VehicleCardProps {
  vehicle: Vehiculo;
  priority?: boolean;
  onViewDetails: (vehicle: Vehiculo) => void; // Nueva prop para abrir el modal de detalles
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle: v, priority = false, onViewDetails }) => {
  const imageUrl = getFirstImageUrlFromString(v.imagenes);
  const numeroWhatsApp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "573124423639"; 
  const mensajeWhatsApp = `Hola, estoy interesado en el ${encodeURIComponent(v.marca || 'vehículo')} ${encodeURIComponent(v.linea || '')} ${v.modelo || ''} (ID: ${v.id}, Placa: ${v.placa || 'N/A'}). Quisiera más información.`;
  const whatsappLink = `https://wa.me/${numeroWhatsApp}?text=${mensajeWhatsApp}`;

  const [isFinanciacionModalOpen, setIsFinanciacionModalOpen] = useState(false);

  const openFinanciacionModal = () => setIsFinanciacionModalOpen(true);
  const closeFinanciacionModal = () => setIsFinanciacionModalOpen(false);

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Evitar que el click en los botones de acción abra el modal de detalles
    const targetElement = e.target as HTMLElement;
    if (targetElement.closest('button') || targetElement.closest('a')) {
      return; // Si el click fue en un botón o enlace dentro de la card, no hacer nada aquí.
    }
    onViewDetails(v); // Llamar a onViewDetails si el click fue en el área general de la card.
  };

  return (
    <>
      <div 
        className="bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-red-800/50 transition-all duration-300 flex flex-col border border-gray-700/50 hover:border-red-700/70 group h-full cursor-pointer"
        onClick={handleCardClick} // Click en cualquier parte de la tarjeta (excepto botones) abre detalles
      >
        <div className="relative w-full aspect-video overflow-hidden">
          <Image
            src={imageUrl || '/placeholder.png'} 
            alt={`Foto de ${v.marca || 'Vehículo'} ${v.linea || ''} ${v.modelo || ''}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out"
            onError={(e) => {
              if (e.currentTarget.src !== '/placeholder.png') {
                e.currentTarget.srcset = "";
                e.currentTarget.src = '/placeholder.png';
              }
            }}
            priority={priority}
          />
           {v.vendido && (
            <div className="absolute top-3 left-3 bg-red-700 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg z-10">
              VENDIDO
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-grow">
          <h2 className="text-lg lg:text-xl font-bold mb-1 truncate text-gray-100 group-hover:text-red-400 transition-colors" title={`${v.marca} ${v.linea}`}>
            {v.marca} {v.linea}
          </h2>
          <p className="text-sm text-red-400 mb-3 font-medium">
            {v.modelo} | {v.km != null ? `${v.km.toLocaleString('es-CO')} km` : 'N/D km'}
          </p>

          <div className="text-xs text-gray-300 space-y-1.5 mb-4 border-t border-gray-700 pt-3 mt-auto">
            {v.motor && <p><span className="font-semibold text-gray-400 w-[70px] inline-block">Motor:</span> {v.motor}</p>}
            {v.tipo_caja && <p><span className="font-semibold text-gray-400 w-[70px] inline-block">Caja:</span> {v.tipo_caja}</p>}
            {/* No mostrar todos los detalles aquí, para eso está el modal */}
          </div>

          <p className="text-2xl lg:text-3xl font-extrabold text-red-500 mb-4 text-right">
            {formatPrice(v.valor_venta)}
          </p>

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
                onClick={(e) => { e.stopPropagation(); onViewDetails(v); }} // Detener propagación y abrir detalles
                className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2.5 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500"
              >
                <FiEye size={16} />
                Ver Detalles
            </button>
            {!v.vendido && (
              <button
                onClick={(e) => { e.stopPropagation(); openFinanciacionModal(); }} // Detener propagación
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
              >
                <FiDollarSign size={16} />
                Financiación
              </button>
            )}
          </div>
           <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()} // Detener propagación
              className="mt-2 w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2.5 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500"
              aria-label={`Contactar por WhatsApp sobre ${v.marca} ${v.linea}`}
            >
              <FaWhatsapp size={18} />
              Contactar
            </a>
        </div>
      </div>

      {!v.vendido && isFinanciacionModalOpen && (
        <FinanciacionModal
          isOpen={isFinanciacionModalOpen}
          onClose={closeFinanciacionModal}
          vehiculoInteres={v}
        />
      )}
    </>
  );
};