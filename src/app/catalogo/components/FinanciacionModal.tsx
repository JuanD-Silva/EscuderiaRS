// src/app/catalogo/components/FinanciacionModal.tsx
"use client";

import React from 'react';
import { Vehiculo } from '@/app/admin/lib/supabase'; // Ajusta la ruta si es necesario
import { FinanciacionForm, FinanciacionFormData } from './FinanciacionForm';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface FinanciacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehiculoInteres: Vehiculo;
}

export const FinanciacionModal: React.FC<FinanciacionModalProps> = ({ isOpen, onClose, vehiculoInteres }) => {
  if (!isOpen) return null;

  const handleFormSubmit = async (formData: FinanciacionFormData, vehiculoNombre: string) => {
    const toastId = toast.loading("Enviando solicitud de financiación...");
    try {
      const response = await fetch('/api/solicitar-financiacion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, vehiculoInteresNombre: vehiculoNombre }),
      });

      const result = await response.json(); // Intenta parsear la respuesta siempre

      if (!response.ok) {
        // Usa el mensaje del backend si está disponible, o uno genérico
        throw new Error(result.message || `Error del servidor: ${response.status}`);
      }

      toast.success('¡Solicitud enviada con éxito! Nos pondremos en contacto pronto.', { id: toastId, duration: 5000 });
      onClose(); // Cierra el modal si el envío fue exitoso
    } catch (error: any) {
      console.error("Error al enviar la solicitud de financiación:", error);
      toast.error(error.message || 'No se pudo enviar la solicitud. Por favor, inténtalo de nuevo más tarde.', { id: toastId });
      // No cerramos el modal en caso de error para que el usuario pueda reintentar o verificar los datos.
    }
  };

  return (
    // Overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-opacity duration-300 ease-in-out animate-fadeIn">
      {/* Contenedor del Modal */}
      <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-full max-w-lg max-h-[90vh] flex flex-col animate-slideUp">
        {/* Encabezado del Modal */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600 sticky top-0 bg-gray-800 z-10">
          <h2 className="text-xl font-semibold text-white">Solicitar Financiación</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Cerrar modal"
          >
            <FiX size={22} />
          </button>
        </div>

        {/* Cuerpo del Modal (con scroll) */}
        <div className="p-5 sm:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          <FinanciacionForm
            vehiculoInteres={vehiculoInteres}
            onFormSubmit={handleFormSubmit} // Pasa la función que llama a la API
            onCancel={onClose} // Pasa la función para cerrar el modal desde el botón "Cancelar" del form
          />
        </div>
      </div>
    </div>
  );
};

// Opcional: Pequeñas animaciones con Tailwind (añadir a tu tailwind.config.js si quieres)
/*
En tailwind.config.js, dentro de theme.extend:
keyframes: {
  fadeIn: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
  slideUp: {
    '0%': { opacity: '0', transform: 'translateY(20px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  }
},
animation: {
  fadeIn: 'fadeIn 0.3s ease-out',
  slideUp: 'slideUp 0.3s ease-out',
}
*/