// src/app/catalogo/components/VehicleDetailModal.tsx
"use client";

import React, { useState, useEffect } from 'react'; // Importar useEffect
import Image from 'next/image';
import { Vehiculo } from '@/app/admin/lib/supabase';
import { getAllImageUrlsFromString, formatPrice } from '@/app/lib/utils';
import { FiX, FiCalendar, FiCheckCircle, FiXCircle, FiAlertTriangle, FiTag, FiCpu, FiSettings, FiMapPin, FiFileText, FiShield, FiImage } from 'react-icons/fi';
import { FaCar, FaTachometerAlt, FaPalette, FaWhatsapp } from 'react-icons/fa';

interface VehicleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehiculo | null;
}

// Helper para mostrar booleanos de forma amigable
const formatBoolean = (value: boolean | null | undefined): React.ReactNode => {
  if (value === true) return <span className="flex items-center text-green-400"><FiCheckCircle className="mr-1" /> Sí</span>;
  if (value === false) return <span className="flex items-center text-red-400"><FiXCircle className="mr-1" /> No</span>;
  return <span className="text-gray-500">N/D</span>;
};

// Helper para mostrar fechas
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/D';
  try {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch  {
    return 'Fecha inválida';
  }
};

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({ isOpen, onClose, vehicle }) => {
  // CORRECCIÓN: Todos los hooks se mueven al principio del componente, ANTES de cualquier return.
  const allImageUrls = getAllImageUrlsFromString(vehicle?.imagenes);
  
  const [mainImageUrl, setMainImageUrl] = useState<string>(
    allImageUrls.length > 0 ? allImageUrls[0] : '/placeholder.png'
  );

  useEffect(() => {
    // Cuando el vehículo (o su visibilidad) cambia, reseteamos la imagen principal a la primera de la lista.
    const newAllImageUrls = getAllImageUrlsFromString(vehicle?.imagenes);
    setMainImageUrl(newAllImageUrls.length > 0 ? newAllImageUrls[0] : '/placeholder.png');
  }, [vehicle]);

  // CORRECCIÓN: El "early return" se mueve aquí, después de los hooks.
  if (!isOpen || !vehicle) {
    return null;
  }

  // El resto de la lógica del componente que depende de 'vehicle' va aquí.
  const numeroWhatsApp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "573124423639";
  const mensajeWhatsApp = `Hola, estoy interesado en el ${encodeURIComponent(vehicle.marca || 'vehículo')} ${encodeURIComponent(vehicle.linea || '')} ${vehicle.modelo || ''} (ID: ${vehicle.id}, Placa: ${vehicle.placa || 'N/A'}). Quisiera más información.`;
  const whatsappLink = `https://wa.me/${numeroWhatsApp}?text=${mensajeWhatsApp}`;

  const detailItemClass = "py-2 px-3 even:bg-gray-800/50 odd:bg-gray-800/20 rounded-md flex";
  const labelClass = "font-semibold text-gray-400 w-1/3 sm:w-1/4 flex-shrink-0";
  const valueClass = "text-gray-200 flex-grow";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-opacity duration-300 ease-in-out animate-fadeIn">
      <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700 w-full max-w-3xl max-h-[95vh] flex flex-col animate-slideUp">
        <div className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-gray-900 z-10 rounded-t-xl">
          <h2 className="text-xl lg:text-2xl font-bold text-red-500 truncate" title={`${vehicle.marca} ${vehicle.linea} ${vehicle.modelo}`}>
            {vehicle.marca} {vehicle.linea} <span className="text-gray-400 font-medium">{vehicle.modelo}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Cerrar modal"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800/50 flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {allImageUrls.length > 0 ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-700 shadow-lg">
                  <Image
                    src={mainImageUrl}
                    alt={`Imagen principal de ${vehicle.marca} ${vehicle.linea}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    onError={(e) => {
                      if (e.currentTarget.src !== '/placeholder.png') {
                        e.currentTarget.srcset = "";
                        e.currentTarget.src = '/placeholder.png';
                      }
                    }}
                    priority
                  />
                  {vehicle.vendido && (
                    <div className="absolute top-3 left-3 bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg z-10">
                      VENDIDO
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-700 shadow-lg bg-gray-700 flex items-center justify-center">
                    <FiImage size={48} className="text-gray-500" />
                </div>
              )}

              {allImageUrls.length > 1 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-2">
                  {allImageUrls.map((url, index) => (
                    <button
                      key={url + index}
                      className={`relative aspect-square rounded overflow-hidden border-2 transition-all
                                  ${url === mainImageUrl ? 'border-red-500 shadow-md' : 'border-transparent hover:border-red-400'}`}
                      onClick={() => setMainImageUrl(url)}
                    >
                      <Image
                        src={url}
                        alt={`Miniatura ${index + 1} de ${vehicle.marca} ${vehicle.linea}`}
                        fill
                        sizes="10vw"
                        className="object-cover"
                        onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className="text-center md:text-left mt-4">
                <p className="text-3xl lg:text-4xl font-extrabold text-red-500">
                  {formatPrice(vehicle.valor_venta)}
                </p>
                {vehicle.vendido && vehicle.fecha_venta && (
                  <p className="text-sm text-gray-500 mt-1">
                    Vendido el: {formatDate(vehicle.fecha_venta)}
                  </p>
                )}
              </div>
               <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-3 rounded-lg text-base transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500"
                aria-label={`Contactar por WhatsApp sobre ${vehicle.marca} ${vehicle.linea}`}
              >
                <FaWhatsapp size={20} />
                Consultar por WhatsApp
              </a>
            </div>

            <div className="space-y-1 text-sm">
              <h3 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-2 mb-3">Detalles del Vehículo</h3>
              
              <div className={detailItemClass}>
                <span className={labelClass}><FaCar className="inline mr-2 text-red-400" />Placa:</span>
                <span className={valueClass}>{vehicle.placa || 'N/D'}</span>
              </div>
              <div className={detailItemClass}>
                <span className={labelClass}><FaTachometerAlt className="inline mr-2 text-red-400" />Kilometraje:</span>
                <span className={valueClass}>{vehicle.km != null ? `${vehicle.km.toLocaleString('es-CO')} km` : 'N/D'}</span>
              </div>
              <div className={detailItemClass}>
                <span className={labelClass}><FiCpu className="inline mr-2 text-red-400" />Motor:</span>
                <span className={valueClass}>{vehicle.motor || 'N/D'}</span>
              </div>
              <div className={detailItemClass}>
                <span className={labelClass}><FiSettings className="inline mr-2 text-red-400" />Caja:</span>
                <span className={valueClass}>{vehicle.tipo_caja || 'N/D'}</span>
              </div>
              <div className={detailItemClass}>
                <span className={labelClass}><FaPalette className="inline mr-2 text-red-400" />Color:</span>
                <span className={valueClass}>{vehicle.color || 'N/D'}</span>
              </div>
              <div className={detailItemClass}>
                <span className={labelClass}><FiMapPin className="inline mr-2 text-red-400" />Ciudad Matrícula:</span>
                <span className={valueClass}>{vehicle.lugar_matricula || 'N/D'}</span>
              </div>
              <div className={detailItemClass}>
                <span className={labelClass}><FiTag className="inline mr-2 text-red-400" />Estado Actual:</span>
                <span className={`${valueClass} ${vehicle.vendido ? 'text-red-400' : 'text-green-400'}`}>{vehicle.estado || 'N/D'}</span>
              </div>

              <h4 className="text-md font-semibold text-gray-300 pt-3 mt-4 border-t border-gray-700/50">Documentación y Legal</h4>
              <div className={detailItemClass}>
                <span className={labelClass}><FiCalendar className="inline mr-2 text-red-400" />SOAT hasta:</span>
                <span className={valueClass}>{formatDate(vehicle.soat)}</span>
              </div>
              <div className={detailItemClass}>
                <span className={labelClass}><FiFileText className="inline mr-2 text-red-400" />Tecnomecánica hasta:</span>
                <span className={valueClass}>{formatDate(vehicle.tecno)}</span>
              </div>
               <div className={detailItemClass}>
                <span className={labelClass}><FiAlertTriangle className="inline mr-2 text-red-400" />Reportes:</span>
                <span className={valueClass}>{formatBoolean(vehicle.reporte)}</span>
              </div>
              <div className={detailItemClass}>
                <span className={labelClass}><FiShield className="inline mr-2 text-red-400" />Prenda:</span>
                <span className={valueClass}>{formatBoolean(vehicle.prenda)}</span>
              </div>
              
              {vehicle.descripcion && (
                <>
                  <h4 className="text-md font-semibold text-gray-300 pt-3 mt-4 border-t border-gray-700/50">Descripción Adicional</h4>
                  <div className="bg-gray-800/30 p-3 rounded-md mt-1">
                    <p className="text-gray-300 whitespace-pre-line leading-relaxed">{vehicle.descripcion}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
