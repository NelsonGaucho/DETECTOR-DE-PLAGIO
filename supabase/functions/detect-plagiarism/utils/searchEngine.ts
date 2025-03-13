
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
    
    // User agent rotation to avoid detection patterns
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:94.0) Gecko/20100101 Firefox/94.0",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
    ];
    
    // Select a random user agent
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    
    // Randomize words in the fragment to avoid bot detection
    // and improve search without losing context
    const queryWords = query.split(/\s+/).filter(w => w.length > 3);
    let searchQuery = query;
    
    // If the fragment has enough words, we can randomize
    if (queryWords.length > 7) {
      // Select 70-90% of the original words in random order
      const wordCount = Math.floor(queryWords.length * (0.7 + Math.random() * 0.2));
      const selectedWords = [];
      
      for (let i = 0; i < wordCount; i++) {
        const randomIndex = Math.floor(Math.random() * queryWords.length);
        selectedWords.push(queryWords[randomIndex]);
        // Remove the word to avoid duplicates
        queryWords.splice(randomIndex, 1);
        if (queryWords.length === 0) break;
      }
      
      // Convert to string if there are selected words
      if (selectedWords.length > 0) {
        searchQuery = selectedWords.join(' ');
      }
    }
    
    // Add quotes if it's an exact phrase and has few words
    if (searchQuery.split(/\s+/).length <= 6) {
      searchQuery = `"${searchQuery}"`;
    }
    
    // URL encoding for the query
    const encodedQuery = encodeURIComponent(searchQuery);
    
    // Determine which base URL to use
    const baseUrl = isScholar
      ? "https://scholar.google.com/scholar?q="
      : "https://www.google.com/search?q=";
    
    // Build complete URL with additional parameters to look more like a real browser
    const searchUrl = `${baseUrl}${encodedQuery}${isScholar ? '&hl=es&as_sdt=0,5' : '&hl=es&gl=es&sourceid=chrome'}`;
    
    console.log(`[searchEngine] URL de búsqueda: ${searchUrl}`);
    
    // Simulate a browser with more complete headers
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
    
    try {
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
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
  
      if (!response.ok) {
        throw new Error(`Error en búsqueda: ${response.status} ${response.statusText}`);
      }
      
      const html = await response.text();
      console.log(`[searchEngine] Respuesta recibida: ${html.length} caracteres`);
      
      if (html.includes("detected unusual traffic") || html.includes("captcha")) {
        console.error("[searchEngine] Detección de CAPTCHA o tráfico inusual");
        return [];
      }
      
      // Use cheerio to parse the HTML
      const $ = load(html);
      const results = [];
      
      // Extract results based on the search type
      if (isScholar) {
        // Extract Google Scholar results
        $(".gs_ri").each((i, element) => {
          if (results.length >= 10) return false; // Limit to 10 results
          
          const titleElement = $(element).find("h3 a");
          const title = titleElement.text().trim();
          let url = titleElement.attr("href") || "";
          
          // Format URL
          if (url.startsWith('/scholar')) {
            url = `https://scholar.google.com${url}`;
          }
          
          // Extract snippet
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
        // Extract regular Google results
        $("div.g").each((i, element) => {
          if (results.length >= 10) return false; // Limit to 10 results
          
          const titleElement = $(element).find("h3");
          if (!titleElement.length) return; // Continue if there's no title
          
          const title = titleElement.text().trim();
          if (!title) return; // Continue if the title is empty
          
          // Find the link
          const linkElement = titleElement.closest("a");
          let url = linkElement.attr("href") || "";
          
          // Clean URL
          if (url.startsWith('/url?')) {
            try {
              const urlParams = new URLSearchParams(url.substring(5));
              url = urlParams.get('q') || url;
            } catch (e) {
              console.error("[searchEngine] Error parsing URL:", e);
            }
          }
          
          // Extract snippet
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
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        console.error('[searchEngine] Búsqueda abortada por timeout');
      } else {
        console.error('[searchEngine] Error en fetch:', fetchError);
      }
      clearTimeout(timeoutId);
      return [];
    }
  } catch (error) {
    console.error(`[searchEngine] Error en búsqueda ${isScholar ? 'Scholar' : 'Google'}:`, error);
    return [];
  }
}
