// Search engine utilities for Google and Google Scholar with improved anti-blocking techniques
import { corsHeaders } from "./corsHeaders.ts";
import { load } from "https://esm.sh/cheerio@1.0.0-rc.12";

// Enhanced list of user agents for better rotation
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

// Array of languages for rotation
const languages = ["es-ES,es", "en-US,en", "en-GB,en", "es-MX,es", "es-AR,es"];

// Last request timestamp to implement rate limiting
let lastRequestTime = 0;

/**
 * Perform a search on Google or Google Scholar and return the results
 * with advanced techniques to avoid being blocked
 */
export async function searchGoogle(query: string, isScholar = false) {
  try {
    console.log(`[searchEngine] Iniciando búsqueda ${isScholar ? 'Scholar' : 'Google'}: "${query.substring(0, 30)}..."`);
    
    // Implement rate limiting - enforce minimum delay between requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    const minimumDelay = 2000 + Math.floor(Math.random() * 3000); // 2-5 seconds
    
    if (timeSinceLastRequest < minimumDelay) {
      const waitTime = minimumDelay - timeSinceLastRequest;
      console.log(`[searchEngine] Esperando ${waitTime}ms para evitar rate limiting...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Update last request time
    lastRequestTime = Date.now();
    
    // Select a random user agent
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    
    // Select a random language
    const language = languages[Math.floor(Math.random() * languages.length)];
    
    // Apply query variation to avoid detection
    const searchQuery = applyQueryVariation(query);
    
    // URL encoding for the query
    const encodedQuery = encodeURIComponent(searchQuery);
    
    // Add random parameters to avoid detection patterns
    const randomNum = Math.floor(Math.random() * 1000);
    
    // Determine which base URL to use
    const baseUrl = isScholar
      ? "https://scholar.google.com/scholar?q="
      : "https://www.google.com/search?q=";
    
    // Build complete URL with additional parameters to look more like a real browser
    const searchUrl = isScholar
      ? `${baseUrl}${encodedQuery}&hl=es&as_sdt=0,5&as_vis=1&scisbd=${randomNum}`
      : `${baseUrl}${encodedQuery}&hl=es&gl=es&pws=0&source=hp&ei=a${randomNum}b`;
    
    console.log(`[searchEngine] URL de búsqueda: ${searchUrl}`);
    console.log(`[searchEngine] User-Agent: ${userAgent.substring(0, 20)}...`);
    
    // Simulate a browser with more complete headers
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout
    
    try {
      // Create advanced headers that mimic a real browser
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
        "Referer": isScholar ? "https://scholar.google.com/" : "https://www.google.com/",
        "DNT": "1",
        "Sec-CH-UA": `"Chromium";v="122", "Google Chrome";v="122", "Not(A:Brand";v="24"`,
        "Sec-CH-UA-Mobile": "?0",
        "Sec-CH-UA-Platform": `"${Math.random() > 0.5 ? 'Windows' : 'macOS'}"`,
      };
      
      const response = await fetch(searchUrl, {
        headers,
        signal: controller.signal,
        redirect: "follow"
      });
      
      clearTimeout(timeoutId);
  
      if (!response.ok) {
        throw new Error(`Error en búsqueda: ${response.status} ${response.statusText}`);
      }
      
      const html = await response.text();
      console.log(`[searchEngine] Respuesta recibida: ${html.length} caracteres`);
      
      // Check for CAPTCHA or unusual traffic detection with multiple patterns
      if (html.includes("detected unusual traffic") || 
          html.includes("captcha") ||
          html.includes("Our systems have detected unusual traffic") ||
          html.includes("Sorry, we couldn't process your request")) {
        console.error("[searchEngine] Detección de CAPTCHA o tráfico inusual");
        throw new Error("Google ha detectado el scraping y está mostrando un CAPTCHA");
      }
      
      // Use cheerio to parse the HTML
      const $ = load(html);
      const results = [];
      
      // Extract results based on the search type
      if (isScholar) {
        // Extract Google Scholar results with multiple selector patterns
        const scholarSelectors = [".gs_ri h3 a", ".gs_rt a", "h3 a"];
        
        let foundElements = false;
        
        for (const selector of scholarSelectors) {
          $(selector).each((i, element) => {
            if (results.length >= 10) return false; // Limit to 10 results
            
            const title = $(element).text().trim();
            let url = $(element).attr("href") || "";
            
            if (title) {
              foundElements = true;
              
              // Format URL
              if (url.startsWith('/scholar')) {
                url = `https://scholar.google.com${url}`;
              }
              
              // Extract snippet
              const container = $(element).closest('.gs_ri');
              const snippet = container.find('.gs_rs').text().trim();
              
              if (title && url) {
                results.push({
                  url: url.startsWith('http') ? url : (url.startsWith('/') ? `https://scholar.google.com${url}` : url),
                  title,
                  snippet: snippet || "",
                  source: "Google Scholar",
                  position: i + 1
                });
              }
            }
          });
          
          if (foundElements) break; // Stop trying selectors if we found results
        }
      } else {
        // Extract regular Google results with multiple selector patterns
        const googleSelectors = [
          "div.g div.yuRUbf h3", // Common result container
          "div.g h3", // Alternative result container
          "h3.LC20lb" // Direct heading selector
        ];
        
        let foundElements = false;
        
        for (const selector of googleSelectors) {
          $(selector).each((i, element) => {
            if (results.length >= 10) return false; // Limit to 10 results
            
            const titleElement = $(element);
            const title = titleElement.text().trim();
            
            if (title && !title.includes("People also ask")) {
              foundElements = true;
              
              // Find the closest anchor tag for URL
              let url = "";
              const parentLink = titleElement.closest("a");
              
              if (parentLink.length) {
                url = parentLink.attr("href") || "";
              } else {
                // Try to find URL in parent container
                const container = titleElement.closest("div.g, div.yuRUbf");
                const link = container.find("a");
                url = link.attr("href") || "";
              }
              
              // Clean URL
              if (url.startsWith('/url?')) {
                try {
                  const urlObj = new URL(`https://www.google.com${url}`);
                  url = urlObj.searchParams.get("q") || url;
                } catch (e) {
                  console.error("[searchEngine] Error parsing URL:", e);
                }
              }
              
              // Extract snippet
              let snippet = "";
              const snippetContainer = titleElement.closest("div.g, div.yuRUbf").find(".VwiC3b, .st");
              if (snippetContainer.length) {
                snippet = snippetContainer.text().trim();
              }
              
              if (title && url && url.startsWith('http')) {
                results.push({
                  url,
                  title,
                  snippet: snippet || "",
                  source: "Google",
                  position: i + 1
                });
              }
            }
          });
          
          if (foundElements) break; // Stop trying selectors if we found results
        }
      }
      
      console.log(`[searchEngine] Resultados encontrados: ${results.length}`);
      
      // Warn if no results found but page didn't indicate "no results"
      if (results.length === 0 && !html.includes("No results found")) {
        console.warn(`[searchEngine] No se encontraron resultados en ${isScholar ? 'Scholar' : 'Google'}, pero la página no muestra mensaje de "sin resultados"`);
        console.warn("[searchEngine] Es posible que la estructura HTML haya cambiado, revisar selectores");
      }
      
      return results;
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        console.error('[searchEngine] Búsqueda abortada por timeout');
      } else {
        console.error('[searchEngine] Error en fetch:', fetchError);
      }
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error(`[searchEngine] Error en búsqueda ${isScholar ? 'Scholar' : 'Google'}:`, error);
    throw error;
  }
}

/**
 * Apply variations to search query to avoid detection patterns
 * while maintaining the original meaning
 */
function applyQueryVariation(query: string): string {
  // For very short queries, don't modify
  if (query.length < 10) return query;
  
  // Randomly decide whether to modify (30% chance of no modification)
  if (Math.random() < 0.3) return query;
  
  const variations = [
    () => query,                                // No change 
    () => `"${query}"`,                         // Add quotes for exact match
    () => query.toLowerCase(),                  // Convert to lowercase
    () => query + (Math.random() > 0.5 ? " información" : " details"),  // Add related word
    () => {
      // Randomly reorganize words while keeping key phrases
      const words = query.split(/\s+/);
      if (words.length <= 3) return query;     // Don't modify very short queries
      
      // Only swap some words to maintain meaning
      for (let i = 0; i < Math.min(2, words.length - 1); i++) {
        const idx1 = Math.floor(Math.random() * words.length);
        const idx2 = Math.floor(Math.random() * words.length);
        [words[idx1], words[idx2]] = [words[idx2], words[idx1]];
      }
      
      return words.join(' ');
    }
  ];
  
  // Choose a random variation
  const variation = variations[Math.floor(Math.random() * variations.length)];
  const result = variation();
  
  console.log(`[searchEngine] Query original: "${query}"`);
  console.log(`[searchEngine] Query con variación: "${result}"`);
  
  return result;
}

/**
 * Add random delay to simulate human behavior and avoid rate limiting
 */
export async function addRandomDelay() {
  // Random delay between 2-5 seconds
  const delay = 2000 + Math.floor(Math.random() * 3000);
  console.log(`[searchEngine] Añadiendo retraso aleatorio de ${delay}ms...`);
  await new Promise(resolve => setTimeout(resolve, delay));
}
