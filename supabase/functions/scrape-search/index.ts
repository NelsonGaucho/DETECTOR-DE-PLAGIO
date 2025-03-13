// Supabase Edge Function for scraping Google and Google Scholar search results
import { load } from "https://esm.sh/cheerio@1.0.0-rc.12";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

// Main function to handle HTTP requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request URL and body
    const url = new URL(req.url);
    let queryParam = url.searchParams.get("query");
    let source = url.searchParams.get("source") || "google";
    
    // Also support JSON body for better compatibility
    if (!queryParam && req.body) {
      try {
        const body = await req.json();
        queryParam = body.query;
        source = body.source || source;
      } catch (e) {
        // Not a JSON body, continue with query params
      }
    }

    if (!queryParam) {
      return new Response(
        JSON.stringify({ error: "Query parameter is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`[scrape-search] Scraping ${source} for query: ${queryParam}`);
    
    // Add a random delay between 1-3 seconds to appear more human-like
    const delayMs = Math.floor(Math.random() * 2000) + 1000;
    console.log(`[scrape-search] Waiting ${delayMs}ms before request...`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    // Get search results based on the source
    const results = await scrapeSearch(queryParam, source);
    
    // Add timestamp for cache control
    const response = {
      results,
      timestamp: new Date().toISOString(),
      query: queryParam,
      source
    };
    
    // Return the results as JSON
    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate"
        } 
      }
    );
  } catch (error) {
    console.error("[scrape-search] Error:", error);
    
    // Return error response with detailed information
    return new Response(
      JSON.stringify({ 
        error: error.message,
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
 * Function to scrape search results from Google or Google Scholar
 * with improved anti-blocking measures
 */
async function scrapeSearch(query: string, source: string): Promise<any[]> {
  // Apply query variation to avoid detection patterns
  const searchQuery = addQueryVariation(query);
  
  // Select a random user agent
  const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  
  // Select a random language setting
  const language = languages[Math.floor(Math.random() * languages.length)];
  
  // URL encode the query
  const encodedQuery = encodeURIComponent(searchQuery);
  
  // Add random parameters to avoid detection patterns
  const randomNum = Math.floor(Math.random() * 1000);
  
  // Determine the search URL based on the source
  const searchUrl = source === "scholar" 
    ? `https://scholar.google.com/scholar?q=${encodedQuery}&hl=es&as_sdt=0,5&as_vis=1&scisbd=${randomNum}`
    : `https://www.google.com/search?q=${encodedQuery}&hl=es&gl=es&pws=0&source=hp&ei=a${randomNum}b&start=0`;
  
  console.log(`[scrape-search] Fetching from URL: ${searchUrl}`);
  console.log(`[scrape-search] Using User-Agent: ${userAgent.substring(0, 20)}...`);
  
  try {
    // Set timeout to avoid hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
    
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
      "Referer": source === "scholar" ? "https://scholar.google.com/" : "https://www.google.com/",
      "DNT": "1",
      "Sec-CH-UA": `"Chromium";v="122", "Google Chrome";v="122", "Not(A:Brand";v="24"`,
      "Sec-CH-UA-Mobile": "?0",
      "Sec-CH-UA-Platform": `"${Math.random() > 0.5 ? 'Windows' : 'macOS'}"`,
    };

    // Fetch the search results page
    const response = await fetch(searchUrl, {
      headers,
      signal: controller.signal,
      redirect: "follow"
    });

    // Clear the timeout
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch search results: ${response.status} ${response.statusText}`);
    }

    // Get the HTML content
    const html = await response.text();
    console.log(`[scrape-search] Received HTML response (${html.length} bytes)`);
    
    // Check for CAPTCHA or unusual traffic detection
    if (html.includes("detected unusual traffic") || 
        html.includes("captcha") ||
        html.includes("Our systems have detected unusual traffic") ||
        html.includes("Sorry, we couldn't process your request")) {
      console.error("[scrape-search] CAPTCHA or unusual traffic detection triggered");
      throw new Error(`${source === "scholar" ? "Google Scholar" : "Google"} has triggered a CAPTCHA verification`);
    }
    
    // Load the HTML into cheerio
    const $ = load(html);
    const results = [];

    if (source === "scholar") {
      // Extract Google Scholar results with multiple selector patterns for resilience
      const scholarSelectors = [".gs_ri h3 a", ".gs_rt a", "h3 a"];
      
      let foundElements = false;
      
      for (const selector of scholarSelectors) {
        $(selector).each((i, element) => {
          const title = $(element).text().trim();
          let url = $(element).attr("href") || "";
          
          if (title) {
            foundElements = true;
            // Clean and format URL
            if (url.startsWith('/scholar')) {
              url = `https://scholar.google.com${url}`;
            }
            
            // Try to extract snippet/abstract if available
            const container = $(element).closest('.gs_ri');
            const snippet = container.find('.gs_rs').text().trim();
            
            results.push({
              title,
              url: url.startsWith('http') ? url : (url.startsWith('/') ? `https://scholar.google.com${url}` : url),
              snippet: snippet || "",
              source: "Google Scholar",
              position: i + 1
            });
          }
        });
        
        if (foundElements) break; // Stop trying selectors if we found results
      }
    } else {
      // Extract Google Search results with multiple selector patterns for resilience
      const googleSelectors = [
        "div.g div.yuRUbf h3", // Common result container
        "div.g h3", // Alternative result container
        "h3.LC20lb" // Direct heading selector
      ];
      
      let foundElements = false;
      
      for (const selector of googleSelectors) {
        $(selector).each((i, element) => {
          const titleElement = $(element);
          const title = titleElement.text().trim();
          
          if (title && !title.includes("People also ask")) {
            foundElements = true;
            
            // Find the closest anchor tag that might contain the URL
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
            
            // Clean up Google's URL format
            if (url.startsWith('/url?')) {
              try {
                const urlObj = new URL(`https://www.google.com${url}`);
                url = urlObj.searchParams.get("q") || url;
              } catch (e) {
                console.error("[scrape-search] Error parsing URL:", e);
              }
            }
            
            // Find snippet text
            let snippet = "";
            const snippetContainer = titleElement.closest("div.g, div.yuRUbf").find(".VwiC3b, .st");
            if (snippetContainer.length) {
              snippet = snippetContainer.text().trim();
            }
            
            // Only add if we have a title and valid URL
            if (title && url.startsWith('http')) {
              results.push({
                title,
                url,
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

    console.log(`[scrape-search] Extracted ${results.length} results from ${source}`);
    
    // Log warning if no results were found but page didn't indicate "no results"
    if (results.length === 0 && !html.includes("No results found")) {
      console.warn(`[scrape-search] No results found in ${source}, but page doesn't show "no results" message`);
      console.warn("[scrape-search] The HTML structure might have changed, review selectors");
    }
    
    return results;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`[scrape-search] Request to ${source} aborted due to timeout`);
      throw new Error(`Request to ${source} timed out after 15 seconds`);
    }
    
    console.error(`[scrape-search] Error scraping ${source}:`, error);
    throw new Error(`Failed to scrape ${source}: ${error.message}`);
  }
}

/**
 * Add variations to search query to avoid detection patterns
 * while maintaining the original meaning
 */
function addQueryVariation(query: string): string {
  // For very short queries, don't modify
  if (query.length < 10) return query;
  
  // Randomly decide whether to modify (30% chance of no modification)
  if (Math.random() < 0.3) return query;
  
  const variations = [
    () => query,                                // No change (30% chance)
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
  
  console.log(`[scrape-search] Original query: "${query}"`);
  console.log(`[scrape-search] Varied query: "${result}"`);
  
  return result;
}
