
// Search engine utilities for Google and Google Scholar
import { corsHeaders } from "./corsHeaders.ts";

/**
 * Perform a search on Google or Google Scholar and return the results
 */
export async function searchGoogle(query: string, isScholar = false) {
  try {
    // URL encoding para la consulta
    const encodedQuery = encodeURIComponent(query);
    
    // Determinar qué URL base usar
    const baseUrl = isScholar
      ? "https://scholar.google.com/scholar?q="
      : "https://www.google.com/search?q=";
    
    // Construir URL completa
    const searchUrl = `${baseUrl}${encodedQuery}`;
    
    // Simular un navegador para evitar bloqueos
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html",
        "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`Error en búsqueda: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extraer URLs y títulos de los resultados
    const results = [];
    
    // Extraer enlaces
    const linkRegex = isScholar 
      ? /<h3 class="gs_rt".*?<a href="([^"]+)".*?>(.*?)<\/a>/g
      : /<div class="yuRUbf">.*?<a href="([^"]+)".*?<h3 class="LC20lb.*?>(.*?)<\/h3>/g;
    
    let match;
    while ((match = linkRegex.exec(html)) !== null && results.length < 10) {
      const url = match[1];
      const title = match[2].replace(/<\/?[^>]+(>|$)/g, ""); // Eliminar HTML
      
      // Obtener un fragmento de texto del resultado
      let snippet = "";
      if (isScholar) {
        const snippetMatch = /<div class="gs_rs">(.*?)<\/div>/g.exec(html.substring(match.index));
        if (snippetMatch) {
          snippet = snippetMatch[1].replace(/<\/?[^>]+(>|$)/g, "");
        }
      } else {
        const snippetMatch = /<div class="VwiC3b".*?>(.*?)<\/div>/g.exec(html.substring(match.index));
        if (snippetMatch) {
          snippet = snippetMatch[1].replace(/<\/?[^>]+(>|$)/g, "");
        }
      }
      
      results.push({
        url,
        title,
        snippet,
        source: isScholar ? "Google Scholar" : "Google",
      });
    }
    
    return results;
  } catch (error) {
    console.error(`Error en búsqueda ${isScholar ? 'Scholar' : 'Google'}:`, error);
    return [];
  }
}
