
// Supabase Edge Function para scraping de Google sin usar APIs de pago
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { load } from "https://esm.sh/cheerio@1.0.0-rc.12";

// Headers CORS para permitir peticiones cross-origin
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Array de User-Agents para rotar y evitar bloqueos
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36", 
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
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
    
    // Realizar scraping de Google
    const results = await scrapeGoogle(query);
    
    // Devolver resultados en formato JSON
    return new Response(
      JSON.stringify({ results }),
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
        details: error.message 
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
 */
async function scrapeGoogle(query: string): Promise<any[]> {
  // Seleccionar un User-Agent aleatorio
  const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  
  // Codificar la query para la URL
  const encodedQuery = encodeURIComponent(query);
  const searchUrl = `https://www.google.com/search?q=${encodedQuery}&hl=es`;
  
  console.log(`[scraper] Consultando URL: ${searchUrl}`);
  
  try {
    // Configurar timeout para evitar bloqueos en la petición
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
    
    // Realizar la petición a Google
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
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      },
      signal: controller.signal
    });
    
    // Limpiar el timeout
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Error en la petición: ${response.status} ${response.statusText}`);
    }
    
    // Obtener el HTML de la respuesta
    const html = await response.text();
    console.log(`[scraper] Respuesta recibida: ${html.length} caracteres`);
    
    // Comprobar si Google ha detectado el scraping y está mostrando un CAPTCHA
    if (html.includes("detected unusual traffic") || html.includes("captcha")) {
      console.error("[scraper] Detección de CAPTCHA o tráfico inusual");
      throw new Error("Google ha detectado el scraping y está mostrando un CAPTCHA");
    }
    
    // Usar cheerio para parsear el HTML y extraer los resultados
    const $ = load(html);
    const results = [];
    
    // Extraer los títulos de los resultados de búsqueda
    $("h3").each((index, element) => {
      const title = $(element).text().trim();
      
      // Encontrar el elemento enlace más cercano para obtener la URL
      const linkElement = $(element).closest("a");
      let url = linkElement.attr("href") || "";
      
      // Limpiar la URL (Google usa un formato especial de URL)
      if (url.startsWith('/url?')) {
        try {
          const urlObj = new URL(`https://www.google.com${url}`);
          url = urlObj.searchParams.get("q") || url;
        } catch (e) {
          console.error("[scraper] Error al parsear URL:", e);
        }
      }
      
      // Solo añadir resultados con título y que no sean resultados especiales
      if (title && !title.includes("People also ask") && url.startsWith('http')) {
        results.push({
          title,
          url,
        });
      }
    });

    console.log(`[scraper] Se encontraron ${results.length} resultados`);
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
