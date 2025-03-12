
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function searchGoogle(query: string, isScholar = false) {
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
    // Nota: Esta es una extracción simple; en producción considera usar una library de parsing HTML
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

// Función para calcular la similitud de texto
function calculateSimilarity(text1, text2) {
  // Normalizar textos
  const normalize = (text) => 
    text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
  
  const normalizedText1 = normalize(text1);
  const normalizedText2 = normalize(text2);
  
  // Dividir en tokens (palabras)
  const tokens1 = normalizedText1.split(' ');
  const tokens2 = normalizedText2.split(' ');
  
  // Encontrar n-gramas comunes (frases de 3 palabras)
  const getNGrams = (tokens, n = 3) => {
    const ngrams = [];
    for (let i = 0; i <= tokens.length - n; i++) {
      ngrams.push(tokens.slice(i, i + n).join(' '));
    }
    return ngrams;
  };
  
  const ngrams1 = getNGrams(tokens1);
  const ngrams2 = getNGrams(tokens2);
  
  // Contar coincidencias
  let matches = 0;
  for (const ngram of ngrams1) {
    if (ngrams2.includes(ngram)) {
      matches++;
    }
  }
  
  // Calcular similitud
  if (ngrams1.length === 0) return 0;
  return Math.round((matches / ngrams1.length) * 100);
}

// Función para detectar patrones de IA
function detectAIPatterns(text) {
  // Características típicas de texto generado por IA
  const aiPatterns = {
    averageSentenceLength: 0,
    repeatedPhrases: 0,
    formalLanguage: 0,
  };
  
  // Analizar longitud de oraciones
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const totalLength = sentences.reduce((sum, s) => sum + s.trim().length, 0);
  aiPatterns.averageSentenceLength = totalLength / (sentences.length || 1);
  
  // Analizar repetición de frases
  const tokens = text.toLowerCase().split(/\s+/);
  const phrases = {};
  for (let i = 0; i < tokens.length - 2; i++) {
    const phrase = `${tokens[i]} ${tokens[i+1]} ${tokens[i+2]}`;
    phrases[phrase] = (phrases[phrase] || 0) + 1;
  }
  
  const repeatedPhrases = Object.values(phrases).filter(count => count > 1).length;
  aiPatterns.repeatedPhrases = repeatedPhrases;
  
  // Palabras formales comunes en IA
  const formalWords = [
    'furthermore', 'moreover', 'additionally', 'consequently', 'therefore', 
    'thus', 'hence', 'subsequently', 'nevertheless', 'accordingly'
  ];
  
  const normalizedText = text.toLowerCase();
  const formalWordCount = formalWords.reduce((count, word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = normalizedText.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);
  
  aiPatterns.formalLanguage = formalWordCount;
  
  // Calcular puntuación de IA (0-100)
  const aiScore = Math.min(100, Math.max(0, Math.round(
    (aiPatterns.averageSentenceLength / 20) * 40 +
    (aiPatterns.repeatedPhrases / 10) * 30 +
    (aiPatterns.formalLanguage / 5) * 30
  )));
  
  return {
    score: aiScore,
    patterns: aiPatterns,
  };
}

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

    console.log("Texto recibido para análisis:", text.substring(0, 100) + "...");

    // Dividir el texto en fragmentos para búsqueda
    const textFragments = [];
    const words = text.split(' ');
    
    // Crear fragmentos de aproximadamente 10-15 palabras
    for (let i = 0; i < words.length; i += 10) {
      if (i + 5 < words.length) {  // Al menos 5 palabras para formar un fragmento
        textFragments.push(words.slice(i, i + 15).join(' '));
      }
    }
    
    // Limitar a máximo 5 fragmentos para evitar excesivas búsquedas
    const searchFragments = textFragments.slice(0, 5);
    
    // Realizar búsquedas en paralelo
    const searchPromises = [];
    
    // Alternar entre Google y Google Scholar para los fragmentos
    for (let i = 0; i < searchFragments.length; i++) {
      searchPromises.push(searchGoogle(searchFragments[i], i % 2 === 1));
    }
    
    // Ejecutar todas las búsquedas con un timeout de 15 segundos
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
    
    // Procesar resultados
    const allSources = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
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
        console.error(`Error en búsqueda ${index}:`, result.reason);
      }
    });
    
    // Eliminar duplicados por URL
    const uniqueSources = allSources.filter((source, index, self) =>
      index === self.findIndex(s => s.url === source.url)
    );
    
    // Ordenar por porcentaje de coincidencia
    const sortedSources = uniqueSources.sort((a, b) => b.match_percentage - a.match_percentage);
    
    // Limitar a los 10 resultados más relevantes
    const topSources = sortedSources.slice(0, 10);
    
    // Calcular porcentaje de plagio general
    const plagiarismPercentage = topSources.length > 0
      ? Math.round(topSources.reduce((sum, s) => sum + s.match_percentage, 0) / topSources.length)
      : 0;
    
    // Analizar patrones de IA
    const aiAnalysis = detectAIPatterns(text);

    // Devolver resultado
    return new Response(
      JSON.stringify({
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
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("Error en función detect-plagiarism:", error);
    
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
