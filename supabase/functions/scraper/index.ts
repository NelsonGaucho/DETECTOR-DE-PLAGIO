
// Supabase Edge Function para scraping de Google evitando bloqueos
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

// Headers CORS para permitir peticiones cross-origin
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Array expandido de User-Agents modernos para mejor rotación y evitar bloqueos
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36", 
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 OPR/108.0.0.0",
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0"
];

// Array de lenguajes para rotar
const languages = ["es-ES,es;q=0.9", "en-US,en;q=0.8", "en-GB,en;q=0.8", "es-MX,es;q=0.9", "es-AR,es;q=0.9"];

// Navegadores simulados para los headers
const browserVersions = [
  { name: "Chrome", version: "123.0.0.0", platform: "Windows NT 10.0; Win64; x64" },
  { name: "Firefox", version: "124.0", platform: "Windows NT 10.0; Win64; x64" },
  { name: "Safari", version: "17.4", platform: "Macintosh; Intel Mac OS X 14_4" },
  { name: "Edge", version: "123.0.0.0", platform: "Windows NT 10.0; Win64; x64" }
];

// Lista de cookies de consentimiento para evitar páginas de consentimiento
const consentCookies = [
  "CONSENT=YES+cb.20220301-11-p0.en+FX+421; SID=RghYml23wnMFy_ZI65cDblahblah;",
  "CONSENT=PENDING+123; NID=511=mKcW6tmAZfs6OAblahblah;",
  "CONSENT=YES+; SOCS=CAESEwgUEg; OTZ=12345678_78_90_123456",
  "CONSENT=YES+; SIDCC=ABTdFD43Blahlblah; APISID=somedata/someotherdata"
];

// Servicio de proxy para acceder a través de diferentes IPs
const proxyServices = {
  scraperApi: "http://api.scraperapi.com?api_key={{API_KEY}}&url={{URL}}",
  scrapeNinja: "https://api.scrapeninja.net/scrape?api_key={{API_KEY}}&url={{URL}}",
  proxyDefault: "https://proxy.scrapeops.io/v1/?api_key={{API_KEY}}&url={{URL}}&residential=true"
};

serve(async (req) => {
  // Manejar peticiones preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Obtener parámetros de la URL
    const url = new URL(req.url);
    const query = url.searchParams.get("query");
    const proxyApiKey = url.searchParams.get("proxyApiKey");
    const proxyService = url.searchParams.get("proxyService") || "default"; 
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
    const results = await scrapeGoogle(query, proxyApiKey, proxyService, debug);
    
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
 * @param proxyApiKey API key para el servicio de proxy (opcional)
 * @param proxyService Servicio de proxy a utilizar (opcional)
 * @param debug Indica si se debe devolver información de depuración
 */
async function scrapeGoogle(query: string, proxyApiKey?: string|null, proxyService?: string, debug = false): Promise<any[]> {
  // Seleccionar un navegador simulado aleatorio
  const browser = browserVersions[Math.floor(Math.random() * browserVersions.length)];
  
  // Construir un User-Agent avanzado basado en el navegador seleccionado
  const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  
  // Seleccionar un lenguaje aleatorio
  const language = languages[Math.floor(Math.random() * languages.length)];
  
  // Seleccionar cookies de consentimiento aleatorias
  const cookies = consentCookies[Math.floor(Math.random() * consentCookies.length)];
  
  // Añadir variación a la consulta para evitar patrones detectables
  const searchQuery = addQueryVariation(query);
  
  // Codificar la query para la URL
  const encodedQuery = encodeURIComponent(searchQuery);
  
  // Agregar parámetros aleatorios para simular un navegador real
  const randomNum = Math.floor(Math.random() * 10000);
  const searchUrl = `https://www.google.com/search?q=${encodedQuery}&hl=es&gl=es&pws=0&source=hp&ei=a${randomNum}b&start=0`;
  
  console.log(`[scraper] Consultando URL: ${searchUrl}`);
  console.log(`[scraper] User-Agent: ${userAgent.substring(0, 20)}...`);
  
  try {
    // Configurar timeout para evitar bloqueos en la petición
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 segundos de timeout
    
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
      "Sec-CH-UA": `"${browser.name}";v="${browser.version}", "Not(A:Brand";v="24"`,
      "Sec-CH-UA-Mobile": "?0",
      "Sec-CH-UA-Platform": `"${browser.platform.split(';')[0].trim()}"`,
      "Cookie": cookies
    };
    
    // Realizar la petición a Google
    const options: RequestInit = {
      headers,
      signal: controller.signal,
      redirect: "follow"
    };
    
    // Usar un servicio de proxy si se proporciona una API key
    let response;
    let finalUrl = searchUrl;
    
    if (proxyApiKey) {
      let proxyUrl;
      
      // Seleccionar el servicio de proxy según el parámetro
      switch(proxyService) {
        case "scraperapi":
          proxyUrl = proxyServices.scraperApi;
          break;
        case "scrapeninja":
          proxyUrl = proxyServices.scrapeNinja;
          break;
        default:
          proxyUrl = proxyServices.proxyDefault;
      }
      
      // Reemplazar placeholders con valores reales
      finalUrl = proxyUrl
        .replace("{{API_KEY}}", proxyApiKey)
        .replace("{{URL}}", encodeURIComponent(searchUrl));
      
      console.log(`[scraper] Usando proxy: ${proxyService}`);
      
      // Realizar petición a través del proxy
      response = await fetch(finalUrl, {
        ...options,
        // Algunos servicios de proxy requieren estos headers específicos
        headers: {
          "User-Agent": userAgent,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        }
      });
    } else {
      // Petición directa a Google
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
    
    // Usar Deno DOM para parsear el HTML y extraer los resultados
    const document = new DOMParser().parseFromString(html, "text/html");
    if (!document) {
      throw new Error("No se pudo parsear el HTML");
    }
    
    const results = [];
    
    // Enfoque 1: Extracción directa de resultados de búsqueda usando selectores modernos
    console.log("[scraper] Intentando extraer resultados con enfoque 1");
    
    // Identificar resultados orgánicos usando los selectores actuales de Google (2024)
    const searchResults = document.querySelectorAll('div.g, div[data-hveid], div.MjjYud, div.Gx5Zad, div.tF2Cxc, div.yuRUbf');
    
    if (debug) {
      console.log(`[scraper] Encontrados ${searchResults.length} posibles resultados con enfoque 1`);
    }
    
    // Iterar sobre cada posible resultado de búsqueda
    for (let i = 0; i < searchResults.length; i++) {
      const result = searchResults[i];
      
      // Buscar el título (h3)
      const titleElement = result.querySelector('h3');
      if (!titleElement) continue;
      
      const title = titleElement.textContent.trim();
      if (!title || title.includes("People also ask")) continue;
      
      // Buscar el enlace (a)
      const link = result.querySelector('a[href^="http"], a[href^="/url"]');
      if (!link) continue;
      
      let url = link.getAttribute('href') || '';
      
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
      
      // Solo procesar URLs válidas
      if (!url.startsWith('http')) continue;
      
      // Buscar el snippet
      let snippet = '';
      const snippetElement = result.querySelector('.VwiC3b, .lyLwlc, .IsZvec');
      if (snippetElement) {
        snippet = snippetElement.textContent.trim();
      }
      
      // Añadir resultado si no está duplicado
      if (!results.some(r => r.title === title || r.url === url)) {
        results.push({
          title,
          url,
          snippet: snippet || "",
          position: results.length + 1
        });
      }
      
      // Limitar a 10 resultados
      if (results.length >= 10) break;
    }
    
    // Si el primer enfoque no dio resultados, probar con el segundo enfoque
    if (results.length === 0) {
      console.log("[scraper] Intentando extraer resultados con enfoque 2");
      
      // Buscar todos los h3 en la página que probablemente sean títulos de resultados
      const h3Elements = document.querySelectorAll('h3');
      
      if (debug) {
        console.log(`[scraper] Encontrados ${h3Elements.length} elementos h3`);
      }
      
      for (let i = 0; i < h3Elements.length; i++) {
        const h3 = h3Elements[i];
        const title = h3.textContent.trim();
        
        if (!title || title.includes("People also ask")) continue;
        
        // Buscar el enlace más cercano (ancestro o hermano)
        let linkElement = null;
        let current = h3;
        
        // Buscar hacia arriba hasta 3 niveles
        for (let j = 0; j < 3; j++) {
          const parent = current.parentElement;
          if (!parent) break;
          
          // Buscar enlace en el padre
          linkElement = parent.querySelector('a[href^="http"], a[href^="/url"]');
          if (linkElement) break;
          
          current = parent;
        }
        
        if (!linkElement) continue;
        
        let url = linkElement.getAttribute('href') || '';
        
        // Limpiar URL de Google
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
        
        // Solo procesar URLs válidas
        if (!url.startsWith('http')) continue;
        
        // Buscar snippet
        let snippet = '';
        const parent = h3.parentElement;
        if (parent) {
          // Buscar elementos que puedan contener el snippet
          const possibleSnippets = parent.querySelectorAll('div:not(:has(h3))');
          for (let j = 0; j < possibleSnippets.length; j++) {
            const text = possibleSnippets[j].textContent.trim();
            if (text && text !== title && text.length > 20) {
              snippet = text;
              break;
            }
          }
        }
        
        // Añadir resultado si no está duplicado
        if (!results.some(r => r.title === title || r.url === url)) {
          results.push({
            title,
            url,
            snippet: snippet || "",
            position: results.length + 1
          });
        }
        
        // Limitar a 10 resultados
        if (results.length >= 10) break;
      }
    }
    
    // Tercer enfoque (última oportunidad): Búsqueda genérica
    if (results.length === 0) {
      console.log("[scraper] Intentando extracción con enfoque 3 (genérico)");
      
      // Buscar todos los enlaces en la página
      const links = document.querySelectorAll('a[href^="http"], a[href^="/url"]');
      
      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        let url = link.getAttribute('href') || '';
        
        // Ignorar enlaces que claramente no son resultados
        if (url.includes('google.com/search') || 
            url.includes('accounts.google') || 
            url.includes('support.google')) {
          continue;
        }
        
        // Limpiar URL de Google
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
            continue;
          }
        }
        
        // Solo procesar URLs válidas
        if (!url.startsWith('http')) continue;
        
        // Buscar texto que pueda ser el título
        let title = '';
        const linkText = link.textContent.trim();
        if (linkText && linkText.length > 5 && linkText.length < 100) {
          title = linkText;
        } else {
          // Buscar un elemento cercano que pueda contener el título
          let current = link;
          for (let j = 0; j < 3; j++) {
            const parent = current.parentElement;
            if (!parent) break;
            
            const possibleTitle = parent.querySelector('h3, h2, strong, b');
            if (possibleTitle) {
              title = possibleTitle.textContent.trim();
              break;
            }
            
            current = parent;
          }
        }
        
        // Si no encontramos título, usar la URL como título
        if (!title) {
          try {
            const urlObj = new URL(url);
            title = urlObj.hostname.replace('www.', '');
          } catch {
            title = url.substring(0, 30) + '...';
          }
        }
        
        // Buscar texto que pueda ser el snippet
        let snippet = '';
        let current = link;
        for (let j = 0; j < 3; j++) {
          const parent = current.parentElement;
          if (!parent) break;
          
          const text = parent.textContent.trim().replace(title, '').replace(linkText, '').trim();
          if (text && text.length > 20) {
            snippet = text.substring(0, 200);
            break;
          }
          
          current = parent;
        }
        
        // Añadir resultado si no está duplicado
        if (!results.some(r => r.url === url)) {
          results.push({
            title,
            url,
            snippet: snippet || "",
            position: results.length + 1
          });
        }
        
        // Limitar a 10 resultados
        if (results.length >= 10) break;
      }
    }

    console.log(`[scraper] Se encontraron ${results.length} resultados`);
    
    // Si no encontramos resultados pero tampoco hubo errores, podría ser que Google cambió su estructura
    if (results.length === 0 && !html.includes("No results found")) {
      console.warn("[scraper] No se encontraron resultados, pero la página no muestra error de 'sin resultados'");
      
      if (debug) {
        // Extraer y devolver información para depurar
        const debugInfo = {
          htmlLength: html.length,
          titleTagContent: document.querySelector('title')?.textContent || '',
          h1Tags: Array.from(document.querySelectorAll('h1')).map(h1 => h1.textContent.trim()),
          h3Count: document.querySelectorAll('h3').length,
          linkCount: document.querySelectorAll('a[href]').length,
          bodyClasses: document.querySelector('body')?.getAttribute('class') || ''
        };
        
        console.log("[scraper] Información de depuración:", debugInfo);
        
        // En modo depuración, devolver metainformación
        return [
          {
            title: "DEBUG INFO: No results found",
            url: searchUrl,
            snippet: `HTML length: ${html.length}, Title: ${document.querySelector('title')?.textContent || 'No title'}, H3 count: ${document.querySelectorAll('h3').length}`,
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
