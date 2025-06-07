// src/app/catalogo/components/FinanciacionForm.tsx
"use client";

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Vehiculo } from '@/app/admin/lib/supabase';
import toast from 'react-hot-toast';
import { ClipLoader } from 'react-spinners';
import { formatPrice } from '@/app/lib/utils';

// Esquema de Zod con correcciones
const financiacionSchema = z.object({
  nombreCompleto: z.string().min(3, "Nombre es requerido y debe tener al menos 3 caracteres."),
  cedula: z.string().min(5, "Cédula es requerida y debe tener al menos 5 caracteres.").regex(/^\d+$/, "Cédula debe contener solo números."),
  email: z.string().email("Email inválido."),
  telefono: z.string().min(7, "Teléfono es requerido y debe tener al menos 7 caracteres.").regex(/^[\d\s()+-]+$/, "Teléfono inválido."),
  
  ciudad: z.string().trim().optional(),
  mensaje: z.string().trim().optional(),
  aceptaVehiculoPartePago: z.boolean().optional(),
  vehiculoPartePagoMarca: z.string().trim().optional(),
  vehiculoPartePagoLinea: z.string().trim().optional(),
  vehiculoPartePagoPlaca: z.string().trim().optional(),
  
  // CORRECCIÓN: Simplificado para que Zod espere un número, ya que react-hook-form lo proporcionará.
  montoFinanciar: z.number({ invalid_type_error: "Monto debe ser un número." })
    .positive("Monto debe ser positivo.")
    .optional()
    .or(z.literal(undefined)), // Aceptar explícitamente undefined si el campo está vacío

  // CORRECCIÓN: Simplificado de la misma manera.
  vehiculoPartePagoAnio: z.number({ invalid_type_error: "Año debe ser un número." })
    .min(1980, "Año debe ser mayor o igual a 1980.")
    .max(new Date().getFullYear() + 1, `Año no puede ser mayor a ${new Date().getFullYear() + 1}.`)
    .optional()
    .or(z.literal(undefined)),

}).refine(data => {
  if (!data.aceptaVehiculoPartePago) return true;
  return !!(data.vehiculoPartePagoMarca && data.vehiculoPartePagoMarca.trim() !== "" &&
            data.vehiculoPartePagoLinea && data.vehiculoPartePagoLinea.trim() !== "" &&
            data.vehiculoPartePagoAnio !== undefined);
}, {
  message: "Si deseas poner un vehículo como parte de pago, debes ingresar su Marca, Línea y Año.",
  path: ["vehiculoPartePagoMarca"],
});

export type FinanciacionFormData = z.infer<typeof financiacionSchema>;

interface FinanciacionFormProps {
  vehiculoInteres: Vehiculo;
  onFormSubmit: (data: FinanciacionFormData, vehiculoNombre: string) => Promise<void>;
  onCancel: () => void;
}

export const FinanciacionForm: React.FC<FinanciacionFormProps> = ({ vehiculoInteres, onFormSubmit, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { 
    register, 
    handleSubmit, 
    watch, 
    formState: { errors } 
  } = useForm<FinanciacionFormData>({
    resolver: zodResolver(financiacionSchema), 
    defaultValues: {
      nombreCompleto: "",
      cedula: "",
      email: "",
      telefono: "",
      ciudad: "",
      montoFinanciar: undefined, 
      mensaje: "",
      aceptaVehiculoPartePago: false,
      vehiculoPartePagoMarca: "",
      vehiculoPartePagoLinea: "",
      vehiculoPartePagoAnio: undefined,
      vehiculoPartePagoPlaca: "",
    }
  });

  const aceptaVehiculo = watch("aceptaVehiculoPartePago");

  const onSubmitHandler: SubmitHandler<FinanciacionFormData> = async (data) => {
    setIsSubmitting(true);
    const vehiculoNombre = `${vehiculoInteres.marca || ''} ${vehiculoInteres.linea || ''} ${vehiculoInteres.modelo || ''} (ID: ${vehiculoInteres.id})`;
    try {
      await onFormSubmit(data, vehiculoNombre);
    } catch (error) {
      console.error("Error en FinanciacionForm onSubmitHandler:", error);
      toast.error("Error al enviar la solicitud. Intenta de nuevo más tarde.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-3 py-2 rounded-md bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm";
  const errorTextClass = "mt-1 text-xs text-red-400";

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-100 mb-1">
          Solicitud de Financiación para:
        </h3>
        <p className="text-red-400 font-medium">
          {vehiculoInteres.marca} {vehiculoInteres.linea} {vehiculoInteres.modelo}
        </p>
        <p className="text-sm text-gray-400">
          Precio: {formatPrice(vehiculoInteres.valor_venta)}
        </p>
      </div>

      <hr className="border-gray-600" />

      <fieldset className="space-y-4">
        <legend className="text-md font-semibold text-gray-200 mb-2">Tus Datos de Contacto</legend>
        <div>
          <label htmlFor="nombreCompleto" className="block text-sm font-medium text-gray-300 mb-1">Nombre Completo*</label>
          <input type="text" id="nombreCompleto" {...register("nombreCompleto")} className={`${inputClass} ${errors.nombreCompleto ? 'border-red-500' : ''}`} />
          {errors.nombreCompleto && <p className={errorTextClass}>{errors.nombreCompleto.message}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cedula" className="block text-sm font-medium text-gray-300 mb-1">Cédula*</label>
            <input type="text" id="cedula" inputMode="numeric" {...register("cedula")} className={`${inputClass} ${errors.cedula ? 'border-red-500' : ''}`} />
            {errors.cedula && <p className={errorTextClass}>{errors.cedula.message}</p>}
          </div>
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-300 mb-1">Teléfono*</label>
            <input type="tel" id="telefono" {...register("telefono")} className={`${inputClass} ${errors.telefono ? 'border-red-500' : ''}`} />
            {errors.telefono && <p className={errorTextClass}>{errors.telefono.message}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Correo Electrónico*</label>
          <input type="email" id="email" {...register("email")} className={`${inputClass} ${errors.email ? 'border-red-500' : ''}`} />
          {errors.email && <p className={errorTextClass}>{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="ciudad" className="block text-sm font-medium text-gray-300 mb-1">Ciudad de Residencia</label>
          <input type="text" id="ciudad" {...register("ciudad")} className={inputClass} />
          {errors.ciudad && <p className={errorTextClass}>{errors.ciudad.message}</p>}
        </div>
        <div>
          <label htmlFor="montoFinanciar" className="block text-sm font-medium text-gray-300 mb-1">Monto a Financiar (Opcional)</label>
          {/* CORRECCIÓN: Añadido { valueAsNumber: true } para que react-hook-form parsee el valor como número */}
          <input type="text" inputMode="numeric" id="montoFinanciar" placeholder="Ej: 20000000" {...register("montoFinanciar", { valueAsNumber: true })} className={`${inputClass} ${errors.montoFinanciar ? 'border-red-500' : ''}`} />
          {errors.montoFinanciar && <p className={errorTextClass}>{errors.montoFinanciar.message}</p>}
        </div>
      </fieldset>

      <hr className="border-gray-600" />

      <fieldset className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="aceptaVehiculoPartePago"
            {...register("aceptaVehiculoPartePago")}
            className="h-4 w-4 text-red-600 border-gray-500 rounded focus:ring-red-500 accent-red-600"
          />
          <label htmlFor="aceptaVehiculoPartePago" className="ml-2 block text-sm text-gray-200 cursor-pointer">
            Quiero poner mi vehículo actual como parte de pago
          </label>
        </div>

        {aceptaVehiculo && (
          <div className="space-y-4 p-4 bg-gray-800/50 rounded-md border border-gray-600 animate-fadeIn">
            <p className="text-sm font-medium text-gray-300 mb-2">Datos de tu vehículo:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="vehiculoPartePagoMarca" className="block text-xs font-medium text-gray-400 mb-1">Marca*</label>
                <input type="text" id="vehiculoPartePagoMarca" {...register("vehiculoPartePagoMarca")} className={`${inputClass} ${errors.vehiculoPartePagoMarca || errors.root?.type === 'custom_refine_vehiculo' ? 'border-red-500' : ''}`} />
                {errors.vehiculoPartePagoMarca && <p className={errorTextClass}>{errors.vehiculoPartePagoMarca.message}</p>}
                {errors.root?.message && errors.root.type === 'custom_refine_vehiculo' && !errors.vehiculoPartePagoMarca && <p className={errorTextClass}>{errors.root.message}</p>}
              </div>
              <div>
                <label htmlFor="vehiculoPartePagoLinea" className="block text-xs font-medium text-gray-400 mb-1">Línea/Modelo*</label>
                <input type="text" id="vehiculoPartePagoLinea" {...register("vehiculoPartePagoLinea")} className={`${inputClass} ${errors.vehiculoPartePagoLinea ? 'border-red-500' : ''}`} />
                {errors.vehiculoPartePagoLinea && <p className={errorTextClass}>{errors.vehiculoPartePagoLinea.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="vehiculoPartePagoAnio" className="block text-xs font-medium text-gray-400 mb-1">Año*</label>
                    {/* CORRECCIÓN: Añadido { valueAsNumber: true } para que react-hook-form parsee el valor como número */}
                    <input type="number" inputMode="numeric" id="vehiculoPartePagoAnio" {...register("vehiculoPartePagoAnio", { valueAsNumber: true })} className={`${inputClass} ${errors.vehiculoPartePagoAnio ? 'border-red-500' : ''}`} />
                    {errors.vehiculoPartePagoAnio && <p className={errorTextClass}>{errors.vehiculoPartePagoAnio.message}</p>}
                </div>
                <div>
                    <label htmlFor="vehiculoPartePagoPlaca" className="block text-xs font-medium text-gray-400 mb-1">Placa (Opcional)</label>
                    <input type="text" id="vehiculoPartePagoPlaca" {...register("vehiculoPartePagoPlaca")} className={inputClass} />
                    {errors.vehiculoPartePagoPlaca && <p className={errorTextClass}>{errors.vehiculoPartePagoPlaca.message}</p>}
                </div>
            </div>
          </div>
        )}
      </fieldset>
      
      <div>
        <label htmlFor="mensaje" className="block text-sm font-medium text-gray-300 mb-1">Mensaje Adicional (Opcional)</label>
        <textarea id="mensaje" rows={3} {...register("mensaje")} className={inputClass}></textarea>
        {errors.mensaje && <p className={errorTextClass}>{errors.mensaje.message}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-gray-600">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500 disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 disabled:opacity-60 flex items-center"
        >
          {isSubmitting && <ClipLoader color="#fff" size={16} className="mr-2" />}
          {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
        </button>
      </div>
    </form>
  );
};