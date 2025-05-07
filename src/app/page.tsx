"use client";

import React, { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { supabase, Vehiculo } from "./admin/lib/supabase"; // ajusta la ruta

// --- Función Auxiliar (Sin cambios, parece correcta) ---
const getFirstImageUrlFromString = (imageString: unknown): string | null => {
  if (typeof imageString !== 'string' || !imageString) return null;
  const trimmedString = imageString.trim();
  if (!trimmedString.startsWith('{') || !trimmedString.endsWith('}')) {
    // Podríamos intentar tratarla como URL directa si es un caso común
    // if (trimmedString.startsWith('http') || trimmedString.startsWith('/')) return trimmedString;
    console.warn(`Formato inesperado para imageString: ${imageString}. Se esperaba "{url,...}".`);
    return null;
  }
  const content = trimmedString.slice(1, -1);
  if (!content) return null;
  const urls = content.split(',');
  if (!urls.length || !urls[0]) return null;
  const firstUrl = urls[0].trim();
  const cleanUrl = firstUrl.startsWith('"') && firstUrl.endsWith('"')
                   ? firstUrl.slice(1, -1)
                   : firstUrl;
  return cleanUrl || null;
};

// --- Componente Skeleton Card ---
const SkeletonCard = () => (
  <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg animate-pulse">
    <div className="w-full bg-gray-700 aspect-video"></div> {/* Placeholder para imagen */}
    <div className="p-5">
      <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div> {/* Placeholder título */}
      <div className="h-4 bg-gray-700 rounded w-1/2 mb-1"></div> {/* Placeholder detalle 1 */}
      <div className="h-4 bg-gray-700 rounded w-1/3"></div>    {/* Placeholder detalle 2 */}
    </div>
  </div>
);

// --- Componente Vehicle Card ---
interface VehicleCardProps {
  vehiculo: Vehiculo;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehiculo }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Usamos useCallback para memorizar la función y evitar re-renders innecesarios si el componente se vuelve más complejo
  const loadImage = useCallback(() => {
    const url = getFirstImageUrlFromString(vehiculo.imagenes);
    // console.log(`Vehículo ID ${vehiculo.id}: Raw='${vehiculo.imagenes}', Extracted='${url}'`); // Debug
    if (url) {
      setImageUrl(url);
      setImageError(false); // Reset error state if URL is found
    } else {
      setImageUrl("/images/placeholder-car.svg"); // Fallback a placeholder *local* (recomendado)
      setImageError(true); // Mark as error if no valid URL extracted
    }
  }, [vehiculo.imagenes, vehiculo.id]);

  useEffect(() => {
    loadImage();
  }, [loadImage]); // Depend on the memoized function

  const handleImageError = () => {
    // console.error(`Error al cargar imagen: ${imageUrl} para vehículo ${vehiculo.id}`); // Debug
    setImageUrl("/images/placeholder-car.svg"); // Fallback en caso de error de carga de red/URL inválida
    setImageError(true);
  };

  const placeholderSrc = "/images/placeholder-car.svg"; // Define tu ruta de placeholder

  return (
    <div className="group bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl hover:shadow-red-800/40 transition-all duration-300 ease-in-out flex flex-col transform hover:-translate-y-1">
      <div className="relative w-full aspect-video overflow-hidden"> {/* aspect-video para 16:9 */}
        <Image
          src={imageError ? placeholderSrc : imageUrl || placeholderSrc}
          alt={`Imagen de ${vehiculo.marca} ${vehiculo.linea} ${vehiculo.modelo || ''}`}
          fill
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw" // Ajusta según tu layout
          className={`object-cover transition-transform duration-300 ease-in-out ${!imageError ? 'group-hover:scale-105' : ''}`} // Zoom suave al hacer hover solo si no es placeholder
          onError={handleImageError}
          priority={false} // Probablemente no sean LCP aquí
        />
      </div>
      <div className="p-5 text-center flex-grow flex flex-col justify-between">
        <div> {/* Contenido Principal */}
          <h3 className="font-bold text-xl mb-2 text-gray-100 group-hover:text-red-500 transition-colors">
            {vehiculo.marca} {vehiculo.linea}
          </h3>
          <p className="text-sm text-gray-400 mb-3">
            {vehiculo.modelo ? `Modelo ${vehiculo.modelo}` : "Modelo N/D"}
            <span className="mx-2">|</span>
            {vehiculo.km != null ? `${vehiculo.km.toLocaleString('es-CO')} km` : "Kilometraje N/D"}
          </p>
          {/* Podrías añadir el precio aquí si es relevante */}
          {/* <p className="text-lg font-semibold text-red-600 mb-3">
            {vehiculo.precio ? `$${vehiculo.precio.toLocaleString('es-CO')}` : 'Consultar precio'}
          </p> */}
        </div>
        {/* Botón opcional dentro de la tarjeta */}
        {/*
        <Link href={`/catalogo/${vehiculo.id}`} // Asumiendo que tienes una ruta de detalle
            className="mt-4 inline-block bg-red-700 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors duration-200 self-center">
             Ver Detalles
        </Link>
         */}
      </div>
    </div>
  );
};


// --- Componente Principal Home ---
export default function Home() {
  const [destacados, setDestacados] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDestacados() {
      setLoading(true);
      setError(null); // Reset error state
      try {
        const { data, error: dbError } = await supabase
          .from("Autos")
          .select("*")
          .eq("vendido", false)
          .order("created_at", { ascending: false })
          .limit(3);

        if (dbError) {
          console.error("Error al obtener destacados:", dbError);
          setError("No se pudieron cargar los vehículos destacados. Inténtalo más tarde.");
          setDestacados([]); // Asegurarse de que no haya datos viejos
        } else if (data) {
          // console.log("Datos recibidos de Supabase:", data); // Debug
          setDestacados(data as Vehiculo[]);
        }
      } catch (err) {
        console.error("Error inesperado en loadDestacados:", err);
        setError("Ocurrió un error inesperado. Por favor, recarga la página.");
        setDestacados([]);
      } finally {
        setLoading(false);
      }
    }

    loadDestacados();
  }, []);

  return (
    <>
      <Head>
        <title>Escuderia RS - Compra y Venta de Vehículos Premium</title>
        <meta
          name="description"
          content="Descubre nuestra selección exclusiva de vehículos usados garantizados. Calidad, confianza y servicio detailing."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" /> {/* Añade tu favicon */}
      </Head>

      {/* Usamos un tema oscuro consistente */}
      <div className="bg-gray-950 text-gray-200 min-h-screen flex flex-col font-sans"> {/* Considera una fuente sans-serif moderna */}

        {/* HEADER */}
        <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800 shadow-sm">
           <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
              {/* Logo o Nombre - más prominente */}
              <Link href="/" className="text-2xl font-extrabold tracking-tight text-white hover:text-red-500 transition-colors">
                ESCUDERÍA <span className="text-red-600">R.S</span>
              </Link>

              {/* Navegación (Podrías añadir más links aquí) */}
              <nav className="flex items-center gap-4">
                 {/* <Link href="/catalogo" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Catálogo</Link> */}
                 {/* <Link href="/servicios" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Servicios</Link> */}
                 {/* <Link href="/contacto" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Contacto</Link> */}
                  <Link
                    href="/auth/login"
                    // Botón más sutil pero claro
                    className="bg-red-700 hover:bg-red-600 text-white text-sm font-semibold px-5 py-2 rounded-md transition-colors duration-200 shadow-sm"
                  >
                    Iniciar Sesión
                  </Link>
              </nav>
           </div>
        </header>

        {/* MAIN */}
        {/* Añadimos más padding vertical y usamos el container para centrar */}
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="flex flex-col gap-16 md:gap-24"> {/* Mayor separación entre secciones */}

            {/* QUIENES SOMOS */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
               {/* Contenido Texto */}
              <div className="order-2 lg:order-1">
                {/* Título más impactante */}
                <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
                  Tu Próximo Vehículo,<br />Nuestra <span className="text-red-600">Pasión</span>.
                </h2>
                <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                  En Escudería R.S, combinamos la experiencia en comercialización de vehículos de alta calidad con un servicio de detailing excepcional. Encuentra el auto de tus sueños o realza la belleza del tuyo.
                </p>
                <a
                  href="https://wa.me/573041076526?text=Hola%2C%20estoy%20interesado%20en%20sus%20productos%20y%20servicios"
                  target="_blank"
                  rel="noopener noreferrer"
                  // CTA más prominente
                  className="inline-flex items-center gap-2 bg-red-700 hover:bg-red-600 text-white font-semibold px-8 py-3 rounded-md transition-colors duration-200 text-base shadow-lg hover:shadow-red-800/50 transform hover:-translate-y-0.5"
                >
                  Contáctanos
                  {/* Icono opcional */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </a>
              </div>
               {/* Imagen */}
              <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
                 {/* Aumentamos tamaño y añadimos más sombra */}
                <Image
                  src="/logo-definitivo_Mesa de trabajo 1.png"
                  alt="Logo Escuderia RS"
                  width={400} // Más grande
                  height={400}
                  priority // Importante para LCP si está "above the fold"
                  className="rounded-full shadow-2xl shadow-red-900/30"
                />
              </div>
            </section>

            {/* Separador visual sutil */}
            <hr className="border-gray-800" />

            {/* DESTACADOS DINÁMICOS */}
            <section>
              {/* Título de la sección */}
              <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">
                Vehículos <span className="text-red-600">Destacados</span>
              </h2>

              <div className="grid lg:grid-cols-4 gap-8 items-start">
                {/* Grid de Vehículos */}
                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                  {loading && (
                    // Mostrar 3 skeletons mientras carga
                    <>
                      <SkeletonCard />
                      <SkeletonCard />
                      <SkeletonCard />
                    </>
                  )}

                  {!loading && error && (
                     // Mensaje de error amigable
                     <div className="col-span-full bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-md text-center">
                       <p>{error}</p>
                     </div>
                  )}

                  {!loading && !error && destacados.length === 0 && (
                    // Mensaje si no hay destacados
                    <p className="col-span-full text-gray-500 text-center py-10 text-lg">
                      Actualmente no tenemos vehículos destacados. ¡Vuelve pronto!
                    </p>
                  )}

                  {!loading && !error && destacados.map((v) => (
                    <VehicleCard key={v.id} vehiculo={v} />
                  ))}
                </div>

                {/* Lateral Catálogo - Más integrado */}
                <aside className="lg:col-span-1 bg-gradient-to-br from-gray-900 to-gray-950 p-6 rounded-lg shadow-lg border border-gray-800 flex flex-col items-center text-center sticky top-20"> {/* Sticky para que se quede visible al hacer scroll */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-red-600 mb-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m9 12.75 3 3m0 0 3-3m-3 3v-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  <h3 className="text-xl font-semibold mb-3 text-white">Explora Nuestro Catálogo</h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Descubre la colección completa de vehículos disponibles, con fotos detalladas y especificaciones.
                  </p>
                  <Link
                    href="/catalogo"
                    className="w-full bg-red-700 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-md transition-colors duration-200 shadow-md hover:shadow-lg"
                  >
                    Ver Catálogo Completo
                  </Link>
                </aside>
              </div>
            </section>

          </div> {/* Fin del contenedor de secciones */}
        </main>

        {/* FOOTER */}
        <footer className="bg-gray-900 border-t border-gray-800 mt-auto">
           <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-500 text-sm">
              © {new Date().getFullYear()} Escudería R.S. Todos los derechos reservados.
              {/* Podrías añadir links a política de privacidad, redes sociales, etc. */}
              {/* <div className="mt-2">
                <Link href="/privacidad" className="hover:text-gray-300 transition-colors">Política de Privacidad</Link>
                <span className="mx-2">|</span>
                <Link href="/terminos" className="hover:text-gray-300 transition-colors">Términos de Servicio</Link>
              </div> */}
           </div>
        </footer>

      </div>
    </>
  );
}