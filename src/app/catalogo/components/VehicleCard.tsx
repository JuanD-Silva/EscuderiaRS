// src/app/catalogo/components/VehicleCard.tsx
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Vehiculo } from '@/app/admin/lib/supabase'; // Ajusta ruta si es necesario
import { getFirstImageUrlFromString, formatPrice } from '@/app/lib/utils'; // Ajusta ruta
import { FiDollarSign } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { FinanciacionModal } from './FinanciacionModal'; // <--- IMPORTAR EL MODAL

interface VehicleCardProps {
  vehicle: Vehiculo;
  priority?: boolean;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle: v, priority = false }) => {
  const imageUrl = getFirstImageUrlFromString(v.imagenes);
  // Asegúrate de que este número de WhatsApp sea correcto y esté como variable de entorno idealmente
  const numeroWhatsApp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "573124423639"; // Fallback
  const mensajeWhatsApp = `Hola, estoy interesado en el ${encodeURIComponent(v.marca || 'vehículo')} ${encodeURIComponent(v.linea || '')} ${v.modelo || ''} (ID: ${v.id}, Placa: ${v.placa || 'N/A'}). Quisiera más información.`;
  const whatsappLink = `https://wa.me/${numeroWhatsApp}?text=${mensajeWhatsApp}`;

  const [isFinanciacionModalOpen, setIsFinanciacionModalOpen] = useState(false);

  const openFinanciacionModal = () => setIsFinanciacionModalOpen(true);
  const closeFinanciacionModal = () => setIsFinanciacionModalOpen(false);

  return (
    <>
      <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-red-800/50 transition-all duration-300 flex flex-col border border-gray-700/50 hover:border-red-700/70 group h-full">
        <div className="relative w-full aspect-video overflow-hidden">
          <Image
            src={imageUrl || '/placeholder.png'} // Ten un placeholder en /public/placeholder.png
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
            {v.color && <p><span className="font-semibold text-gray-400 w-[70px] inline-block">Color:</span> {v.color}</p>}
            {v.placa && <p><span className="font-semibold text-gray-400 w-[70px] inline-block">Placa:</span> ***{v.placa.slice(-3)}</p>}
          </div>

          <p className="text-2xl lg:text-3xl font-extrabold text-red-500 mb-4 text-right">
            {formatPrice(v.valor_venta)}
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2.5 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500"
              aria-label={`Contactar por WhatsApp sobre ${v.marca} ${v.linea}`}
            >
              <FaWhatsapp size={18} />
              Contactar
            </a>
            {/* Solo mostrar botón de financiación si NO está vendido */}
            {!v.vendido && (
              <button
                onClick={openFinanciacionModal}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
              >
                <FiDollarSign size={16} />
                Financiación
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RENDERIZAR EL MODAL DE FINANCIACIÓN */}
      {!v.vendido && isFinanciacionModalOpen && (
        <FinanciacionModal
          isOpen={isFinanciacionModalOpen}
          onClose={closeFinanciacionModal}
          vehiculoInteres={v} // Pasar el vehículo actual al modal
        />
      )}
    </>
  );
};