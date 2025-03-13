
// Search engine utilities for Google and Google Scholar with improved anti-blocking techniques
import { corsHeaders } from "./corsHeaders.ts";
import { load } from "https://esm.sh/cheerio@1.0.0-rc.12";

/**
 * Perform a search on Google or Google Scholar and return the results
 * with techniques to avoid being blocked
 */
export async function searchGoogle(query: string, isScholar = false) {
  try {
    console.log(`[searchEngine] Iniciando búsqueda ${isScholar ? 'Scholar' : 'Google'}: "${query.substring(0, 30)}..."`);
    
    // Rotación de user agents para evitar patrones de detección
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:94.0) Gecko/20100101 Firefox/94.0",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
    ];
    
    // Seleccionar un user agent aleatorio
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    
    // Aleatorizar las palabras del fragmento para evitar detección de bots
    // y mejorar la búsqueda sin perder contexto
    const queryWords = query.split(/\s+/).filter(w => w.length > 3);
    let searchQuery = query;
    
    // Si el fragmento tiene suficientes palabras, podemos aleatorizar
    if (queryWords.length > 7) {
      // Seleccionar 70-90% de las palabras originales en orden aleatorio
      const wordCount = Math.floor(queryWords.length * (0.7 + Math.random() * 0.2));
      const selectedWords = [];
      
      for (let i = 0; i < wordCount; i++) {
        const randomIndex = Math.floor(Math.random() * queryWords.length);
        selectedWords.push(queryWords[randomIndex]);
        // Eliminar la palabra para evitar duplicados
        queryWords.splice(randomIndex, 1);
        if (queryWords.length === 0) break;
      }
      
      // Convertir a cadena si hay palabras seleccionadas
      if (selectedWords.length > 0) {
        searchQuery = selectedWords.join(' ');
      }
    }
    
    // Añadir comillas si es una frase exacta y tiene pocas palabras
    if (searchQuery.split(/\s+/).length <= 6) {
      searchQuery = `"${searchQuery}"`;
    }
    
    // URL encoding para la consulta
    const encodedQuery = encodeURIComponent(searchQuery);
    
    // Determinar qué URL base usar
    const baseUrl = isScholar
      ? "https://scholar.google.com/scholar?q="
      : "https://www.google.com/search?q=";
    
    // Construir URL completa con parámetros adicionales para parecer más un navegador real
    const searchUrl = `${baseUrl}${encodedQuery}${isScholar ? '&hl=es&as_sdt=0,5' : '&hl=es&gl=es&sourceid=chrome'}`;
    
    console.log(`[searchEngine] URL de búsqueda: ${searchUrl}`);
    
    // Simular un navegador con headers más completos
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": userAgent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0"
      },
    });

    if (!response.ok) {
      throw new Error(`Error en búsqueda: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log(`[searchEngine] Respuesta recibida: ${html.length} caracteres`);
    
    // Usar cheerio para analizar el HTML
    const $ = load(html);
    const results = [];
    
    // Extraer resultados según el tipo de búsqueda
    if (isScholar) {
      // Extraer resultados de Google Scholar
      $(".gs_ri").each((i, element) => {
        if (results.length >= 10) return false; // Limitar a 10 resultados
        
        const titleElement = $(element).find("h3 a");
        const title = titleElement.text().trim();
        let url = titleElement.attr("href") || "";
        
        // Formatear URL
        if (url.startsWith('/scholar')) {
          url = `https://scholar.google.com${url}`;
        }
        
        // Extraer snippet
        const snippet = $(element).find(".gs_rs").text().trim();
        
        if (title && url) {
          results.push({
            url,
            title,
            snippet,
            source: "Google Scholar"
          });
        }
      });
    } else {
      // Extraer resultados de Google normal
      $("div.g").each((i, element) => {
        if (results.length >= 10) return false; // Limitar a 10 resultados
        
        const titleElement = $(element).find("h3");
        if (!titleElement.length) return; // Continuar si no hay título
        
        const title = titleElement.text().trim();
        if (!title) return; // Continuar si el título está vacío
        
        // Encontrar el enlace
        const linkElement = titleElement.closest("a");
        let url = linkElement.attr("href") || "";
        
        // Limpiar URL
        if (url.startsWith('/url?')) {
          const urlParams = new URLSearchParams(url.substring(5));
          url = urlParams.get('q') || url;
        }
        
        // Extraer snippet
        const snippet = $(element).find(".VwiC3b").text().trim();
        
        if (title && url && url.startsWith('http')) {
          results.push({
            url,
            title,
            snippet,
            source: "Google"
          });
        }
      });
    }
    
    console.log(`[searchEngine] Resultados encontrados: ${results.length}`);
    
    return results;
  } catch (error) {
    console.error(`[searchEngine] Error en búsqueda ${isScholar ? 'Scholar' : 'Google'}:`, error);
    return [];
  }
}
