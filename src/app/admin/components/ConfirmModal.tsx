// src/app/admin/components/ConfirmModal.tsx (o src/components/ui/ConfirmModal.tsx si es global)
import { FiAlertTriangle, FiX } from 'react-icons/fi'; // Iconos

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode; // Permitir ReactNode para mensajes más ricos
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean; // Para mostrar spinner en el botón de confirmación
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (isLoading) return;
    onConfirm();
  };

  return (
    // Overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 transition-opacity duration-300 ease-in-out">
      {/* Modal Panel */}
      <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-full max-w-md transform transition-all duration-300 ease-in-out scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <FiAlertTriangle className="text-red-500" size={20} />
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Cerrar modal"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 text-sm text-gray-300">
          {typeof message === 'string' ? <p>{message}</p> : message}
        </div>

        {/* Footer / Actions */}
        <div className="flex justify-end gap-3 p-4 bg-gray-800/50 border-t border-gray-700 rounded-b-lg">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 disabled:opacity-60"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 disabled:opacity-60 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isLoading ? 'Confirmando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};