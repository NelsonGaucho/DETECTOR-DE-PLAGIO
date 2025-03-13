
// Supabase Edge Function para scraping de Google sin usar APIs de pago
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { load } from "https://esm.sh/cheerio@1.0.0-rc.12";

// Headers CORS para permitir peticiones cross-origin
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Array expandido de User-Agents para mejor rotación y evitar bloqueos
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36", 
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 OPR/108.0.0.0"
];

// Array de lenguajes para rotar
const languages = ["es-ES,es", "en-US,en", "en-GB,en", "es-MX,es", "es-AR,es"];

// Lista de proxies gratuitos (estos suelen cambiar frecuentemente, requerirían actualización periódica)
// Se recomienda usar un servicio de proxy pagado para producción
const freeProxies = [
  // La lista está vacía porque los proxies gratuitos son inestables
  // Si se desea implementar, se pueden agregar URLs de proxies aquí
];

serve(async (req) => {
  // Manejar peticiones preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Obtener la query de los parámetros de la URL
    const url = new URL(req.url);
    const query = url.searchParams.get("query");
    const useProxy = url.searchParams.get("proxy") === "true";
    const debug = url.searchParams.get("debug") === "true";

    if (!query) {
      return new Response(
        JSON.stringify({ error: "El parámetro 'query' es obligatorio" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`[scraper] Iniciando scraping para query: "${query}"`);
    
    // Introducir un retraso aleatorio para parecer más humano (entre 1 y 3 segundos)
    const delayMs = Math.floor(Math.random() * 2000) + 1000;
    console.log(`[scraper] Esperando ${delayMs}ms antes de la petición...`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    // Realizar scraping de Google
    const results = await scrapeGoogle(query, useProxy, debug);
    
    // Devolver resultados en formato JSON
    return new Response(
      JSON.stringify({ 
        results,
        timestamp: new Date().toISOString(),
        query
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("[scraper] Error:", error);
    
    // Devolver respuesta de error
    return new Response(
      JSON.stringify({ 
        error: "Error al realizar el scraping", 
        details: error.message,
        timestamp: new Date().toISOString() 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

/**
 * Función para hacer scraping de los resultados de búsqueda de Google
 * @param query Consulta de búsqueda
 * @param useProxy Indica si se debe usar un proxy (experimental)
 * @param debug Indica si se debe devolver información de depuración
 */
async function scrapeGoogle(query: string, useProxy = false, debug = false): Promise<any[]> {
  // Seleccionar un User-Agent aleatorio
  const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  
  // Seleccionar un lenguaje aleatorio
  const language = languages[Math.floor(Math.random() * languages.length)];
  
  // Añadir variación a la consulta para evitar patrones detectables
  const searchQuery = addQueryVariation(query);
  
  // Codificar la query para la URL
  const encodedQuery = encodeURIComponent(searchQuery);
  
  // Agregar parámetros aleatorios para simular un navegador real
  const randomNum = Math.floor(Math.random() * 100);
  const searchUrl = `https://www.google.com/search?q=${encodedQuery}&hl=es&gl=es&pws=0&source=hp&ei=a${randomNum}b&start=0`;
  
  console.log(`[scraper] Consultando URL: ${searchUrl}`);
  console.log(`[scraper] User-Agent: ${userAgent.substring(0, 20)}...`);
  
  try {
    // Configurar timeout para evitar bloqueos en la petición
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos de timeout
    
    // Crear headers personalizados que parezcan de un navegador real
    const headers = {
      "User-Agent": userAgent,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": language,
      "Accept-Encoding": "gzip, deflate, br",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Cache-Control": "max-age=0",
      "Referer": "https://www.google.com/",
      "DNT": "1",
      "Sec-CH-UA": `"Chromium";v="122", "Google Chrome";v="122", "Not(A:Brand";v="24"`,
      "Sec-CH-UA-Mobile": "?0",
      "Sec-CH-UA-Platform": `"${Math.random() > 0.5 ? 'Windows' : 'macOS'}"`,
      "Cookie": ""
    };
    
    // Realizar la petición a Google
    const options: RequestInit = {
      headers,
      signal: controller.signal,
      redirect: "follow"
    };
    
    // Agregar proxy si está habilitado (experimental)
    let response;
    
    if (useProxy && freeProxies.length > 0) {
      // Seleccionar un proxy aleatorio
      const proxy = freeProxies[Math.floor(Math.random() * freeProxies.length)];
      console.log(`[scraper] Usando proxy: ${proxy}`);
      
      // Esta implementación requeriría un servicio de proxy compatible con Deno
      // Por ahora, fallback a petición sin proxy
      response = await fetch(searchUrl, options);
    } else {
      response = await fetch(searchUrl, options);
    }
    
    // Limpiar el timeout
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Error en la petición: ${response.status} ${response.statusText}`);
    }
    
    // Obtener el HTML de la respuesta
    const html = await response.text();
    console.log(`[scraper] Respuesta recibida: ${html.length} caracteres`);
    
    // Comprobar si Google ha detectado el scraping y está mostrando un CAPTCHA
    if (html.includes("detected unusual traffic") || 
        html.includes("captcha") || 
        html.includes("Our systems have detected unusual traffic") ||
        html.includes("Sorry, we couldn't process your request")) {
      console.error("[scraper] Detección de CAPTCHA o tráfico inusual");
      throw new Error("Google ha detectado el scraping y está mostrando un CAPTCHA");
    }
    
    if (debug) {
      // Si debug está activado, guardar los primeros 1000 caracteres del HTML para depuración
      console.log(`[scraper] Primeros 1000 caracteres del HTML: ${html.substring(0, 1000)}`);
    }
    
    // Usar cheerio para parsear el HTML y extraer los resultados
    const $ = load(html);
    const results = [];
    
    // Depuración: Imprimir estructura básica de la página para analizar
    if (debug) {
      console.log(`[scraper] Títulos h3 encontrados: ${$('h3').length}`);
      $('h3').each((i, el) => {
        console.log(`[scraper] Título ${i}: "${$(el).text().trim()}"`);
      });
    }
    
    // Múltiples enfoques para extraer resultados, adaptándonos a la estructura actual de Google
    
    // Enfoque 1: Selectores múltiples para resultados orgánicos
    console.log("[scraper] Intentando extraer resultados con enfoque 1");
    const mainResults = $('div.g, div[data-hveid], div.MjjYud, div.Gx5Zad, div.tF2Cxc, div.yuRUbf')
      .filter(function() {
        return $(this).find('h3').length > 0;
      });
    
    if (debug) {
      console.log(`[scraper] Enfoque 1 encontró ${mainResults.length} resultados posibles`);
    }
    
    // Si encontramos resultados con enfoque 1, los procesamos
    if (mainResults.length > 0) {
      mainResults.each(function(index, element) {
        try {
          const titleElement = $(element).find('h3').first();
          const title = titleElement.text().trim();
          
          if (!title) return;
          
          // Buscar la URL en varios niveles
          let url = '';
          const linkElement = $(element).find('a[href^="http"], a[href^="/url"]').first();
          
          if (linkElement.length > 0) {
            url = linkElement.attr('href') || '';
            
            // Limpiar URL si es del formato de Google redirect
            if (url.startsWith('/url?') || url.includes('/url?')) {
              try {
                if (url.startsWith('/')) {
                  url = 'https://www.google.com' + url;
                }
                const urlObj = new URL(url);
                const cleanUrl = urlObj.searchParams.get('q') || urlObj.searchParams.get('url');
                if (cleanUrl) url = cleanUrl;
              } catch (e) {
                console.error(`[scraper] Error al limpiar URL: ${e}`);
              }
            }
          }
          
          // Extraer snippet
          const snippetElement = $(element).find('.VwiC3b, .lyLwlc, .IsZvec, .lEBKkf, .yXK7lf, .MUxGbd').first();
          const snippet = snippetElement.text().trim();
          
          if (title && url && url.startsWith('http') && !title.includes("People also ask")) {
            results.push({
              title,
              url,
              snippet: snippet || "",
              position: index + 1
            });
          }
        } catch (err) {
          console.error(`[scraper] Error al procesar resultado ${index}:`, err);
        }
      });
    }
    
    // Enfoque 2: Si no encontramos resultados con el primer enfoque
    if (results.length === 0) {
      console.log("[scraper] Intentando extraer resultados con enfoque 2");
      $('a').each(function(index, element) {
        try {
          const href = $(element).attr('href');
          
          // Solo procesar enlaces que puedan ser resultados de búsqueda
          if (!href || (!href.startsWith('http') && !href.startsWith('/url?'))) return;
          
          // Buscar una etiqueta h3 dentro del enlace o cerca
          const titleElement = $(element).find('h3').first();
          if (!titleElement.length) return;
          
          const title = titleElement.text().trim();
          if (!title || title.includes("People also ask") || title.includes("Featured snippet")) return;
          
          let url = href;
          
          // Limpiar URL si es del formato de Google redirect
          if (url.startsWith('/url?') || url.includes('/url?')) {
            try {
              if (url.startsWith('/')) {
                url = 'https://www.google.com' + url;
              }
              const urlObj = new URL(url);
              const cleanUrl = urlObj.searchParams.get('q') || urlObj.searchParams.get('url');
              if (cleanUrl) url = cleanUrl;
            } catch (e) {
              console.error(`[scraper] Error al limpiar URL: ${e}`);
            }
          }
          
          // Buscar un snippet cercano al elemento de título
          const parentElement = titleElement.parent().parent();
          const snippetElement = parentElement.find('div').not(function() {
            return $(this).find('h3').length > 0;
          }).first();
          
          const snippet = snippetElement.text().trim();
          
          // Solo añadir si tenemos título y URL
          if (title && url && url.startsWith('http') && !results.some(r => r.title === title)) {
            results.push({
              title,
              url,
              snippet: snippet || "",
              position: results.length + 1
            });
          }
        } catch (err) {
          console.error(`[scraper] Error al procesar enlace ${index}:`, err);
        }
      });
    }
    
    // Enfoque 3: Último recurso, usar selectores muy genéricos
    if (results.length === 0) {
      console.log("[scraper] Intentando extraer resultados con enfoque 3 (genérico)");
      $('*').each(function(index, element) {
        try {
          const h3 = $(element).find('h3').first();
          if (!h3.length) return;
          
          const title = h3.text().trim();
          if (!title || title.includes("People also ask")) return;
          
          // Buscar el enlace más cercano
          const anchor = $(element).find('a[href]').first();
          if (!anchor.length) return;
          
          let url = anchor.attr('href') || '';
          
          // Limpiar URL
          if (url.startsWith('/url?') || url.includes('/url?')) {
            try {
              if (url.startsWith('/')) {
                url = 'https://www.google.com' + url;
              }
              const urlObj = new URL(url);
              const cleanUrl = urlObj.searchParams.get('q') || urlObj.searchParams.get('url');
              if (cleanUrl) url = cleanUrl;
            } catch (e) {
              console.error(`[scraper] Error al limpiar URL: ${e}`);
            }
          }
          
          // Solo considerar URLs válidas
          if (!url.startsWith('http')) return;
          
          // Evitar duplicados
          if (results.some(r => r.title === title || r.url === url)) return;
          
          // Buscar snippet
          const snippet = $(element).text().replace(title, '').trim().substring(0, 200);
          
          results.push({
            title,
            url,
            snippet: snippet || "",
            position: results.length + 1
          });
          
          // Limitar a 10 resultados como máximo
          if (results.length >= 10) return false;
        } catch (err) {
          console.error(`[scraper] Error en enfoque genérico para elemento ${index}:`, err);
        }
      });
    }

    console.log(`[scraper] Se encontraron ${results.length} resultados`);
    
    // Si no encontramos resultados pero tampoco hubo errores, podría ser que Google cambió su estructura
    if (results.length === 0 && !html.includes("No results found")) {
      console.warn("[scraper] No se encontraron resultados, pero la página no muestra error de 'sin resultados'");
      console.warn("[scraper] Es posible que Google haya cambiado su estructura HTML");
      
      if (debug) {
        // Extraer y devolver información para ayudar a depurar
        const debugInfo = {
          htmlLength: html.length,
          titleTagContent: $('title').text(),
          h1Tags: $('h1').map((i, el) => $(el).text().trim()).get(),
          h3Count: $('h3').length,
          linkCount: $('a[href]').length,
          bodyClasses: $('body').attr('class')
        };
        
        console.log("[scraper] Información de depuración:", debugInfo);
        
        // En modo depuración, devolver al menos algo de metainformación
        return [
          {
            title: "DEBUG INFO: No results found",
            url: searchUrl,
            snippet: `HTML length: ${html.length}, Title: ${$('title').text()}, H3 count: ${$('h3').length}`,
            position: 1,
            debugInfo
          }
        ];
      }
    }
    
    return results;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('[scraper] La petición ha sido abortada por timeout');
      throw new Error("La petición a Google ha excedido el tiempo de espera");
    }
    
    console.error('[scraper] Error al hacer scraping:', error);
    throw error;
  }
}

/**
 * Añade variaciones aleatorias a la consulta para evitar patrones detectables
 * pero manteniendo el significado original
 */
function addQueryVariation(query: string): string {
  // Si la consulta es muy corta, no la modificamos
  if (query.length < 10) return query;
  
  // Decidir aleatoriamente si añadir variaciones
  if (Math.random() < 0.3) return query;
  
  const variations = [
    () => query,                            // Sin cambios (30% de probabilidad)
    () => `"${query}"`,                     // Añadir comillas para búsqueda exacta
    () => query.toLowerCase(),              // Convertir a minúsculas
    () => query + " información",           // Añadir palabra relacionada
    () => {
      // Reorganizar palabras aleatorias manteniendo palabras clave
      const words = query.split(/\s+/);
      if (words.length <= 3) return query;  // No modificar consultas muy cortas
      
      for (let i = 0; i < Math.min(2, words.length - 1); i++) {
        const idx1 = Math.floor(Math.random() * words.length);
        const idx2 = Math.floor(Math.random() * words.length);
        [words[idx1], words[idx2]] = [words[idx2], words[idx1]];
      }
      
      return words.join(' ');
    }
  ];
  
  // Elegir una variación aleatoria
  const variation = variations[Math.floor(Math.random() * variations.length)];
  const result = variation();
  
  console.log(`[scraper] Query original: "${query}"`);
  console.log(`[scraper] Query con variación: "${result}"`);
  
  return result;
}
