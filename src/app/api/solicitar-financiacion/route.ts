// src/app/api/solicitar-financiacion/route.ts
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { z } from 'zod';

// Esquema de validación Zod (sin cambios)
const backendFinanciacionSchema = z.object({
  nombreCompleto: z.string().min(1, "Nombre completo es requerido."),
  cedula: z.string().min(1, "Cédula es requerida."),
  email: z.string().email("Email inválido."),
  telefono: z.string().min(1, "Teléfono es requerido."),
  ciudad: z.string().optional(),
  montoFinanciar: z.number().positive("Monto a financiar debe ser positivo.").optional(),
  mensaje: z.string().optional(),
  aceptaVehiculoPartePago: z.boolean().optional(),
  vehiculoPartePagoMarca: z.string().optional(),
  vehiculoPartePagoLinea: z.string().optional(),
  vehiculoPartePagoAnio: z.number().min(1900, "Año del vehículo (parte pago) inválido.").max(new Date().getFullYear() + 1).optional(),
  vehiculoPartePagoPlaca: z.string().optional(),
  vehiculoInteresNombre: z.string().min(1, "Vehículo de interés es requerido."),
});

// Helper para formatear moneda (sin cambios)
function formatCurrencyBackend(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

// --- Función Auxiliar getErrorMessage ---
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  // Intenta manejar otros objetos con 'message' de forma más segura
  if (error && typeof error === 'object' && 'message' in error) {
    const maybeErrorWithMessage = error as { message?: unknown }; // Tipado más seguro
    if (typeof maybeErrorWithMessage.message === 'string') {
      return maybeErrorWithMessage.message || "Error con mensaje vacío.";
    }
  }
  try {
      const errorString = String(error);
      if (errorString !== '[object Object]') {
          return errorString;
      }
  // eslint-disable-next-line no-empty
  } catch (_e) { // <--- CAMBIO: Prefijo '_' para 'e' no usado
     /* Ignorar error de conversión */
  }
  return "Ocurrió un error desconocido.";
}
// --- FIN Función Auxiliar ---


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validationResult = backendFinanciacionSchema.safeParse(body);

    if (!validationResult.success) {
      console.error("API Route - Validation errors:", validationResult.error.flatten().fieldErrors);
      return NextResponse.json({ message: 'Datos inválidos recibidos.', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = validationResult.data;

    // Configuración del transporter de Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production'
      }
    });

    // Construcción del cuerpo del correo HTML (sin cambios)
    let emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h1 style="color: #d32f2f; text-align: center;">Nueva Solicitud de Financiación</h1>
            <p>Has recibido una nueva solicitud de financiación con los siguientes detalles:</p>
            <h2 style="color: #555; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px;">Vehículo de Interés</h2>
            <p><strong>${data.vehiculoInteresNombre}</strong></p>
            <h2 style="color: #555; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px;">Datos del Solicitante</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; background-color: #f9f9f9; width: 150px;"><strong>Nombre:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.nombreCompleto}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; background-color: #f9f9f9;"><strong>Cédula:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.cedula}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; background-color: #f9f9f9;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.email}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; background-color: #f9f9f9;"><strong>Teléfono:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.telefono}</td></tr>
              ${data.ciudad ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; background-color: #f9f9f9;"><strong>Ciudad:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.ciudad}</td></tr>` : ''}
              ${data.montoFinanciar !== undefined ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; background-color: #f9f9f9;"><strong>Monto a Financiar:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${formatCurrencyBackend(data.montoFinanciar)}</td></tr>` : ''}
            </table>`;
    if (data.aceptaVehiculoPartePago) {
      emailHtml += `
        <h2 style="color: #555; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px;">Vehículo Ofrecido como Parte de Pago</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; background-color: #f9f9f9; width: 150px;"><strong>Marca:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.vehiculoPartePagoMarca || 'N/A'}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; background-color: #f9f9f9;"><strong>Línea/Modelo:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.vehiculoPartePagoLinea || 'N/A'}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; background-color: #f9f9f9;"><strong>Año:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.vehiculoPartePagoAnio || 'N/A'}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; background-color: #f9f9f9;"><strong>Placa:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.vehiculoPartePagoPlaca || 'N/A'}</td></tr>
        </table>`;
    }
    if (data.mensaje) {
        emailHtml += `
            <h2 style="color: #555; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px;">Mensaje Adicional</h2>
            <p style="padding: 10px; border: 1px solid #eee; background-color: #fdfdfd; white-space: pre-wrap;">${data.mensaje}</p>`;
    }
    emailHtml += `
            <hr style="margin-top: 30px; border: 0; border-top: 1px solid #ccc;">
            <p style="text-align: center; font-size: 0.9em; color: #777;">Este es un correo generado automáticamente desde el catálogo de Escudería R.S.</p>
          </div>
        </body>
      </html>`;

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Escudería RS Catálogo'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO_ADMIN,
      subject: `Nueva Solicitud de Financiación: ${data.nombreCompleto} - ${data.vehiculoInteresNombre}`,
      html: emailHtml,
    };

    console.log("API Route - Sending email...");
    await transporter.sendMail(mailOptions);
    console.log("API Route - Email sent successfully to:", process.env.EMAIL_TO_ADMIN);

    return NextResponse.json({ message: 'Solicitud enviada con éxito.' }, { status: 200 });

  } catch (error: unknown) {
    console.error('API Route - Error en /solicitar-financiacion:', error);
    const errorMessage = getErrorMessage(error);
    const clientErrorMessage = process.env.NODE_ENV === 'production'
        ? 'Ocurrió un error al procesar tu solicitud.'
        : errorMessage;

    return NextResponse.json({ message: 'Error interno del servidor.', error: clientErrorMessage }, { status: 500 });
  }
}