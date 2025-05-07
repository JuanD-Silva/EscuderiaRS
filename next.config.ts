// next.config.js o next.config.mjs

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* otras opciones de configuración que puedas tener */
  images: {
    remotePatterns: [
      {
        protocol: 'https', // Protocolo de la URL (usualmente 'https')
        hostname: 'bqjstjsfskgfdopdfoos.supabase.co', // El hostname EXACTO de tu error
        port: '', // Puerto (dejar vacío para estándar 80/443)
        pathname: '/storage/v1/object/public/**', // Ruta base de tus imágenes en Supabase Storage
                                                   // El ** al final permite cualquier subruta o archivo
      },
      // Puedes añadir aquí más objetos para permitir otros dominios externos si es necesario
      // {
      //   protocol: 'https',
      //   hostname: 'otro.dominio.com',
      // },
    ],
  },
};

export default nextConfig;