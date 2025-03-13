
// Supabase Edge Function for scraping Google and Google Scholar search results
import { load } from "https://esm.sh/cheerio@1.0.0-rc.12";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// List of rotating user agents to avoid detection
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36", 
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
];

// Main function to handle HTTP requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const queryParam = url.searchParams.get("query");
    const source = url.searchParams.get("source") || "google"; // Default to Google if not specified

    if (!queryParam) {
      return new Response(
        JSON.stringify({ error: "Query parameter is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Scraping ${source} for query: ${queryParam}`);
    
    // Get search results based on the source
    const results = await scrapeSearch(queryParam, source);
    
    // Return the results as JSON
    return new Response(
      JSON.stringify({ results }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in scrape-search function:", error);
    
    // Return error response
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

// Function to scrape search results from Google or Google Scholar
async function scrapeSearch(query: string, source: string): Promise<any[]> {
  // Select a random user agent
  const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  
  // URL encode the query
  const encodedQuery = encodeURIComponent(query);
  
  // Determine the search URL based on the source
  const searchUrl = source === "scholar" 
    ? `https://scholar.google.com/scholar?q=${encodedQuery}&hl=es`
    : `https://www.google.com/search?q=${encodedQuery}&hl=es`;
  
  console.log(`Fetching from URL: ${searchUrl}`);
  
  try {
    // Fetch the search results page
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": userAgent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch search results: ${response.status} ${response.statusText}`);
    }

    // Get the HTML content
    const html = await response.text();
    console.log(`Received HTML response (${html.length} bytes)`);
    
    // Load the HTML into cheerio
    const $ = load(html);
    const results = [];

    if (source === "scholar") {
      // Extract Google Scholar results
      $(".gs_ri h3 a").each((i, element) => {
        const title = $(element).text().trim();
        const url = $(element).attr("href") || "";
        
        if (title) {
          results.push({
            title,
            url: url.startsWith('/scholar') ? `https://scholar.google.com${url}` : url,
            source: "Google Scholar"
          });
        }
      });
    } else {
      // Extract Google Search results
      $("h3").each((i, element) => {
        const titleElement = $(element);
        const title = titleElement.text().trim();
        
        // Find the closest anchor tag that might contain the URL
        const linkElement = titleElement.closest("a");
        let url = linkElement.attr("href") || "";
        
        // Clean up Google's URL format
        if (url.startsWith('/url?')) {
          const urlObj = new URL(`https://www.google.com${url}`);
          url = urlObj.searchParams.get("q") || url;
        }
        
        if (title && !title.includes("People also ask")) {
          results.push({
            title,
            url,
            source: "Google"
          });
        }
      });
    }

    console.log(`Extracted ${results.length} results`);
    return results;
  } catch (error) {
    console.error(`Error scraping ${source}:`, error);
    throw new Error(`Failed to scrape ${source}: ${error.message}`);
  }
}
