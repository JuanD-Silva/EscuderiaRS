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
    // Dividir por coma, y luego limpiar cada URL (quitar espacios y comillas)
    const urls = content.split(',').map(url => {
      let cleanUrl = url.trim();
      if (cleanUrl.startsWith('"') && cleanUrl.endsWith('"')) {
        cleanUrl = cleanUrl.slice(1, -1);
      }
      return cleanUrl;
    }).filter(url => url); // Filtrar URLs vacías después de limpiar

    return urls.length > 0 ? urls[0] : null;
  }

  // Caso 2: Es una URL directa (o asumimos que lo es)
  // También podría ser una lista de URLs separadas por comas sin las llaves (menos robusto)
  if (trimmedString.includes(',')) {
      const urls = trimmedString.split(',').map(url => url.trim()).filter(url => url);
      if (urls.length > 0 && (urls[0].startsWith('http') || urls[0].startsWith('/'))) {
          return urls[0];
      }
  } else if (trimmedString.startsWith('http') || trimmedString.startsWith('/')) {
    return trimmedString;
  }
  
  // console.warn(`Formato inesperado para imageString en getFirst: ${imageString}.`);
  return null;
};

/**
* Extrae todas las URLs de una cadena que puede contener una o varias URLs,
* en formato de array string PostgreSQL ('{url1,url2}') o separadas por comas.
*/
export const getAllImageUrlsFromString = (imageString: unknown): string[] => {
if (typeof imageString !== 'string' || !imageString) {
  return [];
}
const trimmedString = imageString.trim();
let urls: string[] = [];

if (trimmedString.startsWith('{') && trimmedString.endsWith('}')) {
  const content = trimmedString.slice(1, -1);
  if (content) {
    urls = content.split(',').map(url => {
      let cleanUrl = url.trim();
      // Quitar comillas si las hay (común en arrays de texto de PG)
      if (cleanUrl.startsWith('"') && cleanUrl.endsWith('"')) {
        cleanUrl = cleanUrl.slice(1, -1);
      }
      return cleanUrl;
    }).filter(url => url); // Filtrar URLs vacías después de limpiar
  }
} else if (trimmedString.includes(',')) {
  // Intenta parsear como lista separada por comas si no tiene llaves
  urls = trimmedString.split(',').map(url => url.trim()).filter(url => url);
} else if (trimmedString.startsWith('http') || trimmedString.startsWith('/')) {
  // Es una única URL directa
  urls = [trimmedString];
} else {
  // console.warn(`Formato inesperado para imageString en getAll: ${imageString}.`);
}
return urls.filter(url => url.startsWith('http') || url.startsWith('/')); // Asegurar que sean URLs válidas
};


/**
* Formatea un número como moneda colombiana (COP).
*/
export const formatPrice = (price: number | null | undefined): string => {
if (price == null || isNaN(price)) {
  return "Consultar"; 
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
    return `$ ${price}`; 
}
};
