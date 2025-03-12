
// Main entry point for plagiarism detection service
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

    console.log("[detect-plagiarism] Texto recibido para análisis:", text.substring(0, 100) + "...");

    // Dividir el texto en fragmentos para búsqueda
    const textFragments = [];
    const words = text.split(' ');
    
    // Crear fragmentos de aproximadamente 10-15 palabras
    for (let i = 0; i < words.length; i += 10) {
      if (i + 5 < words.length) {  // Al menos 5 palabras para formar un fragmento
        textFragments.push(words.slice(i, i + 15).join(' '));
      }
    }
    
    // Limitar a máximo 5 fragmentos para evitar excesivas búsquedas y mejorar rendimiento
    const searchFragments = textFragments.slice(0, 5);
    console.log("[detect-plagiarism] Fragmentos a buscar:", searchFragments.length);
    
    // Realizar búsquedas en paralelo con manejo de timeout mejorado
    const searchPromises = [];
    
    // Alternar entre Google y Google Scholar para los fragmentos
    for (let i = 0; i < searchFragments.length; i++) {
      // Añadir retraso entre búsquedas para evitar bloqueos
      const delay = i * 400; // 400ms entre búsquedas 
      const fragment = searchFragments[i];
      const useScholar = i % 2 === 1;
      
      console.log(`[detect-plagiarism] Preparando búsqueda ${i+1}: ${fragment.substring(0, 30)}... (${useScholar ? 'Scholar' : 'Google'})`);
      
      searchPromises.push(
        new Promise(resolve => setTimeout(
          () => resolve(searchGoogle(fragment, useScholar)), 
          delay
        ))
      );
    }
    
    // Ejecutar todas las búsquedas con un timeout de 10 segundos para mejorar rendimiento
    console.log("[detect-plagiarism] Iniciando búsquedas en paralelo");
    const results = await Promise.allSettled(
      searchPromises.map(promise => 
        Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 10000)
          )
        ])
      )
    );
    
    console.log("[detect-plagiarism] Búsquedas completadas, procesando resultados");
    
    // Procesar resultados - con optimizaciones de rendimiento
    const allSources = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`[detect-plagiarism] Búsqueda ${index+1} exitosa:`, result.value.length, "resultados");
        result.value.forEach(source => {
          if (source.url && source.title) {
            // Calcular similitud con el fragmento de búsqueda
            const fragment = searchFragments[index];
            const similarity = calculateSimilarity(fragment, source.snippet || '');
            
            // Solo incluir si hay alguna similitud relevante
            if (similarity > 20) {
              allSources.push({
                ...source,
                match_percentage: similarity,
                searched_fragment: fragment,
              });
            }
          }
        });
      } else {
        console.error(`[detect-plagiarism] Error en búsqueda ${index}:`, result.reason);
      }
    });
    
    console.log("[detect-plagiarism] Fuentes encontradas (antes de filtrar):", allSources.length);
    
    // Eliminar duplicados por URL usando Set para mayor eficiencia
    const uniqueUrls = new Set();
    const uniqueSources = allSources.filter(source => {
      if (uniqueUrls.has(source.url)) return false;
      uniqueUrls.add(source.url);
      return true;
    });
    
    console.log("[detect-plagiarism] Fuentes únicas:", uniqueSources.length);
    
    // Ordenar por porcentaje de coincidencia
    const sortedSources = uniqueSources.sort((a, b) => b.match_percentage - a.match_percentage);
    
    // Limitar a los 10 resultados más relevantes
    const topSources = sortedSources.slice(0, 10);
    
    // Calcular porcentaje de plagio general
    const plagiarismPercentage = topSources.length > 0
      ? Math.round(topSources.reduce((sum, s) => sum + s.match_percentage, 0) / topSources.length)
      : 0;
    
    console.log("[detect-plagiarism] Porcentaje de plagio calculado:", plagiarismPercentage);
    
    // Analizar patrones de IA
    const aiAnalysis = detectAIPatterns(text);
    console.log("[detect-plagiarism] Probabilidad de IA calculada:", aiAnalysis.score);

    // Devolver resultado
    const response = {
      plagiarism_percentage: plagiarismPercentage,
      ai_generated_probability: aiAnalysis.score,
      sources: topSources,
      document_content: text.substring(0, 1000) + (text.length > 1000 ? '...' : ''),
      analyzed_content: textFragments.map(fragment => ({
        text: fragment,
        is_plagiarized: topSources.some(source => 
          calculateSimilarity(fragment, source.snippet || '') > 50
        )
      })),
      ai_analysis_details: {
        confidenceScore: aiAnalysis.score,
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
