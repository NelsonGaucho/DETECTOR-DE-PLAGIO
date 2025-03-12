
// Search engine utilities for Google and Google Scholar with improved anti-blocking techniques
import { corsHeaders } from "./corsHeaders.ts";

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
    
    // Extraer URLs y títulos de los resultados con regex mejorados
    const results = [];
    
    // Extraer enlaces con expresiones regulares más robustas
    // Para Google Scholar
    if (isScholar) {
      // Extraer resultados usando un regex más tolerante a cambios en el HTML
      const scholarEntryRegex = /<div class="gs_ri">([\s\S]*?)<\/div>\s*<\/div>/g;
      let scholarEntry;
      
      while ((scholarEntry = scholarEntryRegex.exec(html)) !== null && results.length < 10) {
        const entryHtml = scholarEntry[1];
        
        // Extraer título y URL
        const titleMatch = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(entryHtml);
        if (titleMatch) {
          const url = titleMatch[1].startsWith('/scholar') 
            ? `https://scholar.google.com${titleMatch[1]}`
            : titleMatch[1];
          const title = titleMatch[2].replace(/<\/?[^>]+(>|$)/g, "").trim();
          
          // Extraer fragmento/snippet
          const snippetMatch = /<div class="gs_rs">([\s\S]*?)<\/div>/i.exec(entryHtml);
          const snippet = snippetMatch 
            ? snippetMatch[1].replace(/<\/?[^>]+(>|$)/g, "").trim()
            : "";
          
          results.push({
            url,
            title,
            snippet,
            source: "Google Scholar"
          });
        }
      }
    } 
    // Para Google normal
    else {
      // Extraer resultados de búsqueda normal
      const googleEntryRegex = /<div class="g">([\s\S]*?)(?:<div class="g">|<\/div>\s*<div id="botn")/g;
      let googleEntry;
      
      while ((googleEntry = googleEntryRegex.exec(html)) !== null && results.length < 10) {
        const entryHtml = googleEntry[1];
        
        // Extraer título y URL - más tolerante a cambios en la estructura HTML
        const titleUrlRegex = /<a[^>]*href="([^"#]*?)(?:#[^"]*?)?"[^>]*>([\s\S]*?)<\/a>/i;
        const titleMatch = titleUrlRegex.exec(entryHtml);
        
        if (titleMatch) {
          const rawUrl = titleMatch[1];
          
          // Limpiar URL si contiene parámetros de Google
          let url = rawUrl;
          if (url.startsWith('/url?')) {
            const urlParams = new URLSearchParams(url.substring(5));
            url = urlParams.get('q') || url;
          }
          
          // Limpiar título de etiquetas HTML
          const title = titleMatch[2].replace(/<\/?[^>]+(>|$)/g, "").trim();
          
          // Extraer snippet/descripción
          const snippetRegex = /<div class="[^"]*?"[^>]*?>([\s\S]*?)<\/div>/g;
          let snippet = "";
          let snippetMatch;
          
          // Buscar el primer <div> después del título que probablemente sea el snippet
          while ((snippetMatch = snippetRegex.exec(entryHtml)) !== null) {
            const potentialSnippet = snippetMatch[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
            if (potentialSnippet.length > 20 && potentialSnippet !== title) {
              snippet = potentialSnippet;
              break;
            }
          }
          
          // Solo añadir si tenemos una URL válida
          if (url && url.startsWith('http') && title) {
            results.push({
              url,
              title,
              snippet,
              source: "Google"
            });
          }
        }
      }
    }
    
    console.log(`[searchEngine] Resultados encontrados: ${results.length}`);
    
    return results;
  } catch (error) {
    console.error(`[searchEngine] Error en búsqueda ${isScholar ? 'Scholar' : 'Google'}:`, error);
    return [];
  }
}
