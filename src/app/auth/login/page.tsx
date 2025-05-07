// src/app/login/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ClipLoader } from "react-spinners";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    let username = formData.get("username") as string; // Usamos 'let' porque lo vamos a modificar
    const password = formData.get("password") as string;

    // --- NORMALIZACIÓN DEL USERNAME ---
    if (username) {
      username = username.trim(); // Elimina espacios al inicio y al final

      // Opción A: Hacer todo el username insensible a mayúsculas/minúsculas (RECOMENDADO)
      username = username.toLowerCase();

      // Opción B: Solo la primera letra insensible a mayúsculas (si es un requisito estricto)
      // if (username.length > 0) {
      //   username = username.charAt(0).toLowerCase() + username.slice(1);
      // }
    }
    // --- FIN DE LA NORMALIZACIÓN ---

    // Validar que el username no quede vacío después del trim
    if (!username) {
        setError("El nombre de usuario no puede estar vacío.");
        setIsLoading(false);
        return;
    }
    if (!password) {
        setError("La contraseña no puede estar vacía."); // Aunque el 'required' del input ayuda
        setIsLoading(false);
        return;
    }


    try {
      const result = await signIn("credentials", {
        username, // Usamos el username normalizado
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          setError("Usuario o contraseña incorrectos.");
        } else {
          console.error("Error en signIn:", result.error);
          setError("Error al intentar iniciar sesión. Intenta de nuevo.");
        }
      } else if (result?.ok) {
        router.push("/admin");
        // router.refresh(); // Opcional, solo si es necesario
      } else {
         setError("Ocurrió un problema inesperado durante el inicio de sesión.");
      }

    } catch (err) {
      console.error("Error inesperado en handleSubmit:", err);
      setError("No se pudo conectar con el servidor. Verifica tu conexión.");
    } finally {
      setIsLoading(false);
    }
  };

  // ... (el resto de tu JSX no cambia)
  return (
    // Fondo oscuro y centrado
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex flex-col items-center justify-center p-4">

      {/* Contenedor del formulario con estilo mejorado */}
      <div className="w-full max-w-md bg-gray-900/70 backdrop-blur-lg border border-gray-700/50 rounded-xl shadow-2xl shadow-red-900/20 overflow-hidden">

        {/* Encabezado con la marca */}
        <div className="bg-gradient-to-r from-red-800 via-red-700 to-red-600 p-5 text-center">
            <h1 className="text-2xl font-bold tracking-wider text-white shadow-sm">
                ESCUDERÍA R.S
            </h1>
            <p className="text-sm text-red-100/80 mt-1">Panel de Administración</p>
        </div>

        {/* Padding interno para el formulario */}
        <div className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold mb-6 text-center text-gray-200">
                Iniciar Sesión
            </h2>

            {/* Mensaje de Error */}
            {error && (
                <div className="bg-red-900/30 border border-red-600/50 text-red-300 px-4 py-3 rounded-md mb-4 text-sm text-center" role="alert">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-y-5">
              {/* Campo Usuario */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Usuario
                </label>
                <input
                  type="text"
                  name="username"
                  id="username"
                  placeholder="Tu nombre de usuario"
                  className="w-full px-4 py-2.5 rounded-md border border-gray-600 bg-gray-950/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 disabled:opacity-60"
                  required
                  disabled={isLoading} // Deshabilitar durante carga
                  autoComplete="username"
                />
              </div>

              {/* Campo Contraseña */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Contraseña
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="Tu contraseña"
                  className="w-full px-4 py-2.5 rounded-md border border-gray-600 bg-gray-950/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition duration-200 disabled:opacity-60"
                  required
                  disabled={isLoading} // Deshabilitar durante carga
                  autoComplete="current-password"
                />
              </div>

              {/* Botón de Envío */}
              <button
                type="submit"
                disabled={isLoading}
                className={`
                  w-full flex items-center justify-center bg-gradient-to-r from-red-700 via-red-600 to-red-500
                  hover:from-red-600 hover:via-red-500 hover:to-red-400
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500
                  text-white font-semibold px-6 py-3 rounded-md shadow-md
                  transition-all duration-300 ease-in-out
                  cursor-pointer
                  disabled:opacity-70 disabled:cursor-not-allowed
                  ${isLoading ? 'py-2' : 'py-3'}
                `}
              >
                {isLoading ? (
                  <ClipLoader
                    color="#ffffff"
                    loading={isLoading}
                    size={22}
                    aria-label="Ingresando..."
                  />
                ) : (
                  "Ingresar"
                )}
              </button>
            </form>
        </div>
      </div>

      <footer className="mt-8 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} Escudería R.S.
      </footer>
    </div>
  );
}