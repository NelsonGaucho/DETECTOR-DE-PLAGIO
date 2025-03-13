import { corsHeaders } from "../utils/corsHeaders.ts";
import { searchGoogle } from "../utils/searchEngine.ts";
import { calculateSimilarity, detectAIPatterns } from "../utils/textAnalysis.ts";
import { extractTextFragments } from "../utils/textFragmentation.ts";

/**
 * Main handler for plagiarism detection requests
 */
export async function handlePlagiarismDetection(req: Request) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text) {
      return new Response(
        JSON.stringify({ error: "El texto a analizar es requerido" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("[detect-plagiarism] Iniciando análisis de texto:", text.substring(0, 100) + "...");

    // Extract text fragments for analysis
    const { searchFragments, textFragments } = extractTextFragments(text);
    
    console.log("[detect-plagiarism] Fragmentos a buscar:", searchFragments.length);
    
    // Perform searches in parallel with improved timeout and delays
    const searchResults = await performSearches(searchFragments);
    
    // Process search results
    const { allSources, fragmentResults } = processSearchResults(searchResults, searchFragments);
    
    // Prepare final response
    const response = prepareResponse(allSources, fragmentResults, searchFragments, text);
    
    console.log("[detect-plagiarism] Respuesta completa generada");
    
    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("[detect-plagiarism] Error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        note: "Ha ocurrido un error al procesar la solicitud. Es posible que Google esté bloqueando las solicitudes automatizadas."
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Perform searches for each fragment in parallel
 */
async function performSearches(searchFragments: string[]) {
  const searchPromises = [];
  
  // Alternar entre Google y Google Scholar para los fragmentos
  for (let i = 0; i < searchFragments.length; i++) {
    // Add progressive delay between searches to avoid blocks
    const delay = i * 600; // 600ms between searches
    const fragment = searchFragments[i];
    const useScholar = i % 3 === 1; // 1 out of every 3 searches uses Scholar
    
    console.log(`[detect-plagiarism] Preparando búsqueda ${i+1}: ${fragment.substring(0, 30)}... (${useScholar ? 'Scholar' : 'Google'})`);
    
    searchPromises.push(
      new Promise(resolve => setTimeout(
        () => resolve(searchGoogle(fragment, useScholar)), 
        delay
      ))
    );
  }
  
  // Execute all searches with a 15-second timeout for each
  console.log("[detect-plagiarism] Iniciando búsquedas en paralelo");
  const results = await Promise.allSettled(
    searchPromises.map(promise => 
      Promise.race([
        promise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 15000)
        )
      ])
    )
  );
  
  console.log("[detect-plagiarism] Búsquedas completadas, procesando resultados");
  return results;
}

/**
 * Process search results and calculate similarities
 */
function processSearchResults(results: PromiseSettledResult<any>[], searchFragments: string[]) {
  const allSources = [];
  const fragmentResults = new Map(); // Track which fragments found matches
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const searchResults = result.value as any[];
      console.log(`[detect-plagiarism] Búsqueda ${index+1} exitosa:`, searchResults.length, "resultados");
      
      const fragment = searchFragments[index];
      let foundMatch = false;
      
      searchResults.forEach(source => {
        if (source.url && source.title && source.snippet) {
          // Calculate similarity with search fragment
          const similarity = calculateSimilarity(fragment, source.snippet);
          
          // Only include if there's relevant similarity
          if (similarity > 25) { // Reduced threshold to capture more potential matches
            foundMatch = true;
            allSources.push({
              ...source,
              match_percentage: similarity,
              searched_fragment: fragment,
            });
          }
        }
      });
      
      fragmentResults.set(fragment, foundMatch);
    } else {
      console.error(`[detect-plagiarism] Error en búsqueda ${index+1}:`, result.reason);
    }
  });
  
  console.log("[detect-plagiarism] Fuentes encontradas (antes de filtrar):", allSources.length);
  
  return { allSources, fragmentResults };
}

/**
 * Prepare the final response with filtered sources and analysis
 */
function prepareResponse(allSources: any[], fragmentResults: Map<string, boolean>, searchFragments: string[], text: string) {
  // Remove duplicates by URL using Map to keep the entry with highest similarity
  const uniqueUrlMap = new Map();
  allSources.forEach(source => {
    const existingSource = uniqueUrlMap.get(source.url);
    
    // If doesn't exist or has lower match percentage, update
    if (!existingSource || existingSource.match_percentage < source.match_percentage) {
      uniqueUrlMap.set(source.url, source);
    }
  });
  
  // Convert map to array
  const uniqueSources = Array.from(uniqueUrlMap.values());
  console.log("[detect-plagiarism] Fuentes únicas:", uniqueSources.length);
  
  // Sort by match percentage
  const sortedSources = uniqueSources.sort((a, b) => b.match_percentage - a.match_percentage);
  
  // Limit to the 10 most relevant results
  const topSources = sortedSources.slice(0, 10);
  
  // Calculate overall plagiarism percentage based on fragments with matches
  // and the relevance (similarity) of found matches
  let plagiarismPercentage = 0;
  
  if (topSources.length > 0) {
    // Calculate a weighted average based on fragments with matches and similarity
    const fragmentsWithMatches = Array.from(fragmentResults.values()).filter(Boolean).length;
    const matchRatio = fragmentsWithMatches / searchFragments.length;
    
    // Average similarity of the best matches
    const avgSimilarity = topSources.reduce((sum, s) => sum + s.match_percentage, 0) / topSources.length;
    
    // Combine both factors for the final percentage
    plagiarismPercentage = Math.round((matchRatio * 0.6 + avgSimilarity / 100 * 0.4) * 100);
  }
  
  console.log("[detect-plagiarism] Porcentaje de plagio calculado:", plagiarismPercentage);
  
  // Analyze if the content appears to be AI-generated
  const aiAnalysis = detectAIPatterns(text);
  console.log("[detect-plagiarism] Probabilidad de IA calculada:", aiAnalysis.score);

  // Prepare enriched result for fragment analysis
  const analyzedContent = searchFragments.map(fragment => {
    // Find the best match for this fragment
    const bestMatch = allSources
      .filter(source => source.searched_fragment === fragment)
      .sort((a, b) => b.match_percentage - a.match_percentage)[0];
    
    return {
      text: fragment,
      is_plagiarized: bestMatch && bestMatch.match_percentage > 50,
      match_percentage: bestMatch ? bestMatch.match_percentage : 0,
      matched_source: bestMatch ? {
        url: bestMatch.url,
        title: bestMatch.title
      } : null
    };
  });
  
  // Return complete result
  return {
    plagiarism_percentage: plagiarismPercentage,
    ai_generated_probability: aiAnalysis.score,
    sources: topSources.map(source => ({
      url: source.url,
      title: source.title,
      matchPercentage: source.match_percentage,
      source: source.source || "Google Search",
      snippet: source.snippet?.substring(0, 150) + (source.snippet?.length > 150 ? '...' : '')
    })),
    document_content: text.substring(0, 1000) + (text.length > 1000 ? '...' : ''),
    analyzed_content: analyzedContent,
    ai_analysis_details: {
      confidenceScore: aiAnalysis.score / 100,
      features: aiAnalysis.patterns
    }
  };
}
