
// Main entry point for plagiarism detection service
// Enhanced version that focuses on Google and Google Scholar searches
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "./utils/corsHeaders.ts";
import { searchGoogle } from "./utils/searchEngine.ts";
import { calculateSimilarity, detectAIPatterns } from "./utils/textAnalysis.ts";

serve(async (req) => {
  // Manejar preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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

    // Dividir el texto en fragmentos significativos para búsqueda
    const textFragments = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    // Crear fragmentos basados en oraciones completas
    for (let i = 0; i < sentences.length; i++) {
      // Añadir oraciones individuales que son suficientemente largas
      if (sentences[i].length >= 50) {
        textFragments.push(sentences[i].trim());
      } 
      // Combinar oraciones cortas consecutivas
      else if (i < sentences.length - 1) {
        const combinedSentence = `${sentences[i].trim()} ${sentences[i+1].trim()}`;
        if (combinedSentence.length >= 50) {
          textFragments.push(combinedSentence);
          i++; // Saltar la siguiente oración ya que la hemos incluido
        }
      }
    }
    
    // Si no se pudieron extraer fragmentos de oraciones, usar división por palabras
    if (textFragments.length === 0) {
      const words = text.split(' ');
      // Crear fragmentos de aproximadamente El fragmento debe tener más de 6 palabras y menos de 20
      for (let i = 0; i < words.length; i += 15) {
        if (i + 6 < words.length) {
          const fragmentLength = Math.min(20, words.length - i);
          textFragments.push(words.slice(i, i + fragmentLength).join(' '));
        }
      }
    }
    
    // Eliminar fragmentos duplicados o muy similares
    const uniqueFragments = [];
    for (const fragment of textFragments) {
      // Verificar si ya existe un fragmento muy similar
      const isDuplicate = uniqueFragments.some(
        existingFragment => calculateSimilarity(fragment, existingFragment) > 80
      );
      
      if (!isDuplicate) {
        uniqueFragments.push(fragment);
      }
    }
    
    // Seleccionar fragmentos representativos para búsqueda (limitamos a 8 para evitar bloqueos)
    let searchFragments = [];
    
    // Si hay más de 8 fragmentos, seleccionar estratégicamente
    if (uniqueFragments.length > 8) {
      // Tomar el primer y último fragmento
      searchFragments.push(uniqueFragments[0]);
      searchFragments.push(uniqueFragments[uniqueFragments.length - 1]);
      
      // Tomar fragmentos distribuidos uniformemente del resto
      const step = Math.floor((uniqueFragments.length - 2) / 6);
      for (let i = 1; i < uniqueFragments.length - 1 && searchFragments.length < 8; i += step) {
        searchFragments.push(uniqueFragments[i]);
      }
    } else {
      searchFragments = [...uniqueFragments];
    }
    
    console.log("[detect-plagiarism] Fragmentos a buscar:", searchFragments.length);
    
    // Realizar búsquedas en paralelo con manejo de timeout mejorado y retrasos para evitar bloqueos
    const searchPromises = [];
    
    // Alternar entre Google y Google Scholar para los fragmentos
    for (let i = 0; i < searchFragments.length; i++) {
      // Añadir retraso progresivo entre búsquedas para evitar bloqueos
      const delay = i * 600; // 600ms entre búsquedas (aumentado para evitar bloqueos)
      const fragment = searchFragments[i];
      const useScholar = i % 3 === 1; // 1 de cada 3 búsquedas usa Scholar
      
      console.log(`[detect-plagiarism] Preparando búsqueda ${i+1}: ${fragment.substring(0, 30)}... (${useScholar ? 'Scholar' : 'Google'})`);
      
      searchPromises.push(
        new Promise(resolve => setTimeout(
          () => resolve(searchGoogle(fragment, useScholar)), 
          delay
        ))
      );
    }
    
    // Ejecutar todas las búsquedas con un timeout de 15 segundos para cada una
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
    
    // Procesar resultados - con análisis de similitud mejorado
    const allSources = [];
    const fragmentResults = new Map(); // Rastrear qué fragmentos encontraron coincidencias
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const searchResults = result.value as any[];
        console.log(`[detect-plagiarism] Búsqueda ${index+1} exitosa:`, searchResults.length, "resultados");
        
        const fragment = searchFragments[index];
        let foundMatch = false;
        
        searchResults.forEach(source => {
          if (source.url && source.title && source.snippet) {
            // Calcular similitud con el fragmento de búsqueda usando nuestra función mejorada
            const similarity = calculateSimilarity(fragment, source.snippet);
            
            // Solo incluir si hay alguna similitud relevante
            if (similarity > 25) { // Umbral reducido para capturar más coincidencias potenciales
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
    
    // Eliminar duplicados por URL usando Map para mantener la entrada con mayor similitud
    const uniqueUrlMap = new Map();
    allSources.forEach(source => {
      const existingSource = uniqueUrlMap.get(source.url);
      
      // Si no existe o tiene menor porcentaje de coincidencia, actualizar
      if (!existingSource || existingSource.match_percentage < source.match_percentage) {
        uniqueUrlMap.set(source.url, source);
      }
    });
    
    // Convertir el mapa a un array
    const uniqueSources = Array.from(uniqueUrlMap.values());
    console.log("[detect-plagiarism] Fuentes únicas:", uniqueSources.length);
    
    // Ordenar por porcentaje de coincidencia
    const sortedSources = uniqueSources.sort((a, b) => b.match_percentage - a.match_percentage);
    
    // Limitar a los 10 resultados más relevantes
    const topSources = sortedSources.slice(0, 10);
    
    // Calcular porcentaje de plagio general basado en los fragmentos que encontraron coincidencias
    // y la relevancia (similitud) de las coincidencias encontradas
    let plagiarismPercentage = 0;
    
    if (topSources.length > 0) {
      // Calcular un promedio ponderado basado en los fragmentos con coincidencias y la similitud
      const fragmentsWithMatches = Array.from(fragmentResults.values()).filter(Boolean).length;
      const matchRatio = fragmentsWithMatches / searchFragments.length;
      
      // Promedio de similitud de las mejores coincidencias
      const avgSimilarity = topSources.reduce((sum, s) => sum + s.match_percentage, 0) / topSources.length;
      
      // Combinar ambos factores para el porcentaje final
      plagiarismPercentage = Math.round((matchRatio * 0.6 + avgSimilarity / 100 * 0.4) * 100);
    }
    
    console.log("[detect-plagiarism] Porcentaje de plagio calculado:", plagiarismPercentage);
    
    // Analizar si el contenido parece generado por IA
    const aiAnalysis = detectAIPatterns(text);
    console.log("[detect-plagiarism] Probabilidad de IA calculada:", aiAnalysis.score);

    // Preparar resultado enriquecido para el análisis de cada fragmento
    const analyzedContent = searchFragments.map(fragment => {
      // Buscar la mejor coincidencia para este fragmento
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
    
    // Devolver resultado completo
    const response = {
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
});
