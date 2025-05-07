// src/lib/utils.ts

/**
 * Extrae la primera URL de una cadena que puede contener una o varias URLs,
 * a veces en formato de array string PostgreSQL ('{url1,url2}').
 * Maneja URLs directas y el formato de array.
 */
export const getFirstImageUrlFromString = (imageString: unknown): string | null => {
    if (typeof imageString !== 'string' || !imageString) {
      return null;
    }
    const trimmedString = imageString.trim();

    // Caso 1: Formato de array de PostgreSQL "{url1, url2, ...}"
    if (trimmedString.startsWith('{') && trimmedString.endsWith('}')) {
      const content = trimmedString.slice(1, -1);
      if (!content) return null;
      const urls = content.split(',');
      if (!urls.length || !urls[0]) return null;

      let firstUrl = urls[0].trim();
      // Limpiar comillas si existen (común en arrays de texto de PG)
      if (firstUrl.startsWith('"') && firstUrl.endsWith('"')) {
        firstUrl = firstUrl.slice(1, -1);
      }
      return firstUrl || null; // Devolver null si la URL limpia está vacía
    }

    // Caso 2: Es una URL directa (o asumimos que lo es)
    if (trimmedString.startsWith('http') || trimmedString.startsWith('/')) {
      return trimmedString;
    }

    // Caso 3: No es un formato esperado
    // console.warn(`Formato inesperado para imageString: ${imageString}. Se esperaba "{url,...}" o URL directa.`);
    return null;
};

/**
 * Formatea un número como moneda colombiana (COP).
 */
export const formatPrice = (price: number | null | undefined): string => {
  if (price == null || isNaN(price)) {
    return "Consultar"; // Texto más neutral que "Consultar Precio"
  }
  try {
      return price.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
  } catch (error) {
      console.error("Error formateando precio:", error);
      return `$ ${price}`; // Fallback simple
  }
};