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

// --- Función Auxiliar getErrorMessage ---
// (Puedes moverla a un archivo de utilidades si la usas en varios sitios)
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  // Intenta manejar otros objetos con 'message'
  if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
    return (error as { message: string }).message || "Error con mensaje vacío.";
  }
  try {
      const errorString = String(error);
      if (errorString !== '[object Object]') {
          return errorString;
      }
  } catch (e) { /* Ignorar */ }
  return "Ocurrió un error desconocido.";
}
// --- FIN Función Auxiliar ---


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

      const result = await response.json();

      if (!response.ok) {
        // Intenta obtener un mensaje de error específico del backend del objeto 'result'
        const backendErrorMessage = result?.message || result?.error || `Error del servidor: ${response.status} ${response.statusText}`;
        // Lanza un error estándar para ser capturado por el catch
        throw new Error(backendErrorMessage);
      }

      toast.success('¡Solicitud enviada con éxito! Nos pondremos en contacto pronto.', { id: toastId, duration: 5000 });
      onClose();
    } catch (error: unknown) { // <--- CAMBIO: tipado como unknown
      console.error("Error al enviar la solicitud de financiación:", error);
      // Usa la función auxiliar para obtener un mensaje seguro del error capturado
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage || 'No se pudo enviar la solicitud. Por favor, inténtalo de nuevo más tarde.', { id: toastId });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-opacity duration-300 ease-in-out animate-fadeIn">
      <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-full max-w-lg max-h-[90vh] flex flex-col animate-slideUp">
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
        <div className="p-5 sm:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          <FinanciacionForm
            vehiculoInteres={vehiculoInteres}
            onFormSubmit={handleFormSubmit}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};